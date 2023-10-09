const vscode = acquireVsCodeApi();

addEventListener("load", delayedInit);

function delayedInit() {
  setTimeout(initialize, 50);
}
function initialize() {
  addEditorClickHandlers();
  addProjectEditorClickHandlers();
  addToolbarHandlers();
  exportMermaidImages();
}
function addEditorClickHandlers() {
  var webview = document.getElementById('webviewDiv');
  if(webview) { 
    webview.addEventListener('click', editorAddBlock); 
  }
  var elements = document.getElementsByClassName('block');
  for (let i = 0; i < elements.length; i++) {
    var el = elements[i];
    el.addEventListener('click', editorBlockOnClick);
    var textAreas = el.getElementsByTagName('textarea');
    for (let t = 0; t < textAreas.length; t++) {
      var ta = textAreas[t];
      ta.addEventListener('change', editorAutogrowOnChange);
      ta.addEventListener('focusin', editorAutogrowOnFocusIn);
    }
  }
}
function addProjectEditorClickHandlers() {
  var elements = document.getElementsByClassName('projectNewDoc');
  for (let i = 0; i < elements.length; i++) {
    var el = elements[i];
    el.addEventListener('click', projectNewDocClick);
  }
  var elements = document.getElementsByClassName('projectOpenDoc');
  for (let i = 0; i < elements.length; i++) {
    var el = elements[i];
    el.addEventListener('click', projectOpenDocClick);
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
function editorAddBlock(event) {
  const clientY = event.clientY;
  for(let i=0; i<event.currentTarget.children.length; i++) {
    const rect = event.currentTarget.children[i].getBoundingClientRect();
    if(rect.y > event.clientY) {
      vscode.postMessage({command: 'addEditBlock', blockNumber:i});
      return;    
    }
  }  
}
function editorBlockOnClick(event) {
  const blockNumber = event.currentTarget.dataset["blockNumber"];
  vscode.postMessage({command: 'addEditBlock', blockNumber:Number(blockNumber)});
  event.stopPropagation();
}
function editorAutogrowOnChange(event) {
  const value = event.currentTarget.value;
  event.currentTarget.parentNode.dataset.replicatedValue = value; // Autogrow
  const blockNumber = event.currentTarget.dataset["blockNumber"];
  vscode.postMessage({command: 'updateTextBlockContent', blockNumber:Number(blockNumber), blockValue:value});
}
function editorAutogrowOnFocusIn(event) {
  const blockNumber = event.currentTarget.dataset["blockNumber"];
  document.getElementById('editorToolbar').dataset['lastBlock'] = blockNumber;
}
function addToolbarHandlers() {
  let el = document.getElementById('toolbarClose');
  if(el) {
    el.addEventListener('click', toolbarCloseOnClick);
    document.getElementById('toolbarAddText').addEventListener('click', toolbarAddTextOnClick);
    document.getElementById('toolbarAddImage').addEventListener('click', toolbarAddImageOnClick);
    document.getElementById('toolbarAddMermaid').addEventListener('click', toolbarAddMermaidOnClick);
    document.getElementById('toolbarAddFR').addEventListener('click', toolbarAddFROnClick);
    document.getElementById('toolbarAddNFR').addEventListener('click', toolbarAddNFROnClick);
    document.getElementById('toolbarAddDC').addEventListener('click', toolbarAddDCOnClick);
  }
}
function toolbarCloseOnClick(event) {
  const blockNumber = event.currentTarget.parentNode.dataset["lastBlock"];
  vscode.postMessage({command: 'closeEditblock', blockNumber:Number(blockNumber)});
}
function toolbarAddTextOnClick(event) {
  const blockNumber = event.currentTarget.parentNode.dataset["lastBlock"];
  vscode.postMessage({command: 'addTextBlock', blockNumber:Number(blockNumber)});  
}
function toolbarAddImageOnClick(event) {
  const blockNumber = event.currentTarget.parentNode.dataset["lastBlock"];
  vscode.postMessage({command: 'addImageBlock', blockNumber:Number(blockNumber)});    
}
function toolbarAddMermaidOnClick(event) {
  const blockNumber = event.currentTarget.parentNode.dataset["lastBlock"];
  vscode.postMessage({command: 'addMermaidBlock', blockNumber:Number(blockNumber)});      
}
function toolbarAddFROnClick(event) {
  const blockNumber = event.currentTarget.parentNode.dataset["lastBlock"];
  vscode.postMessage({command: 'addFRBlock', blockNumber:Number(blockNumber)});    
}
function toolbarAddNFROnClick(event) {
  const blockNumber = event.currentTarget.parentNode.dataset["lastBlock"];
  vscode.postMessage({command: 'addNFRBlock', blockNumber:Number(blockNumber)});  
}
function toolbarAddDCOnClick(event) {
  const blockNumber = event.currentTarget.parentNode.dataset["lastBlock"];
  vscode.postMessage({command: 'addDCBlock', blockNumber:Number(blockNumber)}); 
}
function projectNewDocClick(event) {
  const docType = event.currentTarget.dataset["documentType"];
  vscode.postMessage({command: 'newDocument', documentType: docType});
}
function projectOpenDocClick(event) {
  const relPath = event.currentTarget.dataset["relPath"];
  vscode.postMessage({command: 'openDocument', relativePath: relPath});
}
function projectItemClick(event) {
  const item = event.currentTarget.dataset["item"];
  vscode.postMessage({command: 'dataClick', item: item});

}