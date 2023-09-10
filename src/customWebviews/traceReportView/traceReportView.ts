import * as vscode from "vscode";
import { clearNonce, getNonce } from "../getNonce";
import * as schema from '../../model/schema';
import { DocumentNode } from "../../model/documentNode";
import { DoorsSmores } from "../../doorsSmores";
import { join } from "path";
import { writeFileSync } from "fs";
import * as heading from '../headingInnerHtml';
import { getDocumentStylePaths, getScriptPath } from "../resources";
import { getIdLabel, getTableRow } from "../contentInnerHtml";
import { getTableTextHtmlFromMd } from "../markdownConversion";
import { getTraceReportDownstreamContent, getTraceReportTestsContent, getTraceReportUpstreamContent } from "./traceReportContent";

export class TraceReportView {
  public static currentPanel: TraceReportView | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private _viewNode:DocumentNode;

  private constructor(panel: vscode.WebviewPanel, node:DocumentNode) {
    this._panel = panel;
    this._viewNode = node;
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }
  public dispose() {
    TraceReportView.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  public setViewNode(node:DocumentNode) {
    this._viewNode = node;
  }

  public static async render(node:DocumentNode|undefined) {
    if(node === undefined) {
      return;
    }
    if (TraceReportView.currentPanel) {
      TraceReportView.currentPanel._panel.reveal(vscode.ViewColumn.One);
      await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
      TraceReportView.currentPanel = undefined;
    }
    const docType = node.getDocumentType();
    const viewId = TraceReportView.getViewIdByDocumentType(docType);
    const panel = TraceReportView.createPanel(viewId, docType);
    TraceReportView.currentPanel = new TraceReportView(panel, node);
    return TraceReportView.refresh();
  }
  public static refresh(exporting:boolean = false) {
    if(TraceReportView.currentPanel) {
      const panel = TraceReportView.currentPanel._panel;
      const viewNode = TraceReportView.currentPanel._viewNode;
      panel.webview.html = TraceReportView.getPageHtml(panel.webview, viewNode, exporting);
      return panel.webview.html;
    } else {
      return "";
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
    filePath = join(projectRoot, filename);
    const panel = TraceReportView.createPanel('smoresNodeView', 'Exporting');
    content = TraceReportView.getPageHtml(panel.webview, documentNode!, true);
    vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    writeFileSync(filePath, content);
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
  private static getPageHtml(webview:vscode.Webview, viewNode:DocumentNode, exporting:boolean):string {
    if(webview === undefined || viewNode === undefined) {
      return "";
    }
    const nonce = getNonce();
    const bodyHtml = TraceReportView.getBodyHtml(viewNode);
    let scriptBlock = "";
    var styleUri:string[];
    const stylePaths = getDocumentStylePaths();
    if(exporting === false) {
      const scriptPath = getScriptPath();
      const scriptUri = webview.asWebviewUri(vscode.Uri.file(scriptPath)).toString();
      scriptBlock = `<script nonce="${nonce}" src="${scriptUri}"></script>`;
      styleUri = [
        webview.asWebviewUri(vscode.Uri.file(stylePaths[0])).toString(),
        webview.asWebviewUri(vscode.Uri.file(stylePaths[1])).toString(),
        webview.asWebviewUri(vscode.Uri.file(stylePaths[2])).toString(),
        webview.asWebviewUri(vscode.Uri.file(stylePaths[3])).toString()
      ];
    } else {
      styleUri = stylePaths;
    }
    const styleBlock = `
    <link nonce="${nonce}" href="${styleUri[0]}" rel="stylesheet"/>
    <link nonce="${nonce}" href="${styleUri[1]}" rel="stylesheet"/>
    <link nonce="${nonce}" href="${styleUri[2]}" rel="stylesheet"/>
    <link nonce="${nonce}" href="${styleUri[3]}" rel="stylesheet"/>
    `;
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
      <body data-vscode-context='{"preventDefaultContextMenuItems": true}'>${bodyHtml}${scriptBlock}</body>    
    </html>`;  
  }
  private static getBodyHtml(node: DocumentNode):string {
    heading.resetHeaderDepth();
    return TraceReportView.getHtmlForNode(node);
  }
  private static getHtmlForNode(node: DocumentNode):string {
    let html:string = "";
    html = html.concat(TraceReportView.getHtmlForNodeType(node));
    html = html.concat(TraceReportView.getHtmlForNodeChildren(node));
    return html;
  }
  private static getHtmlForNodeChildren(node:DocumentNode):string {
    let html:string = "";
    if(node.data.children && node.data.children.length > 0) {
      heading.increaseHeaderDepth();
      const childNodes = node.getChildren();
      for (let index = 0; index < childNodes.length; index++) {
        const child = childNodes[index];
        html = html.concat(TraceReportView.getHtmlForNode(child));
      }
      heading.decreaseHeaderDepth();
    }
    return html;
  }

  private static getHtmlForNodeType(node:DocumentNode):string {
    const pageBreak = `<hr class="hr-text pageBreak" data-content="Page Break">`;
    if(node.data.category === schema.documentCategory) {
      return `<h1>WIP:Front Page</h1>${pageBreak}<h1>WIP:TOC</h1>${pageBreak}`;
    } else if(node.data.category === schema.headingCategory) {
      return TraceReportView.getTraceReportHeading(node, pageBreak);
    } else if(schema.isFuncReqCategory(node.data.category)) {
      return TraceReportView.getTraceReportItem(node);
    } else if(schema.isNonFuncReqCategory(node.data.category)) {
      return TraceReportView.getTraceReportItem(node);
    } else if(schema.isConstraintCategory(node.data.category)) {
      return TraceReportView.getTraceReportItem(node);
    } else if(schema.isTestCategory(node.data.category)) {
      return TraceReportView.getTraceReportItem(node);
    }
    return "";
  }
  private static getTraceReportHeading(node:DocumentNode, pageBreak:string) {
    let innerHtml:string = "";
    let insertPageBreak = false;
      [innerHtml, insertPageBreak] = heading.getHeadingHtml(node);
    if(insertPageBreak) {
      return pageBreak.concat(TraceReportView.getViewDivHtml(node, innerHtml));
    } else {
      return TraceReportView.getViewDivHtml(node, innerHtml);
    }
  }
  private static getTraceReportItem(node:DocumentNode) {
    const c1 = getIdLabel(node);
    const c2 = getTableTextHtmlFromMd(node.data.text.split('\n')[0]);
    const row1 = getTableRow(c1, c2);
    const upstreamRow = getTraceReportUpstreamContent(node);
    const testRow = getTraceReportTestsContent(node);
    const downstreamRow = getTraceReportDownstreamContent(node);
    return `<table class="indented2ColSmall"><tbody>
    ${row1}
    ${upstreamRow}
    ${testRow}
    ${downstreamRow}
  </tbody></table>`;
  }
  private static getViewDivHtml(node:DocumentNode, innerHtml:string) {
    const categoryShort = schema.getLabelPrefix(node.data.category);
    return `<div class="viewDiv" data-vscode-context='{"webviewSection": "Node-${categoryShort}", "nodeId": "${node.data.id}", "preventDefaultContextMenuItems": true}'>${innerHtml}</div>`;
  }
    
}
