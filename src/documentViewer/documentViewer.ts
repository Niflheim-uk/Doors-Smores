import * as vscode from "vscode";
import * as path from "path";
import * as fs from 'fs';
import { SmoresDataFile } from "../model/smoresDataFile";
import { TreeNode } from "../treeView/treeNode";
import { SmoresNode } from "../model/smoresNode";
import { getPageHtml } from './pageHtml';
import * as utils from '../utils/utils';

export class DocumentViewer {
  private _referenceNode:SmoresNode|undefined;
  private _nodeToEdit:SmoresNode|undefined;
  private _viewPanel: vscode.WebviewPanel | undefined;

  constructor() {}

  isViewActive() {
    if(this._referenceNode) {
      return true;
    }
    return false;
  }

  public editNode(context:any) {
    if(context.nodeId && this._referenceNode) {
      const nodeId:number = Number(context.nodeId);
      const nodeFilepath = this._referenceNode.getNodeFilepath(nodeId);
      const node = new SmoresNode(nodeFilepath);
      if(node.data.category === "heading") {
        this._editHeadingText(node);
      } else if (node.data.category === "image") {
        this._editImageSource(node);
      } else {
        this._nodeToEdit = node;
        this.updatePanel();
      }
    }
  }
  public showNode(node: SmoresNode) {
    if(node === undefined) {
      return;
    }
    if (this._viewPanel === undefined) {
      this._createPanel(node);
    } else {
      this._referenceNode = node;
      this._viewPanel.reveal();
    }
    this.updatePanel();
  }
  public async exportDocument(node:SmoresNode) {
    const workspaceRoot = utils.getWorkspaceRoot();
    let documentNode:SmoresNode|null = node;
    while(documentNode!== null && documentNode.getParentNode() !== null) {
      documentNode = documentNode.getParentNode();
    }
    if(documentNode !== null) {
      const filename = await vscode.window.showInputBox(
        { value: `${documentNode.data.text}.html` });
      if(workspaceRoot && filename) {
        const filePath = path.join(workspaceRoot, filename);
        this.showNode(documentNode);
        const html = getPageHtml(documentNode, true);
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
          vscode.commands.executeCommand('doors-smores.Update-Views');
        }
        this.updatePanel();
        vscode.window.showErrorMessage(message.text);
        return;
      case 'cancel':
        this._nodeToEdit=undefined;
        this.updatePanel();
        return;
    }
  }
  private getViewIdByDocumentType(docType:string) {
    switch (docType) {
      case 'User Requirements Specification': return "smoresURSView";
      case 'Software Requirements Specification': return "smoresSRSView";
      case "Architecture Design Specification": return "smoresADSView";
      case "Detailed Design Specification": return "smoresDDSView";
      case "Software Acceptance Test Protocol": return "smoresATPView";
      case "Software System Test Protocol": return "smoresSTPView";
      case "Software Integration Test Protocol": return "smoresITPView";
      case "Software Unit Test Protocol": return "smoresUTPView";
      default: return "smoresNodeView";
    }
  }
  private _createPanel(node:SmoresNode) {
    const docType = node.getDocumentType();
    const viewId = this.getViewIdByDocumentType(docType);
    this._referenceNode = node;
    const imagesPath = SmoresDataFile.getImagesFilepath();
    const nodePath = SmoresDataFile.getDataFilepath();
    const extensionPath = SmoresDataFile.getExtensionPath();
    if(imagesPath === undefined || nodePath === undefined) {
      return;
    }
    if(extensionPath === undefined) {
      return;
    }
    const imagesUri = vscode.Uri.file(imagesPath);    
    const nodeUri = vscode.Uri.file(nodePath);    
    const extensionUri = vscode.Uri.file(extensionPath);    
    this._viewPanel = vscode.window.createWebviewPanel(
      viewId, // Identifies the type of the webview. Used internally
      docType, // Title of the panel displayed to the user
      vscode.ViewColumn.One, // Editor column to show the new webview panel in.
      {
        enableScripts: true,
        localResourceRoots:[
          vscode.Uri.joinPath(extensionUri, 'resources'),
          nodeUri,
          imagesUri
        ]
      }
    );
    utils.setWebview(this._viewPanel.webview);
    // Assign event handlers
    this._viewPanel.webview.onDidReceiveMessage((message) => {
      this._handleMessageFromPanel(message);
    });

    this._viewPanel.onDidDispose((e) => {
      console.log("closed panel");
      this._viewPanel = undefined;
      utils.clearWebview();
    });

  }
  private async _editHeadingText(node: SmoresNode) {
    const currentValue = node.data.text.split("\n")[0];
    const newValue = await vscode.window.showInputBox({ value: `${currentValue}` });
    if(newValue) {
      node.data.text = newValue;
      node.write();
      vscode.commands.executeCommand('doors-smores.Update-Views');
      this.updatePanel();
    }
  }
  private async _editImageSource(node: SmoresNode) {
    const imagesPath = SmoresDataFile.getImagesFilepath();
    if(imagesPath === undefined) {
      return;
    }
    const imagesUri = vscode.Uri.file(imagesPath);    
    const uri = await vscode.window.showOpenDialog({
      canSelectMany:false,
      /* eslint-disable  @typescript-eslint/naming-convention */
      filters:{'Image source':['jpg','jpeg','png','gif','tif']},
      openLabel:"Select New Image Source",
      canSelectFolders:false,
      defaultUri:imagesUri
    });
    if(uri) {
      node.data.text = path.relative(imagesUri.path, uri[0].path);
      node.write();
      vscode.commands.executeCommand('doors-smores.Update-Views');
      this.updatePanel();
    }  
  }
  public updatePanel() {
    if(this._viewPanel === undefined || this._referenceNode === undefined) {
      return;
    }
    this._viewPanel.webview.html = getPageHtml(this._referenceNode, false, this._nodeToEdit);
  }
}
