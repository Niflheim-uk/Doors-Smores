import * as vscode from 'vscode';
import { TreeNode } from "./treeView/treeNode";
import { TreeNodeProvider } from './treeView/treeNodeProvider';
import { DocumentViewer } from './documentViewer/documentViewer';
import { VersionController } from './versionControl/versionController';
import { newDocumentFromTemplate } from "./projectManagement/newDocument";
import { newProjectWorkspace } from "./projectManagement/newProject";
import { openProjectWorkspace } from "./projectManagement/openProject";
import { closeProjectWorkspace } from "./projectManagement/closeProject";
import { deleteNode } from "./projectManagement/deleteNode";
import { 
  newTreeComment, newWebviewComment,
  newTreeSysTest, newWebviewSysTest,
  newTreeIntTest, newWebviewIntTest,
  newTreeUnitTest, newWebviewUnitTest,
  newTreeUserReq, newWebviewUserReq,
  newTreeFuncReq, newWebviewFuncReq,
  newTreeNonFuncReq, newWebviewNonFuncReq,
  newTreeHeading, newWebviewHeading,
  newTreeImage, newWebviewImage,
  newTreeMermaidImage, newWebviewMermaidImage 
} from "./projectManagement/newNode";
import { promoteNode, demoteNode, moveNodeDown, moveNodeUp } from './projectManagement/moveNode';


export class DoorsSmores {
  static treeView:TreeNodeProvider;
  static documentView:DocumentViewer;
  constructor(context: vscode.ExtensionContext) {
    DoorsSmores.treeView = new TreeNodeProvider();
    DoorsSmores.documentView = new DocumentViewer();
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
      vscode.commands.registerCommand("doors-smores.View-TreeNode", (node: TreeNode) => {DoorsSmores.documentView.showNode(node.smoresNode);}),
      vscode.commands.registerCommand('doors-smores.Export-Document', (node: TreeNode) => {DoorsSmores.documentView.exportDocument(node.smoresNode);})
    ];
    context.subscriptions.push(...registrations);
  }
  static refreshViews() {
    if(DoorsSmores.documentView.isViewActive()) {
      DoorsSmores.documentView.updatePanel();
    }
    DoorsSmores.treeView.refresh();
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
      vscode.commands.registerCommand("doors-smores.New-TreeHeading", newTreeHeading),
      vscode.commands.registerCommand("doors-smores.New-TreeComment", newTreeComment),
      vscode.commands.registerCommand("doors-smores.New-TreeUserReq", newTreeUserReq),
      vscode.commands.registerCommand("doors-smores.New-TreeNonFuncReq", newTreeNonFuncReq),
      vscode.commands.registerCommand("doors-smores.New-TreeFuncReq", newTreeFuncReq),
      vscode.commands.registerCommand("doors-smores.New-TreeSysTest", newTreeSysTest),
      vscode.commands.registerCommand("doors-smores.New-TreeIntTest", newTreeIntTest),
      vscode.commands.registerCommand("doors-smores.New-TreeUnitTest", newTreeUnitTest),
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
      vscode.commands.registerCommand("doors-smores.Edit-Section", DoorsSmores.documentView.editNode),
      vscode.commands.registerCommand("doors-smores.New-WebHeading", newWebviewHeading),
      vscode.commands.registerCommand("doors-smores.New-WebComment", newWebviewComment),
      vscode.commands.registerCommand("doors-smores.New-WebUserReq", newWebviewUserReq),
      vscode.commands.registerCommand("doors-smores.New-WebNonFuncReq", newWebviewNonFuncReq),
      vscode.commands.registerCommand("doors-smores.New-WebFuncReq", newWebviewFuncReq),
      vscode.commands.registerCommand("doors-smores.New-WebSysTest", newWebviewSysTest),
      vscode.commands.registerCommand("doors-smores.New-WebIntTest", newWebviewIntTest),
      vscode.commands.registerCommand("doors-smores.New-WebUnitTest", newWebviewUnitTest),
      vscode.commands.registerCommand("doors-smores.New-WebImage", newWebviewImage),
      vscode.commands.registerCommand("doors-smores.New-WebMermaidImage", newWebviewMermaidImage)
    ];
    return registrations;
  }
}
