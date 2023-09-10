import * as vscode from "vscode";
import * as path from "path";
import * as fs from 'fs';
import { SmoresDataFile } from "../model/smoresDataFile";
import { SmoresNode, getNodeFromId } from "../model/smoresNode";
import * as utils from '../utils/utils';
import { 
  getDownstreamReqTraceHtml, 
  getDownstreamTestTraceHtml,
  getUpstreamReqTraceHtml,
  getUpstreamTestTraceHtml,
  getTraceTargetHtml
 } from "./traceHtml";
import { getProject } from "../model/smoresProject";

export class TraceView {
  private _viewPanel: vscode.WebviewPanel | undefined;
  private _viewedNode: SmoresNode|undefined;

  constructor() {}

  public showTraceView(node: SmoresNode) {
    if(node === undefined) {
      return;
    }
    if (this._viewPanel === undefined) {
      this._createPanel(node);
    } else {
      this._viewedNode = node;
      this._viewPanel.reveal();
    }
    this.updatePanel();
  }
  private handleMessageFromPanel(message:any) {
    switch (message.command) {
      case 'addTrace':
        this.addTrace(message.traceType, message.traceUpstream);
        return;
      case 'removeTrace':
        if(this._viewedNode) {
          if(message.traceUpstream) {
            this._viewedNode.removeUpstreamTrace(message.traceType, message.nodeId);
          } else {
            this._viewedNode.removeDownstreamTrace(message.traceType, message.nodeId);
          }
          this.showTraceView(this._viewedNode);
        }
        return;
      case 'viewTrace':
        const traceNode = getNodeFromId(message.nodeId);
        if(traceNode) {
          this.showTraceView(traceNode);
        }
        return;
    }
  }
  private async addTrace(traceType:string, upstream:boolean) {            
    const projectNode = getProject();
    if(this._viewedNode === undefined || projectNode === undefined) {
      return;
    }
    const nodeIdStr = await vscode.window.showInputBox({
      prompt:"Enter the id of the target node",
      placeHolder:"node id (number only, no prefix)",
      validateInput: text => {
        if(/^\d+$/.test(text)) {
          return null;
        } else {
          return 'Not a valid node Id. Please enter an integer number.';
        }
      }  
    });
    if(nodeIdStr) {
      const nodeId = parseInt(nodeIdStr);
      if(projectNode.verifyId(nodeId)) {
        if(upstream) {
          this._viewedNode.addUpstreamTrace(traceType, nodeId);
        } else {
          this._viewedNode.addDownstreamTrace(traceType, nodeId);
        }
      }
      this.showTraceView(this._viewedNode);
    }
  }
  private _createPanel(node:SmoresNode) {
    this._viewedNode = node;
    const extensionPath = SmoresDataFile.getExtensionPath();
    if(extensionPath === undefined) {
      return;
    }
    const extensionUri = vscode.Uri.file(extensionPath);    
    this._viewPanel = vscode.window.createWebviewPanel(
      "smoresTraceView", // Identifies the type of the webview. Used internally
      "Trace View", // Title of the panel displayed to the user
      vscode.ViewColumn.One, // Editor column to show the new webview panel in.
      {
        enableScripts: true,
        localResourceRoots:[
          vscode.Uri.joinPath(extensionUri, 'resources')
        ]
      }
    );
    utils.setTraceWebview(this._viewPanel.webview);
    // Assign event handlers
    this._viewPanel.webview.onDidReceiveMessage((message) => {
      this.handleMessageFromPanel(message);
    });

    this._viewPanel.onDidDispose((e) => {
      console.log("closed panel");
      this._viewPanel = undefined;
      utils.clearTraceWebview();
    });
  }
  public updatePanel() {
    if(this._viewPanel === undefined || this._viewedNode === undefined) {
      return;
    }
    this._viewPanel.webview.html = this.getPageHtml(this._viewedNode);
  }
  private getPageHtml(node:SmoresNode):string {
    const extensionPath = SmoresDataFile.getExtensionPath();
    const nonce = utils.getNonce();
    const webview = utils.getTraceWebview();
    const stylePaths = utils.getTracingStylePaths(extensionPath);
    const scriptPath = utils.getScriptPath(extensionPath);
    if(webview === undefined || stylePaths === undefined) {
      return "";
    }
    if(scriptPath === undefined) {
      return "";
    }
    const webUri = [
      webview.asWebviewUri(vscode.Uri.file(stylePaths[0])).toString(),
      webview.asWebviewUri(vscode.Uri.file(stylePaths[1])).toString(),
      webview.asWebviewUri(vscode.Uri.file(stylePaths[2])).toString(),
      webview.asWebviewUri(vscode.Uri.file(stylePaths[3])).toString(),
      webview.asWebviewUri(vscode.Uri.file(scriptPath)).toString()
    ];
    const bodyHtml = this.getBodyHtml(node);
    utils.clearNonce();
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
        <title>Tracing Id: ${node.data.id}</title>
      </head>
      <body class='tracing'><div class='tracingOuter'>${bodyHtml}</div>
        <script nonce="${nonce}" src="${webUri[4]}"></script>
      </body>    
    </html>`;  
  }
  private getBodyHtml(node:SmoresNode):string {
    switch(node.data.category) {
      case "userRequirement":
      case "functionalRequirement":
      case "nonFunctionalRequirement":
      case "designConstraint":
        return this.getReqTracingGrid(node);
      case "softwareSystemTest":
      case "softwareIntegrationTest":
      case "softwareUnitTest":
        return this.getTestTracingGrid(node);
      case "document":
      case "heading":
      case "comment":
      case "image":
      case "mermaid":
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
    let html = "<div class='tracingGrid'>";
    html = html.concat('<div>', getTraceTargetHtml(node),'</div>');
    html = html.concat('<div>', getUpstreamTestTraceHtml(node),'</div>');
    html = html.concat('</div>');
    return html;
  }
}
