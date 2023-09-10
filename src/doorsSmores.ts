import * as vscode from 'vscode';
import { TreeNode } from "./treeView/treeNode";
import { TreeNodeProvider } from './treeView/treeNodeProvider';
import { DocumentViewer } from './documentViewer/documentViewer';
import { TraceView } from './traceView/traceView';
import { VersionController } from './versionControl/versionController';
import { newDocumentFromTemplate } from "./projectManagement/newDocument";
import { newProjectWorkspace } from "./projectManagement/newProject";
import { openProjectWorkspace } from "./projectManagement/openProject";
import { closeProjectWorkspace } from "./projectManagement/closeProject";
import { deleteNode } from "./projectManagement/deleteNode";
import { 
  newTreeHeading, newWebviewHeading,
  newTreeComment, newWebviewComment,
  newTreeFuncReq, newWebviewFuncReq,
  newTreeNonFuncReq, newWebviewNonFuncReq,
  newTreeDesCon, newWebviewDesCon,
  newTreeTest, newWebviewTest,
  newTreeImage, newWebviewImage,
  newTreeMermaidImage, newWebviewMermaidImage, getNodeFromContext 
} from "./projectManagement/newNode";
import { promoteNode, demoteNode, moveNodeDown, moveNodeUp } from './projectManagement/moveNode';


export class DoorsSmores {
  static treeView:TreeNodeProvider;
  static documentView:DocumentViewer;
  static traceView:TraceView;
  constructor(context: vscode.ExtensionContext) {
    DoorsSmores.treeView = new TreeNodeProvider();
    this.register(context);
  }

  private register(context: vscode.ExtensionContext) {
    const registrations = [
      vscode.window.registerTreeDataProvider('smoresTreeView', DoorsSmores.treeView),
      vscode.window.createTreeView('smoresTreeView', {treeDataProvider: DoorsSmores.treeView, showCollapseAll: false}),
      ...this.registerTreeViewCommands(),
      ...this.registerDocumentViewerCommands(),
      ...this.registerProjectCommands(),
      vscode.commands.registerCommand('doors-smores.Update-Views', DoorsSmores.refreshViews),
      vscode.commands.registerCommand("doors-smores.View-TreeNode", DoorsSmores.viewTreeNode),
      vscode.commands.registerCommand('doors-smores.Export-Document', (node: TreeNode) => {DoorsSmores.documentView.exportDocument(node.smoresNode);})
    ];
    context.subscriptions.push(...registrations);
  }
  static refreshViews() {
    if(DocumentViewer.currentPanel) {
      DocumentViewer.currentPanel.refresh();
    }
    DoorsSmores.treeView.refresh();
  }
  static viewTreeNode(node:TreeNode) {
    DocumentViewer.render(node.smoresNode);
  }
  static traceTreeNode(node:TreeNode) {
    TraceView.render(node.smoresNode);
  }
  static traceWebviewNode(context:any) {
    const node = getNodeFromContext(context);
    if(node) {
      TraceView.render(node);
    }
  }
  static editWebviewNode(context:any) {
    if(DocumentViewer.currentPanel) {
      DocumentViewer.currentPanel.editNode(context);
    }
  }
  
  private registerProjectCommands():vscode.Disposable[] {
    const registrations = [
      vscode.commands.registerCommand("doors-smores.New-Project", async () => {
        if(await newProjectWorkspace()) {
          if(await VersionController.repoExists()) {
            VersionController.queryExistingRepoUse();
          } else {
            VersionController.queryStartRepoUse();
          }
        }
        DoorsSmores.treeView.refresh();
      }),
      vscode.commands.registerCommand("doors-smores.Open-Project", async () => {
        if(await openProjectWorkspace()) {
          VersionController.initialise();
        }
        DoorsSmores.treeView.refresh();
      }),
      vscode.commands.registerCommand("doors-smores.Close-Project", () => {
        closeProjectWorkspace();
        DoorsSmores.treeView.refresh();
      }),
      vscode.commands.registerCommand("doors-smores.New-Document", async () => {
        await newDocumentFromTemplate();
        DoorsSmores.refreshViews();
      }),
    ];
    return registrations;
  }
  private registerTreeViewCommands():vscode.Disposable[] {
    const registrations = [
      vscode.commands.registerCommand("doors-smores.Trace-TreeNode", DoorsSmores.traceTreeNode),
      vscode.commands.registerCommand("doors-smores.New-TreeHeading", newTreeHeading),
      vscode.commands.registerCommand("doors-smores.New-TreeComment", newTreeComment),
      vscode.commands.registerCommand("doors-smores.New-TreeFuncReq", newTreeFuncReq),
      vscode.commands.registerCommand("doors-smores.New-TreeNonFuncReq", newTreeNonFuncReq),
      vscode.commands.registerCommand("doors-smores.New-TreeDesCon", newTreeDesCon),
      vscode.commands.registerCommand("doors-smores.New-TreeTest", newTreeTest),
      vscode.commands.registerCommand("doors-smores.New-TreeImage", newTreeImage),
      vscode.commands.registerCommand("doors-smores.New-TreeMermaidImage", newTreeMermaidImage),
      vscode.commands.registerCommand("doors-smores.Move-Node-Up", moveNodeUp),
      vscode.commands.registerCommand("doors-smores.Move-Node-Down", moveNodeDown),
      vscode.commands.registerCommand("doors-smores.Promote-Node", promoteNode),
      vscode.commands.registerCommand("doors-smores.Demote-Node", demoteNode),
      vscode.commands.registerCommand("doors-smores.Delete-TreeNode", deleteNode)
    ];
    return registrations;
  }
  private registerDocumentViewerCommands():vscode.Disposable[] {
    const registrations = [
      vscode.commands.registerCommand("doors-smores.Edit-Section", DoorsSmores.editWebviewNode),
      vscode.commands.registerCommand("doors-smores.Trace-WebviewNode", DoorsSmores.traceWebviewNode),
      vscode.commands.registerCommand("doors-smores.New-WebHeading", newWebviewHeading),
      vscode.commands.registerCommand("doors-smores.New-WebComment", newWebviewComment),
      vscode.commands.registerCommand("doors-smores.New-WebFuncReq", newWebviewFuncReq),
      vscode.commands.registerCommand("doors-smores.New-WebNonFuncReq", newWebviewNonFuncReq),
      vscode.commands.registerCommand("doors-smores.New-WebDesCon", newWebviewDesCon),
      vscode.commands.registerCommand("doors-smores.New-WebTest", newWebviewTest),
      vscode.commands.registerCommand("doors-smores.New-WebImage", newWebviewImage),
      vscode.commands.registerCommand("doors-smores.New-WebMermaidImage", newWebviewMermaidImage)
    ];
    return registrations;
  }
}
