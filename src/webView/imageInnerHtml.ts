import * as vscode from 'vscode';
import { SmoresNode } from '../model/smoresNode';

var _imagesUri:vscode.Uri;
export function setImagesUri(imagesUri:vscode.Uri) {
  _imagesUri = imagesUri;
}
export function getInnerHtmlForImage(node:SmoresNode, webview:vscode.Webview) {
  if(_imagesUri === undefined) {
    return "";
  }
  const imageFileUri = vscode.Uri.joinPath(_imagesUri, `${node.data.text}`);
  const imageWebUri = webview.asWebviewUri(imageFileUri);
  return `<div Id='image-${node.data.id}' class='imageHolder'>
    <img src=${imageWebUri}>
  </div>`;
}
