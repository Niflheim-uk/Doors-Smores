import * as vscode from "vscode";
import * as fs from "fs";
import { TreeNode } from "./treeNode";
import { SmoresProject } from "./smoresProject";
import { SmoresNode } from "./smoresNode";

export class TreeNodeProvider implements vscode.TreeDataProvider<TreeNode> {
  private _onDidChangeTreeData: vscode.EventEmitter<TreeNode | undefined> =
    new vscode.EventEmitter<TreeNode | undefined>();
  readonly onDidChangeTreeData: vscode.Event<TreeNode | undefined> =
    this._onDidChangeTreeData.event;
  readonly project?:SmoresProject;

  constructor(private projectFilePath: fs.PathLike|undefined) {
    if(this.projectFilePath) {
      this.project = new SmoresProject(this.projectFilePath);
    }
  }

  refresh(entry?: TreeNode): void {
    this._onDidChangeTreeData.fire(entry);
  }

  getTreeItem(element: TreeNode): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TreeNode): Thenable<TreeNode[]> {
    return vscode.window.withProgress({location:{viewId:"smoresTreeView"}}, () => {
      if(this.project) {
        if (!element) {
          return Promise.resolve(this.getTreeNodesFromSmoresNodes(this.project.getChildNodes()));
        } else {
          return Promise.resolve(this.getTreeNodesFromSmoresNodes(element.smoresNode.getChildNodes()));
        }
      } else {
        return Promise.resolve([]);
      }  
    });
  }
  getTreeNodesFromSmoresNodes(smores:SmoresNode[]):TreeNode[] {
    var nodes:TreeNode[]|undefined;
    smores.forEach(smoresNode => {
      if(nodes){
        nodes.push(new TreeNode(smoresNode.filePath,this.project));
      } else {
        nodes = [new TreeNode(smoresNode.filePath, this.project)];
      }
    });
    if(nodes) {
      return nodes;
    }
    return [];
  }
  register(context: vscode.ExtensionContext): vscode.TreeView<TreeNode> {
    // setup
    const options = {
        treeDataProvider: this,
        showCollapseAll: true
    };

    // build
    vscode.window.registerTreeDataProvider('smoresTreeView', this);
    vscode.commands.registerCommand('doors-smores.Update-TreeView', () => {
        this.refresh();
    });

    // create
    const tree = vscode.window.createTreeView('smoresTreeView', options);
    
    // setup: events
    tree.onDidChangeSelection(e => {
      console.log("onDidChangeSelection");
      console.log(e); // breakpoint here for debug
      if(e.selection.length >0) {
        const node = e.selection[0].smoresNode;
        vscode.commands.executeCommand('doors-smores.View-TreeNode',node);
      }
    });
    // tree.onDidCollapseElement(e => {
    //   console.log("onDidCollapseElement");
    //   console.log(e); // breakpoint here for debug
    // });
    // tree.onDidChangeVisibility(e => {
    //   console.log("onDidChangeVisibility");
    //   console.log(e); // breakpoint here for debug
    // });
    // tree.onDidExpandElement(e => {
    //   console.log("onDidExpandElement");
    //   console.log(e); // breakpoint here for debug
    // });

    // subscribe
    context.subscriptions.push(tree);
    return tree;
  }
}
