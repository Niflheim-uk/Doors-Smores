import * as vscode from "vscode";
import * as fs from 'fs';
import * as path from 'path';
import { SmoresNode } from "../model/smoresNode";
import {getBodyHtml} from './bodyHtml';
import * as utils from "../utils/utils";

const _extension = vscode.extensions.getExtension("Niflheim.doors-smores");
const _extensionPath = _extension?.extensionPath;


function getStylePaths():string[]|undefined {
  if(_extensionPath) {
    // Local path to css styles
    const stylesPaths:string[] = [
      path.join(_extensionPath, 'resources', 'theme.css'),
      path.join(_extensionPath, 'resources', 'smores.css'),
      path.join(_extensionPath, 'resources', 'displayStyle.css'),
      path.join(_extensionPath, 'resources', 'pagination.css')
    ];
    return stylesPaths;
  }
  return undefined;
}
function getScriptPath():string|undefined {
  if(_extensionPath) {
    return path.join(_extensionPath, 'resources', 'smoresScript.js');
  }
  return undefined;
}
function getStyleBlock(exporting:boolean):string {
  const nonce = utils.getNonce();
  const webview = utils.getWebview();
  const stylePaths = getStylePaths();
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
      webview.asWebviewUri(vscode.Uri.parse(stylePaths[0])).toString(),
      webview.asWebviewUri(vscode.Uri.parse(stylePaths[1])).toString(),
      webview.asWebviewUri(vscode.Uri.parse(stylePaths[2])).toString(),
      webview.asWebviewUri(vscode.Uri.parse(stylePaths[3])).toString()
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
  const webview = utils.getWebview();
  const scriptPath = getScriptPath();
  if(webview === undefined || scriptPath === undefined) {
    return "";
  }
  var scriptUri:string;
  if(exporting) {
    scriptUri = scriptPath;
  } else {
    scriptUri = webview.asWebviewUri(vscode.Uri.parse(scriptPath)).toString();
  }
  return `
  <script nonce="${nonce}" src="${scriptUri}"></script>
  `;
}
export function getPageHtml(node:SmoresNode, exporting:boolean, editNode?:SmoresNode):string {
  const nonce = utils.getNonce();
  const webview = utils.getWebview();
  if(webview === undefined) {
    return "";
  }
  const bodyHtml = getBodyHtml(node, exporting, editNode);
  const styleBlock = getStyleBlock(exporting);
  const scriptBlock = getScriptBlock(exporting);
  utils.clearNonce();
  
  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${styleBlock}
      ${scriptBlock}
      <title>${node.data.text}</title>
    </head>
    <body>${bodyHtml}</body>
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