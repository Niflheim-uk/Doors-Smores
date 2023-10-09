import { Position, Range, TextDocument, TextLine, Webview, WorkspaceEdit, window, workspace } from 'vscode';
import { FileIO } from './fileIO';
import * as schema from './schema';
import { SmoresContent } from './smoresContent';
import * as markdown from '../interface/markdownConversion';
import { HTML } from '../interface/html';
import { dirname, join, relative } from 'path';
import { existsSync } from 'fs';

export interface SmoresDocumentBlock {
	data:string,
	isText:boolean,
	range:Range
};
interface MatchesResult {
	blocks:SmoresDocumentBlock[];
	remainingText:string;
	newPosition:Position;
	endDetected:boolean;
}
export class SmoresDocument {
	static readonly itemPattern = /(\n)*(.*)(\[SMORES\.[^\]]+\])(.*)/;
	static readonly endPattern = /(\n)*(.*)<\/text>/;
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
	public static generateNewDocument(docInfo:schema.DocumentInfo, projectFilepath:string) {
		const projectRoot = dirname(projectFilepath);
		const docPath = join(projectRoot, docInfo.relativePath);
		if(existsSync(docPath)) { return false;}
		const docRoot = dirname(docPath);
		const relProjPath = relative(docRoot, projectFilepath);
		const newData:schema.SmoresDocumentData = {
			relativeProjectPath: relProjPath,
			type: docInfo.type,
			name: docInfo.name,
			history: {
				document: { revision: [] },
				traceReport: { revision: [] }
			},
			content: {
				id:[],
				text: ""
			}
		};
		FileIO.writeXmlFile(docPath, newData, 'document');
		return true;
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
	private getMatches(testText:string, testStartPos:Position, bufferText:string, bufferStartPos:Position):MatchesResult {
		const itemMatch = testText.match(SmoresDocument.itemPattern);
		let blocks:SmoresDocumentBlock[] = [];
		if(itemMatch) {
			const preamble = `${itemMatch[1]}${itemMatch[2]}`;
			const item = itemMatch[3];
			const epilogue = itemMatch[4];
			const pos0 = new Position(testStartPos.line, testStartPos.character + preamble.length);
			if(preamble.length > 0) {
				const block0:SmoresDocumentBlock = {
					data:bufferText.concat(preamble),
					isText:true,
					range: new Range(bufferStartPos, pos0)
				};
				blocks.push(block0);
			}
			const pos1 = new Position(pos0.line, pos0.character + item.length);
			const block1:SmoresDocumentBlock = {
				data:item,
				isText:false,
				range: new Range(pos0, pos1)
			};
			blocks.push(block1);
			if(epilogue.length > 0) {
				const endBlocks = this.matchesEnd(epilogue, pos1, "", pos1);
				if(endBlocks) {
					return {
						blocks:[...blocks, ...endBlocks.blocks], 
						remainingText:endBlocks.remainingText, 
						newPosition:endBlocks.newPosition,
						endDetected:true
					};
				}
			}
			return {
				blocks:[...blocks],
				remainingText:epilogue,
				newPosition:pos1,
				endDetected:false
			};
		} 

		const endBlocks = this.matchesEnd(testText, testStartPos, bufferText, bufferStartPos);
		if(endBlocks) {
			return {
				blocks:[...blocks, ...endBlocks.blocks], 
				remainingText:endBlocks.remainingText, 
				newPosition:endBlocks.newPosition,
				endDetected:true
			};
		} else {
			return {
				blocks:[],
				remainingText:bufferText.concat(testText),
				newPosition:bufferStartPos,
				endDetected:false
			};
		}
	}
	private matchesEnd(testText:string, testStartPos:Position, bufferText:string, bufferStartPos:Position):MatchesResult|undefined {
		const endMatch = testText.match(SmoresDocument.endPattern);
		if(endMatch) {
			if(endMatch[1].length > 0) {
				let result = this.getMatches(endMatch[1], testStartPos, bufferText, bufferStartPos);
				let endBlocks:SmoresDocumentBlock[] = result.blocks;
				let endPos = result.newPosition;
				if(result.remainingText) {
					endPos = new Position(result.newPosition.line, result.newPosition.character + result.remainingText.length);
					const endBlock:SmoresDocumentBlock = {
						data:result.remainingText,
						isText:true,
						range: new Range(result.newPosition, endPos)
					};
					endBlocks.push(endBlock);
				}
				return {
					blocks: endBlocks,
					remainingText: "",
					newPosition: endPos,
					endDetected: true
				};
			} else {
				return {
					blocks: [],
					remainingText: "",
					newPosition: testStartPos,
					endDetected: true				
				};
			}
		}
		return undefined;
	}
	public getDocumentBlocks():SmoresDocumentBlock[] {
		let blocks:SmoresDocumentBlock[] = [];
		let {text, startPos} = this.getTextStart();
		let result = this.matchesEnd(text, startPos, "", startPos);
		if(result !== undefined) {
			if(result.blocks[0].data === "") {
				result.blocks[0].data = "Empty document";
				const endLine = result.blocks[0].range.end.line;
				const endCharacter = result.blocks[0].range.end.character + result.blocks[0].data.length;
				result.blocks[0].range = new Range(result.blocks[0].range.start, new Position(endLine, endCharacter));
			}
			return result.blocks;
		}
		for(let i=startPos.line+1; i<this.document.lineCount; i++) {
			const lineText = `\n${this.document.lineAt(i).text}`;
			const linePosition = new Position(i, 0);
			let result = this.getMatches(lineText, linePosition, text, startPos);
			if(result) {
				blocks.push(...result.blocks);
				text = result.remainingText;
				startPos = result.newPosition;
				if(result.endDetected) {
					return blocks;
				}
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
		window.showInformationMessage("Need to implement updateItem");
	}
	public getHtml(editBlocks:number[], webview?: Webview):string {
		if(this.data === undefined) {
			return '<H1>Invalid document</H1>';
		}
		markdown.SmoresHeading.clear();
		const blocks = this.getDocumentBlocks();
		let divHtml = "";
		if(webview) {
			divHtml = divHtml.concat(`
<div id="webviewDiv" class="webviewDiv">`);
		}
		for(let i=0; i < blocks.length; i++) {
			if(blocks[i].isText) {
				divHtml = divHtml.concat(this.getTextDivHtml(blocks[i].data, i, editBlocks.includes(i)));
			} else {
				divHtml = divHtml.concat(this.getItemHtml(blocks[i].data, i, editBlocks.includes(i), webview));
			}
		}
		if(webview) {
			divHtml = divHtml.concat(`
</div>`);
		}
		return divHtml;
	}
	private getTextDivHtml(divText:string, blockNumber:number, editing:boolean) {
		if(editing) {
			return this.getEditDivHtml(divText, blockNumber);
		} else {
			const html = markdown.getBodyHtmlFromMd(divText);
			return HTML.getBlockDiv(html, blockNumber);
		}
	}
	private getEditDivHtml(divText:string, blockNumber:number) {
		const html = HTML.getAutogrowDivHtml(divText, blockNumber);
		return HTML.getBlockDiv(html, blockNumber);
	}
	private getItemHtml(itemText:string, blockNumber:number, editing:boolean, webview?:Webview) {
		if(itemText === undefined) {return "<h3>Invalid Doors-Smores node found</h3>";}
		const itemId = this.getIdFromItemText(itemText);
		if(itemId === undefined) {return "<h3>Invalid Doors-Smores node found</h3>";}
		if(editing) {
			const html = SmoresContent.getEditHtml(this, itemId, blockNumber, webview);
			return HTML.getBlockDiv(html, blockNumber);
		} else {
			const html = SmoresContent.getHtml(this, itemId, webview);
			return HTML.getBlockDiv(html, blockNumber);
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