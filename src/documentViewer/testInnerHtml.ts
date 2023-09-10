import * as vscode from 'vscode';
import {NodeDataModel} from '../model/smoresDataSchema';
import { SmoresNode } from '../model/smoresNode';
import * as markdown from './markdownConversion';

export function getInnerHtmlForTest(node:SmoresNode) {
  const data:NodeDataModel = node.data;
  const testHtml = markdown.getTableTextHtmlFromMd(data.text);
  let er = "TBD";
  if(data.testData) {
    er = data.testData.expectedResults;
  }
  const expectedResultsHtml = markdown.getTableTextHtmlFromMd(er);
  return `
  <table class="testCase">
    <tbody>
      <tr>
        <td class="tableSmall">Test Case<br/>Id: ${node.data.id}</td>
        <td>${testHtml}</td>
      </tr>
      <tr>
        <td class="tableSmall">Expected<br/>Results</td>
        <td>${expectedResultsHtml}</td>
      </tr>
    </tbody>
  </table>`;
}
