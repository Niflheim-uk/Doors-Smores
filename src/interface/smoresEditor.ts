import * as vscode from 'vscode';
import { getNonce } from './getNonce';
import { SmoresDocument } from '../model/smoresDocument';
import { FileIO } from '../model/fileIO';
import { getEditorStyleBlock, getMermaidBlock, getScriptBlock } from './resources';
import { generateTOCxsl, generateUserCss } from './userStyle';
import * as schema from '../model/schema';

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
		let editBlocks:number[] = [];
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
			switch (e.command) {
				case 'addEditBlock':
					if(e.blockNumber !== undefined) {
						const blockIndex = editBlocks.indexOf(e.blockNumber);
						// make sure this block number is only listed once, and put that number at the end
						if(blockIndex !== -1) {
							editBlocks.splice(blockIndex, 1);
						}
						editBlocks.push(e.blockNumber);
						webviewPanel.webview.html = this.getHtmlForDocument(htmlConstants, false, editBlocks);
					}
					return;
				case 'updateTextBlockContent':
					this.addEdit(smoresDocument, {type:e.command, block:e.blockNumber, data:e.blockValue});
					return;
				case 'closeEditblock':
					if(editBlocks.length > 0) {
						editBlocks.pop();
						webviewPanel.webview.html = this.getHtmlForDocument(htmlConstants, false, editBlocks);
					}
					break;
			}
		});

	}

	private addEdit(document:SmoresDocument, edit:Edit) {
		switch (edit.type) {
		case 'updateTextBlockContent':
			document.updateBlock(edit.block, edit.data);
			break;
		}
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
		let docColourClass = 'ursLevelIconColour';
		switch(smoresDocument.data.type) {
		case schema.ursDocType:
		case schema.atpDocType:
			docColourClass = 'ursLevelIconColour';
			break;
		case schema.srsDocType:
		case schema.stpDocType:
			docColourClass = 'srsLevelIconColour';
			break;
		case schema.adsDocType:
		case schema.itpDocType:
			docColourClass = 'adsLevelIconColour';
			break;
		case schema.ddsDocType:
		case schema.utpDocType:
			docColourClass = 'ddsLevelIconColour';
			break;
		}



		const closeIcon:string = "<i class='codicon codicon-eye'></i>";
		const addFRIcon:string = `<i class='codicon codicon-${schema.requirementIcon} FRIconColour'></i>`;
		const addNFRIcon:string = `<i class='codicon codicon-${schema.requirementIcon} NFRIconColour'></i>`;
		const addDCIcon:string = `<i disabled class='codicon codicon-${schema.constraintIcon} DCIconColour'></i>`;
		const addTestIcon:string = `<i class='codicon codicon-${schema.testIcon} ${docColourClass}'></i>`;
		const addTextIcon:string = `<i class='codicon codicon-${schema.textIcon} textIconColour'></i>`;
		const addImageIcon:string = `<i class='codicon codicon-${schema.imageIcon} imageIconColour'></i>`;
		const addMermaidIcon:string = `<i class='codicon codicon-${schema.imageIcon} mermaidIconColour'></i>`;
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
