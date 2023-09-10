import * as vscode from 'vscode';
import * as utils from '../utils/utils';
import { SmoresNode } from '../model/smoresNode';

var _imagesUri:vscode.Uri;
export function setImagesUri(imagesUri:vscode.Uri) {
  _imagesUri = imagesUri;
}
export function getInnerHtmlForImage(node:SmoresNode, exporting:boolean) {
  const webview = utils.getWebview();
  if(_imagesUri === undefined || webview === undefined) {
    return "";
  }
  const imageFileUri = vscode.Uri.joinPath(_imagesUri, `${node.data.text}`);
  let imageWebUri = imageFileUri;
  if(exporting===false) {
    imageWebUri = webview.asWebviewUri(imageFileUri);
  }
  return `<div Id='image-${node.data.id}' class='imageHolder'>
    <img src=${imageWebUri}>
  </div>`;
}
