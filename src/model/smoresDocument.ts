import { TraceReportView } from "../customWebviews/traceReportView/traceReportView";
import { getTraceCategoryLabels, isDownstreamTraceMissing, isTestTraceMissing, isUpstreamTraceMissing } from "./traceSorting";
import { DocumentNode, RevisionHistoryItem } from "./documentNode";
import { FileType, Uri, window, workspace } from "vscode";
import { VersionController } from "../versionControl/versionController";
import { DocumentView } from "../customWebviews/documentView/documentView";
import { DoorsSmores } from "../doorsSmores";
import { join, relative } from "path";
import { IssueView } from "../customWebviews/issueView/issueView";


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
  public async exportTraceReport() {
    await TraceReportView.exportDocument(this);
  }
  public async exportDocument() {
    await DocumentView.exportDocument(this);
  }

  public async issueDocument() {
    await IssueView.issueDocument(this, false);
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
  
  public getLatestRevision(traceReport:boolean) {
    var revisionHistory:RevisionHistoryItem[];
    if(traceReport) {
      revisionHistory = this.data.documentData!.traceReportRevisionHistory;
    } else {
      revisionHistory = this.data.documentData!.revisionHistory;
    }
    if(revisionHistory.length > 0) {
      return RevisionHistoryItem.make(revisionHistory[revisionHistory.length-1]);
    } else {
      return RevisionHistoryItem.makeEmpty();
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