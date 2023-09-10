import * as vscode from 'vscode';
import { TreeNodeProvider } from './treeView/treeNodeProvider';
import { DocumentViewer } from './documentViewer/documentViewer';

export function activate(context: vscode.ExtensionContext) {
  vscode.commands.executeCommand('setContext', 'doors-smores.projectOpen', false);
  new TreeNodeProvider().register(context);
  new DocumentViewer().register(context); 
}
export function deactivate() {}
