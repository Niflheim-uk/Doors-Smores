import * as vscode from "vscode";

var _nonce:string|undefined;
var _webview:vscode.Webview|undefined;

export function getNonce():string {
  if(_nonce) {
    return _nonce;
  } else {
    _nonce = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      _nonce += possible.charAt(Math.floor(Math.random() * possible.length));
    }
  }
	return _nonce;
}
export function clearNonce():void {
  _nonce = undefined;
}

export function getWorkspaceRoot() :string|undefined {
  const rootPath =
  vscode.workspace.workspaceFolders &&
  vscode.workspace.workspaceFolders.length > 0
    ? vscode.workspace.workspaceFolders[0].uri.fsPath
    : undefined;
  return rootPath;
}

export function setWebview(webview:vscode.Webview) {
  _webview = webview;
}
export function getWebview():vscode.Webview|undefined {
  return _webview;
}
export function clearWebview() {
  _webview = undefined;
}


export function getMarkdownParagraphs(originalText:string):string {
  while(originalText[-1]==="\n") {
    originalText = originalText.slice(0,originalText.length-2);
  }
  return (originalText.concat("\n"));
}

