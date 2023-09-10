import { DocumentNode } from '../model/documentNode';
import { getTableTextHtmlFromMd } from './markdownConversion';
import { join } from 'path';
import { Uri } from 'vscode';
import * as schema from '../model/schema';
import { DoorsSmores } from '../doorsSmores';
import { DocumentView } from './documentView/documentView';
import { getTraceReportDownstreamContent, getTraceReportTestsContent, getTraceReportUpstreamContent } from './traceReportView/traceReportContent';
import { existsSync } from 'fs';

export function getIdLabel(node:DocumentNode) {
  if(node.data.category === schema.headingCategory) {
    return `Heading<br/>Id:${node.data.id}`;
  } else if(node.data.category === schema.commentCategory) {
    return `Comment<br/>Id:${node.data.id}`;
  } else if(schema.isFuncReqCategory(node.data.category) || schema.isNonFuncReqCategory(node.data.category)) {
    return `Requirement<br/>Id:${node.data.id}`;
  } else if(schema.isConstraintCategory(node.data.category)) {
    return `Constraint<br/>Id:${node.data.id}`;
  } else if(schema.isTestCategory(node.data.category)) {
    return `Test Case<br/>Id:${node.data.id}`;
  } else if(node.data.category === schema.imageCategory || node.data.category === schema.mermaidCategory) {
    return `Image<br/>Id:${node.data.id}`;
  }
  return "";
}

export function getInnerHtmlForImage(node:DocumentNode, exporting:boolean) {
  const nodePath = DoorsSmores.getNodeDirectory(node.data.id);
  const imageFilePath = join(nodePath, `${node.data.text}`);
  var imageFileUri;
  if(exporting) {
    imageFileUri = `file:///${imageFilePath}`;
  } else {
    imageFileUri = Uri.file(imageFilePath);
    imageFileUri = DocumentView.getWebviewUri(imageFileUri);
  }
  return `<div Id='image-${node.data.id}' class='imageHolder'>
    <img src=${imageFileUri}/>
  </div>`;
}

export function getInnerHtmlForMermaid(node:DocumentNode, exporting:boolean) {
  var html = '<div class="imageHolder">';
  const nodePath = DoorsSmores.getNodeDirectory(node.data.id);
  const renderedFilepath = join(nodePath, 'rendered.svg');
  if(existsSync(renderedFilepath)) {
    var imageFileUri;
    if(exporting) {
      imageFileUri = `file:///${renderedFilepath}`;
    } else {
      imageFileUri = Uri.file(renderedFilepath);
      imageFileUri = DocumentView.getWebviewUri(imageFileUri);
    }
    html = html.concat(`<img src="${imageFileUri}"/>`);
  } else {
    html = html.concat(`<pre class="mermaid" id="mermaid-${node.data.id}">`);
    html = html.concat(`${node.data.text}`);
    html = html.concat(`</pre>`);
  }
  return html.concat('</div>');
}

export function getInnerHtmlForRequirement(node:DocumentNode, hideTracing:boolean=false):string {
  const row1 = getFirstRow(node);
  const row2 = getTranslationRationaleRow(node);
  return getInnerHtmlForTracedItem(node, hideTracing, row1, row2);
}
export function getInnerHtmlForConstraint(node:DocumentNode, hideTracing:boolean=false):string {
  const row1 = getFirstRow(node);
  const row2 = getTranslationRationaleRow(node);
  return getInnerHtmlForTracedItem(node, hideTracing, row1, row2);
}
export function getInnerHtmlForTest(node:DocumentNode, hideTracing:boolean=false):string {
  const row1 = getFirstRow(node);
  const row2 = getExpectedResultsRow(node);
  return getInnerHtmlForTracedItem(node, hideTracing, row1, row2);
}
export function getInnerHtmlForTracedItem(node:DocumentNode, hideTracing:boolean, row1:string, row2:string):string {
  const documentType = node.getDocumentType();
  let upstreamRow:string = "";
  let testTraceRow:string = "";
  let downstreamRow:string = "";
  if(!hideTracing && DocumentView.includeTraceInfo) {
    upstreamRow = getTraceReportUpstreamContent(documentType, node, DocumentView.tracingRequired);
    testTraceRow = getTraceReportTestsContent(documentType, node, DocumentView.tracingRequired);
    downstreamRow = getTraceReportDownstreamContent(documentType, node, DocumentView.tracingRequired);
  }
  return `
  <table class="indented2ColSmall"><tbody>
    ${row1}
    ${row2}
    ${upstreamRow}
    ${testTraceRow}
    ${downstreamRow}
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
export function getTableRow(c1:string, c2:string) {
  return `<tr><td class="tableSmall">${c1}</td><td>${c2}</td></tr>`;
}

