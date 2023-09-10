import * as vscode from "vscode";
import * as utils from "../utils/utils";
import { getNonce } from "../utils/getNonce";
import { getExtensionBasedPath } from "../utils/getExtension";
import { getBaseStylePaths, getScriptPath } from "../utils/gui";

export function getStyleBlock(webview:vscode.Webview, exporting:boolean):string {
  const nonce = getNonce();
  const stylePaths = getBaseStylePaths();
  if(webview === undefined) {
    return "";
  }
  var styleUri:string[];
  if(exporting) {
    styleUri = stylePaths;
  } else {
    styleUri = [
      webview.asWebviewUri(vscode.Uri.file(stylePaths[0])).toString(),
      webview.asWebviewUri(vscode.Uri.file(stylePaths[1])).toString(),
      webview.asWebviewUri(vscode.Uri.file(stylePaths[2])).toString(),
      webview.asWebviewUri(vscode.Uri.file(stylePaths[3])).toString()
    ];
  }
  return `
  <link nonce="${nonce}" href="${styleUri[0]}" rel="stylesheet"/>
  <link nonce="${nonce}" href="${styleUri[1]}" rel="stylesheet"/>
  <link nonce="${nonce}" href="${styleUri[2]}" rel="stylesheet"/>
  <link nonce="${nonce}" href="${styleUri[3]}" rel="stylesheet"/>
  `;
}
export function getScriptBlock(webview:vscode.Webview, exporting:boolean):string {
  const nonce = getNonce();
  const scriptPath = getScriptPath();
  if(webview === undefined) {
    return "";
  }
  if(exporting === true) {
    return "";
  }
  const scriptUri = webview.asWebviewUri(vscode.Uri.file(scriptPath)).toString();
  return `
  <script nonce="${nonce}" src="${scriptUri}"></script>
  `;
}

export function getMermaidBlock(webview:vscode.Webview, exporting:boolean):string {
  const nonce = getNonce();
  const mermaidPath = getExtensionBasedPath(['resources', 'vendor', 'mermaid', 'mermaid.min.js']);
  const mermaidConfig = `{ 
    startOnLoad: true, 
    theme: 'neutral',
    flowchart: {
       useMaxWidth: false, 
       htmlLabels: true 
      } 
    }`;
  var mermaidUri;
  if(webview === undefined) {
    return "";
  }
  if(exporting) {
    mermaidUri = mermaidPath;
  } else {
    mermaidUri = webview.asWebviewUri(vscode.Uri.file(mermaidPath)).toString();
  }

  return `
  <script nonce="${nonce}" src="${mermaidUri}"></script>
  <script nonce="${nonce}">mermaid.initialize(${mermaidConfig});</script>`;
}
