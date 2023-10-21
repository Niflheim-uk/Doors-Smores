import * as vscode from 'vscode';
import { clearNonce, getNonce } from './getNonce';
import { SmoresDocument } from '../model/smoresDocument';
import { FileIO } from '../model/fileIO';
import { getEditorStyleBlock, getMermaidBlock, getScriptBlock } from './resources';
import { generateTOCxsl, generateUserCss } from './userStyle';
import * as schema from '../model/schema';
import { HTML } from './html';

interface Edit {
	type: string;
	block: number;
	data: any;
};
interface HtmlConstants {
	smoresDocument:SmoresDocument;
	dataUri:vscode.Uri;
	webview:vscode.Webview;
};
export class SmoresEditorProvider implements vscode.CustomTextEditorProvider {
	public static readonly viewType = 'doors-smores.smoresEditor';
	public static register(context: vscode.ExtensionContext) {
		const provider = new SmoresEditorProvider(context);
		const providerRegistration = vscode.window.registerCustomEditorProvider(SmoresEditorProvider.viewType, provider);
		context.subscriptions.push(providerRegistration);
	}

	constructor(private readonly context: vscode.ExtensionContext) { }

	public async resolveCustomTextEditor(document: vscode.TextDocument,	webviewPanel: vscode.WebviewPanel, _token: vscode.CancellationToken): Promise<void> {
		const smoresDocument = new SmoresDocument(document);
		const projPath = FileIO.getProjectPath(smoresDocument);
		if(projPath === undefined) {
			vscode.window.showErrorMessage("Could not read document file");
			return;
		}
		const dataPath = FileIO.getContentRoot(smoresDocument);
		if(dataPath === undefined) {
			vscode.window.showErrorMessage(`Could not read project file referenced by this document: ${projPath}`);
			return;
		}
		let editBlocks:number[] = [];
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
		const htmlConstants:HtmlConstants = {
			smoresDocument,
			webview:webviewPanel.webview,
			dataUri
		};
		webviewPanel.webview.html = this.getHtmlForDocument(htmlConstants, false, editBlocks);

		const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
			if (e.document.uri.toString() === document.uri.toString()) {
				smoresDocument.updateData();
				webviewPanel.webview.html = this.getHtmlForDocument(htmlConstants,false, editBlocks);
			}
		});

		// Make sure we get rid of the listener when our editor is closed.
		webviewPanel.onDidDispose(() => {
			changeDocumentSubscription.dispose();
		});

		// Receive message from the webview.
		webviewPanel.webview.onDidReceiveMessage(e => {
			if(e.command !== undefined && e.blockNumber !== undefined) {
				switch (e.command) {
				case 'addEditBlock':
					editBlocks = this.addEditBlock(e.blockNumber, editBlocks);
					break;
				case 'closeEditblock':
					editBlocks = this.closeEditBlock(e.blockNumber, editBlocks);
					break;
				case 'addNewTextBlock':
					editBlocks = this.addEdit(smoresDocument, {type:'addTextBlock', block:e.blockNumber, data:"New text section"}, editBlocks);
					break;
				case 'updateTextBlockContent':
					editBlocks = this.addEdit(smoresDocument, {type:e.command, block:e.blockNumber, data:e.blockValue}, editBlocks);
					break;
				case 'addFRBlock':
					editBlocks = this.addEdit(smoresDocument, {type:'addFRBlock', block:e.blockNumber, data:'huh'}, editBlocks);
					break;
				}
				webviewPanel.webview.html = this.getHtmlForDocument(htmlConstants, false, editBlocks);
			}
		});

	}
	private addEditBlock(blockNumber:number, editBlocks:number[]):number[] {
		if(!editBlocks.includes(blockNumber)) {
			editBlocks.push(blockNumber);
		}
		return editBlocks;
	}
	private closeEditBlock(blockNumber:number, editBlocks:number[]):number[] {
		if(editBlocks.includes(blockNumber)) {
			const blockIndex = editBlocks.indexOf(blockNumber);
			editBlocks.splice(blockIndex, 1);
		}
		return editBlocks;
	}
	private insertEditBlock(blockNumber:number, editBlocks:number[]):number[] {
		let newBlocks:number[] = [];
		for(let i=0; i<editBlocks.length; i++) {
			if(editBlocks[i] < blockNumber) {
				newBlocks.push(editBlocks[i]);
			} else {
				newBlocks.push(editBlocks[i]+1);
			}
		}
		newBlocks.push(blockNumber);
		return newBlocks;
	}
	private addEdit(document:SmoresDocument, edit:Edit, editBlocks:number[]):number[] {
		switch (edit.type) {
		case 'updateTextBlockContent':
			if(document.updateBlock(edit.block, edit.data)) {
				return this.closeEditBlock(edit.block, editBlocks);
			}
			break;
		case 'addTextBlock':
			if(document.addTextBeforeBlock(edit.block, edit.data)) {
				return this.insertEditBlock(edit.block, editBlocks);
			}
			break;
		case 'addFRBlock':
			
		}
		return editBlocks;
	}

	private getHtmlForDocument(htmlConstants:HtmlConstants, exporting:boolean, editBlocks:number[]): string {
		const nonce = getNonce();
		let webview:vscode.Webview|undefined = htmlConstants.webview;
		if(exporting) {
			webview = undefined;
		}
		const toolbarHtml = this.getToolbarHtml(htmlConstants.smoresDocument, editBlocks, webview);
		const documentHtml = htmlConstants.smoresDocument.getHtml(editBlocks, webview);
		const styleBlock = getEditorStyleBlock(this.context.extensionUri, htmlConstants.dataUri, webview);
    const scriptBlock = getScriptBlock(this.context.extensionUri, webview);
    const mermaidBlock = getMermaidBlock(this.context.extensionUri, webview);
		clearNonce();

		return `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="Content-Security-Policy" 
	content="default-src 'none'; 
	font-src ${htmlConstants.webview.cspSource} 'nonce-${nonce}'; 
	img-src ${htmlConstants.webview.cspSource} 'nonce-${nonce}'; 
	script-src ${htmlConstants.webview.cspSource} 'nonce-${nonce}';
	style-src ${htmlConstants.webview.cspSource} 'unsafe-inline';
"/>
${styleBlock}
<title>Doors Smores</title>
</head>
<body data-vscode-context='{"preventDefaultContextMenuItems": true}'>
${toolbarHtml}
${documentHtml}
${mermaidBlock}
${scriptBlock}
</body>    

</html>`;
	}
	private getToolbarHtml(smoresDocument:SmoresDocument, editBlocks:number[], webview?: vscode.Webview) {
		if(webview === undefined || smoresDocument.data === undefined ) {
			return "";
		}
		let hideClass = "";
		if(editBlocks.length===0) {
			hideClass = 'hiddenToolbar';
		}
		const closeIcon:string = "<i class='codicon codicon-eye'></i>";
		const addFRIcon:string = HTML.getIcon(smoresDocument.data.type, schema.userFRCategory);
		const addNFRIcon:string = HTML.getIcon(smoresDocument.data.type, schema.userNFRCategory);
		const addDCIcon:string = HTML.getIcon(smoresDocument.data.type, schema.userDCCategory);
		const addTestIcon:string = HTML.getIcon(smoresDocument.data.type, schema.userTestCategory);
		const addTextIcon:string = HTML.getIcon(smoresDocument.data.type, schema.commentCategory);
		const addImageIcon:string = HTML.getIcon(smoresDocument.data.type, schema.imageCategory);
		const addMermaidIcon:string = HTML.getIcon(smoresDocument.data.type, schema.mermaidCategory);
		let documentButtonHtml = "";
		switch(smoresDocument.data.type) {
		case schema.ursDocType:
		case schema.srsDocType:
		case schema.adsDocType:
		case schema.ddsDocType:
			documentButtonHtml = `
		<button id=toolbarAddFR class="toolbarButton">${addFRIcon}</Button>
		<button id=toolbarAddNFR class="toolbarButton">${addNFRIcon}</Button>
		<button id=toolbarAddDC class="toolbarButton">${addDCIcon}</Button>`;
			break;
		case schema.atpDocType:
		case schema.stpDocType:
		case schema.itpDocType:
		case schema.utpDocType:
			documentButtonHtml = `
		<button id=toolbarAddTest class="toolbarButton">${addTestIcon}</Button>`;
			break;
		}

		return `
	<div id='editorToolbar' class="toolbarDiv ${hideClass}">
		<button id=toolbarClose class="toolbarButton">${closeIcon}</Button>${documentButtonHtml}
		<button id=toolbarAddText class="toolbarButton">${addTextIcon}</Button>
		<button id=toolbarAddImage class="toolbarButton">${addImageIcon}</Button>
		<button id=toolbarAddMermaid class="toolbarButton">${addMermaidIcon}</Button>
	</div>`;
	}
}
