import { SmoresNode } from '../model/smoresNode';
import * as utils from '../utils/utils';

const mdHelp:string = "some helpful instructions about Markdown syntax";
const mermaidHelp:string = "some helpful instructions about the Mermaid syntax";
const commentHelp:string = "some helpful instructions about comments";
const requirementHelp:string = "some helpful instructions about requirements";
const transRatHelp:string = "some helpful instructions about translation rationale";

function getEditTextArea(divId:string, divContent:string):string {
  return `<textarea id='${divId}' class="editBox" data-vscode-context='
    {"preventDefaultContextMenuItems": false}'>${divContent}</textarea>`;
}
function getButtons(submitDataMap:any) {
  const nonce = utils.getNonce();
  return `<button class="editOk" nonce="${nonce}" onclick='onSubmit(${submitDataMap})'>Submit</button>
  <button class="editCancel" nonce="${nonce}" onclick="onCancel()">Cancel</button>
  `;
}

function getHelp(helpText:string, nodeId:number) {
  const nonce = utils.getNonce();
  return`
  <button class="helpButton" nonce="${nonce}" onClick="showHelp('help-${nodeId}')">(?)</button>
  <div id="help-${nodeId}" class="helpText">${helpText}</div>`;
}
function getCommentEditDivHtml(node:SmoresNode):string {
  let helpText:string = `${commentHelp}<br/>${mdHelp}`;
  const textArea = getEditTextArea(`textarea-${node.data.id}-1`,node.data.text);
  const buttons = getButtons(`{text:"textarea-${node.data.id}-1"}`);
  const help = getHelp(helpText, node.data.id);
  const outerHtml = `
  <div class="editDiv">${textArea}</div>
  <div class="buttonContainer">${buttons}${help}</div>`;
  return outerHtml;
}
function getMermaidEditDivHtml(node:SmoresNode):string {
  let helpText:string = `${mermaidHelp}`;
  const textArea = getEditTextArea(`textarea-${node.data.id}-1`,node.data.text);
  const buttons = getButtons(`{text:"textarea-${node.data.id}-1"}`);
  const help = getHelp(helpText, node.data.id);
  const outerHtml = `
  <div class="editDiv">${textArea}</div>
  <div class="buttonContainer">${buttons}${help}</div>`;
  return outerHtml;
}
function getRequirementEditDivHtml(node:SmoresNode):string {
  let helpText:string = `${requirementHelp}<br/>${transRatHelp}<br/>${mdHelp}`;
  const textArea1 = getEditTextArea(`textarea-${node.data.id}-1`,node.data.text);
  let tr = '-';
  if(node.data.requirementData) {
    tr=node.data.requirementData.translationRationale;
  }
  const textArea2 = getEditTextArea(`textarea-${node.data.id}-2`,tr);
  const submitDataMap = `{
    text:"textarea-${node.data.id}-1",
    translationRationale:"textarea-${node.data.id}-2"
  }`;
  const buttons = getButtons(submitDataMap);
  const help = getHelp(helpText, node.data.id);
  const outerHtml = `
  <div class="editDiv">${textArea1}<br/>${textArea2}</div>
  <div class="buttonContainer">${buttons}${help}</div>`;
  return outerHtml;
}

export function getEditHtmlForNodeType(node:SmoresNode):string {
  let helpText:string = "some helpful instructions";
  switch(node.data.category) {
    case "document":
    case "heading":
    case "image":
      return "<H1>ERROR - Inconceivable!</H1>";
    case "functionalRequirement":
      return getRequirementEditDivHtml(node);
    case "comment":
      return getCommentEditDivHtml(node);
    case "mermaid":
      return getMermaidEditDivHtml(node);
    default:
      return "<H1>ERROR - Unknown Category</H1>";
  }
}
