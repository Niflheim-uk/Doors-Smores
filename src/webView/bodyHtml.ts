import { SmoresNode } from '../model/smoresNode';
import { getInnerHtmlForImage } from './imageInnerHtml';
import { getInnerHtmlForRequirement } from './requirementInnerHtml';
import { getHeadingHtml } from './headingInnerHtml';
import { getMarkdownParagraphs, insertHtmlClass, setWebviewSection } from '../utils';
import { getEditHtmlForNodeType } from './textEditor';
import { Converter } from "showdown";


function getViewDivHtml(node:SmoresNode, innerHtml:string) {
  const tooltip = `<b>category</b>: ${node.data.category}<br/><b>id</b>: ${node.data.id}`;
  const outerHtml = `<div class="tooltip">
      <div class="toolTipText">${tooltip}</div>
      <div class="viewDiv" data-vscode-context='{"webviewSection": "Node-${node.data.id}",
        "preventDefaultContextMenuItems": true}'>${innerHtml}</div>
    </div>`;
  return outerHtml;
}

function getHtmlForNodeType(node:SmoresNode, exporting:boolean, editNode?:SmoresNode):string {
  if(node.data.id === editNode?.data.id) {
    return getEditHtmlForNodeType(node);
  } else {
    return getViewHtmlForNodeType(node, exporting);
  }
}
function getViewHtmlForNodeType(node:SmoresNode, exporting:boolean):string {
  const pageBreak = `<hr class="hr-text pageBreak" data-content="Page Break">`;
  let mdString:string = "";
  let innerHtml:string = "";
  let insertPageBreak = false;
  const converter = new Converter();
  switch(node.data.category) {
    case "document":
      return innerHtml;
    case "heading":
      [innerHtml, insertPageBreak] =  getHeadingHtml(node);
      if(insertPageBreak) {
        return pageBreak.concat(getViewDivHtml(node, innerHtml));
      } else {
        return getViewDivHtml(node, innerHtml);
      }
    case "functionalRequirement":
      innerHtml =  getInnerHtmlForRequirement(node);
      return getViewDivHtml(node, innerHtml);
    case "comment":
      const comment = getMarkdownParagraphs(node.data.text);
      innerHtml =  converter.makeHtml(comment);
      innerHtml = insertHtmlClass(innerHtml, "indented");
      innerHtml = setWebviewSection(innerHtml, `text-${node.data.id}`);
      return getViewDivHtml(node, innerHtml);
    case "image":
      innerHtml = getInnerHtmlForImage(node, exporting);
      return getViewDivHtml(node, innerHtml);
    default:
      innerHtml =  "<H1>ERROR - Unknown Category</H1>";
      return getViewDivHtml(node, innerHtml);
  }
}
function getHtmlForNodeChildren(node:SmoresNode, exporting:boolean, editNode?:SmoresNode):string {
  let html:string = "";
  if(node.data.children && node.data.children.length > 0) {
    const childNodes = node.getChildNodes();
    for (let index = 0; index < childNodes.length; index++) {
      const child = childNodes[index];
      html = html.concat(getHtmlForNode(child, exporting, editNode));
    }
  }
  return html;
}
function getHtmlForNode(node: SmoresNode, exporting:boolean, editNode?: SmoresNode):string {
  let html:string = "";
  html = html.concat(getHtmlForNodeType(node, exporting, editNode));
  html = html.concat(getHtmlForNodeChildren(node, exporting, editNode));
  return html;
}

export function getBodyHtml(node: SmoresNode, exporting:boolean, editNode?: SmoresNode):string {
  return getHtmlForNode(node, exporting, editNode);
}
