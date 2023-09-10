import * as vscode from "vscode";
import * as path from "path";
import * as fs from 'fs';
import { clearNonce, getNonce } from "../getNonce";
import * as schema from '../../model/schema';
import { getBodyHtml } from "./bodyHtml";
import { getMermaidBlock, getScriptBlock, getStyleBlock } from "./pageHtml";
import { DocumentNode } from "../../model/documentNode";
import { DoorsSmores } from "../../doorsSmores";
import { SmoresFile } from "../../model/smoresFile";
import { VersionController } from "../../versionControl/versionController";

export class DocumentView {
  public static currentPanel: DocumentView | undefined;
  public static includeTraceInfo:boolean|undefined=false;
  public static tracingRequired:boolean|undefined=false;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private _viewNode:DocumentNode;
  private _editNode:DocumentNode|undefined;

  private constructor(panel: vscode.WebviewPanel, node:DocumentNode) {
    this._panel = panel;
    this._viewNode = node;
    // Assign event handlers
    this._panel.webview.onDidReceiveMessage((message) => {
      this.handleMessageFromPanel(message);
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
        DocumentView.currentPanel.editHeadingText(node);
      } else if (node.data.category === schema.imageCategory) {
        DocumentView.currentPanel.editImageSource(node);
      } else {
        DocumentView.currentPanel._editNode = node;
        DocumentView.refresh();
      }
    }
  }
  public static async exportDocument(node:DocumentNode|undefined) {
    if(node=== undefined) {
      return;
    }
    let documentNode:DocumentNode|null = node;
    while(documentNode!== null && documentNode.getParent() !== null) {
      documentNode = documentNode.getParent();
    }
    var filePath:string;
    var content:string;
    const defaultFilename = `${documentNode!.data.text}.html`;
    const projectRoot = DoorsSmores.getProjectDirectory();
    const filename = await vscode.window.showInputBox({value:defaultFilename});
    if(filename === undefined) {
      return;
    }
    filePath = path.join(projectRoot, filename);
    const panel = DocumentView.createPanel('smoresNodeView', 'Exporting');
    content = DocumentView.getPageHtml(panel.webview, documentNode!, true);
    vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    fs.writeFileSync(filePath, content);
  }
  private static createPanel(viewId:string, title:string) {
    const projUri = vscode.Uri.file(DoorsSmores.getProjectDirectory());    
    const extensionUri = vscode.Uri.file(DoorsSmores.getExtensionPath());
    const panel = vscode.window.createWebviewPanel(
      viewId, // Identifies the type of the webview. Used internally
      title, // Title of the panel displayed to the user
      vscode.ViewColumn.One, // Editor column to show the new webview panel in.
      {
        enableScripts: true,
        localResourceRoots:[
          vscode.Uri.joinPath(extensionUri, 'resources'),
          projUri,
        ]
      }  
    );
    return panel;
  }
  private handleMessageFromPanel(message:any) {
    switch (message.command) {
      case 'render':
        this.writeRenderedSVG(message.id, message.svg, message.width, message.height);
        break;
      case 'edit':
        DocumentView.editNode(message.context);
        break;
      case 'submit':
        if(this._editNode) {
          this._editNode.update(message);
          this._editNode = undefined;
          DoorsSmores.refreshViews();
        }
        DocumentView.refresh();
        return;
      case 'cancel':
        this._editNode=undefined;
        DocumentView.refresh();
        return;
    }
  }
  private writeRenderedSVG(id:number, svg:string, width:number, height:number) {
    const renderedNode = DocumentNode.createFromId(id);
    const svgHeightInsertionPattern = "viewBox=\"([^\"]+)\" ";
    const svgWidthInsertionPattern = 'width="100%"';
    if(renderedNode) {
      const matches = svg.match(svgHeightInsertionPattern);
      if(Array.isArray(matches) && matches.length > 0) {
        svg = svg.replace(`viewBox="${matches[1]}" `, `viewBox="${matches[1]}" height="${height}px" ` );
        svg = svg.replace(svgWidthInsertionPattern, `width="${width}px"`);
      }
      const nodePath = DoorsSmores.getNodeDirectory(renderedNode.data.id);
      const renderedFilepath = path.join(nodePath, 'rendered.svg');
      fs.writeFileSync(renderedFilepath, svg);
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
  private async editHeadingText(node: DocumentNode) {
    const currentValue = node.data.text.split("\n")[0];
    const newValue = await vscode.window.showInputBox({ value: `${currentValue}` });
    if(newValue) {
      node.data.text = newValue;
      node.write();
      VersionController.commitChanges(`Updated heading ${node.data.id}\n`);  
      DoorsSmores.refreshViews();
    }
  }
  private async editImageSource(node: DocumentNode) {
    const searchRoot = DoorsSmores.getProjectDirectory();
    const searchRootUri = vscode.Uri.file(searchRoot);    
    const uri = await vscode.window.showOpenDialog({
      canSelectMany:false,
      /* eslint-disable  @typescript-eslint/naming-convention */
      filters:{'Image source':['jpg','jpeg','png','gif','tif']},
      openLabel:"Select New Image Source",
      canSelectFolders:false,
      defaultUri:searchRootUri
    });
    if(uri) {
      const ext = path.extname(uri[0].fsPath);
      const previousImage = node.data.text;
      const dest = path.join(node.getDirPath(), `${SmoresFile.imageFilename}${ext}`);
      vscode.workspace.fs.copy(uri[0], vscode.Uri.file(dest), {overwrite:true});
      node.data.text = `${SmoresFile.imageFilename}${ext}`;
      node.write();
      if(node.data.text !== previousImage) {
        const prevUri = vscode.Uri.file(path.join(node.getDirPath(), previousImage));
        vscode.workspace.fs.delete(prevUri);
      }
      VersionController.commitChanges(`Updated image source on ${node.data.id}\n`);  
      DoorsSmores.refreshViews();
    }  
  }
  private static getPageHtml(webview:vscode.Webview, viewNode:DocumentNode, exporting:boolean, editNode?:DocumentNode):string {
    const settings = vscode.workspace.getConfiguration('documents');
    DocumentView.includeTraceInfo = settings.get("includeTraceDetailInDocuments");
    DocumentView.tracingRequired = settings.get("tracingRequired");
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
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="Content-Security-Policy" 
    content="default-src 'none'; 
    font-src ${webview.cspSource} 'nonce-${nonce}'; 
    img-src ${webview.cspSource} 'nonce-${nonce}'; 
    script-src ${webview.cspSource} 'nonce-${nonce}';
    style-src ${webview.cspSource} 'unsafe-inline';
  "/>
  ${styleBlock}
  <title>${viewNode.data.text}</title>
</head>
<body data-vscode-context='{"preventDefaultContextMenuItems": true}'>
${bodyHtml}
${mermaidBlock}
${scriptBlock}
</body>    
</html>`;  
  }
}
