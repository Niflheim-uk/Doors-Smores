import { DocumentNode } from '../model/documentNode';
import { getTableTextHtmlFromMd } from './markdownConversion';
import { join } from 'path';
import { Uri } from 'vscode';
import * as schema from '../model/schema';
import { DoorsSmores } from '../doorsSmores';
import { DocumentView } from './documentView/documentView';

export function getIdLabel(node:DocumentNode) {
  switch(node.data.category) {
  case schema.headingCategory:
    return `Heading<br/>Id:${node.data.id}`;
  case schema.commentCategory:
    return `Comment<br/>Id:${node.data.id}`;
  case schema.userFRCategory:
  case schema.userNFRCategory:
  case schema.softFRCategory:
  case schema.softNFRCategory:
  case schema.archFRCategory:
  case schema.archNFRCategory:
  case schema.desFRCategory:
  case schema.desNFRCategory:
    return `Requirement<br/>Id:${node.data.id}`;
  case schema.userDCCategory:
  case schema.softDCCategory:
  case schema.archDCCategory:
  case schema.desDCCategory:
    return `Constraint<br/>Id:${node.data.id}`;
  case schema.userTestCategory:
  case schema.softTestCategory:
  case schema.archTestCategory:
  case schema.desTestCategory:
    return `Test Case<br/>Id:${node.data.id}`;
  case schema.imageCategory:
  case schema.mermaidCategory:
    return `Image<br/>Id:${node.data.id}`;
  }
  return "";
}

export function getInnerHtmlForImage(node:DocumentNode, exporting:boolean) {
  const imagesPath = DoorsSmores.getImagesDirectory();
  const imageFilePath = join(imagesPath, `${node.data.text}`);
  let imageFileUri = Uri.file(imageFilePath);
  if(exporting===false) {
    imageFileUri = DocumentView.getWebviewUri(imageFileUri);
  }
  return `<div Id='image-${node.data.id}' class='imageHolder'>
    <img src=${imageFileUri}>
  </div>`;
}

export function getInnerHtmlForRequirement(node:DocumentNode):string {
  const reqRow = getFirstRow(node);
  const trRow = getTranslationRationaleRow(node);
  return `
  <table class="indented2ColSmall"><tbody>
    ${reqRow}
    ${trRow}
  </tbody></table>`;
}
export function getInnerHtmlForConstraint(node:DocumentNode) {
  const constRow = getFirstRow(node);
  const trRow = getTranslationRationaleRow(node);
  return `
  <table class="indented2ColSmall"><tbody>
    ${constRow}
    ${trRow}
  </tbody></table>`;
}
export function getInnerHtmlForTest(node:DocumentNode) {
  const testRow = getFirstRow(node);
  const erRow = getExpectedResultsRow(node);
  return `
  <table class="indented2ColSmall"><tbody>
    ${testRow}
    ${erRow}
  </tbody></table>`;
}
function getFirstRow(node:DocumentNode) {
  const c1 = getIdLabel(node);
  const c2 = getTableTextHtmlFromMd(node.data.text);
  return getTableRow(c1, c2);
}
function getTranslationRationaleRow(node:DocumentNode) {
  let translationRationaleHtml = getTableTextHtmlFromMd("-");
  if(node.data.requirementData) {
    translationRationaleHtml = getTableTextHtmlFromMd(node.data.requirementData.translationRationale);
  }
  return getTableRow("Translation<br/>Rationale", translationRationaleHtml);
}
function getExpectedResultsRow(node:DocumentNode) {
  let expectedResultsHtml = getTableTextHtmlFromMd("TBD");
  if(node.data.testData) {
    expectedResultsHtml = getTableTextHtmlFromMd(node.data.testData.expectedResults);
  }
  return getTableRow("Expected<br/>Results", expectedResultsHtml);
}
function getTableRow(c1:string, c2:string) {
  return `<tr><td class="tableSmall">${c1}</td><td>${c2}</td></tr>`;
}
