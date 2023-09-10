import * as path from 'path';
import * as fs from 'fs';
import { SmoresNode, getNodeFromId } from "../model/smoresNode";
import { SmoresDataFile } from '../model/smoresDataFile';
import { getInnerHtmlForConstraint } from '../documentViewer/constraintInnerHtml';
import { getInnerHtmlForRequirement } from '../documentViewer/requirementInnerHtml';
import { getInnerHtmlForTest } from '../documentViewer/testInnerHtml';

// var eyeUri:vscode.Uri;
// var trashUri:vscode.Uri;
var viewSVG:string;
var deleteSVG:string;
var verifiedSVG:string;
var unverifiedSVG:string;
var newTraceSVG:string;
// function getImageUri(webview:vscode.Webview, extensionPath:string, imageName:string) {
//   const imagePath = path.join(extensionPath, 'resources', imageName);
//   const imageUri = vscode.Uri.file(imagePath);
//   return webview.asWebviewUri(imageUri);
// }
function readImage(extensionPath:string, imageName:string) {
  const imagePath = path.join(extensionPath, 'resources', imageName);
  if (fs.existsSync(imagePath)){
    return fs.readFileSync(imagePath, "utf-8");
  }
  return "";
}
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
// function getViewImage() {
//   return `<img src=${eyeUri}>`;
// }
// function getDeleteImage() {
//   return `<img src=${trashUri}>`;
// }
function getTraceRow(nodeId:number, suspectTraces:number[]|undefined, traceType:string, traceUpstream:boolean):string {
  const suspect = isTraceSuspect(nodeId, suspectTraces);
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
    <td class='traceLink'>${traceName}</td>
    <td class='traceHealth'>
      <button class='tracing' ${viewDetail}>${viewSVG}</button>
    </td>
    <td class='traceHealth'>
      <button class='tracing' ${deleteDetail}>${deleteSVG}</button>
    </td>
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
  </br>
  <div class='traceContainer'>
    <div class='traceTitle'><h3 class='tracing'>${title}</h3></div>
    <div><table class='traceView'>${traceRows}</table></div>
  </div>
  <div class='traceContainer'>
    <div class='traceTitle'></div>
    <div class='traceNew'>
      <button class='tracing' ${newButtonDetail}>${newTraceSVG}</button>
    </div> 
  </div>
  `;
}
// export function setImageUri(webview:vscode.Webview) {
//   const extensionPath = SmoresDataFile.getExtensionPath();
//   if(extensionPath === undefined) {
//     return;
//   }
//   eyeUri = getImageUri(webview, extensionPath, 'eye.svg');
//   trashUri = getImageUri(webview, extensionPath, 'trash.svg');

// }
export function loadTraceImages() {
  const extensionPath = SmoresDataFile.getExtensionPath();
  if(extensionPath === undefined) {
    return;
  }
  viewSVG = readImage(extensionPath, 'zoom-in.svg');
  deleteSVG = readImage(extensionPath, 'trash.svg');
  verifiedSVG = readImage(extensionPath, 'verified-filled.svg');
  unverifiedSVG = readImage(extensionPath, 'unverified.svg');
  newTraceSVG = readImage(extensionPath, 'add.svg');
}
export function getDownstreamReqTraceHtml(node:SmoresNode):string {
  let html = "";
  const downstream = node.data.traces?.downstream;
  const suspectTraces = node.data.traces?.suspectTrace;
  html = html.concat(getTraceTable(downstream?.decompose, suspectTraces, "Decomposes To"));
  html = html.concat(getTraceTable(downstream?.detail, suspectTraces, "Detailed By"));
  html = html.concat(getTraceTable(downstream?.implement, suspectTraces, "Implemented By"));
  html = html.concat(getTraceTable(downstream?.satisfy, suspectTraces, "Satisfied By"));
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
  const upstream = node.data.traces?.upstream;
  const suspectTraces = node.data.traces?.suspectTrace;
  html = html.concat(getTraceTable(upstream?.decompose, suspectTraces, "Decomposed From"));
  html = html.concat(getTraceTable(upstream?.detail, suspectTraces, "Details"));
  html = html.concat(getTraceTable(upstream?.implement, suspectTraces, "Implements"));
  html = html.concat(getTraceTable(upstream?.satisfy, suspectTraces, "Satisfies"));
  return html;
}
export function getUpstreamTestTraceHtml(node:SmoresNode):string {
  let html = "";
  if(node.data.traces && node.data.traces.upstream) {
    const upstream = node.data.traces.upstream;
    const suspectTraces = node.data.traces.suspectTrace;
    html = html.concat(getTraceTable(upstream.verify, suspectTraces, "Verifies"));
  }
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
