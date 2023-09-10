import { TraceReportView } from "../customWebviews/traceReportView/traceReportView";
import { getTraceCategoryLabels, isDownstreamTraceMissing, isTestTraceMissing, isUpstreamTraceMissing } from "./traceSorting";
import { DocumentNode, RevisionHistoryItem } from "./documentNode";
import { FileType, Uri, window, workspace } from "vscode";
import { VersionController } from "../versionControl/versionController";
import { DocumentView } from "../customWebviews/documentView/documentView";
import { DoorsSmores } from "../doorsSmores";
import { join, relative } from "path";


export class SmoresDocument extends DocumentNode {
  constructor(filepath:string) {
    super(filepath);
  }
  public static createDocumentFromId(id:number) {
    const node = DocumentNode.createFromId(id);
    const docNode = node.getDocument();
    return new SmoresDocument(docNode.getFilepath());
  }
  
  public getNumberTraces():number {
    return this.getNumberNodeTraces(this);
  }
  public getNumberMissingTraces():number {
    return this.getNumberMissingNodeTraces(this);
  }
  public viewTraceReport() {
    TraceReportView.render(this);
  }
  public exportTraceReport() {
    TraceReportView.exportDocument(this);
  }
  public exportDocument() {
    DocumentView.exportDocument(this);
  }

  public async issueDocument() {
    const lastRev = this.getLatestRevision(false);
    var nextRev = await this.getNextRevision(lastRev);;
    if (nextRev) {
      const detail = await this.getIssueDetail();
      if(detail) {
        await this.addRevisionHistory(nextRev, [detail], false);
        this.exportDocument();
        VersionController.issueDocument(this, false);
      }
    }
  }

  public async duplicateDocumentNodes(stubName:string, includeTracedNodes:boolean) {
    const srcRoot = DoorsSmores.getDataDirectory();
    const destRoot = srcRoot.concat(`_${stubName}`);
    await workspace.fs.createDirectory(Uri.file(destRoot));
    await this.copyNodeFiles(this, includeTracedNodes, srcRoot, destRoot);
  }
  
  private async copyNodeFiles(node:DocumentNode, includeTracedNodes:boolean, srcRoot:string, destRoot:string) {
    const thisNodeDir = node.getDirPath();
    const destDirStub = relative(srcRoot, thisNodeDir);
    const destPath = join(destRoot, destDirStub);
    await workspace.fs.createDirectory(Uri.file(destPath));
    await this.duplicateDirectory(thisNodeDir, destPath);
    for(let i=0; i<node.data.children.length; i++) {
      const child = DocumentNode.createFromId(node.data.children[i]);
      await this.copyNodeFiles(child, includeTracedNodes, srcRoot, destRoot);
    }
    if(includeTracedNodes) {
      for(let i=0; i<node.data.traces.traceIds.length; i++) {
        const trace = DocumentNode.createFromId(node.data.traces.traceIds[i]);
        await this.copyNodeFiles(trace, false, srcRoot, destRoot);
      }  
    }
  }
  private async duplicateDirectory(src:string, dest:string) {
    const srcContents = await workspace.fs.readDirectory(Uri.file(src));
    for(let i=0; i < srcContents.length; i++) {
      const [name, type] = srcContents[i];
      const srcPath = join(src, name);
      const destPath = join(dest, name);
      if (type === FileType.File) {
        await workspace.fs.copy(Uri.file(srcPath),Uri.file(destPath));
      } else if (type === FileType.Directory) {
        await workspace.fs.createDirectory(Uri.file(destPath));
        await this.duplicateDirectory(srcPath, destPath);
      } else {
        window.showErrorMessage(`Unexpected file type found during directory duplication: ${destPath}`);
      }
    }
  }

  private async getNextRevision(lastRevision:RevisionHistoryItem) {
    var nextRev = new RevisionHistoryItem();
    const majorForMajor = String(lastRevision.major+1).padStart(2, '0');
    const majorForMinor = String(lastRevision.major).padStart(2, '0');
    const minorForMinor = String(lastRevision.minor+1).padStart(2, '0');
    const issueTypes:string[] = [
      `Minor Issue: ${majorForMinor}-${minorForMinor}`,
      `Major Issue: ${majorForMajor}-00`,
    ];
  
    const selection =  await window.showQuickPick(issueTypes,{
      canPickMany:false, 
      title: "Select issue type", 
    });      
    if(selection === undefined) {
      return;
    } else if (selection.match('Minor')) {
      nextRev.minor = lastRevision.minor + 1;
      nextRev.major = lastRevision.major;
      nextRev.isMajor = false;
    } else {
      nextRev.minor = 0;
      nextRev.major = lastRevision.major + 1;
      nextRev.isMajor = true;
    }
    return nextRev;
  }
  private async addRevisionHistory(revHistoryItem:RevisionHistoryItem, detail:string[], traceReport:boolean) {
    const date = new Date();
    revHistoryItem.day = date.getDate();
    revHistoryItem.month = date.getMonth();
    revHistoryItem.year = date.getFullYear();
    revHistoryItem.author = await VersionController.getUserName();
    revHistoryItem.detail = detail;
    if(traceReport) {
      if(this.data.documentData) {
        this.data.documentData.traceReportRevisionHistory.push(revHistoryItem);
      }
    } else {
      if(this.data.documentData) {
        this.data.documentData.revisionHistory.push(revHistoryItem);
      }
    }
    this.write();
  }
  private async getIssueDetail():Promise<string|undefined> {
    return await window.showInputBox({
      prompt:"Enter revision history detail",
      placeHolder:"Changes made"
    });
  }
  
  public getLatestRevision(traceReport:boolean) {
    var revisionHistory:RevisionHistoryItem[];
    if(traceReport) {
      revisionHistory = this.data.documentData!.traceReportRevisionHistory;
    } else {
      revisionHistory = this.data.documentData!.revisionHistory;
    }
    if(revisionHistory.length > 0) {
      return revisionHistory[revisionHistory.length-1];
    } else {
      return new RevisionHistoryItem();
    }
  }
  private getNumberNodeTraces(node:DocumentNode):number {
    let nTraces = node.data.traces.traceIds.length;
    const nodeChildren = node.getChildren();
    for(let i=0; i<nodeChildren.length; i++) {
      nTraces += this.getNumberNodeTraces(nodeChildren[i]);
    }
    return nTraces;
  }
  
  private getNumberMissingNodeTraces(node:DocumentNode):number {
    let nMissing = this.getNumberMissingNodeTracesByCategory(node);
    const nodeChildren = node.getChildren();
    for(let i=0; i<nodeChildren.length; i++) {
      nMissing += this.getNumberMissingNodeTraces(nodeChildren[i]);
    }
    return nMissing;
  }

  private getNumberMissingNodeTracesByCategory(node:DocumentNode):number {
    const traces = node.data.traces.traceIds;
    const traceCategoryLabels = getTraceCategoryLabels(traces);
    let nMissing = 0;
    if(isUpstreamTraceMissing(this.data.documentData!.documentType,node)) {
      nMissing++;
    }
    if(isTestTraceMissing(this.data.documentData!.documentType,node)) {
      nMissing++;
    }
    if(isDownstreamTraceMissing(this.data.documentData!.documentType,node)) {
      nMissing++;
    }
    return nMissing;
  }
}