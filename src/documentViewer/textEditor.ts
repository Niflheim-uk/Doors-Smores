import { SmoresNode } from '../model/smoresNode';
import { getDataTypeDisplayName } from '../utils/utils';

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
  <button class="helpButton" ${dataAttribute}>(?)</button>
  <button class="editCancel">Cancel</button>
  `;
}

function getHelp(helpText:string, nodeId:number):string {
  return`<div id="help-${nodeId}" class="helpText">${helpText}</div>`;
}

function getTranslationRationaleArea(node:SmoresNode):string {
  let tr = '-';
  if(node.data.requirementData) {
    tr=node.data.requirementData.translationRationale;
  }
  return getEditTextArea(`textarea-${node.data.id}-2`, tr, 'translationRationale');
}

function getExpectedResultsArea(node:SmoresNode):string {
  let er = 'TBD';
  if(node.data.testData) {
    er=node.data.testData.expectedResults;
  }
  return getEditTextArea(`textarea-${node.data.id}-2`, er, 'expectedResults');
}
function getEditDivHtml(node:SmoresNode, editSection:string, helpText:string):string {
  const buttons = getButtons(node.data.id);
  const help = getHelp(helpText, node.data.id);
  const outerHtml = `
  <div class="editDiv">${editSection}</div>
  <div class="buttonContainer">${buttons}${help}</div>`;
  return outerHtml;
}
function getCommentEditDivHtml(node:SmoresNode):string {
  const helpText:string = `${commentHelp}<br/>${mdHelp}`;
  const textArea = getEditTextArea(`textarea-${node.data.id}-1`, node.data.text, 'text');
  return getEditDivHtml(node, textArea, helpText);
}
function getMermaidEditDivHtml(node:SmoresNode):string {
  let helpText:string = `${mermaidHelp}`;
  const textArea = getEditTextArea(`textarea-${node.data.id}-1`, node.data.text, 'text');
  return getEditDivHtml(node, textArea, helpText);
}
function getRequirementEditDivHtml(node:SmoresNode):string {
  let helpText:string = `${requirementHelp}<br/>${transRatHelp}<br/>${mdHelp}`;
  const textArea1 = getEditTextArea(`textarea-${node.data.id}-1`, node.data.text, 'text');
  const textArea2 = getTranslationRationaleArea(node);
  return getEditDivHtml(node, `${textArea1}<br/>${textArea2}`, helpText);
}
function getConstraintEditDivHtml(node:SmoresNode):string {
  let helpText:string = `${desConHelp}<br/>${transRatHelp}<br/>${mdHelp}`;
  const textArea1 = getEditTextArea(`textarea-${node.data.id}-1`, node.data.text, 'text');
  const textArea2 = getTranslationRationaleArea(node);
  return getEditDivHtml(node, `${textArea1}<br/>${textArea2}`, helpText);
}
function getTestCaseEditDivHtml(node:SmoresNode):string {
  let helpText:string = `${testCaseHelp}<br/>${expResHelp}<br/>${mdHelp}`;
  const textArea1 = getEditTextArea(`textarea-${node.data.id}-1`, node.data.text, 'text');
  const textArea2 = getExpectedResultsArea(node);
  return getEditDivHtml(node, `${textArea1}<br/>${textArea2}`, helpText);
}

export function getEditHtmlForNodeType(node:SmoresNode):string {
  switch(node.data.category) {
    case "document":
    case "heading":
    case "image":
      return "<H1>ERROR - Inconceivable!</H1>";
    case "userRequirement":
    case "functionalRequirement":
    case "nonFunctionalRequirement":
      return getRequirementEditDivHtml(node);
    case "designConstraint":
      return getConstraintEditDivHtml(node);
    case "userAcceptanceTest":
    case "softwareSystemTest":
    case "softwareIntegrationTest":
    case "softwareUnitTest":
      return getTestCaseEditDivHtml(node);
    case "comment":
      return getCommentEditDivHtml(node);
    case "mermaid":
      return getMermaidEditDivHtml(node);
    default:
      return "<H1>ERROR - Unknown Category</H1>";
  }
}
