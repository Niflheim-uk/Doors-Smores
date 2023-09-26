import { DocumentNode } from '../../model/documentNode';
import * as schema from '../../model/schema';
import { 
  getInnerHtmlForRequirement,
  getInnerHtmlForConstraint,
  getInnerHtmlForTest,
  getIdLabel
} from '../contentInnerHtml';
import { 
  getDecomposedFromTraceType, 
  getDecomposesToTraceType, 
  getDetailedByTraceType, 
  getDetailsTraceType, 
  getSatisfiedByTraceType, 
  getSatisfiesTraceType, 
  getTraceCategoryLabels, 
  getVerifiedByTraceType, 
  getVerifiesTraceType 
} from "../../model/traceSorting";

var viewSVG:string = "<i class='tracing codicon codicon-zoom-in'></i>";
var deleteSVG:string = "<i class='tracing codicon codicon-trash'></i>";
var verifiedSVG:string = "<i style='color:#55ba7f;' class='tracing codicon codicon-verified-filled'></i>";
var unverifiedSVG:string = "<i style='color:#e5e54e;' class='tracing codicon codicon-unverified'></i>";
function getNameFromId(nodeId:number):string {
  const node = DocumentNode.createFromId(nodeId);
  if(node) {
   return node.data.text.split("/n")[0];
  }
  return "Unknown node";
}
function getTraceRow(originId:number, traceId:number):string {
  const traceNode = DocumentNode.createFromId(traceId);
  const suspect = traceNode!.isTraceSuspect(originId);
  const traceLabel = getIdLabel(traceNode!);
  const traceName = getNameFromId(traceId);
  const viewDetail = `title='View' id='ViewTd-${traceId}' data-node-id='${traceId}'`;
  const deleteDetail = `title='Delete' id='DeleteTd-${traceId}' data-node-id='${traceId}'`;
  const verDetail = `title='Verify Trace' id='VerifyTd-${traceId}' data-node-id='${traceId}'`;
  let verHealth = verifiedSVG;
  if(suspect) {
    verHealth = `<button class='tracing' ${verDetail}>${unverifiedSVG}</button>`;
  }
  // The empty cell allows for easier layout as it takes up any slack
  return `
  <tr>
    <td class='traceHealth'>${verHealth}</td>
    <td class='traceId tableSmall'>${traceLabel}</td>
    <td class='traceLink'>${traceName}</td>
    <td class='traceHealth'><button class='tracing' ${viewDetail}>${viewSVG}</button></td>
    <td class='traceHealth'><button class='tracing' ${deleteDetail}>${deleteSVG}</button></td>
    <td class='traceHealth'></td> 
  </tr>`;
}
function getTraceTable(originId:number, traceArray:number[]|undefined, title:string) {
  let traceRows = "";
  if(traceArray) {
    for (let index = 0; index < traceArray.length; index++) {
      const traceId = traceArray[index];
      traceRows = traceRows.concat(getTraceRow(originId, traceId));
    }
  }
  return `
  <br/>
  <div class='traceContainer'>
    <div class='traceTitle'><h3 class='tracing'>${title}</h3></div>
    <div><table class='traceView'>${traceRows}</table></div>
  </div>`;
}
export function getDownstreamReqTraceHtml(node:DocumentNode):string {
  let html = "";
  const originCategory = node.data.category;
  const originCategoryLabel = schema.getLabelPrefix(originCategory);
  const traces = node.data.traces.traceIds;
  const traceCategoryLabels = getTraceCategoryLabels(traces);

  const decomposesTo = getDecomposesToTraceType(originCategoryLabel, traces, traceCategoryLabels);
  const satisfiedBy = getSatisfiedByTraceType(originCategoryLabel, traces, traceCategoryLabels);
  const detailedBy = getDetailedByTraceType(originCategoryLabel, traces, traceCategoryLabels);
  if(decomposesTo.length > 0) {
    html = html.concat(getTraceTable(node.data.id, decomposesTo, "Decomposes To"));
  }
  if(satisfiedBy.length > 0) {
    html = html.concat(getTraceTable(node.data.id, satisfiedBy, "Satisfied By"));
  }
  if(detailedBy.length > 0) {
    html = html.concat(getTraceTable(node.data.id, detailedBy, "Detailed By"));
  }
  return html;
}
export function getTestsForItemHtml(node:DocumentNode):string {
  let html = "";
  const originCategory = node.data.category;
  const originCategoryLabel = schema.getLabelPrefix(originCategory);
  const traces = node.data.traces.traceIds;
  const traceCategoryLabels = getTraceCategoryLabels(traces);

  const verifiedBy = getVerifiedByTraceType(originCategoryLabel, traces, traceCategoryLabels);
  if(verifiedBy.length > 0) {
    html = html.concat(getTraceTable(node.data.id, verifiedBy, "Verified By"));
  }
  return html;
}
export function getUpstreamReqTraceHtml(node:DocumentNode):string {
  let html = "";
  const originCategory = node.data.category;
  const originCategoryLabel = schema.getLabelPrefix(originCategory);
  const traces = node.data.traces.traceIds;
  const traceCategoryLabels = getTraceCategoryLabels(traces);
  const decomposedFrom = getDecomposedFromTraceType(originCategoryLabel, traces, traceCategoryLabels);
  const satisfies = getSatisfiesTraceType(originCategoryLabel, traces, traceCategoryLabels);
  const details = getDetailsTraceType(originCategoryLabel, traces, traceCategoryLabels);
  if(decomposedFrom.length > 0) {
    html = html.concat(getTraceTable(node.data.id, decomposedFrom, "Decomposed From"));
  }
  if(satisfies.length > 0) {
    html = html.concat(getTraceTable(node.data.id, satisfies, "Satisfies"));
  }
  if(details.length > 0) {
    html = html.concat(getTraceTable(node.data.id, details, "Details"));
  }
  return html;
}
export function getTestTargetsHtml(node:DocumentNode):string {
  let html = "";
  const originCategory = node.data.category;
  const originCategoryLabel = schema.getLabelPrefix(originCategory);
  const traces = node.data.traces.traceIds;
  const traceCategoryLabels = getTraceCategoryLabels(traces);

  const verifies = getVerifiesTraceType(originCategoryLabel, traces, traceCategoryLabels);
  if(verifies.length > 0) {
    html = html.concat(getTraceTable(node.data.id, verifies, "Verifies"));
  }
  return html;
}
export function getTracedItemHtml(node:DocumentNode):string {
  const title = `<br/><div class='traceTitle'><h3 class='tracing'>Tracing: ${node.data.id}</h3></div>`;
  const addButton = "<div><br/><button id='NewTrace'>Add Trace</button></div>";
  switch(node.data.category) {
  case schema.userFRCategory:
  case schema.userNFRCategory:
  case schema.softFRCategory:
  case schema.softNFRCategory:
  case schema.archFRCategory:
  case schema.archNFRCategory:
  case schema.desFRCategory:
  case schema.desNFRCategory:
    return `<div class='tracing'>${title}${getInnerHtmlForRequirement(node, true)}${addButton}</div>`;
  case schema.userDCCategory:
  case schema.softDCCategory:
  case schema.archDCCategory:
  case schema.desDCCategory:
    return `<div class='tracing'>${title}${getInnerHtmlForConstraint(node, true)}${addButton}</div>`;
  case schema.userTestCategory:
  case schema.softTestCategory:
  case schema.archTestCategory:
  case schema.desTestCategory:
    return `<div class='tracing'>${title}${getInnerHtmlForTest(node, true)}${addButton}</div>`;
  default:
    return "<H1>ERROR - Invalid Category</H1>";
  }
}
