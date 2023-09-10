import { DocumentNode } from '../../model/documentNode';
import * as heading from '../headingInnerHtml';
import * as schema from '../../model/schema';
import { getEditHtmlForNodeType } from './textEditor';
import * as markdown from '../markdownConversion';
import { 
  getInnerHtmlForImage,
  getInnerHtmlForRequirement, 
  getInnerHtmlForConstraint, 
  getInnerHtmlForTest 
} from '../contentInnerHtml';
import { getPageBreak } from '../getPageBreak';
import { getTableOfContents } from '../getTableOfContents';

function getViewDivHtml(node:DocumentNode, exporting:boolean, innerHtml:string) {
  if(exporting) {
    return innerHtml;
  }
  const categoryShort = schema.getLabelPrefix(node.data.category);
  const tooltip = `<b>category</b>: ${node.data.category}<br/><b>id</b>: ${node.data.id}`;
  const outerHtml = `
<div class="tooltip">
  <div class="toolTipText">${tooltip}</div>
  <div class="viewDiv" data-vscode-context='{
    "webviewSection": "Node-${categoryShort}", 
    "nodeId": "${node.data.id}", 
    "preventDefaultContextMenuItems": true
  }'>
    ${innerHtml}
  </div>
</div>`;
  return outerHtml;
}

function getHtmlForNodeType(node:DocumentNode, exporting:boolean, editNode?:DocumentNode):string {
  if(node.data.id === editNode?.data.id) {
    return getEditHtmlForNodeType(node);
  } else {
    return getViewHtmlForNodeType(node, exporting);
  }
}
function getMarkdownParagraphs(originalText:string):string {
  while(originalText[-1]==="\n") {
    originalText = originalText.slice(0,originalText.length-2);
  }
  return (originalText.concat("\n"));
}

function getViewHtmlForNodeType(node:DocumentNode, exporting:boolean):string {
  const pageBreak = getPageBreak();;
  let innerHtml:string = "";
  let insertPageBreak = false;
  switch(node.data.category) {
  case schema.documentCategory:
    return ``;
  case schema.headingCategory:
    [innerHtml, insertPageBreak] = heading.getHeadingHtml(node);
    if(insertPageBreak) {
      return pageBreak.concat(getViewDivHtml(node, exporting, innerHtml));
    } else {
      return getViewDivHtml(node, exporting, innerHtml);
    }
  case schema.commentCategory:
    const comment = getMarkdownParagraphs(node.data.text);
    innerHtml = markdown.getIndentedHtmlFromMd(comment);
    return getViewDivHtml(node, exporting, innerHtml);
  case schema.userFRCategory:
  case schema.userNFRCategory:
  case schema.softFRCategory:
  case schema.softNFRCategory:
  case schema.archFRCategory:
  case schema.archNFRCategory:
  case schema.desFRCategory:
  case schema.desNFRCategory:
    innerHtml = getInnerHtmlForRequirement(node);
    return getViewDivHtml(node, exporting, innerHtml);
  case schema.userDCCategory:
  case schema.softDCCategory:
  case schema.archDCCategory:
  case schema.desDCCategory:
    innerHtml = getInnerHtmlForConstraint(node);
    return getViewDivHtml(node, exporting, innerHtml);
  case schema.userTestCategory:
  case schema.softTestCategory:
  case schema.archTestCategory:
  case schema.desTestCategory:
    innerHtml = getInnerHtmlForTest(node);
    return getViewDivHtml(node, exporting, innerHtml);
  case schema.imageCategory:
    innerHtml = getInnerHtmlForImage(node, exporting);
    return getViewDivHtml(node, exporting, innerHtml);
  case schema.mermaidCategory:
    innerHtml = `<div class="imageHolder"><pre class="mermaid">${node.data.text}</pre></div>`;
    return getViewDivHtml(node, exporting, innerHtml);
  default:
    innerHtml = "<H1>ERROR - Unknown Category</H1>";
    return getViewDivHtml(node, exporting, innerHtml);
  }
}
function getHtmlForNodeChildren(node:DocumentNode, exporting:boolean, editNode?:DocumentNode):string {
  let html:string = "";
  if(node.data.children && node.data.children.length > 0) {
    heading.increaseHeaderDepth();
    const childNodes = node.getChildren();
    for (let index = 0; index < childNodes.length; index++) {
      const child = childNodes[index];
      html = html.concat(getHtmlForNode(child, exporting, editNode));
    }
    heading.decreaseHeaderDepth();
  }
  return html;
}
function getHtmlForNode(node: DocumentNode, exporting:boolean, editNode?: DocumentNode):string {
  let html:string = "";
  html = html.concat(getHtmlForNodeType(node, exporting, editNode));
  html = html.concat(getHtmlForNodeChildren(node, exporting, editNode));
  return html;
}
function getDocumentCover(documentType:string, documentName:string) {
  return `<h1>${documentType} - ${documentName}</h1>`;
}
export function getBodyHtml(node: DocumentNode, exporting:boolean, editNode?: DocumentNode):string {
  heading.resetHeaderDepth();
  if(node.data.documentData) {
    const documentType = node.data.documentData.documentType;
    const body = getHtmlForNode(node, exporting, editNode);
    const cover = getDocumentCover(documentType, node.data.text);
    const TOC = getTableOfContents(body, 2);
    return `${cover}${TOC}${body}`;
  } else {
    return getHtmlForNode(node, exporting, editNode);
  }
}
