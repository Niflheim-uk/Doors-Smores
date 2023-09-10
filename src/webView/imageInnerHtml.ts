import * as vscode from 'vscode';
import { SmoresNode } from '../model/smoresNode';

var _imagesUri:vscode.Uri;
export function setImagesUri(imagesUri:vscode.Uri) {
  _imagesUri = imagesUri;
}
var _webview:vscode.Webview|undefined;
export function setWebview(webview:vscode.Webview|undefined) {
  _webview = webview;
}
export function getInnerHtmlForImage(node:SmoresNode, exporting:boolean) {
  if(_imagesUri === undefined || _webview === undefined) {
    return "";
  }
  const imageFileUri = vscode.Uri.joinPath(_imagesUri, `${node.data.text}`);
  let imageWebUri = imageFileUri;
  if(exporting===false) {
    imageWebUri = _webview.asWebviewUri(imageFileUri);
  }
  return `<div Id='image-${node.data.id}' class='imageHolder'>
    <img src=${imageWebUri}>
  </div>`;
}
