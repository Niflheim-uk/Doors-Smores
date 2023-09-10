import * as vscode from "vscode";
import * as fs from 'fs';
import * as path from 'path';
import { SmoresNode } from "../model/smoresNode";
import {getBodyHtml} from './bodyHtml';
import * as utils from "../utils/utils";
import { SmoresDataFile } from "../model/smoresDataFile";

const _extensionPath = SmoresDataFile.getExtensionPath();

function getMermaidPath():string|undefined {
  if(_extensionPath) {
    return path.join(_extensionPath, 'resources', 'vendor', 'mermaid', 'mermaid.min.js');
  }
  return undefined;
}
function getStyleBlock(exporting:boolean):string {
  const nonce = utils.getNonce();
  const webview = utils.getDocumentWebview();
  const stylePaths = utils.getDocStylePaths(_extensionPath);
  if(webview === undefined || stylePaths === undefined) {
    return "";
  }
  var styleUri:string[];
  if(exporting) {
    styleUri = [
      stylePaths[0],
      stylePaths[1],
      stylePaths[2],
      stylePaths[3]
    ];
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
function getScriptBlock(exporting:boolean):string {
  const nonce = utils.getNonce();
  const webview = utils.getDocumentWebview();
  const scriptPath = utils.getScriptPath(_extensionPath);
  if(webview === undefined || scriptPath === undefined) {
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

function getMermaidBlock(exporting:boolean):string {
  const nonce = utils.getNonce();
  const webview = utils.getDocumentWebview();
  const mermaidPath = getMermaidPath();
  const mermaidConfig = `{ 
    startOnLoad: true, 
    theme: 'neutral',
    flowchart: {
       useMaxWidth: false, 
       htmlLabels: true 
      } 
    }`;
  var mermaidUri;
  if(webview === undefined || mermaidPath === undefined) {
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
export function getPageHtml(node:SmoresNode, exporting:boolean, editNode?:SmoresNode):string {
  const nonce = utils.getNonce();
  const webview = utils.getDocumentWebview();
  if(webview === undefined) {
    return "";
  }
  const bodyHtml = getBodyHtml(node, exporting, editNode);
  const styleBlock = getStyleBlock(exporting);
  const scriptBlock = getScriptBlock(exporting);
  const mermaidBlock = getMermaidBlock(exporting);
  utils.clearNonce();
  
  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Security-Policy" content="
        default-src 'none'; 
        img-src ${webview.cspSource} 'nonce-${nonce}';
        script-src ${webview.cspSource} 'nonce-${nonce}';
        style-src ${webview.cspSource} 'nonce-${nonce}';
      "/>
      ${styleBlock}
      <title>${node.data.text}</title>
    </head>
    <body>${bodyHtml}${mermaidBlock}${scriptBlock}</body>    
  </html>`;  
}
/*
      <meta http-equiv="Content-Security-Policy" content="
        default-src 'none'; 
        img-src ${webview.cspSource} 'nonce-${nonce}';
        script-src ${webview.cspSource} 'nonce-${nonce}';
        style-src ${webview.cspSource} 'nonce-${nonce}';
      "/>
*/