import * as vscode from "vscode";
import * as path from "path";
import { TreeNode } from "./treeNode";
import { TreeNodeProvider } from "./treeNodeProvider";

export class SmoresTreeView {
  private view: vscode.TreeView<TreeNode>;
  constructor(context: vscode.ExtensionContext) {
    const rootPath =
      vscode.workspace.workspaceFolders &&
      vscode.workspace.workspaceFolders.length > 0
        ? vscode.workspace.workspaceFolders[0].uri.fsPath
        : undefined;

    const cheat = path.join(rootPath!, "a file name.smores-project");
    this.view = new TreeNodeProvider(cheat).register(context);
  }
}
