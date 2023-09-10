import * as vscode from 'vscode';
import { SmoresNode } from '../model/smoresNode';
import { getInnerHtmlForImage } from './imageInnerHtml';
import { getInnerHtmlForRequirement } from './requirementInnerHtml';
import { getHeadingMd } from './headingMd';
import {Converter} from "showdown";


function getViewDivHtml(node:SmoresNode, innerHtml:string) {
  const tooltip = `<b>category</b>: ${node.data.category}<br/><b>id</b>: ${node.data.id}`;
  const outerHtml = `<div class="tooltip">
      <div class="toolTipText">${tooltip}</div>
      <div class="viewDiv" data-vscode-context='{"webviewSection": "Node-${node.data.id}",
        "preventDefaultContextMenuItems": true}'>${innerHtml}</div>
    </div>`;
  return outerHtml;
}
function getEditDivHtml(nodeId:number, content:string, helpText:string) {
  const outerHtml = `<div class="editContainer">
    <textarea id='textarea-${nodeId}' class="editBox"
      data-vscode-context='{"webviewSection": "textarea-${nodeId}", 
    "preventDefaultContextMenuItems": false}'>${content}</textarea>
    <div class="editHelp">${helpText}</div>
  </div>
  <button class="editOk" onclick="onSubmit('textarea-${nodeId}')">Submit</button>
  <button class="editCancel" onclick="onCancel()">Cancel</button>`;
  return outerHtml;
}

function getHtmlForNodeType(node:SmoresNode, webview:vscode.Webview, editNode?:SmoresNode):string {
  if(node.data.id === editNode?.data.id) {
    return getEditHtmlForNodeType(node, webview, editNode);
  } else {
    return getViewHtmlForNodeType(node, webview, editNode);
  }
}
function getEditHtmlForNodeType(node:SmoresNode, webview:vscode.Webview, editNode?:SmoresNode):string {
  let helpText:string = "some helpful instructions";
  let innerHtml:string = "";
  switch(node.data.category) {
    case "document":
    case "heading":
    case "image":
      return "<H1>ERROR - Inconceivable!</H1>";
      break;
    case "functionalRequirement":
      return getEditDivHtml(node.data.id, node.data.text, helpText);
    case "comment":
      return getEditDivHtml(node.data.id, node.data.text, helpText);
    default:
      return "<H1>ERROR - Unknown Category</H1>";
  }
}
function getViewHtmlForNodeType(node:SmoresNode, webview:vscode.Webview, editNode?:SmoresNode):string {
  let mdString:string = "";
  let innerHtml:string = "";
  const converter = new Converter();
  switch(node.data.category) {
    case "document":
      return innerHtml;
    case "heading":
      mdString = getHeadingMd(node);
      innerHtml =  converter.makeHtml(mdString);
      return getViewDivHtml(node, innerHtml);
    case "functionalRequirement":
      innerHtml =  getInnerHtmlForRequirement(node);
      return getViewDivHtml(node, innerHtml);
    case "comment":
      innerHtml =  converter.makeHtml(node.data.text);
      return getViewDivHtml(node, innerHtml);
    case "image":
      innerHtml = getInnerHtmlForImage(node, webview);
      return getViewDivHtml(node, innerHtml);
    default:
      innerHtml =  "<H1>ERROR - Unknown Category</H1>";
      return getViewDivHtml(node, innerHtml);
  }
}
function getHtmlForNodeChildren(node:SmoresNode, webview:vscode.Webview, editNode?:SmoresNode):string {
  let html:string = "";
  if(node.data.children && node.data.children.length > 0) {
    const childNodes = node.getChildNodes();
    for (let index = 0; index < childNodes.length; index++) {
      const child = childNodes[index];
      html = html.concat(getHtmlForNode(child, webview, editNode));
    }
  }
  return html;
}
function getHtmlForNode(node: SmoresNode, webview:vscode.Webview, editNode?: SmoresNode):string {
  let html:string = "";
  html = html.concat(getHtmlForNodeType(node, webview, editNode));
  html = html.concat(getHtmlForNodeChildren(node, webview, editNode));
  return html;
}

export function getBodyHtml(node: SmoresNode, webview:vscode.Webview, editNode?: SmoresNode):string {
  return getHtmlForNode(node, webview, editNode);
}
