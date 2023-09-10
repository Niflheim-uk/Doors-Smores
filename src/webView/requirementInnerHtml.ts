import * as vscode from 'vscode';
import {NodeDataModel} from '../model/smoresDataSchema';
import { Converter } from 'showdown';
import { SmoresNode } from '../model/smoresNode';

var _imagesUri:vscode.Uri;
export function setImagesUri(imagesUri:vscode.Uri) {
  _imagesUri = imagesUri;
}
export function getInnerHtmlForRequirement(node:SmoresNode) {
  const data:NodeDataModel = node.data;
  const converter = new Converter();
  const requirementHtml = converter.makeHtml(data.text);
  let translationRationaleHtml = "-";
  if(data.requirementData) {
    translationRationaleHtml = converter.makeHtml(data.requirementData.translationRationale);
  }
  return `
  <table>
    <colgroup>
      <col class="requirementsC1">
      <col class="requirementsC2">
    </colgroup>
    <tbody>
      <tr>
        <td class="tableText7pt">Id: ${node.data.id}</td>
        <td class="tableText">${requirementHtml}</td>
      </tr>
      <tr>
        <td class="tableText7pt">Translation\nRationale</td>
        <td class="tableText">${translationRationaleHtml}</td>
      </tr>
    </tbody>
  </table>`;
}
