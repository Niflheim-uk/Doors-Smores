import * as vscode from "vscode";
import { SmoresNode } from "../model/smoresNode";
import {getBodyHtml} from './bodyHtml';


export function getPageHtml(extensionUri:vscode.Uri,
  webview:vscode.Webview, node:SmoresNode, editNode?:SmoresNode):string {
  
  // Local path to css styles
  const stylesPaths:vscode.Uri[] = [
    vscode.Uri.joinPath(extensionUri, 'resources', 'smores.css'),
    vscode.Uri.joinPath(extensionUri, 'resources', 'fonts.css'),
    vscode.Uri.joinPath(extensionUri, 'resources', 'headings.css'),
    vscode.Uri.joinPath(extensionUri, 'resources', 'tables.css')
  ];
  const scriptPath = vscode.Uri.joinPath(extensionUri, 'resources', 'smoresScript.js');
  // Convert to webviewUri
  const stylesUris = [
    webview.asWebviewUri(stylesPaths[0]),
    webview.asWebviewUri(stylesPaths[1]),
    webview.asWebviewUri(stylesPaths[2]),
    webview.asWebviewUri(stylesPaths[3]),
  ];
  const scriptUri = webview.asWebviewUri(scriptPath);
  const bodyHtml = getBodyHtml(node, webview, editNode);
  
  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="${stylesUris[0]}" rel="stylesheet">
      <link href="${stylesUris[1]}" rel="stylesheet">
      <link href="${stylesUris[2]}" rel="stylesheet">
      <link href="${stylesUris[3]}" rel="stylesheet">
      <script src="${scriptUri}"></script>
      <title>Smores Preview</title>
    </head>
    <body>${bodyHtml}</body>
  </html>`;  
}