import * as vscode from "vscode";
import * as showdown from "showdown";
import { TreeNode } from "../treeView/treeNode";
import { SmoresNode } from "../model/smoresNode";
const test: vscode.MarkdownString = new vscode.MarkdownString("# Hello World");

export class NodeViewer {
  private _extensionUri!:vscode.Uri;
  private referenceNode:SmoresNode|undefined;
  private nodeToEdit:SmoresNode|undefined;
  private viewPanel: vscode.WebviewPanel | undefined;

  constructor() {}

  register(context: vscode.ExtensionContext) {
    this._extensionUri = context.extensionUri;
    const registrations = (
      vscode.commands.registerCommand(
        "doors-smores.View-TreeNode",
        (node: TreeNode) => {
          this.showNode(node.smoresNode);
        }
      ),
      vscode.commands.registerCommand(
        "doors-smores.Edit-Section",(context:any) => {
          this.editNode(context);
        }
      )
    );
    context.subscriptions.push(registrations);
  }
  editNode(context:any) {
    if(context.webviewSection && this.referenceNode) {
      const webviewSection:string = context.webviewSection;
      const nodeId:number = Number(webviewSection.replace("Node-",""));
      const nodeFilepath = this.referenceNode.getNodeFilepath(nodeId);
      const node = new SmoresNode(nodeFilepath);
      this.editSingleOrMultilineNode(node);
    }
  }
  showNode(node: SmoresNode) {
    this.referenceNode = node;
    if (this.viewPanel === undefined) {
      this.viewPanel = vscode.window.createWebviewPanel(
        "smoresNodeView", // Identifies the type of the webview. Used internally
        "Smores Preview", // Title of the panel displayed to the user
        vscode.ViewColumn.One, // Editor column to show the new webview panel in.
        {enableScripts: true} // Webview options. More on these later.
      );
      
      // Handle messages from the webview
      this.viewPanel.webview.onDidReceiveMessage(message => {
        switch (message.command) {
          case 'submit':
            if(this.nodeToEdit) {
              this.nodeToEdit.data.text = message.newValue;
              this.nodeToEdit.write();
              this.nodeToEdit = undefined;
              vscode.commands.executeCommand('doors-smores.Update-TreeView');
            }
            this.updatePanel();
            vscode.window.showErrorMessage(message.text);
            return;
          case 'cancel':
            this.nodeToEdit=undefined;
            this.updatePanel();
            return;
          }
      });
      this.viewPanel.onDidDispose((e) => {
        console.log("closed panel");
        this.viewPanel = undefined;
      });
    } else {
      this.viewPanel.reveal();
    }
    this.updatePanel();
  }
  private async editSingleOrMultilineNode(node: SmoresNode) {
    if(node.data.category === "heading") {
      const currentValue = node.data.text.split("\n")[0];
      const newValue = await vscode.window.showInputBox({ value: `${currentValue}` });
      if(newValue) {
        node.data.text = newValue;
        node.write();
        vscode.commands.executeCommand('doors-smores.Update-TreeView');
        this.updatePanel();
      }
    } else {
      this.nodeToEdit = node;
      this.updatePanel();
    }
  }
  private getHtmlForNode(node: SmoresNode):string {
    let html:string = "";
    html = html.concat(this.getHtmlForNodeType(node));
    html = html.concat(this.getHtmlForNodeChildren(node));
    return html;
  }
  private getHtmlForEditor(nodeId:number, content:string, helpText:string) {
    const outerHtml = `<div class="editContainer">
      <textarea id='textarea-${nodeId}' class="editBox"
        data-vscode-context='{"webviewSection": "textarea-${nodeId}", 
      "preventDefaultContextMenuItems": false}'>${content}</textarea>
      <div class="editHelp">${helpText}</div>
    </div>
    <button class="editOk" onclick="onSubmit('textarea-${nodeId}')">Submit</button>
    <button class="editCancel" onclick="onCancel()">Cancel</button>`;
    return outerHtml;
  }
  private getHtmlForViewing(nodeId:number, innerHtml:string, tooltip:string) {
    const outerHtml = `<div class="tooltip">
        <div class="tooltiptext">${tooltip}</div>
        <div class="viewDiv" data-vscode-context='{"webviewSection": "Node-${nodeId}",
          "preventDefaultContextMenuItems": true}'>${innerHtml}</div>
      </div>`;
    return outerHtml;
  
  }
  private getHtmlForNodeType(node:SmoresNode):string {
    let mdString:string = "";
    let helpText:string = "some helpful instructions";
    switch(node.data.category) {
      case "document":
        return "";
      case "heading":
        mdString = this.getMdForHeading(node);
        break;
      default:
        mdString = node.data.text;
    }
    const converter = new showdown.Converter();
    const innerHtml =  converter.makeHtml(mdString);
    const tooltip = `<b>category</b>: ${node.data.category}<br/><b>id</b>: ${node.data.id}`;
    if(node.data.id === this.nodeToEdit?.data.id) {
      return this.getHtmlForEditor(node.data.id, node.data.text, helpText);
    } else {
      return this.getHtmlForViewing(node.data.id, innerHtml, tooltip);
    }
  }
  private getHtmlForNodeChildren(node:SmoresNode):string {
    let html:string = "";
    if(node.data.children && node.data.children.length > 0) {
      const childNodes = node.getChildNodes();
      for (let index = 0; index < childNodes.length; index++) {
        const child = childNodes[index];
        html = html.concat(this.getHtmlForNode(child));
      }
    }
    return html;
  }
  private getMdForHeading(node:SmoresNode):string {
    let parent = node.getParentNode();
    let depth = 0;
    while(parent !== null) {
      parent = parent.getParentNode();
      depth++;
    }
    let mdString = "";
    while(depth > 0) {
      mdString = mdString.concat("#");
      depth--;
    }
    mdString = mdString.concat(" ", node.data.text.split("\n")[0]);
    return mdString;
  }
  private updatePanel() {
    if(this.viewPanel === undefined || this.referenceNode === undefined) {
      return;
    }
    // Local path to css styles
		const stylesPath = vscode.Uri.joinPath(this._extensionUri, 'resources', 'smores.css');
		const scriptPath = vscode.Uri.joinPath(this._extensionUri, 'resources', 'smoresScript.js');
    const editIconPath = vscode.Uri.joinPath(this._extensionUri, 'resources', 'edit.svg');
		// Convert to webviewUri
		const stylesUri = this.viewPanel.webview.asWebviewUri(stylesPath);
		const scriptUri = this.viewPanel.webview.asWebviewUri(scriptPath);
    const editIconUri = this.viewPanel.webview.asWebviewUri(editIconPath);
    const nodeHtml = this.getHtmlForNode(this.referenceNode);
    
    this.viewPanel!.webview.html =`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${stylesUri}" rel="stylesheet">
        <script src="${scriptUri}"></script>
				<title>Smores Preview</title>
    </head>
      <body>${nodeHtml}</body>
    </html>`;  
  }
}
