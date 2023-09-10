import * as vscode from "vscode";
import * as schema from '../model/smoresDataSchema';
import { SmoresNode, getNodeFromId } from "../model/smoresNode";
import { 
  getDownstreamReqTraceHtml, 
  getDownstreamTestTraceHtml,
  getUpstreamReqTraceHtml,
  getUpstreamTestTraceHtml,
  getTraceTargetHtml
 } from "./traceHtml";
import { clearNonce, getNonce } from "../utils/getNonce";
import { getExtensionUri } from "../utils/getExtension";
import { getScriptPath, getTracingStylePaths } from "../utils/gui";
import { getTraceSelection } from "./traceSelection";

export class TraceView {
  public static currentPanel: TraceView | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private _viewNode: SmoresNode|undefined;

  private constructor(panel: vscode.WebviewPanel, node:SmoresNode) {
    this._panel = panel;
    this._viewNode = node;
    // Assign event handlers
    this._panel.webview.onDidReceiveMessage((message) => {
      this.handleMessageFromPanel(message);
    });
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }
  public dispose() {
    TraceView.currentPanel = undefined;
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

  public static render(node:SmoresNode) {
    if (TraceView.currentPanel) {
      TraceView.currentPanel.setViewNode(node);
      TraceView.currentPanel._panel.reveal(vscode.ViewColumn.One);
    } else {
      const extensionUri = getExtensionUri();
      const panel = vscode.window.createWebviewPanel(
        "smoresTraceView", // Identifies the type of the webview. Used internally
        "Trace View", // Title of the panel displayed to the user
        vscode.ViewColumn.One, // Editor column to show the new webview panel in.
        {
          enableScripts: true,
          localResourceRoots:[
            vscode.Uri.joinPath(extensionUri, 'resources'),
            vscode.Uri.joinPath(extensionUri, 'node_modules', '@vscode', 'codicons', 'dist')
          ]
        }
      );
      TraceView.currentPanel = new TraceView(panel, node);
    }
    return TraceView.currentPanel.refresh();
  }
  public refresh() {
    this._panel.webview.html = this.getPageHtml();
    return this._panel.webview.html;
  }
    
  private async handleMessageFromPanel(message:any) {
    switch (message.command) {
    case 'addTrace':
      await this.addTrace();
      this.refresh();
      return;
    case 'verifyTrace':
      if(this._viewNode) {
        this._viewNode.verifyTrace(message.nodeId);
        this.refresh();
      }
      return;
    case 'removeTrace':
      if(this._viewNode) {
        this._viewNode.removeTrace(message.nodeId);
      }
      this.refresh();
      return;
    case 'viewTrace':
      const traceNode = getNodeFromId(message.nodeId);
      if(traceNode) {
        this.setViewNode(traceNode);
        this.refresh();
      }
      return;
    }
  }
  private async addTrace() { 
    if(this._viewNode === undefined) {
      return;
    }
    const traceId = await getTraceSelection(this._viewNode.data.id);
    if(this._viewNode && traceId) {
      this._viewNode.addTrace(traceId);
    }
    console.log(`selected: ${traceId}`);
  }
  private getPageHtml():string {
    if(this._viewNode === undefined) {
      return "";
    }
    const nonce =  getNonce();
    const stylePaths = getTracingStylePaths();
    const scriptPath = getScriptPath();
    const webUri = [
      this._panel.webview.asWebviewUri(vscode.Uri.file(stylePaths[0])).toString(),
      this._panel.webview.asWebviewUri(vscode.Uri.file(stylePaths[1])).toString(),
      this._panel.webview.asWebviewUri(vscode.Uri.file(stylePaths[2])).toString(),
      this._panel.webview.asWebviewUri(vscode.Uri.file(stylePaths[3])).toString(),
      this._panel.webview.asWebviewUri(vscode.Uri.file(stylePaths[4])).toString(),
      this._panel.webview.asWebviewUri(vscode.Uri.file(scriptPath)).toString()
    ];
    const bodyHtml = this.getBodyHtml(this._viewNode);
    clearNonce();
    return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link nonce="${nonce}" href="${webUri[0]}" rel="stylesheet"/>
        <link nonce="${nonce}" href="${webUri[1]}" rel="stylesheet"/>
        <link nonce="${nonce}" href="${webUri[2]}" rel="stylesheet"/>
        <link nonce="${nonce}" href="${webUri[3]}" rel="stylesheet"/>
        <link nonce="${nonce}" href="${webUri[4]}" rel="stylesheet"/>
        <title>Tracing Id: ${this._viewNode.data.id}</title>
      </head>
      <body class='tracing'><div class='tracingOuter'>${bodyHtml}</div>
        <script nonce="${nonce}" src="${webUri[5]}"></script>
      </body>    
    </html>`;  
  }
  private getBodyHtml(node:SmoresNode):string {
    switch(node.data.category) {
      case schema.userFRType:
      case schema.userNFRType:
      case schema.userDCType:
      case schema.softFRType:
      case schema.softNFRType:
      case schema.softDCType:
      case schema.archFRType:
      case schema.archNFRType:
      case schema.archDCType:
      case schema.desFRType:
      case schema.desNFRType:
      case schema.desDCType:
        return this.getReqTracingGrid(node);
      case schema.userTestType:
      case schema.softTestType:
      case schema.archTestType:
      case schema.desTestType:
        return this.getTestTracingGrid(node);
      case schema.documentType:
      case schema.headingType:
      case schema.commentType:
      case schema.imageType:
      case schema.mermaidType:
      default:
        return "<H2>Invalid selection</H2>";
      }
  }
  private getReqTracingGrid(node:SmoresNode):string {
    let html = "<div class='tracingGrid'><div></div>";
    html = html.concat('<div>', getUpstreamReqTraceHtml(node), '</div>');
    html = html.concat('<div>', getTraceTargetHtml(node),'</div>');
    html = html.concat('<div>', getDownstreamTestTraceHtml(node),'</div><div></div>');
    html = html.concat('<div>', getDownstreamReqTraceHtml(node)),'</div></div>';
    return html;
  }
  private getTestTracingGrid(node:SmoresNode):string {
    let html = "<div class='tracingGrid'><div></div><div></div>";
    html = html.concat('<div>', getTraceTargetHtml(node),'</div>');
    html = html.concat('<div>', getUpstreamTestTraceHtml(node),'</div>');
    html = html.concat('<div></div><div></div></div>');
    return html;
  }
}
