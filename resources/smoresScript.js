//import {default as mermaid} from 'mermaid';
const vscode = acquireVsCodeApi();

mermaid.initialize({startOnLoad:false});

function onSubmit(elementId) {
  const newText = document.getElementById(elementId).value;
  vscode.postMessage({command: 'submit', newValue:`${newText}`});
}
function onCancel() {
  vscode.postMessage({command: 'cancel'});
}
