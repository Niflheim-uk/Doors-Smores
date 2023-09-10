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

export function insertHtmlClass(html:string, className:string) {
  const classPattern1 = `(.*)class="(.*)`;
  const classPattern2 = `(<[^ >])(.*)`;
  const match1 = html.match(classPattern1);
  if(Array.isArray(match1)) {
    html = `${match1[1]}class="${className}, ${match1[2]}`;
  } else {
    const match2 = html.match(classPattern2);
    if(Array.isArray(match2)) {
      html = `${match2[1]} class="${className}"${match2[2]}`;
    } else {
      html = `<span class=${className}>${html}</span>`;
    }
  }
  return html;
}
export function setWebviewSection(html:string, sectionId:string):string {
  html = html.replace("\n",'');
  const pattern1 = `(.*)data-vscode-context='{"webviewSection": "[^"]+"(.*)`;
  const pattern2 = `(<[^ >])(.*)`;
  const match1 = html.match(pattern1);
  if(Array.isArray(match1)) {
    html = `${match1[1]}data-vscode-context='{"webviewSection": "${sectionId}"${match1[2]}`;
  } else {
    const match2 = html.match(pattern2);
    if(Array.isArray(match2)) {
      html = `${match2[1]} data-vscode-context='{"webviewSection": "${sectionId}"}' ${match2[2]}`;
    } else {
      console.log(`Failed insert webviewSection. No match found: ${html}`);
    }
  }
  return html;
}