import * as vscode from "vscode";
import * as path from "path";
import * as fs from 'fs';
import { SmoresDataFile } from "../model/smoresDataFile";
import { SmoresNode } from "../model/smoresNode";
import { clearNonce, getNonce } from "../utils/getNonce";
import * as schema from '../model/smoresDataSchema';
import { getExtensionUri } from "../utils/getExtension";
import { getBodyHtml } from "./bodyHtml";
import { getMermaidBlock, getScriptBlock, getStyleBlock } from "./pageHtml";
import { getWorkspaceRoot } from "../utils/getWorkspaceRoot";
import { DoorsSmores } from "../doorsSmores";

export class DocumentViewer {
  public static currentPanel: DocumentViewer | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private _viewNode:SmoresNode;
  private _editNode:SmoresNode|undefined;

  private constructor(panel: vscode.WebviewPanel, node:SmoresNode) {
    this._panel = panel;
    this._viewNode = node;
    // Assign event handlers
    this._panel.webview.onDidReceiveMessage((message) => {
      this._handleMessageFromPanel(message);
    });
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }
  public dispose() {
    DocumentViewer.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  public setViewNode(node:SmoresNode) {
    this._viewNode = node;
  }

  public static getWebviewUri(uri:vscode.Uri):vscode.Uri {
    if(DocumentViewer.currentPanel) {
      return DocumentViewer.currentPanel._panel.webview.asWebviewUri(uri);
    }
    return uri;
  }
  public static render(node:SmoresNode, exporting:boolean = false) {
    if (DocumentViewer.currentPanel) {
      const docType = node.getDocumentType();
      DocumentViewer.currentPanel.setViewNode(node);
      DocumentViewer.currentPanel._panel.title = docType;
      DocumentViewer.currentPanel._panel.reveal(vscode.ViewColumn.One);
    } else {
      const docType = node.getDocumentType();
      const viewId = DocumentViewer.getViewIdByDocumentType(docType);
      const panel = DocumentViewer.createPanel(viewId, docType);
      DocumentViewer.currentPanel = new DocumentViewer(panel, node);
    }
    return DocumentViewer.currentPanel.refresh(exporting);
  }
  public refresh(exporting:boolean = false) {
    this._panel.webview.html = DocumentViewer.getPageHtml(this._panel.webview, this._viewNode, exporting, this._editNode);
    return this._panel.webview.html;
  }
  
  public editNode(context:any) {
    if(context.nodeId) {
      const nodeId:number = Number(context.nodeId);
      const nodeFilepath = this._viewNode.getNodeFilepath(nodeId);
      const node = new SmoresNode(nodeFilepath);
      if(node.data.category === schema.headingType) {
        this._editHeadingText(node);
      } else if (node.data.category === schema.imageType) {
        this._editImageSource(node);
      } else {
        this._editNode = node;
        this.refresh();
      }
    }
  }
  public static async exportDocument(node:SmoresNode, userAction:boolean=true) {
    let documentNode:SmoresNode|null = node;
    while(documentNode!== null && documentNode.getParentNode() !== null) {
      documentNode = documentNode.getParentNode();
    }
    var filePath:string;
    const defaultFilename = `${documentNode!.data.text}.html`;
    const projectRoot = SmoresDataFile.getProjectRoot();
    if(userAction) {
      const filename = await vscode.window.showInputBox({value:defaultFilename});
      if(filename === undefined) {
        return;
      }
      filePath = path.join(projectRoot, filename);
    } else {
      filePath = path.join(projectRoot, defaultFilename);
    }
    const panel = DocumentViewer.createPanel('smoresNodeView', 'Exporting');
    const html = DocumentViewer.getPageHtml(panel.webview, documentNode!, true);
    vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    fs.writeFileSync(filePath,html);
  }
  private static createPanel(viewId:string, title:string) {
    const imagesUri = vscode.Uri.file(SmoresDataFile.getImagesFilepath());    
    const nodeUri = vscode.Uri.file(SmoresDataFile.getDataFilepath());    
    const extensionUri = getExtensionUri();
    const panel = vscode.window.createWebviewPanel(
      viewId, // Identifies the type of the webview. Used internally
      title, // Title of the panel displayed to the user
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
    return panel;
  }
  private _handleMessageFromPanel(message:any) {
    switch (message.command) {
      case 'edit':
        this.editNode(message.context);
        break;
      case 'submit':
        if(this._editNode) {
          this._editNode.setNewData(message);
          this._editNode = undefined;
          vscode.commands.executeCommand('doors-smores.Update-Views');
        }
        this.refresh();
        return;
      case 'cancel':
        this._editNode=undefined;
        this.refresh();
        return;
    }
  }
  private static getViewIdByDocumentType(docType:string) {
    switch (docType) {
      case schema.ursDocType: return "smoresURSView";
      case schema.srsDocType: return "smoresSRSView";
      case schema.adsDocType: return "smoresADSView";
      case schema.ddsDocType: return "smoresDDSView";
      case schema.atpDocType: return "smoresATPView";
      case schema.stpDocType: return "smoresSTPView";
      case schema.itpDocType: return "smoresITPView";
      case schema.utpDocType: return "smoresUTPView";
      default: return "smoresNodeView";
    }
  }
  private async _editHeadingText(node: SmoresNode) {
    const currentValue = node.data.text.split("\n")[0];
    const newValue = await vscode.window.showInputBox({ value: `${currentValue}` });
    if(newValue) {
      node.data.text = newValue;
      node.write();
      vscode.commands.executeCommand('doors-smores.Update-Views');
      this.refresh();
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
      this.refresh();
    }  
  }
  private static getPageHtml(webview:vscode.Webview, viewNode:SmoresNode, exporting:boolean, editNode?:SmoresNode):string {
    const nonce = getNonce();
    const bodyHtml = getBodyHtml(viewNode, exporting, editNode);
    const styleBlock = getStyleBlock(webview, exporting);
    const scriptBlock = getScriptBlock(webview, exporting);
    const mermaidBlock = getMermaidBlock(webview, exporting);
    clearNonce();
    
    return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="
          default-src 'none'; 
          img-src ${webview.cspSource} 'nonce-${nonce}';
          script-src ${webview.cspSource} 'nonce-${nonce}';
          style-src ${webview.cspSource} 'nonce-${nonce}';
        "/>
        ${styleBlock}
        <title>${viewNode.data.text}</title>
      </head>
      <body>${bodyHtml}${mermaidBlock}${scriptBlock}</body>    
    </html>`;  
  }

}
