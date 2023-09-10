import * as vscode from "vscode";
import { SmoresNode } from "../model/smoresNode";
import {getBodyHtml} from './bodyHtml';

export function getPageHtml(extensionUri:vscode.Uri,
  webview:vscode.Webview, node:SmoresNode, editNode?:SmoresNode):string {

  // Local path to css styles
  const stylesPath = vscode.Uri.joinPath(extensionUri, 'resources', 'smores.css');
  const scriptPath = vscode.Uri.joinPath(extensionUri, 'resources', 'smoresScript.js');
  // Convert to webviewUri
  const stylesUri = webview.asWebviewUri(stylesPath);
  const scriptUri = webview.asWebviewUri(scriptPath);
  const bodyHtml = getBodyHtml(node, webview, editNode);
  
  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="${stylesUri}" rel="stylesheet">
      <script src="${scriptUri}"></script>
      <title>Smores Preview</title>
    </head>
    <body>${bodyHtml}</body>
  </html>`;  
}