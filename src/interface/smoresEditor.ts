import * as vscode from 'vscode';
import { getNonce } from './getNonce';
import { SmoresDocument } from '../model/smoresDocument';
import { FileIO } from '../model/fileIO';
import { getEditorStyleBlock, getMermaidBlock, getScriptBlock } from './resources';
import { generateTOCxsl, generateUserCss } from './userStyle';

class DocumentEdit  {
	public block:number|undefined;
	public edit:any;
	private _isDirty:boolean;
	constructor() {
		this.block = undefined;
		this.edit = undefined;
		this._isDirty = false;
	}
	storeEdit(newEdit:any) {
		if(newEdit !== undefined) {
			this._isDirty = true;
			this.edit = newEdit;
		}
	}
	isDirty() {
		if(this.block !== undefined && this._isDirty && this.edit !== undefined) {
			return true;
		}
		return false;
	}
	getEdit():any {
		if(this.isDirty()) {
			this._isDirty = false;
			return this.edit;
		}
		return undefined;
	}
}
export class SmoresEditorProvider implements vscode.CustomTextEditorProvider {
	private static readonly viewType = 'doors-smores.smoresEditor';
	public static register(context: vscode.ExtensionContext): vscode.Disposable {
		const provider = new SmoresEditorProvider(context);
		const providerRegistration = vscode.window.registerCustomEditorProvider(SmoresEditorProvider.viewType, provider);
		return providerRegistration;
	}

	constructor(private readonly context: vscode.ExtensionContext) { }

	public async resolveCustomTextEditor(document: vscode.TextDocument,	webviewPanel: vscode.WebviewPanel, _token: vscode.CancellationToken): Promise<void> {
		const smoresDocument = new SmoresDocument(document);
		const projPath = FileIO.getProjectPath(smoresDocument);
		const dataPath = FileIO.getContentRoot(smoresDocument);
		let docEdit = new DocumentEdit();
		if(projPath === undefined || dataPath === undefined) {return;}
		const dataUri = vscode.Uri.file(dataPath);
		generateUserCss(this.context.extensionUri.fsPath, dataUri.fsPath);
//    generateTOCxsl(dataUri.toString());
    
		webviewPanel.webview.options = {
			enableScripts: true,
			localResourceRoots:[
				vscode.Uri.joinPath(this.context.extensionUri, 'resources'),
				dataUri
			]
		};
		webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, smoresDocument, dataUri, docEdit.block);

		const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
			if (e.document.uri.toString() === document.uri.toString()) {
				smoresDocument.updateData();
				webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, smoresDocument, dataUri, docEdit.block);
			}
		});

		// Make sure we get rid of the listener when our editor is closed.
		webviewPanel.onDidDispose(() => {
			changeDocumentSubscription.dispose();
		});

		// Receive message from the webview.
		webviewPanel.webview.onDidReceiveMessage(e => {
			switch (e.command) {
				case 'editBlock':
					if(e.blockNumber !== undefined && e.blockNumber !== docEdit.block) {
						const edit = docEdit.getEdit();
						if(edit && docEdit.block !== undefined) {
							smoresDocument.updateBlock(docEdit.block, edit);
						}
						docEdit.block = e.blockNumber;
						webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, smoresDocument, dataUri, docEdit.block);
					}
					return;
				case 'update':
					docEdit.storeEdit(e.data);
					return;
			}
		});

	}

	private getHtmlForWebview(webview: vscode.Webview, smoresDocument:SmoresDocument, dataUri:vscode.Uri, editBlock?:number): string {
		const nonce = getNonce();
		const bodyHtml = smoresDocument.getHtml(webview, editBlock);
		const styleBlock = getEditorStyleBlock(this.context.extensionUri, dataUri, webview);
    const scriptBlock = getScriptBlock(this.context.extensionUri, webview);
    const mermaidBlock = getMermaidBlock(this.context.extensionUri, webview);

		return `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="Content-Security-Policy" 
	content="default-src 'none'; 
	font-src ${webview.cspSource} 'nonce-${nonce}'; 
	img-src ${webview.cspSource} 'nonce-${nonce}'; 
	script-src ${webview.cspSource} 'nonce-${nonce}';
	style-src ${webview.cspSource} 'unsafe-inline';
"/>
${styleBlock}
<title>Doors Smores</title>
</head>
<body data-vscode-context='{"preventDefaultContextMenuItems": true}'>
${bodyHtml}
${mermaidBlock}
${scriptBlock}
</body>    

</html>`;
	}
}
