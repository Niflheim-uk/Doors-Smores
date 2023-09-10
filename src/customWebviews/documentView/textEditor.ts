import { DocumentNode } from '../../model/documentNode';
import * as schema from '../../model/schema';

const mdHelp:string = "some helpful instructions about Markdown syntax";
const mermaidHelp:string = "some helpful instructions about the Mermaid syntax";
const commentHelp:string = "some helpful instructions about comments";
const requirementHelp:string = "some helpful instructions about requirements";
const transRatHelp:string = "some helpful instructions about translation rationale";
const desConHelp:string = "some helpful instructions about design constraints";
const testCaseHelp:string = "some helpful instructions about test cases";
const expResHelp:string = "some helpful instructions about expected results";

function getEditTextArea(divId:string, divContent:string, contentType:string):string {
  const label = getDataTypeDisplayName(contentType);
  return `<h2>${label}</h2>
  <textarea id='${divId}' class="editBox" 
  data-vscode-context='{"preventDefaultContextMenuItems": false}' 
  data-content-type='${contentType}'>${divContent}</textarea>`;
}
function getButtons(nodeId:number) {
  const dataAttribute = `data-node-id='${nodeId}'`;
  return `
  <button class="editSubmit" ${dataAttribute}>Submit</button>
  <button class="helpButton" ${dataAttribute}>Help</button>
  <button class="editCancel">Cancel</button>
  `;
}

function getHelp(helpText:string, nodeId:number):string {
  return`<div id="help-${nodeId}" class="helpText">${helpText}</div>`;
}

function getTranslationRationaleArea(node:DocumentNode):string {
  let tr = '-';
  if(node.data.requirementData) {
    tr=node.data.requirementData.translationRationale;
  }
  return getEditTextArea(`textarea-${node.data.id}-2`, tr, 'translationRationale');
}

function getExpectedResultsArea(node:DocumentNode):string {
  let er = 'TBD';
  if(node.data.testData) {
    er=node.data.testData.expectedResults;
  }
  return getEditTextArea(`textarea-${node.data.id}-2`, er, 'expectedResults');
}
function getEditDivHtml(node:DocumentNode, editSection:string, helpText:string):string {
  const buttons = getButtons(node.data.id);
  const help = getHelp(helpText, node.data.id);
  const outerHtml = `
  <div class="editDiv">${editSection}<br/>
  <div class="buttonContainer">${buttons}${help}</div></div>`;
  return outerHtml;
}
function getCommentEditDivHtml(node:DocumentNode):string {
  const helpText:string = `${commentHelp}<br/>${mdHelp}`;
  const textArea = getEditTextArea(`textarea-${node.data.id}-1`, node.data.text, 'text');
  return getEditDivHtml(node, textArea, helpText);
}
function getMermaidEditDivHtml(node:DocumentNode):string {
  let helpText:string = `${mermaidHelp}`;
  const textArea = getEditTextArea(`textarea-${node.data.id}-1`, node.data.text, 'text');
  return getEditDivHtml(node, textArea, helpText);
}
function getRequirementEditDivHtml(node:DocumentNode):string {
  let helpText:string = `${requirementHelp}<br/>${transRatHelp}<br/>${mdHelp}`;
  const textArea1 = getEditTextArea(`textarea-${node.data.id}-1`, node.data.text, 'text');
  const textArea2 = getTranslationRationaleArea(node);
  return getEditDivHtml(node, `${textArea1}<br/>${textArea2}`, helpText);
}
function getConstraintEditDivHtml(node:DocumentNode):string {
  let helpText:string = `${desConHelp}<br/>${transRatHelp}<br/>${mdHelp}`;
  const textArea1 = getEditTextArea(`textarea-${node.data.id}-1`, node.data.text, 'text');
  const textArea2 = getTranslationRationaleArea(node);
  return getEditDivHtml(node, `${textArea1}<br/>${textArea2}`, helpText);
}
function getTestCaseEditDivHtml(node:DocumentNode):string {
  let helpText:string = `${testCaseHelp}<br/>${expResHelp}<br/>${mdHelp}`;
  const textArea1 = getEditTextArea(`textarea-${node.data.id}-1`, node.data.text, 'text');
  const textArea2 = getExpectedResultsArea(node);
  return getEditDivHtml(node, `${textArea1}<br/>${textArea2}`, helpText);
}

export function getEditHtmlForNodeType(node:DocumentNode):string {
  switch(node.data.category) {
  case schema.documentCategory:
  case schema.headingCategory:
  case schema.imageCategory:
    return "<H1>ERROR - Inconceivable!</H1>";
  case schema.userFRCategory:
  case schema.userNFRCategory:
  case schema.softFRCategory:
  case schema.softNFRCategory:
  case schema.archFRCategory:
  case schema.archNFRCategory:
  case schema.desFRCategory:
  case schema.desNFRCategory:
    return getRequirementEditDivHtml(node);
  case schema.userDCCategory:
  case schema.softDCCategory:
  case schema.archDCCategory:
  case schema.desDCCategory:
    return getConstraintEditDivHtml(node);
  case schema.userTestCategory:
  case schema.softTestCategory:
  case schema.archTestCategory:
  case schema.desTestCategory:
    return getTestCaseEditDivHtml(node);
  case schema.commentCategory:
    return getCommentEditDivHtml(node);
  case schema.mermaidCategory:
    return getMermaidEditDivHtml(node);
  default:
    return "<H1>ERROR - Unknown Category</H1>";
  }
}
export function getDataTypeDisplayName(dataType:string):string {
  switch(dataType) {
    case 'text':
      return 'Text';
    case 'translationRationale':
      return 'Translation Rationale';
    case 'expectedResults':
      return 'Expected Results';
    case 'documentType':
      return 'Document Type';
    default:
      return 'unknown';
  }
}
