import * as vscode from "vscode";
import { getNonce } from "../getNonce";
import { getStylePaths, getScriptPath } from "../resources";
import { DoorsSmores } from "../../doorsSmores";
import { join } from "path";

export function getStyleBlock(webview:vscode.Webview, exporting:boolean):string {
  const nonce = getNonce();
  const stylePaths = getStylePaths();
  if(webview === undefined) {
    return "";
  }
  var styleUri:string[];
  if(exporting) {
    return `
  <link nonce="${nonce}" href="file:///${stylePaths.base}" rel="stylesheet"/>
  <link nonce="${nonce}" href="file:///${stylePaths.user}" rel="stylesheet"/>`;
  } else {
    styleUri = [
      webview.asWebviewUri(vscode.Uri.file(stylePaths.base)).toString(),
      webview.asWebviewUri(vscode.Uri.file(stylePaths.user)).toString(),
      webview.asWebviewUri(vscode.Uri.file(stylePaths.gui)).toString(),
      webview.asWebviewUri(vscode.Uri.file(stylePaths.icons)).toString(),
    ];
    return `
  <link nonce="${nonce}" href="${styleUri[0]}" rel="stylesheet"/>
  <link nonce="${nonce}" href="${styleUri[1]}" rel="stylesheet"/>
  <link nonce="${nonce}" href="${styleUri[2]}" rel="stylesheet"/>
  <link nonce="${nonce}" href="${styleUri[3]}" rel="stylesheet"/>`;
  }
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
  <script nonce="${nonce}" src="${scriptUri}"></script>`;
}

export function getMermaidBlock(webview:vscode.Webview, exporting:boolean):string {
  const nonce = getNonce();
  const extensionPath = DoorsSmores.getExtensionPath();
  const mermaidPath = join(extensionPath, 'resources', 'vendor', 'mermaid', 'mermaid.min.js');
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
    mermaidUri = `file:///${mermaidPath}`;
  } else {
    mermaidUri = webview.asWebviewUri(vscode.Uri.file(mermaidPath)).toString();
  }
  return `
  <script nonce="${nonce}" src="${mermaidUri}"></script>
  <script nonce="${nonce}">
    mermaid.initialize(
      ${mermaidConfig}
    );
  </script>`;
}
