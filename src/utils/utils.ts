import * as vscode from "vscode";
import * as path from 'path';


var _nonce:string|undefined;
var _documentWebview:vscode.Webview|undefined;
var _traceWebview:vscode.Webview|undefined;

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

export function setDocumentWebview(webview:vscode.Webview) {
  _documentWebview = webview;
}
export function getDocumentWebview():vscode.Webview|undefined {
  return _documentWebview;
}
export function clearDocumentWebview() {
  _documentWebview = undefined;
}
export function setTraceWebview(webview:vscode.Webview) {
  _traceWebview = webview;
}
export function getTraceWebview():vscode.Webview|undefined {
  return _traceWebview;
}
export function clearTraceWebview() {
  _traceWebview = undefined;
}
export function getMarkdownParagraphs(originalText:string):string {
  while(originalText[-1]==="\n") {
    originalText = originalText.slice(0,originalText.length-2);
  }
  return (originalText.concat("\n"));
}
export function getDocStylePaths(extensionPath:string|undefined):string[]|undefined {
  if(extensionPath) {
    // Local path to css styles
    const stylesPaths:string[] = [
      path.join(extensionPath, 'resources', 'theme.css'),
      path.join(extensionPath, 'resources', 'document.css'),
      path.join(extensionPath, 'resources', 'displayStyle.css'),
      path.join(extensionPath, 'resources', 'pagination.css')
    ];
    return stylesPaths;
  }
  return undefined;
}
export function getTracingStylePaths(extensionPath:string|undefined):string[]|undefined {
  if(extensionPath) {
    // Local path to css styles
    const stylesPaths:string[] = [
      path.join(extensionPath, 'resources', 'theme.css'),
      path.join(extensionPath, 'resources', 'tracing.css'),
      path.join(extensionPath, 'resources', 'displayStyle.css'),
      path.join(extensionPath, 'resources', 'pagination.css'),
      path.join(extensionPath, 'node_modules', '@vscode/codicons', 'dist', 'codicon.css')
    ];
    return stylesPaths;
  }
  return undefined;
}
export function getScriptPath(extensionPath:string|undefined):string|undefined {
  if(extensionPath) {
    return path.join(extensionPath, 'resources', 'smoresScript.js');
  }
  return undefined;
}

export function getArrowSVG(x1:number, y1:number, x2:number, y2:number, color:any) {
  const width = Math.abs(x2 - x1);
  const height = Math.abs(y2 - y1);
  const arrowLength = 15;
  let x3 = x2 - arrowLength;
  if(x2 < x1) {
    x3 = x2 + arrowLength;
  }
  let y3 = y2 - arrowLength;
  if(y2 < y1) {
    y3 = y2 + arrowLength;
  }

//  <div style='width: ${width}px; height: ${height}px; border: none;'>
  return `
  <svg style='width: ${width}px; height: ${height}px;'>
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${color};stroke-width:2"/>
    <line x1="${x2}" y1="${y2}" x2="${x3}" y2="${y2}" style="stroke:${color};stroke-width:2"/>
    <line x1="${x2}" y1="${y2}" x2="${x2}" y2="${y3}" style="stroke:${color};stroke-width:2"/>
  </svg>`;
}