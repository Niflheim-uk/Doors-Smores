import * as vscode from 'vscode';
import { SmoresNode } from "../model/smoresNode";
import { TreeNode } from "../treeView/treeNode";
import { VersionController } from "../versionControl/versionController";

export function promoteNode(node:TreeNode) {
  const parent = node.smoresNode.getParentNode();
  if(!node.smoresNode.canPromoteNode() || parent === null) {
    return;
  }
  const grandparent = parent.getParentNode();
  if(grandparent) {
    const parentPos = grandparent.getChildPosition(parent.data.id);
    grandparent.addChild(node.smoresNode.data.id, parentPos+1);
    parent.removeChild(node.smoresNode.data.id);
    node.smoresNode.data.parent = grandparent.data.id;
    node.smoresNode.write();
    node.contextValue = node.smoresNode.getContextString();
    VersionController.commitChanges(`Node ${node.smoresNode.data.id} document level decreased`);
    vscode.commands.executeCommand('doors-smores.Update-Views');
  }
}
export function demoteNode(node:TreeNode) {
  const parent = node.smoresNode.getParentNode();
  if(!node.smoresNode.canDemoteNode() || parent === null) {
    return;
  }
  const idPos = parent.getChildPosition(node.smoresNode.data.id);
  // idPos is greater than 0 or couldn't demote
  const prevSiblingPos = idPos -1;
  const siblings = parent.getChildNodes();
  siblings[prevSiblingPos].addChild(node.smoresNode.data.id);
  parent.removeChild(node.smoresNode.data.id);
  node.smoresNode.data.parent = siblings[prevSiblingPos].data.id;
  node.smoresNode.write();
  node.contextValue = node.smoresNode.getContextString();
  VersionController.commitChanges(`Node ${node.smoresNode.data.id} document level increased`);
  vscode.commands.executeCommand('doors-smores.Update-Views');
}
export function moveNodeUp(node:TreeNode) {
  const parent = node.smoresNode.getParentNode();
  if(parent === null) {
    return;
  }
  const index = parent.getChildPosition(node.smoresNode.data.id);
  parent.swapChildIndex(index, index-1);
  node.contextValue = node.smoresNode.getContextString();
  VersionController.commitChanges(`Node ${node.smoresNode.data.id} document order decreased`);
  vscode.commands.executeCommand('doors-smores.Update-Views');
}
export function moveNodeDown(node:TreeNode) {
  const parent = node.smoresNode.getParentNode();
  if(parent === null) {
    return;
  }
  const index = parent.getChildPosition(node.smoresNode.data.id);
  parent.swapChildIndex(index, index+1);
  node.contextValue = node.smoresNode.getContextString();
  VersionController.commitChanges(`Node ${node.smoresNode.data.id} document order increased`);
  vscode.commands.executeCommand('doors-smores.Update-Views');
}
