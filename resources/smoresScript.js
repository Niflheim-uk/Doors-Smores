const vscode = acquireVsCodeApi();

addEventListener("load", initialize);

function initialize() {
  /* Trace view */
  var elements = document.getElementsByClassName('tracing');
  for (let i = 0; i < elements.length; i++) {
    var el = elements[i];
    var matches = el.id.match(/ViewTd-([\d]+)/);
    if(Array.isArray(matches)) {
      el.addEventListener('click', traceViewOnClick);
    }
    matches = el.id.match(/DeleteTd-([\d]+)/);
    if(Array.isArray(matches)) {
      el.addEventListener('click', traceDeleteOnClick);
    }
    matches = el.id.match(/New-([\S]+)/);
    if(Array.isArray(matches)) {
      el.addEventListener('click', traceAddOnClick);
    }
  }
  elements = document.getElementsByClassName('editSubmit');
  for (let i = 0; i < elements.length; i++) {
    var el = elements[i];
    el.addEventListener('click', editOnSubmit);
  }
  elements = document.getElementsByClassName('editCancel');
  for (let i = 0; i < elements.length; i++) {
    var el = elements[i];
    el.addEventListener('click', editOnCancel);
  }
  elements = document.getElementsByClassName('helpButton');
  for (let i = 0; i < elements.length; i++) {
    var el = elements[i];
    el.addEventListener('click', showHelp);
  }
  addUpstreamArrow();
  addDownstreamArrow();
  addTestArrow();
}
const arrowGap = 10;
const arrowMargin = 50;
function addUpstreamArrow() {
  const gridDiv = document.getElementsByClassName('tracingGrid')[0];
  if(gridDiv && gridDiv.children[1].children[0]) {
    const upstreamRect = gridDiv.children[1].children[0].getBoundingClientRect();
    const targetRect = gridDiv.children[2].children[0].getBoundingClientRect();
    const divLeft = targetRect.right - arrowMargin;
    const divTop = arrowMargin;
    const width = (upstreamRect.left - arrowGap) - divLeft;
    const height = targetRect.top - divTop;
    const arrow = getArrowSVG(width, 0, 0, height, '#518be2');
    addArrow(arrow, divLeft, divTop);
  }
}
function addDownstreamArrow() {
  const gridDiv = document.getElementsByClassName('tracingGrid')[0];
  if(gridDiv && gridDiv.children[5].children[0]) {
    const targetRect = gridDiv.children[2].children[0].getBoundingClientRect();
    const downstreamRect = gridDiv.children[5].children[0].getBoundingClientRect();
    const divLeft = targetRect.right - arrowMargin;
    const divTop = targetRect.bottom + arrowGap;
    const width = (downstreamRect.left - arrowGap) - divLeft;
    const height = (downstreamRect.top + arrowMargin) - divTop;
    const arrow = getArrowSVG(0, 0,  width, height,'#e5e54e');
    addArrow(arrow, divLeft, divTop);
  }
}
function addTestArrow() {
  const gridDiv = document.getElementsByClassName('tracingGrid')[0];
  if(gridDiv) {
    const targetRect = gridDiv.children[2].children[0].getBoundingClientRect();
    const testRect = gridDiv.children[3].children[0].getBoundingClientRect();
    const divLeft = targetRect.right + arrowGap;
    const divTop = targetRect.top + arrowMargin;
    const width = (testRect.left - divLeft) - (2 * arrowGap);
    const height = 0;
    const arrow = getArrowSVG(0, 0,  width, height,'#55ba7f');
    addArrow(arrow, divLeft, divTop);
  }
}
function addArrow(arrow, divLeft, divTop) {
  const tracingOuter = document.getElementsByClassName('tracingOuter')[0];
  if(tracingOuter) {
    var arrowDiv = document.createElement('div');
    arrowDiv.className = 'tracingArrow';
    arrowDiv.style['left']=`${divLeft}px`;
    arrowDiv.style.top=`${divTop}px`;
    arrowDiv.innerHTML = arrow;
    tracingOuter.appendChild(arrowDiv);
  }
}
function getArrowSVG(x1, y1, x2, y2, color) {
  const width = Math.abs(x2 - x1);
  var height = Math.abs(y2 - y1);
  if(height === 0) {
    height = 1;
  }
  const arrowLength = 15;

  const angle = Math.atan2(y2-y1,x2-x1);
  const deg45 = Math.PI / 4;
  const arrowx1 = x2 - (Math.cos(angle + deg45) * arrowLength);
  const arrowy1 = y2 - (Math.sin(angle + deg45) * arrowLength);
  const arrowx2 = x2 - (Math.cos(angle - deg45) * arrowLength);
  const arrowy2 = y2 - (Math.sin(angle - deg45) * arrowLength);

//  <div style='width: ${width}px; height: ${height}px; border: none;'>
  return `
  <svg style='width: ${width}px; height: ${height}px; overflow:visible'>
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${color};stroke-width:2"/>
    <line x1="${x2}" y1="${y2}" x2="${arrowx1}" y2="${arrowy1}" style="stroke:${color};stroke-width:2"/>
    <line x1="${x2}" y1="${y2}" x2="${arrowx2}" y2="${arrowy2}" style="stroke:${color};stroke-width:2"/>
  </svg>`;
}
function traceViewOnClick(event) {

  const nodeId = event.currentTarget.dataset["nodeId"];
  vscode.postMessage({command: 'viewTrace', nodeId});
}
function traceDeleteOnClick(event) {
  const nodeId = Number(event.currentTarget.dataset["nodeId"]);
  const traceType = event.currentTarget.dataset["traceType"];
  let upstream = false;
  if(event.currentTarget.dataset["traceUpstream"] === 'true') {
    upstream = true;
  }
  vscode.postMessage({command: 'removeTrace', nodeId:nodeId, traceType:traceType, traceUpstream:upstream});
}
function traceAddOnClick(event) {
  const traceType = event.currentTarget.dataset["traceType"];
  let upstream = false;
  if(event.currentTarget.dataset["traceUpstream"] === 'true') {
    upstream = true;
  }
  vscode.postMessage({command: 'addTrace', traceType:traceType, traceUpstream:upstream});
}
function editOnSubmit(event) {
  const nodeId = Number(event.currentTarget.dataset["nodeId"]);
  const textAreas = document.getElementsByTagName('textarea');
  var message = {command:'submit', text: undefined, translationRationale: undefined};
  for (let i = 0; i < textAreas.length; i++) {
    var el = textAreas[i];
    const dataType = el.dataset["contentType"];
    const dataValue = el.value;
    if(dataType === 'text') {
      message.text = dataValue;
    } else if(dataType === 'translationRationale') {
      message.translationRationale = dataValue;
    }
  }
  vscode.postMessage(message);
}
function editOnCancel() {
  vscode.postMessage({command: 'cancel'});
}
function showHelp(event) {
  const nodeId = Number(event.currentTarget.dataset["nodeId"]);
  const helpId = `help-${nodeId}`;
  const element = document.getElementById(helpId);
  if(element.style.visibility === 'visible') {
    element.style.visibility = 'hidden';
  } else {
    element.style.visibility = 'visible';
  }
}
