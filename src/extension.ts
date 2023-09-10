import * as vscode from 'vscode';
import { SmoresTreeView } from './treeView/treeView';
import { NodeViewer } from './webView/nodeViewer';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "doors-smores" is now active!');
  const treeView = new SmoresTreeView(context);
  new NodeViewer().register(context);
  
}

// this method is called when your extension is deactivated
export function deactivate() {}
