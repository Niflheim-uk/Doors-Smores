const vscode = acquireVsCodeApi();

addEventListener("load", delayedInit);

function delayedInit() {
  setTimeout(initialize, 50);
}
function initialize() {
  addEditorClickHandlers();
  addDocumentViewClickHandlers();
  exportMermaidImages();
  addTracingViewClickHandlers();
  addTracingArrows();
}
function addTracingViewClickHandlers() {
  var el;
  var matches;
  var elements = document.getElementsByClassName('tracing');
  for (let i = 0; i < elements.length; i++) {
    el = elements[i];
    matches = el.id.match(/ViewTd-([\d]+)/);
    if(Array.isArray(matches)) {
      el.addEventListener('click', traceViewOnClick);
    }
    matches = el.id.match(/VerifyTd-([\d]+)/);
    if(Array.isArray(matches)) {
      el.addEventListener('click', traceVerifyOnClick);
    }
    matches = el.id.match(/DeleteTd-([\d]+)/);
    if(Array.isArray(matches)) {
      el.addEventListener('click', traceDeleteOnClick);
    }
  }
  el = document.getElementById('NewTrace');
  if(el !== null) {
    el.addEventListener('click', traceAddOnClick);
  }
}
function addTracingArrows() {
  addUpstreamArrow();
  addDownstreamArrow();
  addTestArrow();
}
function addEditorClickHandlers() {
  var elements = document.getElementsByClassName('block');
  for (let i = 0; i < elements.length; i++) {
    var el = elements[i];
    el.addEventListener('click', editorBlockOnClick);
    var textAreas = el.getElementsByTagName('textarea');
    for (let t = 0; t < textAreas.length; t++) {
      var ta = textAreas[t];
      ta.addEventListener('input', editorAutogrowOnInput);
    }
  }
}
function addDocumentViewClickHandlers() {
  var elements = document.getElementsByClassName('viewDiv');
  for (let i = 0; i < elements.length; i++) {
    var el = elements[i];
    el.addEventListener('click', viewDivOnClick);
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
  if(gridDiv && gridDiv.children[3].children[0]) {
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
  const nodeId = Number(event.currentTarget.dataset["nodeId"]);
  vscode.postMessage({command: 'viewTrace', nodeId:nodeId});
}
function traceVerifyOnClick(event) {
  const nodeId = Number(event.currentTarget.dataset["nodeId"]);
  vscode.postMessage({command: 'verifyTrace', nodeId:nodeId});
}
function traceDeleteOnClick(event) {
  const nodeId = Number(event.currentTarget.dataset["nodeId"]);
  vscode.postMessage({command: 'removeTrace', nodeId:nodeId});
}
function traceAddOnClick(event) {
  vscode.postMessage({command: 'addTrace'});
}
function viewDivOnClick(event) {
  const context = event.currentTarget.dataset["vscodeContext"];
  const json = JSON.parse(context);
  vscode.postMessage({command: 'edit', context:json});
}
function editOnSubmit() {
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
    } else if(dataType === 'expectedResults') {
      message.expectedResults = dataValue;
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

function exportMermaidImages() {
  var elements = document.getElementsByClassName('mermaid');
  for (let i = 0; i < elements.length; i++) {
    var el = elements[i];
    const id = el.id.split('mermaid-')[1];
    const height = el.clientHeight;
    const width = el.clientWidth;
    const svg = el.innerHTML;
    var message = {
      command:'render',
      id: Number(id), 
      svg: svg,
      height: height,
      width: width
    };
    vscode.postMessage(message);
  }
}

function editorBlockOnClick(event) {
  const blockNumber = event.currentTarget.dataset["blockNumber"];
  vscode.postMessage({command: 'editBlock', blockNumber:Number(blockNumber)});
}
function editorAutogrowOnInput(event) {
  const blockNumber = event.currentTarget.parentNode.dataset["blockNumber"];
  const value = event.currentTarget.value;
  event.currentTarget.parentNode.dataset.replicatedValue = value;
  vscode.postMessage({command: 'update', blockNumber:Number(blockNumber), data:value});
}