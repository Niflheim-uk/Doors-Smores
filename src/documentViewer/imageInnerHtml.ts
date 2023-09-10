import * as vscode from 'vscode';
import * as path from 'path';
import * as utils from '../utils/utils';
import { SmoresNode } from '../model/smoresNode';

var _imagesPath:string|undefined;
export function setImagesPath(imagesPath:string) {
  _imagesPath = imagesPath;
}
export function getInnerHtmlForImage(node:SmoresNode, exporting:boolean) {
  const webview = utils.getWebview();
  if(_imagesPath === undefined || webview === undefined) {
    return "";
  }
  const imageFilePath = path.join(_imagesPath, `${node.data.text}`);
  let imageFileUri = vscode.Uri.file(imageFilePath);
  if(exporting===false) {
    imageFileUri = webview.asWebviewUri(imageFileUri);
  }
  return `<div Id='image-${node.data.id}' class='imageHolder'>
    <img src=${imageFileUri}>
  </div>`;
}
