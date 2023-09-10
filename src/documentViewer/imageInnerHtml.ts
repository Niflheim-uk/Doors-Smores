import * as vscode from 'vscode';
import * as path from 'path';
import { SmoresNode } from '../model/smoresNode';
import { SmoresDataFile } from '../model/smoresDataFile';
import { DocumentViewer } from './documentViewer';

export function getInnerHtmlForImage(node:SmoresNode, exporting:boolean) {
  const imagesPath = SmoresDataFile.getImagesFilepath();
  const imageFilePath = path.join(imagesPath, `${node.data.text}`);
  let imageFileUri = vscode.Uri.file(imageFilePath);
  if(exporting===false) {
    imageFileUri = DocumentViewer.getWebviewUri(imageFileUri);
  }
  return `<div Id='image-${node.data.id}' class='imageHolder'>
    <img src=${imageFileUri}>
  </div>`;
}
