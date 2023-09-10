import * as vscode from 'vscode';
import { TreeNode } from "./treeView/treeNode";
import { TreeNodeProvider } from './treeView/treeNodeProvider';
import { DocumentViewer } from './documentViewer/documentViewer';
import { TraceView } from './traceView/traceView';
import { ProjectManagement } from './projectManagement/projectManagement';
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
import { getProject } from './model/smoresProject';
import { SmoresNode } from './model/smoresNode';

export class DoorsSmores {
  static treeView:TreeNodeProvider;
  static documentView:DocumentViewer;
  static traceView:TraceView;
  public static extensionContext:vscode.ExtensionContext;
  constructor(context: vscode.ExtensionContext) {
    DoorsSmores.extensionContext = context;
    DoorsSmores.treeView = new TreeNodeProvider();
    ProjectManagement.createAndRegister(context);
    this.register(context);
  }

  private register(context: vscode.ExtensionContext) {
    const registrations = [
      vscode.window.registerTreeDataProvider('doors-smores.documentTree', DoorsSmores.treeView),
      vscode.window.createTreeView('doors-smores.documentTree', {treeDataProvider: DoorsSmores.treeView, showCollapseAll: false}),
      ...this.registerTreeViewCommands(),
      ...this.registerDocumentViewerCommands(),
      ...this.registerProjectCommands(),
      vscode.commands.registerCommand('doors-smores.Update-Views', DoorsSmores.refreshViews),
      vscode.commands.registerCommand("doors-smores.View-TreeNode", DoorsSmores.viewTreeNode),
      vscode.commands.registerCommand('doors-smores.Export-Document', (node: TreeNode) => {DoorsSmores.exportDocument(node.smoresNode);})
    ];
    context.subscriptions.push(...registrations);
  }
  static refreshViews() {
    if(DocumentViewer.currentPanel) {
      DocumentViewer.currentPanel.refresh();
    }
    ProjectManagement.refresh();
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
  static exportAll() {
    console.log('export all');
    const project = getProject();
    if(project === undefined) {
      return;
    }
    const documentPaths = project.getDocumentPaths();
    for(let i=0; i<documentPaths.length; i++) {
      const document = new SmoresNode(documentPaths[i]);
      DoorsSmores.exportDocument(document, false);
    }
  }
  static exportDocument(documentNode:SmoresNode, userAction:boolean=true) {
    DocumentViewer.exportDocument(documentNode, userAction);
  }
  
  private registerProjectCommands():vscode.Disposable[] {
    const registrations = [
      vscode.commands.registerCommand("doors-smores.New-Project", ProjectManagement.newProject),
      vscode.commands.registerCommand("doors-smores.Open-Project", ProjectManagement.openProject),
      vscode.commands.registerCommand("doors-smores.Set-Active-Project", ProjectManagement.setActiveProject),
      vscode.commands.registerCommand("doors-smores.Close-Project", ProjectManagement.closeProject),
      vscode.commands.registerCommand("doors-smores.New-Document", ProjectManagement.newDocument),
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
