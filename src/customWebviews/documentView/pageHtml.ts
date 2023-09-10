import * as vscode from "vscode";
import { getNonce } from "../getNonce";
import { getDocumentStylePaths, getScriptPath } from "../resources";
import { DoorsSmores } from "../../doorsSmores";
import { join } from "path";

export function getStyleBlock(webview:vscode.Webview, exporting:boolean):string {
  const nonce = getNonce();
  const stylePaths = getDocumentStylePaths();
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

