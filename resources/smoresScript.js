const vscode = acquireVsCodeApi();


function onSubmit(submitDataMap) {
  var submitData={};
  Object.keys(submitDataMap).map(dataType =>{
    const dataElementId = submitDataMap[dataType];
    const newText = document.getElementById(dataElementId).value;
    submitData[dataType] = newText;
  });
  vscode.postMessage({command: 'submit', submitData});
}
function onCancel() {
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
