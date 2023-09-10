import * as vscode from 'vscode';
import { SmoresNode } from '../model/smoresNode';

const confirmationString = 'delete me';
export async function deleteNodeWithConfirmation(node:SmoresNode) {
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