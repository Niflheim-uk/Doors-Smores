import * as vscode from 'vscode';
import { SmoresDataFile } from "../model/smoresDataFile";
import { SmoresNode } from "../model/smoresNode";
import { TreeNode } from '../treeView/treeNode';
import * as schema from '../model/smoresDataSchema';

export function getNodeFromContext(context:any):SmoresNode|undefined {
  if(context.nodeId === undefined) {
    vscode.window.showErrorMessage("Undefined Node Id from webview context");
  }
  const nodeId:number = Number(context.nodeId);
  const nodeFilepath = SmoresDataFile.getNodeFilepath(nodeId);
  if(nodeFilepath) {
    return new SmoresNode(nodeFilepath);
  }
}
function getInsertionNodeAndPosition(originNode:SmoresNode|undefined):[SmoresNode|undefined, number] {
  if(originNode !== undefined) {
    if(originNode.data.category === schema.headingType || originNode.data.category === schema.documentType) {
      return [originNode, -1];
    } else {
      const parent = originNode.getParentNode();
      if(parent !== null) {
        const insertPos = parent.getChildPosition(originNode.data.id);
        return [parent, insertPos+1];
      }
    }
  }
  return [originNode, -1];
}
export async function newHeading(node:SmoresNode, insertPos?:number) {
  const heading = await vscode.window.showInputBox({ placeHolder: 'new heading?' });
  if(heading) {
    return node.newItem(schema.headingType, heading, insertPos);
  }
}
export function newComment(node:SmoresNode, content?:string, insertPos?:number) {
  if(content === undefined) {
    content = "new comment";
  }
  return node.newItem(schema.commentType, content, insertPos);
}
export function newFuncReq(node:SmoresNode, insertPos?:number) {
  switch(node.getDocumentType()) {
  case schema.ursDocType:
    return node.newItem(schema.userFRType, "new functional requirement", insertPos);
  case schema.srsDocType:
    return node.newItem(schema.softFRType, "new functional requirement", insertPos);
  case schema.adsDocType:
    return node.newItem(schema.archFRType, "new functional requirement", insertPos);
  case schema.ddsDocType:
    return node.newItem(schema.desFRType, "new functional requirement", insertPos);
  }
}
export function newNonFuncReq(node:SmoresNode, insertPos?:number) {
  switch(node.getDocumentType()) {
  case schema.ursDocType:
    return node.newItem(schema.userNFRType, "new non functional requirement", insertPos);
  case schema.srsDocType:
    return node.newItem(schema.softNFRType, "new non functional requirement", insertPos);
  case schema.adsDocType:
    return node.newItem(schema.archNFRType, "new non functional requirement", insertPos);
  case schema.ddsDocType:
    return node.newItem(schema.desNFRType, "new non functional requirement", insertPos);
  }
}
export function newDesCon(node:SmoresNode, insertPos?:number) {
  switch(node.getDocumentType()) {
  case schema.ursDocType:
    return node.newItem(schema.userDCType, "new design constraint", insertPos);
  case schema.srsDocType:
    return node.newItem(schema.softDCType, "new design constraint", insertPos);
  case schema.adsDocType:
    return node.newItem(schema.archDCType, "new design constraint", insertPos);
  case schema.ddsDocType:
    return node.newItem(schema.desDCType, "new design constraint", insertPos);
  }
}
export function newTest(node:SmoresNode, insertPos?:number) {
  switch(node.getDocumentType()) {
  case schema.atpDocType:
    return node.newItem(schema.userTestType, "new user acceptance test", insertPos);
  case schema.stpDocType:
    return node.newItem(schema.softTestType, "new software system test", insertPos);
  case schema.itpDocType:
    return node.newItem(schema.archTestType, "new software integration test", insertPos);
  case schema.utpDocType:
    return node.newItem(schema.desTestType, "new unit test", insertPos);
  }
}
export function newImage(node:SmoresNode, insertPos?:number) {
  return node.newItem("image", "../defaultImage.jpg", insertPos);
}
export function newMermaidImage(node:SmoresNode, insertPos?:number) {
  return node.newItem("mermaid", `sequenceDiagram
Alice->>John: Hello John, how are you?
John-->>Alice: Great!
Alice-)John: See you later!`, insertPos);
}


export function newTreeHeading(node:TreeNode) {
  const [insertNode, insertPos] = getInsertionNodeAndPosition(node.smoresNode);
  newHeading(insertNode!, insertPos);
}
export function newTreeComment(node:TreeNode) {
  const [insertNode, insertPos] = getInsertionNodeAndPosition(node.smoresNode);
  newComment(insertNode!, undefined, insertPos);
}
export function newTreeFuncReq(node:TreeNode) {
  const [insertNode, insertPos] = getInsertionNodeAndPosition(node.smoresNode);
  newFuncReq(insertNode!, insertPos);
}
export function newTreeNonFuncReq(node:TreeNode) {
  const [insertNode, insertPos] = getInsertionNodeAndPosition(node.smoresNode);
  newNonFuncReq(insertNode!, insertPos);
}
export function newTreeDesCon(node:TreeNode) {
  const [insertNode, insertPos] = getInsertionNodeAndPosition(node.smoresNode);
  newDesCon(insertNode!, insertPos);
}
export function newTreeTest(node:TreeNode) {
  const [insertNode, insertPos] = getInsertionNodeAndPosition(node.smoresNode);
  newTest(insertNode!, insertPos);
}
export function newTreeImage(node:TreeNode) {
  const [insertNode, insertPos] = getInsertionNodeAndPosition(node.smoresNode);
  newImage(insertNode!, insertPos);
}
export function newTreeMermaidImage(node:TreeNode) {
  const [insertNode, insertPos] = getInsertionNodeAndPosition(node.smoresNode);
  newMermaidImage(insertNode!, insertPos);
}

export async function newWebviewHeading(context:any) {
  const originNode = getNodeFromContext(context);
  const [insertNode, insertPos] = getInsertionNodeAndPosition(originNode);
  newHeading(insertNode!, insertPos);
}
export function newWebviewComment(context:any) {
  const originNode = getNodeFromContext(context);
  const [insertNode, insertPos] = getInsertionNodeAndPosition(originNode);
  newComment(insertNode!, undefined, insertPos);
}
export function newWebviewFuncReq(context:any) {
  const originNode = getNodeFromContext(context);
  const [insertNode, insertPos] = getInsertionNodeAndPosition(originNode);
  newFuncReq(insertNode!, insertPos);
}
export function newWebviewNonFuncReq(context:any) {
  const originNode = getNodeFromContext(context);
  const [insertNode, insertPos] = getInsertionNodeAndPosition(originNode);
  newNonFuncReq(insertNode!, insertPos);
}
export function newWebviewDesCon(context:any) {
  const originNode = getNodeFromContext(context);
  const [insertNode, insertPos] = getInsertionNodeAndPosition(originNode);
  newDesCon(insertNode!, insertPos);
}
export function newWebviewTest(context:any) {
  const originNode = getNodeFromContext(context);
  const [insertNode, insertPos] = getInsertionNodeAndPosition(originNode);
  newTest(insertNode!, insertPos);
}
export function newWebviewImage(context:any) {
  const originNode = getNodeFromContext(context);
  const [insertNode, insertPos] = getInsertionNodeAndPosition(originNode);
  newImage(insertNode!, insertPos);
}
export function newWebviewMermaidImage(context:any) {
  const originNode = getNodeFromContext(context);
  const [insertNode, insertPos] = getInsertionNodeAndPosition(originNode);
  newMermaidImage(insertNode!, insertPos);
}

