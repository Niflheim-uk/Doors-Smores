const vscode = acquireVsCodeApi();

function onSubmit(elementId) {
  const newText = document.getElementById(elementId).value;
  vscode.postMessage({command: 'submit', newValue:`${newText}`});
}
function onCancel() {
  vscode.postMessage({command: 'cancel'});
}
