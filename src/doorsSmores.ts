import * as vscode from 'vscode';
import { TreeNode } from "./treeView/treeNode";
import { TreeNodeProvider } from './treeView/treeNodeProvider';
import { DocumentViewer } from './documentViewer/documentViewer';
import { VersionController } from './versionControl/versionController';
import { newDocumentFromTemplate } from "./projectManagement/newDocument";
import { newProjectWorkspace } from "./projectManagement/newProject";
import { openProjectWorkspace } from "./projectManagement/openProject";
import { closeProjectWorkspace } from "./projectManagement/closeProject";
import { deleteNodeWithConfirmation } from "./projectManagement/deleteNode";


export class DoorsSmores {
  private treeView:TreeNodeProvider;
  private documentView:DocumentViewer;
  private versionController:VersionController;
  constructor(context: vscode.ExtensionContext) {
    this.treeView = new TreeNodeProvider();
    this.documentView = new DocumentViewer();
    this.versionController = new VersionController();
    this.register(context);
  }

  private register(context: vscode.ExtensionContext) {
    const registrations = (
      vscode.window.registerTreeDataProvider('smoresTreeView', this.treeView),
      vscode.window.createTreeView('smoresTreeView', {
        treeDataProvider: this.treeView,
        showCollapseAll: false
      }),
      vscode.commands.registerCommand("doors-smores.New-Project", async () => {
        if(await newProjectWorkspace()) {
          this.versionController.initialise();
        }
        this.treeView.refresh();
      }),
      vscode.commands.registerCommand("doors-smores.Open-Project", async () => {
        if(await openProjectWorkspace()) {
          this.versionController.initialise();
        }
        this.treeView.refresh();
      }),
      vscode.commands.registerCommand("doors-smores.Close-Project", () => {
        closeProjectWorkspace();
        this.versionController.close();
        this.treeView.refresh();
      }),
      vscode.commands.registerCommand("doors-smores.Move-Node-Up", (node:TreeNode) => {
        node.smoresNode.moveUp();
        node.contextValue = node.smoresNode.getContextString();
        this.versionController.commitChanges(`Node ${node.smoresNode.data.id} document order decreased`);
        this.refreshViews();
      }),
      vscode.commands.registerCommand("doors-smores.Move-Node-Down", (node:TreeNode) => {
        node.smoresNode.moveDown();
        node.contextValue = node.smoresNode.getContextString();
        this.versionController.commitChanges(`Node ${node.smoresNode.data.id} document order increased`);
        this.refreshViews();
      }),
      vscode.commands.registerCommand("doors-smores.Promote-Node", (node:TreeNode) => {
        node.smoresNode.promote();
        node.contextValue = node.smoresNode.getContextString();
        this.versionController.commitChanges(`Node ${node.smoresNode.data.id} document level decreased`);
        this.refreshViews();
      }),
      vscode.commands.registerCommand("doors-smores.Demote-Node", (node:TreeNode) => {
        node.smoresNode.demote();
        node.contextValue = node.smoresNode.getContextString();
        this.versionController.commitChanges(`Node ${node.smoresNode.data.id} document level increased`);
        this.refreshViews();
      }),
      vscode.commands.registerCommand("doors-smores.New-Document", async () => {
        await newDocumentFromTemplate();
        this.versionController.commitChanges(`New document created`);
        this.refreshViews();
      }),
      vscode.commands.registerCommand("doors-smores.New-Heading", async (node:TreeNode) => {
        const heading = await vscode.window.showInputBox({ placeHolder: 'new heading?' });
        if(heading) {
          node.smoresNode.newHeading(heading);
          this.versionController.commitChanges(`New heading added`);
          this.refreshViews();
        }
      }),
      vscode.commands.registerCommand("doors-smores.New-Comment", (node:TreeNode) => {
        node.smoresNode.newComment();
        this.versionController.commitChanges(`New comment added`);
        this.refreshViews();
      }),
      vscode.commands.registerCommand("doors-smores.New-Functional-Requirement", (node:TreeNode) => {
        node.smoresNode.newFunctionalRequirement();
        this.versionController.commitChanges(`New functional requirement added`);
        this.refreshViews();
      }),
      vscode.commands.registerCommand("doors-smores.New-Image", (node:TreeNode) => {
        node.smoresNode.newImage();
        this.versionController.commitChanges(`New image added`);
        this.refreshViews();
      }),
      vscode.commands.registerCommand("doors-smores.New-MermaidImage", (node:TreeNode) => {
        node.smoresNode.newMermaidImage();
        this.versionController.commitChanges(`New mermaid image added`);
        this.refreshViews();
      }),
      vscode.commands.registerCommand("doors-smores.Delete-TreeNode", async (node:TreeNode) => {
        const parent = node.smoresNode.getParentNode();
        const nodeId = node.smoresNode.data.id;
        if(await deleteNodeWithConfirmation(node.smoresNode)) {
          this.versionController.commitChanges(`Node ${node.smoresNode.data.id} and child nodes deleted`);
          this.refreshViews();
        }
      }),
      vscode.commands.registerCommand('doors-smores.Update-TreeView', () => {
        this.treeView.refresh();
      }),
      vscode.commands.registerCommand("doors-smores.View-TreeNode", (node: TreeNode) => {
        this.documentView.showNode(node.smoresNode);
      }),
      vscode.commands.registerCommand("doors-smores.Edit-Section", (context:any) => {
        this.documentView.editNode(context);
      }),
      vscode.commands.registerCommand('doors-smores.Export-Document', (node: TreeNode) => {
        this.documentView.exportDocument(node.smoresNode);
      })

    );
    context.subscriptions.push(registrations);
  }
  refreshViews() {
    if(this.documentView.isViewActive()) {
      this.documentView.updatePanel();
    }
    this.treeView.refresh();
  }
}
