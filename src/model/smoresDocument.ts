import { TextDocument, Webview } from 'vscode';
import { FileIO } from './fileIO';
import { SmoresDocumentData, SmoresProjectData } from './schema';
import { SmoresContent } from './smoresContent';

export class SmoresDocument {
	public data:SmoresDocumentData|undefined;
	constructor(public document:TextDocument) {
    this.data = this.getContentData();
	}
  private getContentData():SmoresDocumentData|undefined {
    return FileIO.parseDocumentRawXml(this.document.getText());
  }
  public updateDocumentData() {
    this.data = this.getContentData();
  }
	public getHtml(webview: Webview):string {
		if(this.data === undefined) {
			return '<H1>Invalid document</H1>';
		}
		const text = this.data.content.text;
		const pattern = /\[SMORES\.[^\]]+\]/g;
		const items = text.match(pattern);
		const sections = text.split(pattern);
		let divHtml = "";
		for(let i=0; i < sections.length; i++) {
			divHtml = divHtml.concat(this.getTextDivHtml(sections[i]));
			if(items) {
				divHtml = divHtml.concat(this.getItemHtml(items[i], webview));
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
	private getItemHtml(itemText:string, webview?:Webview) {
		if(itemText === undefined) {return "<h3>Invalid Doors-Smores node found</h3>";}
		const itemId = this.getIdFromItemText(itemText);
		if(itemId === undefined) {return "<h3>Invalid Doors-Smores node found</h3>";}
		return SmoresContent.getHtml(this, itemId, webview);
	}
	private getIdFromItemText(itemText:string):number|undefined {
		const pattern = /\[SMORES\.ID\.(\d+)\]/;
		const mat = itemText.match(pattern);
		if(mat !== null) {
			const convNumber = Number(mat[1]);
			if(!Number.isNaN(convNumber) && typeof convNumber === 'number') {
				return convNumber;
			}
		}
		return undefined;
	}
}