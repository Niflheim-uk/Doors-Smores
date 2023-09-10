import * as vscode from 'vscode';
import {NodeDataModel} from '../model/smoresDataSchema';
import { Converter } from 'showdown';
import { SmoresNode } from '../model/smoresNode';

function getTableTextHtml(mdText:string):string {
  const classMap = {
    p: 'tableText',
    ul: 'tableText',
    ol: 'tableText',
    span: 'tableText'
  };
  const tableTextInserter = Object.keys(classMap)
    .map(key => ({
      type: 'output',
      regex: new RegExp(`<${key}(.*)>`, 'g'),
      //@ts-ignore
      replace: `<${key} class="${classMap[key]}" $1>`
    }));

  mdText=`<span>${mdText}</span>`;
  const converter = new Converter({
    extensions: [...tableTextInserter]
  });
  return converter.makeHtml(mdText);
}

export function getInnerHtmlForRequirement(node:SmoresNode) {
  const data:NodeDataModel = node.data;
  const requirementHtml = getTableTextHtml(data.text);
  let tr = "-";
  if(data.requirementData) {
    tr = data.requirementData.translationRationale;
  }
  const translationRationaleHtml = getTableTextHtml(tr);
  return `
  <table class="requirements">
    <tbody>
      <tr>
        <td class="tableSmall">Id: ${node.data.id}</td>
        <td>${requirementHtml}</td>
      </tr>
      <tr>
        <td class="tableSmall">Translation<br/>Rationale</td>
        <td>${translationRationaleHtml}</td>
      </tr>
    </tbody>
  </table>`;
}
