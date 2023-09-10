import { SmoresNode } from '../model/smoresNode';
import * as heading from './headingInnerHtml';
import * as schema from '../model/smoresDataSchema';
import { getMarkdownParagraphs } from '../utils/utils';
import { getEditHtmlForNodeType } from './textEditor';
import * as markdown from './markdownConversion';
import { 
  getInnerHtmlForImage,
  getInnerHtmlForRequirement, 
  getInnerHtmlForConstraint, 
  getInnerHtmlForTest 
} from './contentInnerHtml';

function getViewDivHtml(node:SmoresNode, exporting:boolean, innerHtml:string) {
  if(exporting) {
    return innerHtml;
  }
  const categoryShort = schema.getLabelPrefix(node.data.category);
  const tooltip = `<b>category</b>: ${node.data.category}<br/><b>id</b>: ${node.data.id}`;
  const outerHtml = `<div class="tooltip">
      <div class="toolTipText">${tooltip}</div>
      <div class="viewDiv" data-vscode-context='{"webviewSection": "Node-${categoryShort}", "nodeId": "${node.data.id}",
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
  let innerHtml:string = "";
  let insertPageBreak = false;
  switch(node.data.category) {
  case schema.documentType:
    return innerHtml;
  case schema.headingType:
    [innerHtml, insertPageBreak] = heading.getHeadingHtml(node);
    if(insertPageBreak) {
      return pageBreak.concat(getViewDivHtml(node, exporting, innerHtml));
    } else {
      return getViewDivHtml(node, exporting, innerHtml);
    }
  case schema.commentType:
    const comment = getMarkdownParagraphs(node.data.text);
    innerHtml = markdown.getIndentedHtmlFromMd(comment);
    return getViewDivHtml(node, exporting, innerHtml);
  case schema.userFRType:
  case schema.userNFRType:
  case schema.softFRType:
  case schema.softNFRType:
  case schema.archFRType:
  case schema.archNFRType:
  case schema.desFRType:
  case schema.desNFRType:
    innerHtml = getInnerHtmlForRequirement(node);
    return getViewDivHtml(node, exporting, innerHtml);
  case schema.userDCType:
  case schema.softDCType:
  case schema.archDCType:
  case schema.desDCType:
    innerHtml = getInnerHtmlForConstraint(node);
    return getViewDivHtml(node, exporting, innerHtml);
  case schema.userTestType:
  case schema.softTestType:
  case schema.archTestType:
  case schema.desTestType:
    innerHtml = getInnerHtmlForTest(node);
    return getViewDivHtml(node, exporting, innerHtml);
  case schema.imageType:
    innerHtml = getInnerHtmlForImage(node, exporting);
    return getViewDivHtml(node, exporting, innerHtml);
  case schema.mermaidType:
    innerHtml = `<span class="tabStop"><pre class='mermaid'>${node.data.text}</pre></span>(node)`;
    return getViewDivHtml(node, exporting, innerHtml);
  default:
    innerHtml = "<H1>ERROR - Unknown Category</H1>";
    return getViewDivHtml(node, exporting, innerHtml);
  }
}
function getHtmlForNodeChildren(node:SmoresNode, exporting:boolean, editNode?:SmoresNode):string {
  let html:string = "";
  if(node.data.children && node.data.children.length > 0) {
    heading.increaseHeaderDepth();
    const childNodes = node.getChildNodes();
    for (let index = 0; index < childNodes.length; index++) {
      const child = childNodes[index];
      html = html.concat(getHtmlForNode(child, exporting, editNode));
    }
    heading.decreaseHeaderDepth();
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
  heading.resetHeaderDepth();
  return getHtmlForNode(node, exporting, editNode);
}
