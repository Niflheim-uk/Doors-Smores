import { DocumentNode } from "../../model/documentNode";
import { getLabelPrefix } from "../../model/schema";
import { 
  getDecomposedFromTraceType, 
  getDecomposesToTraceType, 
  getDetailedByTraceType, 
  getDetailsTraceType, 
  getSatisfiedByTraceType, 
  getSatisfiesTraceType, 
  getTraceCategoryLabels, 
  getVerifiedByTraceType, 
  getVerifiesTraceType, 
  isDownstreamTraceMissing, 
  isTestTraceMissing, 
  isUpstreamTraceMissing 
} from "../../model/traceSorting";
import { getTableRow } from "../contentInnerHtml";


export function getTraceReportUpstreamContent(documentType:string, node:DocumentNode, tracingRequired:boolean=true) {
  const c1 = "Upstream:";
  if(isUpstreamTraceMissing(documentType, node) && tracingRequired) {
    return getTableRow(c1, "MISSING TRACE!");
  }
  const traces = node.data.traces.traceIds;
  const traceCategoryLabels = getTraceCategoryLabels(traces);
  const originLabel = getLabelPrefix(node.data.category);
  const decomposedFrom = getDecomposedFromTraceType(originLabel, traces, traceCategoryLabels);
  const satisfies = getSatisfiesTraceType(originLabel, traces, traceCategoryLabels);
  const details = getDetailsTraceType(originLabel, traces, traceCategoryLabels);
  let c2 = "";
  c2 = addDecomposedFromTraces(c2, decomposedFrom);
  c2 = addSatisfiesTraces(c2, satisfies);
  c2 = addDetailsTraces(c2, details);
  if(c2 !== "") {
    return getTableRow(c1, c2);
  }
  return "";
}
export function getTraceReportTestsContent(documentType:string, node:DocumentNode, tracingRequired:boolean=true) {
  const c1 = "Tests:";
  if(isTestTraceMissing(documentType, node) && tracingRequired) {
    return getTableRow(c1, "MISSING TRACE!");
  }
  const traces = node.data.traces.traceIds;
  const traceCategoryLabels = getTraceCategoryLabels(traces);
  const originLabel = getLabelPrefix(node.data.category);
  const verifies = getVerifiesTraceType(originLabel, traces, traceCategoryLabels);
  const verifiedBy = getVerifiedByTraceType(originLabel, traces, traceCategoryLabels);
  let c2 = "";
  c2 = addVerifiesTraces(c2, verifies);
  c2 = addVerifiedByTraces(c2, verifiedBy);
  if(c2 !== "") {
    return getTableRow(c1, c2);
  }
  return "";
}
export function getTraceReportDownstreamContent(documentType:string, node:DocumentNode, tracingRequired:boolean=true) {
  const c1 = "Downstream:";
  if(isDownstreamTraceMissing(documentType, node) && tracingRequired) {
    return getTableRow(c1, "MISSING TRACE!");
  }
  const traces = node.data.traces.traceIds;
  const originLabel = getLabelPrefix(node.data.category);
  const traceCategoryLabels = getTraceCategoryLabels(traces);
  const decomposesTo = getDecomposesToTraceType(originLabel, traces, traceCategoryLabels);
  const satisfiedBy = getSatisfiedByTraceType(originLabel, traces, traceCategoryLabels);
  const detailedBy = getDetailedByTraceType(originLabel, traces, traceCategoryLabels);
  let c2 = "";
  c2 = addDecomposesToTraces(c2, decomposesTo);
  c2 = addSatisfiedByTraces(c2, satisfiedBy);
  c2 = addDetailedByTraces(c2, detailedBy);
  if(c2 !== "") {
    return getTableRow(c1, c2);
  }
  return "";
}

function addTracesType(currentContent:string, traces:number[], label:string):string {
  if(traces.length > 0) {
    currentContent = currentContent.concat(`<u>${label}:</u><br/>`);
    for(let i=0; i<traces.length; i++) {
      const trace = DocumentNode.createFromId(traces[i]);
      currentContent = currentContent.concat(`${trace.data.id}: ${trace.data.text.split('\n')[0]}<br/>`);
    }
  }
  return currentContent;
}
function addDecomposedFromTraces(currentContent:string, traces:number[]):string {
  return addTracesType(currentContent, traces, 'Decomposed from');
}
function addDecomposesToTraces(currentContent:string, traces:number[]):string {
  return addTracesType(currentContent, traces, 'Decomposes to');
}
function addSatisfiesTraces(currentContent:string, traces:number[]):string {
  return addTracesType(currentContent, traces, 'Satisfies');
}
function addSatisfiedByTraces(currentContent:string, traces:number[]):string {
  return addTracesType(currentContent, traces, 'Satisfied by');
}
function addDetailsTraces(currentContent:string, traces:number[]):string {
  return addTracesType(currentContent, traces, 'Details');
}
function addDetailedByTraces(currentContent:string, traces:number[]):string {
  return addTracesType(currentContent, traces, 'Detailed by');
}
function addVerifiesTraces(currentContent:string, traces:number[]):string {
  return addTracesType(currentContent, traces, 'Verifies');
}
function addVerifiedByTraces(currentContent:string, traces:number[]):string {
  return addTracesType(currentContent, traces, 'Verified by');
}
