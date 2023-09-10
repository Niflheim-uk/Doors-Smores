import * as vscode from "vscode";
import * as path from "path";
import * as fs from 'fs';
import { TreeNode } from "../treeView/treeNode";
import { SmoresNode } from "../model/smoresNode";
import { getPageHtml } from './pageHtml';
import { getWorkspaceRoot } from '../utils';
import { setWebview } from "./imageInnerHtml";

export class NodeViewer {
  private _extensionUri!:vscode.Uri;
  private _imagesUri!:vscode.Uri;
  private _referenceNode:SmoresNode|undefined;
  private _nodeToEdit:SmoresNode|undefined;
  private _viewPanel: vscode.WebviewPanel | undefined;

  constructor() {}

  register(context: vscode.ExtensionContext) {
    this._extensionUri = context.extensionUri;
    const registrations = (
      vscode.commands.registerCommand(
        "doors-smores.View-TreeNode",
        (node: TreeNode) => {
          this._showNode(node.smoresNode);
        }
      ),
      vscode.commands.registerCommand(
        "doors-smores.Edit-Section",(context:any) => {
          this._editNode(context);
        }
      ),
      vscode.commands.registerCommand(
        'doors-smores.Export-Document', 
        (node: TreeNode) => {
        this._exportDocument(node.smoresNode);
      })

    );
    context.subscriptions.push(registrations);
  }
  _editNode(context:any) {
    if(context.webviewSection && this._referenceNode) {
      const webviewSection:string = context.webviewSection;
      const nodeId:number = Number(webviewSection.replace("Node-",""));
      const nodeFilepath = this._referenceNode.getNodeFilepath(nodeId);
      const node = new SmoresNode(nodeFilepath);
      if(node.data.category === "heading") {
        this._editHeadingText(node);
      } else if (node.data.category === "image") {
        this._editImageSource(node);
      } else {
        this._nodeToEdit = node;
        this._updatePanel();
      }
    }
  }
  private _showNode(node: SmoresNode) {
    if(node === undefined) {
      return;
    }
    if (this._viewPanel === undefined) {
      this._createPanel(node);
    } else {
      this._referenceNode = node;
      this._viewPanel.reveal();
    }
    this._updatePanel();
  }
  private async _exportDocument(node:SmoresNode) {
    const workspaceRoot = getWorkspaceRoot();
    let documentNode:SmoresNode|null = node;
    while(documentNode!== null && documentNode.getParentNode() !== null) {
      documentNode = documentNode.getParentNode();
    }
    if(documentNode !== null) {
      const filename = await vscode.window.showInputBox(
        { value: `${documentNode.data.text}.html` });
      if(workspaceRoot && filename) {
        const filePath = path.join(workspaceRoot, filename);
        this._showNode(documentNode);
        const html = getPageHtml(documentNode, false);
        if(html !== undefined) {
          fs.writeFileSync(filePath,html);
        }
      }
    }
  }
  private _handleMessageFromPanel(message:any) {
    switch (message.command) {
      case 'submit':
        if(this._nodeToEdit) {
          this._nodeToEdit.setNewData(message.submitData);
          this._nodeToEdit = undefined;
          vscode.commands.executeCommand('doors-smores.Update-TreeView');
        }
        this._updatePanel();
        vscode.window.showErrorMessage(message.text);
        return;
      case 'cancel':
        this._nodeToEdit=undefined;
        this._updatePanel();
        return;
    }
  }
  private _createPanel(node:SmoresNode) {
    this._referenceNode = node;
    const nodeUri = vscode.Uri.file(path.dirname(node.filePath.toString()));
    this._imagesUri = vscode.Uri.joinPath(nodeUri, "images");
    this._viewPanel = vscode.window.createWebviewPanel(
      "smoresNodeView", // Identifies the type of the webview. Used internally
      "Smores Preview", // Title of the panel displayed to the user
      vscode.ViewColumn.One, // Editor column to show the new webview panel in.
      {
        enableScripts: true,
        localResourceRoots:[
          vscode.Uri.joinPath(this._extensionUri, 'resources'),
          nodeUri,
          this._imagesUri
        ]
      }
    );
    console.log(path.dirname(node.filePath.toString()));
    setWebview(this._viewPanel.webview);
    // Assign event handlers
    this._viewPanel.webview.onDidReceiveMessage((message) => {
      this._handleMessageFromPanel(message);
    });

    this._viewPanel.onDidDispose((e) => {
      console.log("closed panel");
      this._viewPanel = undefined;
      setWebview(undefined);
    });

  }
  private async _editHeadingText(node: SmoresNode) {
    const currentValue = node.data.text.split("\n")[0];
    const newValue = await vscode.window.showInputBox({ value: `${currentValue}` });
    if(newValue) {
      node.data.text = newValue;
      node.write();
      vscode.commands.executeCommand('doors-smores.Update-TreeView');
      this._updatePanel();
    }
  }
  private async _editImageSource(node: SmoresNode) {
    const uri = await vscode.window.showOpenDialog({
      canSelectMany:false,
      /* eslint-disable  @typescript-eslint/naming-convention */
      filters:{'Image source':['jpg','jpeg','png','gif','tif']},
      openLabel:"Select New Image Source",
      canSelectFolders:false,
      defaultUri:this._imagesUri
    });
    if(uri) {
      node.data.text = path.relative(this._imagesUri.path, uri[0].path);
      node.write();
      vscode.commands.executeCommand('doors-smores.Update-TreeView');
      this._updatePanel();
    }  
  }
  private _updatePanel() {
    if(this._viewPanel === undefined || this._referenceNode === undefined) {
      return;
    }
    const html = getPageHtml(this._referenceNode, true, this._nodeToEdit);
    this._viewPanel.webview.html = html;
    return html;
  }
}
