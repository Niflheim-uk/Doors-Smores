import * as vscode from 'vscode';
import * as utils from './utils';
import { TreeNodeProvider } from './treeView/treeNodeProvider';
import { NodeViewer } from './webView/nodeViewer';


export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "doors-smores" is now active!');
  vscode.commands.executeCommand('setContext', 'doors-smores.projectOpen', false);

  let cheat = undefined;
  const root = utils.getWorkspaceRoot();
  if(root) {
    cheat = root.concat("\\a file name.smores-project");
  }
  
  new TreeNodeProvider(cheat).register(context);
  new NodeViewer().register(context); 
}

// this method is called when your extension is deactivated
export function deactivate() {}
