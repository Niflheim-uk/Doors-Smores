import * as vscode from 'vscode';
import {RequirementDataModel} from '../model/smoresDataSchema';
import { Converter } from 'showdown';
import { SmoresNode } from '../model/smoresNode';

var _imagesUri:vscode.Uri;
export function setImagesUri(imagesUri:vscode.Uri) {
  _imagesUri = imagesUri;
}
export function getInnerHtmlForRequirement(node:SmoresNode) {
  const data:RequirementDataModel = node.data;
  const converter = new Converter();
  const requirementHtml = converter.makeHtml(data.text);
  let translationRationaleHtml = "-";
  if(data.translationRationale) {
    translationRationaleHtml = converter.makeHtml(data.translationRationale);
  }
  return `
  <table class="requirementsTable">
    <colgroup>
      <col class="requirementsTableCol1">
      <col class="requirementsTableCol2">
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
