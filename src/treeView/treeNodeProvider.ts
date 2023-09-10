import * as vscode from "vscode";
import * as fs from "fs";
import { TreeNode } from "./treeNode";
import { getProject } from "../model/smoresProject";
import { SmoresNode } from "../model/smoresNode";

export class TreeNodeProvider implements vscode.TreeDataProvider<TreeNode> {
  private _onDidChangeTreeData: vscode.EventEmitter<TreeNode | undefined> =
    new vscode.EventEmitter<TreeNode | undefined>();
  readonly onDidChangeTreeData: vscode.Event<TreeNode | undefined> =
    this._onDidChangeTreeData.event;
  constructor() {
  }

  refresh(entry?: TreeNode): void {
    if(this) {
      this._onDidChangeTreeData.fire(entry);
    }
  }

  getTreeItem(element: TreeNode): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TreeNode): Thenable<TreeNode[]> {
    return vscode.window.withProgress({location:{viewId:"smoresTreeView"}}, () => {
      const project = getProject();
      if(project) {
        if (!element) {
          return Promise.resolve(this.getTreeNodesFromPaths(project.getDocumentPaths()));
        } else {
          return Promise.resolve(this.getTreeNodesFromSmoresNodes(element.smoresNode.getChildNodes()));
        }
      } else {
        return Promise.resolve([]);
      }  
    });
  }
  getTreeNodesFromPaths(filePaths:fs.PathLike[]) {
    var smores:SmoresNode[]|undefined;
    filePaths.forEach(path => {
      const smoresNode = new SmoresNode(path);
      if(smores) {
        smores.push(smoresNode);
      } else {
        smores = [smoresNode];
      }
    });
    if(smores) {
      return this.getTreeNodesFromSmoresNodes(smores);
    }
    return [];
  }
  getTreeNodesFromSmoresNodes(smores:SmoresNode[]):TreeNode[] {
    var nodes:TreeNode[]|undefined;
    smores.forEach(smoresNode => {
      if(nodes){
        nodes.push(new TreeNode(smoresNode.filePath));
      } else {
        nodes = [new TreeNode(smoresNode.filePath)];
      }
    });
    if(nodes) {
      return nodes;
    }
    return [];
  }
}
