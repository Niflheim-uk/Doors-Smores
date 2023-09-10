import { DocumentNode } from '../model/documentNode';
import { getTableTextHtmlFromMd } from './markdownConversion';
import { join } from 'path';
import { Uri } from 'vscode';
import * as schema from '../model/schema';
import { DoorsSmores } from '../doorsSmores';
import { DocumentView } from './documentView/documentView';
import {getDecomposedFromTraceType, getDecomposesToTraceType, getDetailedByTraceType, getDetailsTraceType, getSatisfiedByTraceType, getSatisfiesTraceType, getTraceCategoryLabels, getVerifiedByTraceType, getVerifiesTraceType} from './traceSorting';

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
  let imageFileUri = Uri.file(imageFilePath);
  if(exporting===false) {
    imageFileUri = DocumentView.getWebviewUri(imageFileUri);
  }
  return `<div Id='image-${node.data.id}' class='imageHolder'>
    <img src=${imageFileUri}>
  </div>`;
}

export function getInnerHtmlForRequirement(node:DocumentNode, hideTracing:boolean=false):string {
  const reqRow = getFirstRow(node);
  const trRow = getTranslationRationaleRow(node);
  let traceRows:string = "";
  if(!hideTracing && DocumentView.includeTraceInfo) {
    traceRows = getTraceRows(node);
  }
  return `
  <table class="indented2ColSmall"><tbody>
    ${reqRow}
    ${trRow}
    ${traceRows}
  </tbody></table>`;
}
export function getInnerHtmlForConstraint(node:DocumentNode, hideTracing:boolean=false):string {
  const constRow = getFirstRow(node);
  const trRow = getTranslationRationaleRow(node);
  let traceRows:string = "";
  if(!hideTracing && DocumentView.includeTraceInfo) {
    traceRows = getTraceRows(node);
  }
  return `
  <table class="indented2ColSmall"><tbody>
    ${constRow}
    ${trRow}
    ${traceRows}
  </tbody></table>`;
}
export function getInnerHtmlForTest(node:DocumentNode, hideTracing:boolean=false):string {
  const testRow = getFirstRow(node);
  const erRow = getExpectedResultsRow(node);
  let traceRows:string = "";
  if(!hideTracing && DocumentView.includeTraceInfo) {
    traceRows = getTraceRows(node);
  }
  return `
  <table class="indented2ColSmall"><tbody>
    ${testRow}
    ${erRow}
    ${traceRows}
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

function getTraceRow(label:string, traceIds:number[]) {
  if(traceIds.length === 0) {
    return "";
  }
  let c2="";
  for(let i=0;i<traceIds.length;i++) {
    const traceNode = DocumentNode.createFromId(traceIds[i]);
    if(traceNode) {
      c2 = c2.concat(getTableTextHtmlFromMd(`${traceNode.data.id}: ${traceNode.data.text.split('\n')[0]}`));
    }
  }
  return getTableRow(label,c2);
}
function getTraceRows(node:DocumentNode):string {
  const originCategory = node.data.category;
  const originCategoryLabel = schema.getLabelPrefix(originCategory);
  const traces = node.data.traces.traceIds;
  const traceCategoryLabels = getTraceCategoryLabels(traces);
  let traceRows="";
  if(schema.isTestCategory(node.data.category)) {
    const verifies = getVerifiesTraceType(originCategoryLabel, traces, traceCategoryLabels);
    traceRows = traceRows.concat(getTraceRow("Verifies", verifies));
  } else {
    const decomposedFrom = getDecomposedFromTraceType(originCategoryLabel, traces, traceCategoryLabels);
    const satisfies = getSatisfiesTraceType(originCategoryLabel, traces, traceCategoryLabels);
    const details = getDetailsTraceType(originCategoryLabel, traces, traceCategoryLabels);
    const decomposesTo = getDecomposesToTraceType(originCategoryLabel, traces, traceCategoryLabels);
    const satisfiedBy = getSatisfiedByTraceType(originCategoryLabel, traces, traceCategoryLabels);
    const detailedBy = getDetailedByTraceType(originCategoryLabel, traces, traceCategoryLabels);
    const verifiedBy = getVerifiedByTraceType(originCategoryLabel, traces, traceCategoryLabels);
    traceRows = traceRows.concat(getTraceRow("Decomposed<br/>from", decomposedFrom));
    traceRows = traceRows.concat(getTraceRow("Satisfies", satisfies));
    traceRows = traceRows.concat(getTraceRow("Details", details));
    traceRows = traceRows.concat(getTraceRow("Decomposes<br/>to", decomposesTo));
    traceRows = traceRows.concat(getTraceRow("Satisfied<br/>by", satisfiedBy));
    traceRows = traceRows.concat(getTraceRow("Detailed<br/>by", detailedBy));
    traceRows = traceRows.concat(getTraceRow("Verified<br/>by", verifiedBy));  
  }
  return traceRows;
}
