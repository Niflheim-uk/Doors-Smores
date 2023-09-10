import * as vscode from "vscode";
import * as schema from '../../model/schema';
import { 
  getDownstreamReqTraceHtml, 
  getDownstreamTestTraceHtml,
  getUpstreamReqTraceHtml,
  getUpstreamTestTraceHtml,
  getTraceTargetHtml
 } from "./traceHtml";
import { clearNonce, getNonce } from "../getNonce";
import { getScriptPath, getTracingStylePaths } from "../../utils/gui";
import { getTraceSelection } from "./traceSelection";
import { DocumentNode } from "../../model/documentNode";
import { DoorsSmores } from "../../doorsSmores";
import { DocumentTreeItem } from "../../documentTree/documentTreeItem";

export class TraceView {
  public static currentPanel: TraceView | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private _viewNode: DocumentNode|undefined;

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
    TraceView.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  public static register() {
    const registrations = [
      vscode.commands.registerCommand('doors-smores.ViewTraces', (source:any)=>{TraceView.render(source);}),
    ];
    DoorsSmores.register(registrations);
  }

  public setViewNode(node:DocumentNode) {
    this._viewNode = node;
  }

  public static render(source:any) {
    const node = TraceView.getNodeFromSource(source);
    if(node === undefined) {
      return;
    }
    if (TraceView.currentPanel) {
      TraceView.currentPanel.setViewNode(node);
      TraceView.currentPanel._panel.reveal(vscode.ViewColumn.One);
    } else {
      const extensionUri = vscode.Uri.file(DoorsSmores.getExtensionPath());
      const panel = vscode.window.createWebviewPanel(
        "doors-smores.traceView", // Identifies the type of the webview. Used internally
        "Trace View", // Title of the panel displayed to the user
        vscode.ViewColumn.One, // Editor column to show the new webview panel in.
        {
          enableScripts: true,
          localResourceRoots:[
            vscode.Uri.joinPath(extensionUri, 'resources'),
            vscode.Uri.joinPath(extensionUri, 'resources', 'vendor', 'vscode')
          ]
        }
      );
      TraceView.currentPanel = new TraceView(panel, node);
    }
    return TraceView.refresh();
  }
  public static refresh() {
    if(TraceView.currentPanel) {
      TraceView.currentPanel._panel.webview.html = TraceView.currentPanel.getPageHtml();
      return TraceView.currentPanel._panel.webview.html;
    } else {
      return "";
    }
  }
    
  private async handleMessageFromPanel(message:any) {
    switch (message.command) {
    case 'addTrace':
      await this.addTrace();
      TraceView.refresh();
      return;
    case 'verifyTrace':
      if(this._viewNode) {
        this._viewNode.verifyTrace(message.nodeId);
        TraceView.refresh();
      }
      return;
    case 'removeTrace':
      if(this._viewNode) {
        this._viewNode.removeTrace(message.nodeId);
      }
      TraceView.refresh();
      return;
    case 'viewTrace':
      const traceNode = DocumentNode.createFromId(message.nodeId);
      if(traceNode) {
        this.setViewNode(traceNode);
        TraceView.refresh();
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
  private getBodyHtml(node:DocumentNode):string {
    switch(node.data.category) {
      case schema.userFRCategory:
      case schema.userNFRCategory:
      case schema.userDCCategory:
      case schema.softFRCategory:
      case schema.softNFRCategory:
      case schema.softDCCategory:
      case schema.archFRCategory:
      case schema.archNFRCategory:
      case schema.archDCCategory:
      case schema.desFRCategory:
      case schema.desNFRCategory:
      case schema.desDCCategory:
        return this.getReqTracingGrid(node);
      case schema.userTestCategory:
      case schema.softTestCategory:
      case schema.archTestCategory:
      case schema.desTestCategory:
        return this.getTestTracingGrid(node);
      case schema.documentCategory:
      case schema.headingCategory:
      case schema.commentCategory:
      case schema.imageCategory:
      case schema.mermaidCategory:
      default:
        return "<H2>Invalid selection</H2>";
      }
  }
  private getReqTracingGrid(node:DocumentNode):string {
    let html = "<div class='tracingGrid'><div></div>";
    html = html.concat('<div>', getUpstreamReqTraceHtml(node), '</div>');
    html = html.concat('<div>', getTraceTargetHtml(node),'</div>');
    html = html.concat('<div>', getDownstreamTestTraceHtml(node),'</div><div></div>');
    html = html.concat('<div>', getDownstreamReqTraceHtml(node)),'</div></div>';
    return html;
  }
  private getTestTracingGrid(node:DocumentNode):string {
    let html = "<div class='tracingGrid'><div></div><div></div>";
    html = html.concat('<div>', getTraceTargetHtml(node),'</div>');
    html = html.concat('<div>', getUpstreamTestTraceHtml(node),'</div>');
    html = html.concat('<div></div><div></div></div>');
    return html;
  }
  private static getNodeFromSource(source:any) {
    if(source === undefined) {
      vscode.window.showErrorMessage("Undefined source for trace view");
      return undefined;
    
    }
    if(DocumentTreeItem.isDocumentTreeItem(source)) {
      const item:DocumentTreeItem = source;
      return item.node;
    } else {
      if(source.nodeId === undefined) {
        vscode.window.showErrorMessage("Undefined Node Id from webview context");
        return undefined;
      }
      const nodeId:number = Number(source.nodeId);
      return DocumentNode.createFromId(nodeId);
    }
  }
}