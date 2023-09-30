import { Position, Range, TextDocument, TextLine, Webview, WorkspaceEdit, window, workspace } from 'vscode';
import { FileIO } from './fileIO';
import * as schema from './schema';
import { SmoresContent } from './smoresContent';
import * as markdown from '../interface/markdownConversion';

export interface SmoresDocumentBlock {
	data:string,
	isText:boolean,
	range:Range
};
export class SmoresDocument {
	public data:schema.SmoresDocumentData|undefined;
	constructor(public document:TextDocument) {
    this.data = this.getData();
	}
  private getData():schema.SmoresDocumentData|undefined {
    return FileIO.parseDocumentRawXml(this.document.getText());
  }
  public updateData() {
    this.data = this.getData();
  }
	public getPositionOfTextField():Position {
		const nLines = this.document.lineCount;
		for(let i=0; i<nLines; i++) {
			const line:TextLine = this.document.lineAt(i);
			const m = line.text.match(/\s*<text>/);
			if(m) {
				const c = m[0].length;
				return new Position(i,c);
			}
		}
		window.showErrorMessage("Failed to find start of text field");
		return new Position(-1,-1);
	}
	public getPositionFromTextOffset(offsetIntoText:number):Position {
		const startOfText = this.getPositionOfTextField();
		let charactersLeft = offsetIntoText;
		for(let i=startOfText.line; i<this.document.lineCount; i++) {
			let charactersInLine = this.document.lineAt(i).text.length;
			if(i === startOfText.line) {
				charactersInLine -= startOfText.character;
			}
			if(charactersLeft < charactersInLine) {
				return new Position(i, charactersLeft);
			} else {
				charactersLeft -= charactersInLine;
			}
		}
		window.showErrorMessage("Failed to find position within document");
		return new Position(-1,-1);
	}
	private getTextStart():{text:string, startPos:Position} {
		const startPos = this.getPositionOfTextField();
		const startLine = this.document.lineAt(startPos.line).text;
		const text = startLine.slice(startPos.character);
		return {text, startPos};
	}
	public getDocumentBlocks():SmoresDocumentBlock[] {
		let blocks:SmoresDocumentBlock[] = [];
		let {text, startPos} = this.getTextStart();
		const itemPattern = /(.*)(\[SMORES\.[^\]]+\])(.*)/;
		const endPattern = /(.*)<\/text>/;
		for(let i=startPos.line+1; i<this.document.lineCount; i++) {
			const lineText = this.document.lineAt(i).text;
			const itemMatch = lineText.match(itemPattern);
			const endMatch = lineText.match(endPattern);
			if(itemMatch) {
				text = text.concat('\n',itemMatch[1]);
				const textEndPos = new Position(i, itemMatch[1].length);
				blocks.push({data:text, isText:true, range: new Range(startPos, textEndPos)});
				startPos = textEndPos;
				text = itemMatch[2];
				const itemEndPos = new Position(i, startPos.character + itemMatch[2].length);
				blocks.push({data:text, isText:false, range: new Range(startPos, itemEndPos)});
				startPos = itemEndPos;
				text = itemMatch[3];
				const endMatchItem = text.match(endPattern);
				if(endMatchItem) {
					text = endMatchItem[1];
					const endEndPos = new Position(i, startPos.character + endMatchItem[1].length);
					blocks.push({data:text, isText:true, range: new Range(startPos, endEndPos)});
					return blocks;
				}
			} else if(endMatch) {
				text = text.concat('\n',endMatch[1]);
				const endEndPos = new Position(i, endMatch[1].length);
				blocks.push({data:text, isText:true, range: new Range(startPos, endEndPos)});
				return blocks;
			} else {
				text = text.concat('\n',lineText);
			}
		}
		if(text !== "") {
			window.showErrorMessage("Bad parsing of blocks");
		}
		return blocks;
	}

	public updateBlock(blockNumber:number, edit:any) {
		var blocks = this.getDocumentBlocks();
		if(blockNumber < blocks.length) {
			if(blocks[blockNumber].isText && typeof edit === 'string') {
				const change = new WorkspaceEdit();
				change.replace(this.document.uri, blocks[blockNumber].range, edit);
				workspace.applyEdit(change);
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
	public getHtml(webview?: Webview, editBlockNumber?:number):string {
		if(this.data === undefined) {
			return '<H1>Invalid document</H1>';
		}
		markdown.SmoresHeading.clear();
		const blocks = this.getDocumentBlocks();
		let divHtml = "";
		if(webview) {
			divHtml = divHtml.concat(`
<div class=webviewDiv>`);
		}
		for(let i=0; i < blocks.length; i++) {
			if(blocks[i].isText) {
				divHtml = divHtml.concat(this.getTextDivHtml(blocks[i].data, i, editBlockNumber));
			} else {
				divHtml = divHtml.concat(this.getItemHtml(blocks[i].data, i, webview, editBlockNumber));
			}
		}
		if(webview) {
			divHtml = divHtml.concat(`
</div>`);
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
	private getItemHtml(itemText:string, blockNumber:number, webview?:Webview, editBlockNumber?:number) {
		if(itemText === undefined) {return "<h3>Invalid Doors-Smores node found</h3>";}
		const itemId = this.getIdFromItemText(itemText);
		if(itemId === undefined) {return "<h3>Invalid Doors-Smores node found</h3>";}
		if(editBlockNumber !== undefined && blockNumber === editBlockNumber) {
			const html = SmoresContent.getEditHtml(this, itemId, webview);
			return this.getBlockDiv(html, blockNumber);
		} else {
			const html = SmoresContent.getHtml(this, itemId, webview);
			return this.getBlockDiv(html, blockNumber);
		}
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