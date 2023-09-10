import * as vscode from 'vscode';
import { SmoresDataFile } from "../model/smoresDataFile";
import { SmoresNode } from "../model/smoresNode";
import { TreeNode } from '../treeView/treeNode';

function getNodeFromContext(context:any):SmoresNode|undefined {
  if(context.nodeId === undefined) {
    vscode.window.showErrorMessage("Undefined Node Id from webview context");
  }
  const nodeId:number = Number(context.nodeId);
  const nodeFilepath = SmoresDataFile.getNodeFilepath(nodeId);
  if(nodeFilepath) {
    return new SmoresNode(nodeFilepath);
  }
}
function getInsertionNodeAndPosition(context:any):[SmoresNode|undefined, number] {
  const originNode = getNodeFromContext(context);
  if(originNode !== undefined) {
    if(originNode.data.category === "heading" || originNode.data.category === "document") {
      return [originNode, -1];
    } else {
      const parent = originNode.getParentNode();
      if(parent !== null) {
        const insertPos = parent.getChildPosition(originNode.data.id);
        return [parent, insertPos];
      }
    }
  }
  return [originNode, -1];
}
export async function newHeading(node:SmoresNode, insertPos?:number) {
  const heading = await vscode.window.showInputBox({ placeHolder: 'new heading?' });
  if(heading) {
    return node.newItem("heading", heading);
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
export function newNonFuncReq(node:SmoresNode, insertPos?:number) {
  return node.newItem("nonFunctionalRequirement", "new non functional requirement", insertPos);
}
export function newFuncReq(node:SmoresNode, insertPos?:number) {
  return node.newItem("functionalRequirement", "new functional requirement", insertPos);
}
export function newSysTest(node:SmoresNode, insertPos?:number) {
  return node.newItem("nonSoftwareSystemTest", "new software system test", insertPos);
}
export function newIntTest(node:SmoresNode, insertPos?:number) {
  return node.newItem("nonSoftwareIntegrationTest", "new software integration test", insertPos);
}
export function newUnitTest(node:SmoresNode, insertPos?:number) {
  return node.newItem("nonSoftwareUnitTest", "new software unit test", insertPos);
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
  newHeading(node.smoresNode);
}
export function newTreeComment(node:TreeNode) {
  newComment(node.smoresNode);
}
export function newTreeUserReq(node:TreeNode) {
  newUserReq(node.smoresNode);
}
export function newTreeFuncReq(node:TreeNode) {
  newFuncReq(node.smoresNode);
}
export function newTreeNonFuncReq(node:TreeNode) {
  newNonFuncReq(node.smoresNode);
}
export function newTreeSysTest(node:TreeNode) {
  newSysTest(node.smoresNode);
}
export function newTreeIntTest(node:TreeNode) {
  newIntTest(node.smoresNode);
}
export function newTreeUnitTest(node:TreeNode) {
  newUnitTest(node.smoresNode);
}
export function newTreeImage(node:TreeNode) {
  newImage(node.smoresNode);
}
export function newTreeMermaidImage(node:TreeNode) {
  newMermaidImage(node.smoresNode);
}

export async function newWebviewHeading(context:any) {
  const [insertNode, insertPos] = getInsertionNodeAndPosition(context);
  newHeading(insertNode!, insertPos);
}
export function newWebviewComment(context:any) {
  const [insertNode, insertPos] = getInsertionNodeAndPosition(context);
  newComment(insertNode!, undefined, insertPos);
}
export function newWebviewUserReq(context:any) {
  const [insertNode, insertPos] = getInsertionNodeAndPosition(context);
  newUserReq(insertNode!, insertPos);
}
export function newWebviewNonFuncReq(context:any) {
  const [insertNode, insertPos] = getInsertionNodeAndPosition(context);
  newNonFuncReq(insertNode!, insertPos);
}
export function newWebviewFuncReq(context:any) {
  const [insertNode, insertPos] = getInsertionNodeAndPosition(context);
  newFuncReq(insertNode!, insertPos);
}
export function newWebviewSysTest(context:any) {
  const [insertNode, insertPos] = getInsertionNodeAndPosition(context);
  newSysTest(insertNode!, insertPos);
}
export function newWebviewIntTest(context:any) {
  const [insertNode, insertPos] = getInsertionNodeAndPosition(context);
  newIntTest(insertNode!, insertPos);
}
export function newWebviewUnitTest(context:any) {
  const [insertNode, insertPos] = getInsertionNodeAndPosition(context);
  newUnitTest(insertNode!, insertPos);
}
export function newWebviewImage(context:any) {
  const [insertNode, insertPos] = getInsertionNodeAndPosition(context);
  newImage(insertNode!, insertPos);
}
export function newWebviewMermaidImage(context:any) {
  const [insertNode, insertPos] = getInsertionNodeAndPosition(context);
  newMermaidImage(insertNode!, insertPos);
}

