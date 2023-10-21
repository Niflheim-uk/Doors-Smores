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
enum LineMatch {
	text=-1,
	startText=-2,
	endText=-3,
};
interface MatchesResult {
	blocks:SmoresDocumentBlock[];
	endDetected:boolean;
}
export class SmoresDocument {
	static readonly itemPattern = /\[SMORES\.ID\.(\d+)\]/;
	static readonly itemPatternKnownLength = 12;
	static readonly endPattern = /<\/text>/;
	static readonly endPatternLength = 7;
	static readonly startPattern = /<text>/;
	static readonly startPatternLength = 6;
	private startFound = false;
	private unmatchedLinesOfText:string[] = [];
	private unmatchedStartPosition:Position;

	public data:schema.SmoresDocumentData|undefined;
	constructor(public document:TextDocument) {
    this.data = this.getData();
		this.unmatchedStartPosition = new Position(0,0);
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
	private getUnmatchedText(newText:string):string {
		let unmatchedText = "";
		let i = 0;
		for(;i<this.unmatchedLinesOfText.length; i++) {
			if(i > 0) {
				unmatchedText += "\n";
			}
			unmatchedText += this.unmatchedLinesOfText[i];
		}
		this.unmatchedLinesOfText = [];
		if(i > 0 && newText.length > 0) {
			unmatchedText += "\n";
		}
		unmatchedText += newText;
		return unmatchedText;
	}
	private matchLineSection(text:string):LineMatch|number {
		if(text.match(SmoresDocument.startPattern)) {
			return LineMatch.startText;
		} else if(text.match(SmoresDocument.endPattern)) {
			return LineMatch.endText;
		} else {
			const match = text.match(SmoresDocument.itemPattern);
			if(match) {
				return Number(match[1]);
			} else {
				return LineMatch.text;
			}
		}
	}

	private getEndBlock(testText:string, textLine:number, textChar:number) {
		let preEndText = "";
		if(testText.length - SmoresDocument.endPatternLength > 0) {
			preEndText = testText.slice(0, testText.length - SmoresDocument.endPatternLength);
		}
		const textBeforeEnd = this.getUnmatchedText(preEndText);
		if(textBeforeEnd.length === 0) {
			return undefined;
		}
		const endTextStartPos = new Position(textLine, textChar - SmoresDocument.endPatternLength+1);
		const block0:SmoresDocumentBlock = {
			data:textBeforeEnd,
			isText:true,
			range: new Range(this.unmatchedStartPosition, endTextStartPos)
		};
		return block0;
	}
	private getTextBlockBeforeItem(testText:string, id:number, line:number, lastItemChar:number, previousLineLength:number) {
		const idText = SmoresContent.getLinkText(id);
		const preItemTextLength = testText.length - idText.length;
		const preItemText = testText.slice(0, preItemTextLength);
		const textBeforeItem = this.getUnmatchedText(preItemText);
		let textEndPosition = new Position(line-1, previousLineLength);
		if(lastItemChar >= idText.length) {
			textEndPosition = new Position(line, lastItemChar - idText.length +1);
		}
		const block0:SmoresDocumentBlock = {
			data:textBeforeItem,
			isText:true,
			range: new Range(this.unmatchedStartPosition, textEndPosition)
		};
		return block0;
	}
	private getItemBlock(id:number, line:number, endChar:number, lineLength:number) {
		const idText = SmoresContent.getLinkText(id);
		const itemStartPosition = new Position(line, endChar - idText.length + 1);
		const itemEndPosition = new Position(itemStartPosition.line, itemStartPosition.character + idText.length);
		let newTextPosition = new Position(itemEndPosition.line, itemEndPosition.character + 1);
		if(newTextPosition.character >= lineLength) {
			newTextPosition = new Position(itemEndPosition.line+1, 0);
		}
		const block0:SmoresDocumentBlock = {
			data:`${id}`,
			isText:false,
			range: new Range(itemStartPosition, itemEndPosition)
		};
		this.unmatchedStartPosition = newTextPosition;
		return block0;
	}
	private getMatches(inputText:string, inputTextLine:number, lineLength:number, previousLineLength:number):MatchesResult {
		let testText = "";
		let blocks:SmoresDocumentBlock[] = [];
		for(let i=0; i<inputText.length; i++) {
			testText += inputText[i];
			const result = this.matchLineSection(testText);
			switch(result) {
			case LineMatch.endText:
				const blockEnd = this.getEndBlock(testText, inputTextLine, i);
				if(blockEnd !== undefined && blockEnd.data.length > 0 && this.startFound) {
					blocks.push(blockEnd);
				}
				return {
					blocks,
					endDetected: true
				};
			case LineMatch.startText:
				this.startFound = true;
				this.unmatchedLinesOfText = [];
				this.unmatchedStartPosition = new Position(inputTextLine, i+1);
				testText = "";
				break;
			case LineMatch.text:
				break;
			default: // returned an item id number
				const blockText = this.getTextBlockBeforeItem(testText, result, inputTextLine, i, previousLineLength);
				if(blockText.data.length > 0 && this.startFound) {
					blocks.push(blockText);
				}
				const blockItem = this.getItemBlock(result, inputTextLine, i, lineLength);
				if(blockItem.data.length > 0 && this.startFound) {
					blocks.push(blockItem);
				}
				testText = "";
				break;
			}
		}
		if(testText.length) {
			this.unmatchedLinesOfText.push(testText);
		}
		return {
			blocks,
			endDetected:false
		};
	}

	public getDocumentBlocks():SmoresDocumentBlock[] {
		let blocks:SmoresDocumentBlock[] = [];
		this.startFound = false;
		let previousLineLength = 0;
		for(let i=0; i<this.document.lineCount; i++) {
			const lineText = `${this.document.lineAt(i).text}`;
			let result = this.getMatches(lineText, i, lineText.length, previousLineLength);
			previousLineLength = lineText.length;
			blocks.push(...result.blocks);
			if(result.endDetected) {
				console.log(blocks);
				return blocks;
			}
		}
		if(this.unmatchedLinesOfText.length !== 0) {
			window.showErrorMessage("Bad parsing of blocks");
		}
		return blocks;
	}

	public updateBlock(blockNumber:number, edit:any):boolean {
		var closeEditblock = false;
		var blocks = this.getDocumentBlocks();
		const nBlocksBeforeEdit = blocks.length;
		if(blockNumber < blocks.length && blockNumber >= 0) {
			if(blocks[blockNumber].isText && typeof edit === 'string') {
				const change = new WorkspaceEdit();
				change.replace(this.document.uri, blocks[blockNumber].range, edit);
				workspace.applyEdit(change);
				blocks = this.getDocumentBlocks();
				if(blocks.length < nBlocksBeforeEdit) {
					closeEditblock = true;
				}
			} else {
				const itemId = this.getIdFromItemText(blocks[blockNumber].data);
				if(itemId && edit !== undefined) {
					this.updateItem(itemId, edit);
				}
			}
		}
		return closeEditblock;
	}
	public addTextBeforeBlock(blockNumber:number, newText:string) {
		var addEditblock = false;
		var blocks = this.getDocumentBlocks();
		if(blockNumber < blocks.length && blockNumber >= 0) {
			if(blocks[blockNumber].isText === false && blocks[blockNumber-1].isText === false) {
				const change = new WorkspaceEdit();
				change.insert(this.document.uri, blocks[blockNumber].range.start, newText);
				addEditblock = true;
				workspace.applyEdit(change);
			}
		}
		return addEditblock;
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
	private getIdFromItemText(itemNumber:string):number|undefined {
		const convNumber = Number(itemNumber);
		if(!Number.isNaN(convNumber) && typeof convNumber === 'number') {
			return convNumber;
		}
		return undefined;
	}
	private addItemToTextBlock(item:SmoresContent, blockNumber:number) {

	}
}