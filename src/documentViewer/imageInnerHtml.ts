import * as vscode from 'vscode';
import * as path from 'path';
import * as utils from '../utils/utils';
import { SmoresNode } from '../model/smoresNode';
import { SmoresDataFile } from '../model/smoresDataFile';

export function getInnerHtmlForImage(node:SmoresNode, exporting:boolean) {
  const webview = utils.getWebview();
  const imagesPath = SmoresDataFile.getImagesFilepath();
  if(imagesPath === undefined || webview === undefined) {
    return "";
  }
  const imageFilePath = path.join(imagesPath, `${node.data.text}`);
  let imageFileUri = vscode.Uri.file(imageFilePath);
  if(exporting===false) {
    imageFileUri = webview.asWebviewUri(imageFileUri);
  }
  return `<div Id='image-${node.data.id}' class='imageHolder'>
    <img src=${imageFileUri}>
  </div>`;
}
