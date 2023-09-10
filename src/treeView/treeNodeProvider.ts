import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { TreeNode } from "./treeNode";
import { SmoresProject } from "../model/smoresProject";
import { SmoresNode } from "../model/smoresNode";
import * as utils from "../utils";

export class TreeNodeProvider implements vscode.TreeDataProvider<TreeNode> {
  private _onDidChangeTreeData: vscode.EventEmitter<TreeNode | undefined> =
    new vscode.EventEmitter<TreeNode | undefined>();
  readonly onDidChangeTreeData: vscode.Event<TreeNode | undefined> =
    this._onDidChangeTreeData.event;
  private project?:SmoresProject;

  constructor(private projectFilePath?: fs.PathLike) {
    if(this.projectFilePath) {
      this.project = new SmoresProject(this.projectFilePath);
    }
  }

  refresh(entry?: TreeNode): void {
    this._onDidChangeTreeData.fire(entry);
  }
  async initialiseWorkspace() {
    let projectName = await vscode.window.showInputBox({ placeHolder: 'project name?' });
    if(projectName) {
      projectName = projectName.concat(".smores-project");
      this.openProject(projectName);
    }
  }
  openProject(filePath?:string) {
    const workspaceRoot = utils.getWorkspaceRoot();
    if(workspaceRoot === undefined) {
      vscode.window.showErrorMessage("No workspace found for node documents");
      return;
    }
    if(filePath === undefined) {
      vscode.window.showOpenDialog({
        canSelectMany:false,
        /* eslint-disable  @typescript-eslint/naming-convention */
        filters:{'Smores Project':['smores-project']},
        openLabel:"Select Smores Project File"
      }).then(uri => {
        if(uri) {
          filePath = uri[0].fsPath;
          this.openProjectFile(filePath);
        }  
      });
    } else {
      const projectFilepath = path.join (workspaceRoot, filePath);
      this.openProjectFile(projectFilepath);
    }
  }
  openProjectFile(projectFilepath:string) {
    vscode.window.showInformationMessage(`Opening ${projectFilepath}`);
    if(projectFilepath && projectFilepath.match(/\.smores-project$/)) {
      vscode.commands.executeCommand('setContext', 'doors-smores.projectOpen', true);
      this.project = new SmoresProject(projectFilepath);
      this.refresh();
    }
  }

  getTreeItem(element: TreeNode): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TreeNode): Thenable<TreeNode[]> {
    return vscode.window.withProgress({location:{viewId:"smoresTreeView"}}, () => {
      if(this.project) {
        if (!element) {
          return Promise.resolve(this.getTreeNodesFromPaths(this.project.getDocumentPaths()));
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
  private registerWorkspaceCommands(context: vscode.ExtensionContext) {
    const registrations = (
        vscode.commands.registerCommand("doors-smores.Initialise-Workspace", () => {
        this.initialiseWorkspace();
      }),
      vscode.commands.registerCommand("doors-smores.Open-Project", (filePath?) => {
        this.openProject(filePath);
      })
    );
    context.subscriptions.push(registrations);
   }
   private registerNodeMovementCommands(context: vscode.ExtensionContext) {
    const registrations = (
      vscode.commands.registerCommand("doors-smores.Move-Node-Up", (node:TreeNode) => {
        node.smoresNode.moveUp();
        node.contextValue = node.smoresNode.getContextString();
        this.refresh();
      }),
      vscode.commands.registerCommand("doors-smores.Move-Node-Down", (node:TreeNode) => {
        node.smoresNode.moveDown();
        node.contextValue = node.smoresNode.getContextString();
        this.refresh();
      }),
      vscode.commands.registerCommand("doors-smores.Promote-Node", (node:TreeNode) => {
        node.smoresNode.promote();
        node.contextValue = node.smoresNode.getContextString();
        this.refresh();
      }),
      vscode.commands.registerCommand("doors-smores.Demote-Node", (node:TreeNode) => {
        node.smoresNode.demote();
        node.contextValue = node.smoresNode.getContextString();
        this.refresh();
      })
    );
    context.subscriptions.push(registrations);
   }
   private registerNewContentCommands(context: vscode.ExtensionContext) {
    const registrations = (
      vscode.commands.registerCommand("doors-smores.New-Document", async () => {
        if(this.project) {
          const documentName = await vscode.window.showInputBox({ placeHolder: 'document name?' });
          if(documentName) {
            this.project.newDocument(documentName);
            this.refresh();
          }
        }
      }),
      vscode.commands.registerCommand("doors-smores.New-Heading", async (node:TreeNode) => {
        const heading = await vscode.window.showInputBox({ placeHolder: 'new heading?' });
        if(heading) {
          node.smoresNode.newHeading(heading);
          vscode.commands.executeCommand('doors-smores.View-TreeNode',node.smoresNode);
          this.refresh();
        }
      }),
      vscode.commands.registerCommand("doors-smores.New-Comment", (node:TreeNode) => {
        node.smoresNode.newComment();
        vscode.commands.executeCommand('doors-smores.View-TreeNode',node.smoresNode);
        this.refresh();
      }),
      vscode.commands.registerCommand("doors-smores.New-Functional-Requirement", (node:TreeNode) => {
        node.smoresNode.newFunctionalRequirement();
        vscode.commands.executeCommand('doors-smores.View-TreeNode',node.smoresNode);
        this.refresh();
      }),
      vscode.commands.registerCommand("doors-smores.New-Image", (node:TreeNode) => {
        node.smoresNode.newImage();
        vscode.commands.executeCommand('doors-smores.View-TreeNode',node.smoresNode);
        this.refresh();
      })
    );
    context.subscriptions.push(registrations);
  }
  register(context: vscode.ExtensionContext): vscode.TreeView<TreeNode> {
    // setup
    const options = {
        treeDataProvider: this,
        showCollapseAll: true
    };

    // build
    this.registerWorkspaceCommands(context);
    this.registerNodeMovementCommands(context);
    this.registerNewContentCommands(context);
    const registrations = (
      vscode.window.registerTreeDataProvider('smoresTreeView', this),
      vscode.commands.registerCommand('doors-smores.Update-TreeView', () => {
        this.refresh();
      })
    );
    context.subscriptions.push(registrations);

    // create
    const tree = vscode.window.createTreeView('smoresTreeView', options);
    
    // setup: events
    // tree.onDidChangeSelection(e => {
    //   console.log("onDidChangeSelection");
    //   console.log(e); // breakpoint here for debug
    //   if(e.selection.length >0) {
    //     const node = e.selection[0].smoresNode;
    //     vscode.commands.executeCommand('doors-smores.View-TreeNode',node);
    //   }
    // });

    // subscribe
    context.subscriptions.push(tree);
    return tree;
  }
}
