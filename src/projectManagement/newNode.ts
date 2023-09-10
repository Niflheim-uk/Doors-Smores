import * as vscode from 'vscode';
import { SmoresDataFile } from "../model/smoresDataFile";
import { SmoresNode } from "../model/smoresNode";
import { TreeNode } from '../treeView/treeNode';

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
    if(originNode.data.category === "heading" || originNode.data.category === "document") {
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
    return node.newItem("heading", heading, insertPos);
  }
}
export function newComment(node:SmoresNode, content?:string, insertPos?:number) {
  if(content === undefined) {
    content = "new comment";
  }
  return node.newItem("comment", content, insertPos);
}
export function newUserReq(node:SmoresNode, insertPos?:number) {
  return node.newItem("userRequirement", "new user requirement", insertPos);
}
export function newFuncReq(node:SmoresNode, insertPos?:number) {
  return node.newItem("functionalRequirement", "new functional requirement", insertPos);
}
export function newNonFuncReq(node:SmoresNode, insertPos?:number) {
  return node.newItem("nonFunctionalRequirement", "new non functional requirement", insertPos);
}
export function newDesCon(node:SmoresNode, insertPos?:number) {
  return node.newItem("designConstraint", "new design constraint", insertPos);
}
export function newSysTest(node:SmoresNode, insertPos?:number) {
  return node.newItem("softwareSystemTest", "new software system test", insertPos);
}
export function newIntTest(node:SmoresNode, insertPos?:number) {
  return node.newItem("softwareIntegrationTest", "new software integration test", insertPos);
}
export function newUnitTest(node:SmoresNode, insertPos?:number) {
  return node.newItem("softwareUnitTest", "new software unit test", insertPos);
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
export function newTreeUserReq(node:TreeNode) {
  const [insertNode, insertPos] = getInsertionNodeAndPosition(node.smoresNode);
  newUserReq(insertNode!, insertPos);
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
export function newTreeSysTest(node:TreeNode) {
  const [insertNode, insertPos] = getInsertionNodeAndPosition(node.smoresNode);
  newSysTest(insertNode!, insertPos);
}
export function newTreeIntTest(node:TreeNode) {
  const [insertNode, insertPos] = getInsertionNodeAndPosition(node.smoresNode);
  newIntTest(node.smoresNode);
}
export function newTreeUnitTest(node:TreeNode) {
  const [insertNode, insertPos] = getInsertionNodeAndPosition(node.smoresNode);
  newUnitTest(insertNode!, insertPos);
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
export function newWebviewUserReq(context:any) {
  const originNode = getNodeFromContext(context);
  const [insertNode, insertPos] = getInsertionNodeAndPosition(originNode);
  newUserReq(insertNode!, insertPos);
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
export function newWebviewSysTest(context:any) {
  const originNode = getNodeFromContext(context);
  const [insertNode, insertPos] = getInsertionNodeAndPosition(originNode);
  newSysTest(insertNode!, insertPos);
}
export function newWebviewIntTest(context:any) {
  const originNode = getNodeFromContext(context);
  const [insertNode, insertPos] = getInsertionNodeAndPosition(originNode);
  newIntTest(insertNode!, insertPos);
}
export function newWebviewUnitTest(context:any) {
  const originNode = getNodeFromContext(context);
  const [insertNode, insertPos] = getInsertionNodeAndPosition(originNode);
  newUnitTest(insertNode!, insertPos);
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

