import * as vscode from 'vscode';
import { TreeNodeProvider } from './treeView/treeNodeProvider';
import { NodeViewer } from './webView/nodeViewer';

export function activate(context: vscode.ExtensionContext) {
  vscode.commands.executeCommand('setContext', 'doors-smores.projectOpen', false);
  new TreeNodeProvider().register(context);
  new NodeViewer().register(context); 
}
export function deactivate() {}
