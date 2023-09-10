import * as vscode from "vscode";
import * as path from "path";
import * as fs from 'fs';
import { clearNonce, getNonce } from "../getNonce";
import * as schema from '../../model/schema';
import { getBodyHtml } from "./bodyHtml";
import { getMermaidBlock, getScriptBlock, getStyleBlock } from "./pageHtml";
import { DocumentNode } from "../../model/documentNode";
import { DoorsSmores } from "../../doorsSmores";

export class DocumentView {
  public static currentPanel: DocumentView | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private _viewNode:DocumentNode;
  private _editNode:DocumentNode|undefined;

  private constructor(panel: vscode.WebviewPanel, node:DocumentNode) {
    this._panel = panel;
    this._viewNode = node;
    // Assign event handlers
    this._panel.webview.onDidReceiveMessage((message) => {
      this._handleMessageFromPanel(message);
    });
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }
  public dispose() {
    DocumentView.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
  public static registerCommands() {
    const registrations = [
      vscode.commands.registerCommand('doors-smores.EditDocumentNode', DocumentView.editNode)
    ];
    DoorsSmores.register(registrations);
  }

  public setViewNode(node:DocumentNode) {
    this._viewNode = node;
  }

  public static getWebviewUri(uri:vscode.Uri):vscode.Uri {
    if(DocumentView.currentPanel) {
      return DocumentView.currentPanel._panel.webview.asWebviewUri(uri);
    }
    return uri;
  }
  public static async render(node:DocumentNode|undefined, exporting:boolean = false) {
    if(node === undefined) {
      return;
    }
    if (DocumentView.currentPanel) {
      DocumentView.currentPanel._panel.reveal(vscode.ViewColumn.One);
      await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
      DocumentView.currentPanel = undefined;
    }
    const docType = node.getDocumentType();
    const viewId = DocumentView.getViewIdByDocumentType(docType);
    const panel = DocumentView.createPanel(viewId, docType);
    DocumentView.currentPanel = new DocumentView(panel, node);
    return DocumentView.refresh(exporting);
  }
  public static refresh(exporting:boolean = false) {
    if(DocumentView.currentPanel) {
      const panel = DocumentView.currentPanel._panel;
      const viewNode = DocumentView.currentPanel._viewNode;
      const editNode = DocumentView.currentPanel._editNode;
      panel.webview.html = DocumentView.getPageHtml(panel.webview, viewNode, exporting, editNode);
      return panel.webview.html;
    } else {
      return "";
    }
  }
  
  public static editNode(context:any) {
    if(context.nodeId && DocumentView.currentPanel) {
      const nodeId:number = Number(context.nodeId);
      const node = DocumentNode.createFromId(nodeId);
      if(node.data.category === schema.headingCategory) {
        DocumentView.currentPanel._editHeadingText(node);
      } else if (node.data.category === schema.imageCategory) {
        DocumentView.currentPanel._editImageSource(node);
      } else {
        DocumentView.currentPanel._editNode = node;
        DocumentView.refresh();
      }
    }
  }
  public static async exportDocument(node:DocumentNode, userAction:boolean=true) {
    let documentNode:DocumentNode|null = node;
    while(documentNode!== null && documentNode.getParent() !== null) {
      documentNode = documentNode.getParent();
    }
    var filePath:string;
    const defaultFilename = `${documentNode!.data.text}.html`;
    const projectRoot = DoorsSmores.getProjectDirectory();
    if(userAction) {
      const filename = await vscode.window.showInputBox({value:defaultFilename});
      if(filename === undefined) {
        return;
      }
      filePath = path.join(projectRoot, filename);
    } else {
      filePath = path.join(projectRoot, defaultFilename);
    }
    const panel = DocumentView.createPanel('smoresNodeView', 'Exporting');
    const html = DocumentView.getPageHtml(panel.webview, documentNode!, true);
    vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    fs.writeFileSync(filePath,html);
  }
  private static createPanel(viewId:string, title:string) {
    const imagesUri = vscode.Uri.file(DoorsSmores.getImagesDirectory());    
    const nodeUri = vscode.Uri.file(DoorsSmores.getDataDirectory());    
    const extensionUri = vscode.Uri.file(DoorsSmores.getExtensionPath());
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
        DocumentView.editNode(message.context);
        break;
      case 'submit':
        if(this._editNode) {
          this._editNode.update(message);
          this._editNode = undefined;
          vscode.commands.executeCommand('doors-smores.Update-Views');
        }
        DocumentView.refresh();
        return;
      case 'cancel':
        this._editNode=undefined;
        DocumentView.refresh();
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
  private async _editHeadingText(node: DocumentNode) {
    const currentValue = node.data.text.split("\n")[0];
    const newValue = await vscode.window.showInputBox({ value: `${currentValue}` });
    if(newValue) {
      node.data.text = newValue;
      node.write();
      DoorsSmores.refreshViews();
    }
  }
  private async _editImageSource(node: DocumentNode) {
    const imagesPath = DoorsSmores.getImagesDirectory();
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
      DoorsSmores.refreshViews();
    }  
  }
  private static getPageHtml(webview:vscode.Webview, viewNode:DocumentNode, exporting:boolean, editNode?:DocumentNode):string {
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
          font-src ${webview.cspSource} 'nonce-${nonce}';
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
