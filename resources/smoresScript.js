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
  var elements = document.getElementsByClassName('block');
  for (let i = 0; i < elements.length; i++) {
    var el = elements[i];
    el.addEventListener('click', editorBlockOnClick);
    var textAreas = el.getElementsByTagName('textarea');
    for (let t = 0; t < textAreas.length; t++) {
      var ta = textAreas[t];
      ta.addEventListener('change', editorAutogrowOnChange);
      ta.addEventListener('focusin', editorAutogrowOnFocusIn);
      ta.addEventListener('focusout', editorAutogrowOnFocusOut);
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

function editorBlockOnClick(event) {
  const blockNumber = event.currentTarget.dataset["blockNumber"];
  vscode.postMessage({command: 'addEditBlock', blockNumber:Number(blockNumber)});
}
function editorAutogrowOnChange(event) {
  const value = event.currentTarget.value;
  event.currentTarget.parentNode.dataset.replicatedValue = value; // Autogrow
  const blockNumber = event.currentTarget.dataset["blockNumber"];
  vscode.postMessage({command: 'updateTextBlockContent', blockNumber:Number(blockNumber), blockValue:value});
}
function editorAutogrowOnFocusIn(event) {
  let elements = document.getElementsByClassName('toolbarButton');
  for (let i = 0; i < elements.length; i++) {
    elements[i].disabled = false;
    elements[i].children[0].classList.remove("disabledIconColour");
  }
}
function editorAutogrowOnFocusOut(event) {
  const blockNumber = event.currentTarget.dataset["blockNumber"];
  document.getElementById('editorToolbar').dataset['lastBlock'] = blockNumber;
  setTimeout(editorAutogrowOnFocusOutStage2, 1000);
}
function editorAutogrowOnFocusOutStage2() {
  if(document.activeElement.type !== 'textarea') {
    let elements = document.getElementsByClassName('toolbarButton');
    for (let i = 0; i < elements.length; i++) {
      elements[i].disabled = true;
      elements[i].children[0].classList.add("disabledIconColour");
    }
  }
}


function addToolbarHandlers() {
  let el = document.getElementById('toolbarClose');
  if(el) {
    el.addEventListener('click', toolbarCloseOnClick);
  }
  el = document.getElementById('toolbarAddText');
  if(el) {
    el.addEventListener('click', toolbarAddTextOnClick);
  }
  el = document.getElementById('toolbarAddImage');
  if(el) {
    el.addEventListener('click', toolbarAddImageOnClick);
  }
  el = document.getElementById('toolbarAddMermaid');
  if(el) {
    el.addEventListener('click', toolbarAddMermaidOnClick);
  }
  el = document.getElementById('toolbarAddFR');
  if(el) {
    el.addEventListener('click', toolbarAddFROnClick);
  }
  el = document.getElementById('toolbarAddNFR');
  if(el) {
    el.addEventListener('click', toolbarAddNFROnClick);
  }
  el = document.getElementById('toolbarAddDC');
  if(el) {
    el.addEventListener('click', toolbarAddDCOnClick);
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