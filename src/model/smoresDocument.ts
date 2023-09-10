import { TraceReportView } from "../customWebviews/traceReportView/traceReportView";
import { getTraceCategoryLabels, isDownstreamTraceMissing, isTestTraceMissing, isUpstreamTraceMissing } from "./traceSorting";
import { DocumentNode, RevisionHistoryItem } from "./documentNode";
import { window } from "vscode";
import { VersionController } from "../versionControl/versionController";
import { DocumentView } from "../customWebviews/documentView/documentView";


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
        VersionController.issueProject(nextRev.major, nextRev.minor, detail);
      }
    }
  }

  private getBlankRevisionHistoryItem() {
    return {
      day: 0,
      month: 0,
      year: 0,
      major: 0,
      minor: 0,
      detail:[""],
      author:"",
      isMajor:false    
    };
  }

  private async getNextRevision(lastRevision:RevisionHistoryItem) {
    var nextRev = this.getBlankRevisionHistoryItem();
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
  
  private getLatestRevision(traceReport:boolean) {
    var revisionHistory:RevisionHistoryItem[];
    if(traceReport) {
      revisionHistory = this.data.documentData!.traceReportRevisionHistory;
    } else {
      revisionHistory = this.data.documentData!.revisionHistory;
    }
    if(revisionHistory.length > 0) {
      return revisionHistory[revisionHistory.length-1];
    } else {
      return this.getBlankRevisionHistoryItem();
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