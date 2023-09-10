import * as vscode from 'vscode';
import {NodeDataModel} from '../model/smoresDataSchema';
import { SmoresNode } from '../model/smoresNode';
import * as markdown from './markdownConversion';

export function getInnerHtmlForConstraint(node:SmoresNode) {
  const data:NodeDataModel = node.data;
  const requirementHtml = markdown.getTableTextHtmlFromMd(data.text);
  let tr = "-";
  if(data.requirementData) {
    tr = data.requirementData.translationRationale;
  }
  const translationRationaleHtml = markdown.getTableTextHtmlFromMd(tr);
  return `
  <table class="constraint">
    <tbody>
      <tr>
        <td class="tableSmall">Constraint<br/>Id: ${node.data.id}</td>
        <td>${requirementHtml}</td>
      </tr>
      <tr>
        <td class="tableSmall">Translation<br/>Rationale</td>
        <td>${translationRationaleHtml}</td>
      </tr>
    </tbody>
  </table>`;
}
