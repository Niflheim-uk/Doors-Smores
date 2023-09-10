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

async function renderAllMermaidImages() {
  const mermaidElements = document.querySelectorAll("div.mermaidHolder");
  for (let index = 0; index < mermaidElements.length; index++) {
    const element = mermaidElements[index];
    const preElement = element.children[0];
    const elementId = element.attributes.getNamedItem("Id").value;
    if(elementId !== undefined) {
      svg = await mermaid.render(elementId, preElement.innerText);
      element.innerHTML = svg;
    }
  }
}

