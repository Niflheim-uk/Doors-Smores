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
      console.log("view");
    }
    matches = el.id.match(/DeleteTd-([\d]+)/);
    if(Array.isArray(matches)) {
      el.addEventListener('click', traceDeleteOnClick);
      console.log("del");
    }
    matches = el.id.match(/New-([\S]+)/);
    if(Array.isArray(matches)) {
      el.addEventListener('click', traceAddOnClick);
      console.log("new");
    }
  }
  elements = document.getElementsByClassName('editCancel');
  for (let i = 0; i < elements.length; i++) {
    el.addEventListener('click', editOnCancel());
    console.log("cancel");
  }
  // elements = document.getElementsByClassName('editCancel');
  // for (let i = 0; i < elements.length; i++) {
  //   el.addEventListener('click', editOnCancel());
  // }
  addUpstreamArrow();
  addDownstreamArrow();
}
const arrowGap = 10;
const arrowMargin = 50;
function addUpstreamArrow() {
  const gridDiv = document.getElementsByClassName('tracingGrid')[0];
  const tracingOuter = document.getElementsByClassName('tracingOuter')[0];
  if(gridDiv && tracingOuter) {
    const upstreamRect = gridDiv.children[1].children[0].getBoundingClientRect();
    const targetRect = gridDiv.children[2].children[0].getBoundingClientRect();
    const divLeft = targetRect.right - arrowMargin;
    const divTop = arrowMargin;
    const width = (upstreamRect.left - arrowGap) - divLeft;
    const height = targetRect.top - divTop;
    const arrow = getArrowSVG(width, 0, 0, height, '#8BE9FD');
    var arrowDiv = document.createElement('div');
    arrowDiv.className = 'tracingArrow';
    arrowDiv.innerHTML = arrow;
    arrowDiv.style.left=`${divLeft}px`;
    arrowDiv.style.top=`${divTop}px`;
    tracingOuter.appendChild(arrowDiv);
  }
}
function addDownstreamArrow() {
  const gridDiv = document.getElementsByClassName('tracingGrid')[0];
  const tracingOuter = document.getElementsByClassName('tracingOuter')[0];
  if(gridDiv && tracingOuter) {
    const targetRect = gridDiv.children[2].children[0].getBoundingClientRect();
    const downstreamRect = gridDiv.children[5].children[0].getBoundingClientRect();
    const divLeft = targetRect.right - arrowMargin;
    const divTop = targetRect.bottom + arrowGap;
    const width = (downstreamRect.left - arrowGap) - divLeft;
    const height = (downstreamRect.top + arrowMargin) - divTop;
    const arrow = getArrowSVG(0, 0,  width, height,'#e18012');
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
  const height = Math.abs(y2 - y1);
  const arrowLength = 15;
  let x3 = x2 - arrowLength;
  if(x2 < x1) {
    x3 = x2 + arrowLength;
  }
  let y3 = y2 - arrowLength;
  if(y2 < y1) {
    y3 = y2 + arrowLength;
  }

//  <div style='width: ${width}px; height: ${height}px; border: none;'>
  return `
  <svg style='width: ${width}px; height: ${height}px;'>
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${color};stroke-width:2"/>
    <line x1="${x2}" y1="${y2}" x2="${x3}" y2="${y2}" style="stroke:${color};stroke-width:2"/>
    <line x1="${x2}" y1="${y2}" x2="${x2}" y2="${y3}" style="stroke:${color};stroke-width:2"/>
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
function editOnSubmit(submitDataMap) {
  var submitData={};
  Object.keys(submitDataMap).map(dataType =>{
    const dataElementId = submitDataMap[dataType];
    const newText = document.getElementById(dataElementId).value;
    submitData[dataType] = newText;
  });
  vscode.postMessage({command: 'submit', submitData});
}
function editOnCancel() {
  vscode.postMessage({command: 'cancel'});
}
function showHelp(helpId) {
  const element = document.getElementById(helpId);
  if(element.style.visibility === 'visible') {
    element.style.visibility = 'hidden';
  } else {
    element.style.visibility = 'visible';
  }
}
