import * as vscode from 'vscode';
import { SmoresNode } from '../model/smoresNode';
import { TreeNode } from '../treeView/treeNode';
import { VersionController } from '../versionControl/versionController';

const confirmationString = 'delete me';
async function deleteNodeWithConfirmation(node:SmoresNode) {
  const confirmation= await vscode.window.showInputBox({
    prompt:`Enter '${confirmationString}' to confirm`,
    placeHolder:`${confirmationString}`
  });
  if(confirmation === confirmationString) {
    node.delete();
    return true;
  }
  return false;
}

export async function deleteNode(node:TreeNode) {
  const parent = node.smoresNode.getParentNode();
  const nodeId = node.smoresNode.data.id;
  if(await deleteNodeWithConfirmation(node.smoresNode)) {
    VersionController.commitChanges(`Node ${node.smoresNode.data.id} and child nodes deleted`);
    vscode.commands.executeCommand('doors-smores.Update-Views');
  }
}