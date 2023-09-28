const vscode = acquireVsCodeApi();

addEventListener("load", delayedInit);

function delayedInit() {
  setTimeout(initialize, 50);
}
function initialize() {
  addEditorClickHandlers();
  exportMermaidImages();
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