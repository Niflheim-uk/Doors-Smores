import { TraceReportView } from "../customWebviews/traceReportView/traceReportView";
import { getTraceCategoryLabels, isDownstreamTraceMissing, isTestTraceMissing, isUpstreamTraceMissing } from "./traceSorting";
import { DocumentNode } from "./documentNode";

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
  public getTraceReport() {
    TraceReportView.render(this);
  }
  public exportTraceReport() {
    TraceReportView.exportDocument(this);
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