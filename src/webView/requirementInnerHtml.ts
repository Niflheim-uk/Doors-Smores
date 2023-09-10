import * as vscode from 'vscode';
import {NodeDataModel} from '../model/smoresDataSchema';
import { Converter } from 'showdown';
import { SmoresNode } from '../model/smoresNode';
import { insertHtmlClass } from '../utils';

var _imagesUri:vscode.Uri;
export function setImagesUri(imagesUri:vscode.Uri) {
  _imagesUri = imagesUri;
}
export function getInnerHtmlForRequirement(node:SmoresNode) {
  const data:NodeDataModel = node.data;
  const converter = new Converter();
  let requirementHtml = converter.makeHtml(data.text);
  requirementHtml = insertHtmlClass(requirementHtml, "tableText");
  let translationRationaleHtml = "-";
  if(data.requirementData) {
    translationRationaleHtml = converter.makeHtml(data.requirementData.translationRationale);
  }
  translationRationaleHtml = insertHtmlClass(translationRationaleHtml, "tableText");
  return `
  <table class="requirements">
    <tbody>
      <tr>
        <td class="tableSmall tableText">Id: ${node.data.id}</td>
        <td>${requirementHtml}</td>
      </tr>
      <tr>
        <td class="tableSmall tableText">Translation<br/>Rationale</td>
        <td>${translationRationaleHtml}</td>
      </tr>
    </tbody>
  </table>`;
}
