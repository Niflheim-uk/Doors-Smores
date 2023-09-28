import { TextDocument, Webview } from 'vscode';
import { FileIO } from './fileIO';
import { SmoresDocumentData, SmoresProjectData } from './schema';
import { SmoresContent } from './smoresContent';
import * as markdown from '../interface/markdownConversion';

export interface SmoresDocumentBlock {
	data:string,
	isText:boolean
};
export class SmoresDocument {
	public data:SmoresDocumentData|undefined;
	constructor(public document:TextDocument) {
    this.data = this.getData();
	}
  private getData():SmoresDocumentData|undefined {
    return FileIO.parseDocumentRawXml(this.document.getText());
  }
  public updateData() {
    this.data = this.getData();
  }
	public getDocumentBlocks():SmoresDocumentBlock[] {
		if(this.data === undefined) {
			return [];
		}
		const text = this.data.content.text;
		const pattern = /\[SMORES\.[^\]]+\]/g;
		const items = text.match(pattern);
		const sections = text.split(pattern);
		let blocks:SmoresDocumentBlock[] = [];
		for(let i=0; i < sections.length; i++) {
			if(sections[i] && sections[i] !== ""){
				blocks.push({data:sections[i], isText:true});
			}
			if(items && items[i]) {
				blocks.push({data:items[i], isText:false});
			}
		}
		return blocks;
	}
	private getTextFromBlocks(blocks:SmoresDocumentBlock[]) {
		let t = "";
		for(let i=0; i<blocks.length; i++) {
			t = t.concat(blocks[i].data);
		}
		return t;
	}
	public updateBlock(blockNumber:number, edit:any) {
		var blocks = this.getDocumentBlocks();
		if(blockNumber < blocks.length) {
			if(blocks[blockNumber].isText) {
				if(typeof edit === 'string') {
					blocks[blockNumber].data = edit;
					this.data!.content.text = this.getTextFromBlocks(blocks);
				}
			} else {
				const itemId = this.getIdFromItemText(blocks[blockNumber].data);
				if(itemId && edit !== undefined) {
					this.updateItem(itemId, edit);
				}
			}
		}
	}
	private updateItem(itemId:number, edit:any) {

	}
	public getHtml(webview: Webview, editBlockNumber?:number):string {
		if(this.data === undefined) {
			return '<H1>Invalid document</H1>';
		}
		markdown.SmoresHeading.clear();
		const blocks = this.getDocumentBlocks();
		let divHtml = "";
		for(let i=0; i < blocks.length; i++) {
			if(blocks[i].isText) {
				divHtml = divHtml.concat(this.getTextDivHtml(blocks[i].data, i, editBlockNumber));
			} else {
				divHtml = divHtml.concat(this.getItemHtml(blocks[i].data, i, webview));
			}
		}
		return divHtml;
	}
	private getBlockDiv(inner:string, blockNumber:number) {
		return `
		<div class="block" data-block-number="${blockNumber}">
			${inner}
		</div>`;
	}
	private getTextDivHtml(divText:string, blockNumber:number, editBlockNumber?:number) {
		if(editBlockNumber !== undefined && blockNumber === editBlockNumber) {
			return this.getEditDivHtml(divText, blockNumber);
		} else {
			const html = markdown.getBodyHtmlFromMd(divText);
			return this.getBlockDiv(html, blockNumber);
		}
	}
	private getEditDivHtml(divText:string, blockNumber:number) {
		const html = `
		<div class="autogrow" data-replicated-value="${divText}">
			<textarea>${divText}</textarea>
		</div>`;
		return this.getBlockDiv(html, blockNumber);
	}
	private getItemHtml(itemText:string, blockNumber:number, webview?:Webview) {
		if(itemText === undefined) {return "<h3>Invalid Doors-Smores node found</h3>";}
		const itemId = this.getIdFromItemText(itemText);
		if(itemId === undefined) {return "<h3>Invalid Doors-Smores node found</h3>";}
		const html = SmoresContent.getHtml(this, itemId, webview);
		return this.getBlockDiv(html, blockNumber);
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