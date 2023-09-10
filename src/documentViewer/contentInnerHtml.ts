import { SmoresNode } from '../model/smoresNode';
import { getTableTextHtmlFromMd } from './markdownConversion';
import { SmoresDataFile } from '../model/smoresDataFile';
import { DocumentViewer } from './documentViewer';
import { join } from 'path';
import { Uri } from 'vscode';

export function getIdLabel(node:SmoresNode) {
  switch(node.data.category) {
  case "heading":
    return `Heading<br/>Id:${node.data.id}`;
  case "comment":
    return `Comment<br/>Id:${node.data.id}`;
  case "userRequirement":
    return `Requirement<br/>Id:${node.data.id}`;
  case "functionalRequirement":
    return `Requirement<br/>Id:${node.data.id}`;
  case "nonFunctionalRequirement":
    return `Requirement<br/>Id:${node.data.id}`;
  case "designConstraint":
    return `Constraint<br/>Id:${node.data.id}`;
  case "softwareSystemTest":
    return `Test Case<br/>Id:${node.data.id}`;
  case "softwareIntegrationTest":
    return `Test Case<br/>Id:${node.data.id}`;
  case "softwareUnitTest":
    return `Test Case<br/>Id:${node.data.id}`;
  case "image":
    return `Image<br/>Id:${node.data.id}`;
  case "mermaid":
    return `Image<br/>Id:${node.data.id}`;
  }
  return "";
}

export function getInnerHtmlForImage(node:SmoresNode, exporting:boolean) {
  const imagesPath = SmoresDataFile.getImagesFilepath();
  const imageFilePath = join(imagesPath, `${node.data.text}`);
  let imageFileUri = Uri.file(imageFilePath);
  if(exporting===false) {
    imageFileUri = DocumentViewer.getWebviewUri(imageFileUri);
  }
  return `<div Id='image-${node.data.id}' class='imageHolder'>
    <img src=${imageFileUri}>
  </div>`;
}

export function getInnerHtmlForRequirement(node:SmoresNode):string {
  const reqRow = getFirstRow(node);
  const trRow = getTranslationRationaleRow(node);
  return `
  <table class="indented2ColSmall"><tbody>
    ${reqRow}
    ${trRow}
  </tbody></table>`;
}
export function getInnerHtmlForConstraint(node:SmoresNode) {
  const constRow = getFirstRow(node);
  const trRow = getTranslationRationaleRow(node);
  return `
  <table class="indented2ColSmall"><tbody>
    ${constRow}
    ${trRow}
  </tbody></table>`;
}
export function getInnerHtmlForTest(node:SmoresNode) {
  const testRow = getFirstRow(node);
  const erRow = getExpectedResultsRow(node);
  return `
  <table class="indented2ColSmall"><tbody>
    ${testRow}
    ${erRow}
  </tbody></table>`;
}
function getFirstRow(node:SmoresNode) {
  const c1 = getIdLabel(node);
  const c2 = getTableTextHtmlFromMd(node.data.text);
  return getTableRow(c1, c2);
}
function getTranslationRationaleRow(node:SmoresNode) {
  let translationRationaleHtml = getTableTextHtmlFromMd("-");
  if(node.data.requirementData) {
    translationRationaleHtml = getTableTextHtmlFromMd(node.data.requirementData.translationRationale);
  }
  return getTableRow("Translation<br/>Rationale", translationRationaleHtml);
}
function getExpectedResultsRow(node:SmoresNode) {
  let expectedResultsHtml = getTableTextHtmlFromMd("TBD");
  if(node.data.testData) {
    expectedResultsHtml = getTableTextHtmlFromMd(node.data.testData.expectedResults);
  }
  return getTableRow("Expected<br/>Results", expectedResultsHtml);
}
function getTableRow(c1:string, c2:string) {
  return `<tr><td class="tableSmall">${c1}</td><td>${c2}</td></tr>`;
}
