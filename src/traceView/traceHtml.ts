import { SmoresNode, getNodeFromId } from "../model/smoresNode";
import * as schema from '../model/smoresDataSchema';
import { 
  getInnerHtmlForRequirement,
  getInnerHtmlForConstraint,
  getInnerHtmlForTest,
  getIdLabel
} from '../documentViewer/contentInnerHtml';

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
function isTraceSuspect(nodeId:number, suspectTraces:number[]|undefined):boolean {
  if(suspectTraces) {
    return suspectTraces.includes(nodeId);
  }
  return false;
}
function getTraceRow(nodeId:number, suspectTraces:number[]|undefined, traceType:string, traceUpstream:boolean):string {
  const suspect = isTraceSuspect(nodeId, suspectTraces);
  const node = getNodeFromId(nodeId);
  const traceLabel = getIdLabel(node!);
  const traceName = getNameFromId(nodeId);
  let verStatus = verifiedSVG;
  if(suspect) {
    verStatus = unverifiedSVG;
  }
  const viewDetail = `id='ViewTd-${nodeId}' data-node-id='${nodeId}' data-trace-type='${traceType}'`;
  const deleteDetail = `id='DeleteTd-${nodeId}' data-node-id='${nodeId}'
  data-trace-type='${traceType}' data-trace-upstream='${traceUpstream}'`;
  // The empty cell allows for easier layout as it takes up any slack
  return `
  <tr>
    <td class='traceHealth'>${verStatus}</td>
    <td class='traceId tableSmall'>${traceLabel}</td>
    <td class='traceLink'>${traceName}</td>
    <td class='traceHealth'><button class='tracing' ${viewDetail}>${viewSVG}</button></td>
    <td class='traceHealth'><button class='tracing' ${deleteDetail}>${deleteSVG}</button></td>
    <td class='traceHealth'></td> 
  </tr>`;
}
function getTraceTable(traceArray:number[]|undefined, suspectTraces:number[]|undefined, title:string) {
  let traceRows = "";
  const [traceType, traceUpstream] = getTraceTypeFromTitle(title);
  if(traceArray) {
    for (let index = 0; index < traceArray.length; index++) {
      const traceId = traceArray[index];
      traceRows = traceRows.concat(getTraceRow(traceId, suspectTraces, traceType, traceUpstream));
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
export function getDownstreamReqTraceHtml(node:SmoresNode):string {
  let html = "";
  const documentType = node.getDocumentType();
  const downstream = node.data.traces?.downstream;
  const suspectTraces = node.data.traces?.suspectTrace;
  switch(documentType) {
  case schema.ursDocType:
    html = html.concat(getTraceTable(downstream?.decompose, suspectTraces, "Decomposes To"));
    break;
  case schema.srsDocType:
    html = html.concat(getTraceTable(downstream?.satisfy, suspectTraces, "Satisfied By"));
    html = html.concat(getTraceTable(downstream?.detail, suspectTraces, "Detailed By"));
    break;
  case schema.adsDocType:
    html = html.concat(getTraceTable(downstream?.detail, suspectTraces, "Detailed By"));
    break;
  case schema.ddsDocType:
    break;
  case schema.emptyDocType:
    html = html.concat(getTraceTable(downstream?.decompose, suspectTraces, "Decomposes To"));
    html = html.concat(getTraceTable(downstream?.satisfy, suspectTraces, "Satisfied By"));
    html = html.concat(getTraceTable(downstream?.detail, suspectTraces, "Detailed By"));
    break;
  }
  return html;
}
export function getDownstreamTestTraceHtml(node:SmoresNode):string {
  let html = "";
  const downstream = node.data.traces?.downstream;
  const suspectTraces = node.data.traces?.suspectTrace;
  html = html.concat(getTraceTable(downstream?.verify, suspectTraces, "Verified By"));
  return html;
}
export function getUpstreamReqTraceHtml(node:SmoresNode):string {
  let html = "";
  const documentType = node.getDocumentType();
  const upstream = node.data.traces?.upstream;
  const suspectTraces = node.data.traces?.suspectTrace;
  switch(documentType) {
  case schema.ursDocType:
    break;
  case schema.srsDocType:
    html = html.concat(getTraceTable(upstream?.decompose, suspectTraces, "Decomposed From"));
    break;
  case schema.adsDocType:
    html = html.concat(getTraceTable(upstream?.satisfy, suspectTraces, "Satisfies"));
    break;
  case schema.ddsDocType:
    html = html.concat(getTraceTable(upstream?.detail, suspectTraces, "Details"));
    break;
  case schema.emptyDocType:
    html = html.concat(getTraceTable(upstream?.decompose, suspectTraces, "Decomposed From"));
    html = html.concat(getTraceTable(upstream?.satisfy, suspectTraces, "Satisfies"));
    html = html.concat(getTraceTable(upstream?.detail, suspectTraces, "Details"));
    break;
  }
  return html;
}
export function getUpstreamTestTraceHtml(node:SmoresNode):string {
  let html = "";
  const upstream = node.data.traces?.upstream;
  const suspectTraces = node.data.traces?.suspectTrace;
  html = html.concat(getTraceTable(upstream?.verify, suspectTraces, "Verifies"));
  return html;
}
export function getTraceTargetHtml(node:SmoresNode):string {
  const title = `<br/><div class='traceTitle'><h3 class='tracing'>Tracing: ${node.data.id}</h3></div>`;
  switch(node.data.category) {
    case "userRequirement":
    case "functionalRequirement":
    case "nonFunctionalRequirement":
      return `<div class='tracing'>${title}${getInnerHtmlForRequirement(node)}</div>`;
    case "designConstraint":
      return `<div class='tracing'>${title}${getInnerHtmlForConstraint(node)}</div>`;
    case "softwareSystemTest":
    case "softwareIntegrationTest":
    case "softwareUnitTest":
      return `<div class='tracing'>${title}${getInnerHtmlForTest(node)}</div>`;
    default:
      return "<H1>ERROR - Invalid Category</H1>";
  }
}
