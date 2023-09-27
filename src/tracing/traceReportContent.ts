import { SmoresContentData, getLabelPrefix } from "../model/schema";
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
} from "./traceSorting";
import { Settings } from "../interface/settings";
import { SmoresDocument } from "../model/smoresDocument";
import { SmoresContent } from "../model/smoresContent";
import { FileIO } from "../model/fileIO";


export function getUpstreamTraceRow(doc:SmoresDocument, itemData:SmoresContentData) {
  const c1 = "Upstream:";
  const tracingRequired = Settings.getRequireTracing();
  if(isUpstreamTraceMissing(doc, itemData) && tracingRequired) {
    return SmoresContent.getTableRowHtml(c1, "MISSING TRACE!");
  }
  const traces = itemData.traceData.traces.id;
  const traceCategoryLabels = getTraceCategoryLabels(doc, traces);
  const originLabel = getLabelPrefix(itemData.category);
  const decomposedFrom = getDecomposedFromTraceType(originLabel, traces, traceCategoryLabels);
  const satisfies = getSatisfiesTraceType(originLabel, traces, traceCategoryLabels);
  const details = getDetailsTraceType(originLabel, traces, traceCategoryLabels);
  let c2 = "";
  c2 = addDecomposedFromTraces(doc, c2, decomposedFrom);
  c2 = addSatisfiesTraces(doc, c2, satisfies);
  c2 = addDetailsTraces(doc, c2, details);
  if(c2 !== "") {
    return SmoresContent.getTableRowHtml(c1, c2);
  }
  return "";
}
export function getTestsTraceRow(doc:SmoresDocument, itemData:SmoresContentData) {
  const c1 = "Tests:";
  const tracingRequired = Settings.getRequireTracing();
  if(isTestTraceMissing(doc, itemData) && tracingRequired) {
    return SmoresContent.getTableRowHtml(c1, "MISSING TRACE!");
  }
  const traces = itemData.traceData.traces.id;
  const traceCategoryLabels = getTraceCategoryLabels(doc, traces);
  const originLabel = getLabelPrefix(itemData.category);
  const verifies = getVerifiesTraceType(originLabel, traces, traceCategoryLabels);
  const verifiedBy = getVerifiedByTraceType(originLabel, traces, traceCategoryLabels);
  let c2 = "";
  c2 = addVerifiesTraces(doc, c2, verifies);
  c2 = addVerifiedByTraces(doc, c2, verifiedBy);
  if(c2 !== "") {
    return SmoresContent.getTableRowHtml(c1, c2);
  }
  return "";
}
export function getDownstreamTraceRow(doc:SmoresDocument, itemData:SmoresContentData) {
  const c1 = "Downstream:";
  const tracingRequired = Settings.getRequireTracing();
  if(isDownstreamTraceMissing(doc, itemData) && tracingRequired) {
    return SmoresContent.getTableRowHtml(c1, "MISSING TRACE!");
  }
  const traces = itemData.traceData.traces.id;
  const originLabel = getLabelPrefix(itemData.category);
  const traceCategoryLabels = getTraceCategoryLabels(doc, traces);
  const decomposesTo = getDecomposesToTraceType(originLabel, traces, traceCategoryLabels);
  const satisfiedBy = getSatisfiedByTraceType(originLabel, traces, traceCategoryLabels);
  const detailedBy = getDetailedByTraceType(originLabel, traces, traceCategoryLabels);
  let c2 = "";
  c2 = addDecomposesToTraces(doc, c2, decomposesTo);
  c2 = addSatisfiedByTraces(doc, c2, satisfiedBy);
  c2 = addDetailedByTraces(doc, c2, detailedBy);
  if(c2 !== "") {
    return SmoresContent.getTableRowHtml(c1, c2);
  }
  return "";
}

function addTracesType(doc:SmoresDocument, currentContent:string, traces:number[], label:string):string {
  if(traces.length > 0) {
    currentContent = currentContent.concat(`<u>${label}:</u><br/>`);
    for(let i=0; i<traces.length; i++) {
      const traceIdFilename = FileIO.getContentFilepath(doc, traces[i]);
      if(traceIdFilename) {
        const traceIdData = FileIO.readContentFile(traceIdFilename);
        if(traceIdData) {
          currentContent = currentContent.concat(`${traceIdData.id}: ${traceIdData.content.text.split('\n')[0]}<br/>`);
        }
      }
    }
  }
  return currentContent;
}
function addDecomposedFromTraces(doc:SmoresDocument, currentContent:string, traces:number[]):string {
  return addTracesType(doc, currentContent, traces, 'Decomposed from');
}
function addDecomposesToTraces(doc:SmoresDocument, currentContent:string, traces:number[]):string {
  return addTracesType(doc, currentContent, traces, 'Decomposes to');
}
function addSatisfiesTraces(doc:SmoresDocument, currentContent:string, traces:number[]):string {
  return addTracesType(doc, currentContent, traces, 'Satisfies');
}
function addSatisfiedByTraces(doc:SmoresDocument, currentContent:string, traces:number[]):string {
  return addTracesType(doc, currentContent, traces, 'Satisfied by');
}
function addDetailsTraces(doc:SmoresDocument, currentContent:string, traces:number[]):string {
  return addTracesType(doc, currentContent, traces, 'Details');
}
function addDetailedByTraces(doc:SmoresDocument, currentContent:string, traces:number[]):string {
  return addTracesType(doc, currentContent, traces, 'Detailed by');
}
function addVerifiesTraces(doc:SmoresDocument, currentContent:string, traces:number[]):string {
  return addTracesType(doc, currentContent, traces, 'Verifies');
}
function addVerifiedByTraces(doc:SmoresDocument, currentContent:string, traces:number[]):string {
  return addTracesType(doc, currentContent, traces, 'Verified by');
}
