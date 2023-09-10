import { SmoresNode } from '../model/smoresNode';

const mdHelp:string = "some helpful instructions";
const commentHelp:string = "some helpful instructions";
const requirementHelp:string = "some helpful instructions";
const transRatHelp:string = "some helpful instructions";

function getEditTextArea(divId:string, divContent:string):string {
  return `<textarea id='${divId}' class="editBox" data-vscode-context='
    {"preventDefaultContextMenuItems": false}'>${divContent}</textarea>`;
}
function getButtons(submitDataMap:any) {
  return `<button class="editOk" onclick='onSubmit(${submitDataMap})'>Submit</button>
  <button class="editCancel" onclick="onCancel()">Cancel</button>
  `;
}

function getHelp(helpText:string, nodeId:number) {
  return`
  <button class="helpButton" onClick="showHelp('help-${nodeId}')">(?)</button>
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
      break;
    case "functionalRequirement":
      return getRequirementEditDivHtml(node);
    case "comment":
      return getCommentEditDivHtml(node);
    default:
      return "<H1>ERROR - Unknown Category</H1>";
  }
}
