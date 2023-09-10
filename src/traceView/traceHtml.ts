import { SmoresNode, getNodeFromId } from "../model/smoresNode";
import * as schema from '../model/smoresDataSchema';
import { 
  getInnerHtmlForRequirement,
  getInnerHtmlForConstraint,
  getInnerHtmlForTest,
  getIdLabel
} from '../documentViewer/contentInnerHtml';
import { getDecomposedFromTraceType, getDecomposesToTraceType, getDetailedByTraceType, getDetailsTraceType, getSatisfiedByTraceType, getSatisfiesTraceType, getVerifiedByTraceType, getVerifiesTraceType } from "./traceSorting";

var viewSVG:string = "<i class='tracing codicon codicon-zoom-in'></i>";
var deleteSVG:string = "<i class='tracing codicon codicon-trash'></i>";
var verifiedSVG:string = "<i style='color:#55ba7f;' class='tracing codicon codicon-verified-filled'></i>";
var unverifiedSVG:string = "<i style='color:#e5e54e;' class='tracing codicon codicon-unverified'></i>";
var newTraceSVG:string = "<i class='tracing codicon codicon-add'></i>";
function getNameFromId(nodeId:number):string {
  const node = getNodeFromId(nodeId);
  if(node) {
   return node.data.text.split("/n")[0];
  }
  return "Unknown node";
}
function getTraceTypeFromTitle(title:string):[string,boolean] {
  if(title === 'Decomposed From') {
    return ['decompose', true];
  }
  if(title === 'Decomposes To') {
    return ['decompose', false];
  }
  if(title === 'Details') {
    return ['detail', true];
  }
  if(title === 'Detailed By') {
    return ['detail', false];
  }
  if(title === 'Implements') {
    return ['implement', true];
  }
  if(title === 'Implemented By') {
    return ['implement', false];
  }
  if(title === 'Satisfies') {
    return ['satisfy', true];
  }
  if(title === 'Satisfied By') {
    return ['satisfy', false];
  }
  if(title === 'Verifies') {
    return ['verify', true];
  }
  if(title === 'Verified By') {
    return ['verify', false];
  }
  return ['unknown', true];
}
function getTraceRow(originId:number, traceId:number, traceType:string, traceUpstream:boolean):string {
  const traceNode = getNodeFromId(traceId);
  const suspect = traceNode!.isTraceSuspect(originId);
  const traceLabel = getIdLabel(traceNode!);
  const traceName = getNameFromId(traceId);
  const viewDetail = `title='View' id='ViewTd-${traceId}' data-node-id='${traceId}' data-trace-type='${traceType}'`;
  const deleteDetail = `title='Delete' id='DeleteTd-${traceId}' data-node-id='${traceId}' data-trace-type='${traceType}' data-trace-upstream='${traceUpstream}'`;
  const verDetail = `title='Verify Trace' id='VerifyTd-${traceId}' data-node-id='${traceId}' data-trace-type='${traceType}'`;
  const verifyButton = `<button class='tracing' ${verDetail}>${unverifiedSVG}</button>`;
  let verHealth = verifiedSVG;
  if(suspect) {
    verHealth = verifyButton;
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
  const [traceType, traceUpstream] = getTraceTypeFromTitle(title);
  if(traceArray) {
    for (let index = 0; index < traceArray.length; index++) {
      const traceId = traceArray[index];
      traceRows = traceRows.concat(getTraceRow(originId, traceId, traceType, traceUpstream));
    }
  }
  const newButtonDetail = `id='New-${traceType}' data-trace-type='${traceType}' data-trace-upstream='${traceUpstream}'`;
  return `
  <br/>
  <div class='traceContainer'>
    <div class='traceTitle'><h3 class='tracing'>${title}</h3></div>
    <div><table class='traceView'>${traceRows}</table></div>
  </div>
  <div class='traceContainer'>
    <div class='traceNew'><button class='tracing' ${newButtonDetail}>${newTraceSVG}</button></div> 
  </div>
  `;
}
function getTraceCategoryLabels(traceIds:number[]):string[] {
  var labels =[];
  for(let i=0; i<traceIds.length; i++) {
    const traceNode = getNodeFromId(traceIds[i]);
    if(traceNode) {
      labels.push(schema.getLabelPrefix(traceNode.data.category));
    } else {
      labels.push(schema.getLabelPrefix("unknown"));
    }
  }
  return labels;
}
export function getDownstreamReqTraceHtml(node:SmoresNode):string {
  let html = "";
  const originCategory = node.data.category;
  const originCategoryLabel = schema.getLabelPrefix(originCategory);
  const traces = node.data.traces.traceIds;
  const traceCategoryLabels = getTraceCategoryLabels(traces);

  const decomposedFrom = getDecomposedFromTraceType(originCategoryLabel, traces, traceCategoryLabels);
  const decomposesTo = getDecomposesToTraceType(originCategoryLabel, traces, traceCategoryLabels);
  const satisfies = getSatisfiesTraceType(originCategoryLabel, traces, traceCategoryLabels);
  const satisfiedBy = getSatisfiedByTraceType(originCategoryLabel, traces, traceCategoryLabels);
  const details = getDetailsTraceType(originCategoryLabel, traces, traceCategoryLabels);
  const detailedBy = getDetailedByTraceType(originCategoryLabel, traces, traceCategoryLabels);
  const verifies = getVerifiesTraceType(originCategoryLabel, traces, traceCategoryLabels);
  const verifiedBy = getVerifiedByTraceType(originCategoryLabel, traces, traceCategoryLabels);
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
export function getDownstreamTestTraceHtml(node:SmoresNode):string {
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
export function getUpstreamReqTraceHtml(node:SmoresNode):string {
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
export function getUpstreamTestTraceHtml(node:SmoresNode):string {
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
export function getTraceTargetHtml(node:SmoresNode):string {
  const title = `<br/><div class='traceTitle'><h3 class='tracing'>Tracing: ${node.data.id}</h3></div>`;
  const addButton = "<div><br/><button id='NewTrace'>Add Trace</button></div>";
  switch(node.data.category) {
  case schema.userFRType:
  case schema.userNFRType:
  case schema.softFRType:
  case schema.softNFRType:
  case schema.archFRType:
  case schema.archNFRType:
  case schema.desFRType:
  case schema.desNFRType:
    return `<div class='tracing'>${title}${getInnerHtmlForRequirement(node)}${addButton}</div>`;
  case schema.userDCType:
  case schema.softDCType:
  case schema.archDCType:
  case schema.desDCType:
    return `<div class='tracing'>${title}${getInnerHtmlForConstraint(node)}${addButton}</div>`;
  case schema.userTestType:
  case schema.softTestType:
  case schema.archTestType:
  case schema.desTestType:
    return `<div class='tracing'>${title}${getInnerHtmlForTest(node)}${addButton}</div>`;
  default:
    return "<H1>ERROR - Invalid Category</H1>";
  }
}
