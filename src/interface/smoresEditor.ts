import * as vscode from 'vscode';
import { getNonce } from './getNonce';
import { SmoresDocument } from '../model/smoresDocument';


export interface SmoresProjectData {
  dataVersion: number;
	repository: {
		relativeRoot: string;
		pathspec: string;
		remote: string;
	}
	contributors: {
		max: number;
		contributor: string[];
	}
	documents: {
		name: string[];
	}
	uniqueIds: {
		idBase: number;
		id: number[];
	}
}

export class SmoresEditorProvider implements vscode.CustomTextEditorProvider {
	private static readonly viewType = 'doors-smores.smoresEditor';
	public static register(context: vscode.ExtensionContext): vscode.Disposable {
		const provider = new SmoresEditorProvider(context);
		const providerRegistration = vscode.window.registerCustomEditorProvider(SmoresEditorProvider.viewType, provider);
		return providerRegistration;
	}

	constructor(
		private readonly context: vscode.ExtensionContext
	) { }

	public async resolveCustomTextEditor(document: vscode.TextDocument,	webviewPanel: vscode.WebviewPanel, _token: vscode.CancellationToken): Promise<void> {
		const smoresDocument = new SmoresDocument(document);
		// Setup initial content for the webview
		webviewPanel.webview.options = {
			enableScripts: true,
		};
		webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, smoresDocument);

		const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
			if (e.document.uri.toString() === document.uri.toString()) {
				smoresDocument.updateDocumentData();
				webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, smoresDocument);
			}
		});

		// Make sure we get rid of the listener when our editor is closed.
		webviewPanel.onDidDispose(() => {
			changeDocumentSubscription.dispose();
		});

		// Receive message from the webview.
		webviewPanel.webview.onDidReceiveMessage(e => {
			switch (e.type) {
				case 'add':
//					this.addNewScratch(document);
					return;

				case 'delete':
	//				this.deleteScratch(document, e.id);
					return;
			}
		});

	}

	/**
	 * Get the static html used for the editor webviews.
	 */
	private getHtmlForWebview(webview: vscode.Webview, smoresDocument:SmoresDocument): string {
		// Local path to script and css for the webview
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this.context.extensionUri, 'media', 'catScratch.js'));

		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this.context.extensionUri, 'media', 'reset.css'));

		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this.context.extensionUri, 'media', 'vscode.css'));

		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this.context.extensionUri, 'media', 'catScratch.css'));

		// Use a nonce to whitelist which scripts can be run
		const nonce = getNonce();
		const bodyHtml = this.getBodyHtml(smoresDocument.data.content.text);
		return `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<style>
				.autogrow {
					display: grid;
				}
				.autogrow::after {
					content: attr(data-replicated-value) " ";
					white-space: pre-wrap;
					visibility: hidden;
				}
				.autogrow > textarea {
					resize: none;
					overflow: hidden;
				}
					/* Identical styling required!! */
				.autogrow > textarea, .autogrow::after {
					color: var(--vscode-editor-foreground);
					background: var(--vscode-editor-background);				
					border: none;
					padding: 0.5rem;
					font: inherit;
					/* Place on top of each other */
					grid-area: 1 / 1 / 2 / 2;
				}
				</style>
				<title>Doors Smores</title>
			</head>
			<body>${bodyHtml}</body>
			</html>`;
	}
	private getBodyHtml(text:string) {
		const pattern = /\[SMORES\.[^\]]+\]/g;
		const items = text.match(pattern);
		const sections = text.split(pattern);
		let divHtml = "";
		for(let i=0; i < sections.length; i++) {
			divHtml = divHtml.concat(this.getTextDivHtml(sections[i]));
			if(items) {
				divHtml = divHtml.concat(this.getItemHtml(items[i]));
			}
		}
		return divHtml;
	}
	private getTextDivHtml(divText:string) {
		return `
			<div class="autogrow" data-replicated-value="${divText}">
				<textarea onInput="this.parentNode.dataset.replicatedValue = this.value">${divText}</textarea>
			</div>`;
	}
	private getItemHtml(itemText:string) {
		if(itemText === undefined) {
			return "";
		}
		return `
			<div >
				<h3>${itemText}</h3>
			</div>`;
	}
}
