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
