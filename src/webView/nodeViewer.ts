import * as vscode from "vscode";
import * as path from "path";
import { TreeNode } from "../treeView/treeNode";
import { SmoresNode } from "../model/smoresNode";
import { getPageHtml } from './pageHtml';

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
      )
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
      this._viewPanel.reveal();
    }
    this._updatePanel();
  }
  private _handleMessageFromPanel(message:any) {
    switch (message.command) {
      case 'submit':
        if(this._nodeToEdit) {
          this._nodeToEdit.data.text = message.newValue;
          this._nodeToEdit.write();
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
    
    // Assign event handlers
    this._viewPanel.webview.onDidReceiveMessage((message) => {
      this._handleMessageFromPanel(message);
    });

    this._viewPanel.onDidDispose((e) => {
      console.log("closed panel");
      this._viewPanel = undefined;
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
    this._viewPanel.webview.html= getPageHtml(this._extensionUri, 
      this._viewPanel.webview, this._referenceNode, this._nodeToEdit);
  }
}
