import { CancellationToken, CustomTextEditorProvider, Disposable, TextDocument, WebviewPanel, window, workspace } from 'vscode';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, rmdirSync } from 'fs';
import { basename, dirname, join, relative } from 'path';
import * as schema from '../model/schema';
import { RevisionHistoryData, DocumentInfo, SmoresProjectData, SmoresDocumentData, SmoresContentData } from '../model/schema';
import { FileIO } from '../model/fileIO';

interface OldProjectDataModel {
  idBase: number;
  gitInUse: boolean;
  repoRoot?: string;
  repoPathspec?: string;
  repoRemote?: string;
  maxContributors: number;
  knownContributors: string[];
  uniqueIds: number[];
  documentIds: number[];
}
interface DocumentData {
  documentType: string;
  revisionHistory:RevisionHistoryData[];
  traceReportRevisionHistory:RevisionHistoryData[];
}
interface RequirementData {
  translationRationale: string;
}
interface TestData {
  expectedResults: string;
}
export interface OldDocumentNodeData {
  id: number;
  parent: number;
  category: string;
  text: string;
  traces: {
		traceIds:number[];
		suspectIds:number[];	
	}
  children: number[];
  documentData?: DocumentData;
	requirementData?:RequirementData;
  testData?:TestData;
}

export enum SmoresConverterResult {
	success,
	failure,
	noAction
}
export class SmoresConverter {

	constructor() {}

	public convert(projectDocument:TextDocument) {
		var result = SmoresConverterResult.noAction;
		let projectJS = ConverterFileIO.parseProjectRawXml(projectDocument.getText());
		if(projectJS === undefined) {
			result = this.convertProjectJS(projectDocument);
		}
		return result;
	}
	private convertProjectJS(src:TextDocument) {
		const oldData:OldProjectDataModel = JSON.parse(src.getText());
		var result = SmoresConverterResult.success;
		if(oldData.repoRemote === undefined) {
			oldData.repoRemote = "";
		}
		if(oldData.repoRoot === undefined) {
			oldData.repoRoot = dirname(src.fileName);
		}
		if(oldData.repoPathspec === undefined) {
			oldData.repoPathspec = ".";
		}
		var documentInfo:DocumentInfo[] = [];
		for(let i=0; i<oldData.documentIds.length; i++) {
			const docId = oldData.documentIds[i];
			const [docResult, docInfo] = this.convertDocument(src.fileName, docId);
			if(docResult === SmoresConverterResult.failure) {
				return docResult;
			}
			documentInfo.push(docInfo);
		}
		var repoRelativeRoot = relative(dirname(src.fileName), oldData.repoRoot);
		if(repoRelativeRoot === '') {
			repoRelativeRoot = './';
		}
		const newData:SmoresProjectData = {
			dataVersion: 1,
			repository: {
				relativeRoot: repoRelativeRoot,
				remote: oldData.repoRemote,
				pathspec: oldData.repoPathspec
			},
			contributors: {
				max: oldData.maxContributors,
				id: oldData.knownContributors
			},
			data: {
				relativeRoot: "./.smoresData",
				documents: { document: documentInfo },
				uniqueIds: {
					idBase: oldData.idBase,
					id: oldData.uniqueIds
				}
			}
		};
		ConverterFileIO.writeXmlFile(src.fileName, newData, 'project');
		return result;
	}
	private convertDocument(projPath:string, docId:number):[SmoresConverterResult, DocumentInfo] {
		let result = SmoresConverterResult.success;
		const name = ConverterFileIO.getDocumentNameFromText(projPath, docId);
		const outputFilename = `${name}.smores`;
		const relPath = `./${outputFilename}`;
		let docType='unknown';
		try {
			const oldData = ConverterFileIO.getDocumentNodeJson(projPath, docId);
			const outputFilepath = join(dirname(projPath), outputFilename);
			docType = oldData.documentData!.documentType;
			var newChildren:number[] = [];
			var newText:string = "";
			[newText, newChildren] = this.extractChildrenAndText(projPath, outputFilename, oldData.children, newText, newChildren, 1);
		
			const newData:SmoresDocumentData = {
				relativeProjectPath: `./${basename(projPath)}`,
				type: docType,
				name: name,
				history: {
					document: {
						revision: oldData.documentData!.revisionHistory
					},
					traceReport: {
						revision: oldData.documentData!.traceReportRevisionHistory
					}
				},
				content: {
					id: newChildren,
					text: newText
				}
			};
			ConverterFileIO.writeXmlFile(outputFilepath, newData, 'document');
			const contentRoot = ConverterFileIO.getContentDir(projPath, docId);
			rmSync(contentRoot, {recursive:true, force:true});
		} catch(err) {
			result = SmoresConverterResult.failure;	
		}
		const docInfo:DocumentInfo = {
			name,
			relativePath:relPath,
			type: docType
		};
		return [result, docInfo];
	}
	private convertContent(projPath:string, docFilename:string, itemId:number) {
		const outputFilename = `${itemId}.smores-item`;
		const contentRoot = ConverterFileIO.getContentDir(projPath, itemId);
		const outputFilepath = join(ConverterFileIO.getDataDir(projPath), outputFilename);

		let result = SmoresConverterResult.success;
		try {
			const oldData = ConverterFileIO.getDocumentNodeJson(projPath, itemId);
			const oldText = ConverterFileIO.getContentText(projPath, itemId);
			const oldTR = ConverterFileIO.getContentTR(projPath, itemId);
			const oldER = ConverterFileIO.getContentER(projPath, itemId);
			let newText = "";
			let newTR = "";
			let newER = "";
			let newRP = "";
			let newCap = "";
			switch(oldData.category) {
			case schema.userFRCategory:
			case schema.softFRCategory:
			case schema.archFRCategory:
			case schema.desFRCategory:
			case schema.userNFRCategory:
			case schema.softNFRCategory:
			case schema.archNFRCategory:
			case schema.desNFRCategory:
			case schema.userDCCategory:
			case schema.softDCCategory:
			case schema.archDCCategory:
			case schema.desDCCategory:
				newText = oldText;
				newTR = oldTR;
				break;
			case schema.userTestCategory:
			case schema.softTestCategory:
			case schema.archTestCategory:
			case schema.desTestCategory:
				newText = oldText;
				newER = oldER;
				break;
			case schema.imageCategory:
				const oldFilename = oldText.split('\n')[0];
				const oldFilenameParts = oldFilename.split('.');
				const extension = oldFilenameParts[oldFilenameParts.length - 1];
				const newFilename = `${itemId}.${extension}`;
				newRP = `./images/${newFilename}`;
				ConverterFileIO.copyFile(contentRoot, oldFilename, join('..', 'images', newFilename));
				newCap = 'Enter image caption';
			case schema.mermaidCategory:
				newText = oldText;
				newCap = 'Enter image caption';
				break;
			}
			const newData:SmoresContentData = {
				relativeProjectPath: `../${basename(projPath)}`,
				relativeDocumentPath: `../${docFilename}`,
				category: oldData.category,
				id: oldData.id,
				traceData: {
					traces: { id: oldData.traces.traceIds },
					suspects: { id: oldData.traces.suspectIds }
				},
				content: {
					text: newText,
					translationRationale: newTR,
					expectedResults: newER,
					relativePath: newRP,
					caption: newCap
				}
			};
			ConverterFileIO.writeXmlFile(outputFilepath, newData, 'item');
		} catch(err) {
			result = SmoresConverterResult.failure;
		}
		return result;
	}

	private extractChildrenAndText(projectFilepath:string, documentFilename:string, children:number[], text:string, knownChildren:number[], depth:number):[string, number[]] {
		if(children !== undefined) {
			for(let i=0; i < children.length; i++) {
				[text, knownChildren] = this.extractChild(projectFilepath, documentFilename, children[i], text, knownChildren, depth);
			}
		}
		return [text, knownChildren];
	}
	private extractChild(projectFilepath:string, documentFilename:string, childId:number, text:string, knownChildren:number[], depth:number):[string, number[]] {
		const oldData:OldDocumentNodeData = ConverterFileIO.getContentJson(projectFilepath, childId);
		const oldText = ConverterFileIO.getContentText(projectFilepath, childId);
		const contentRoot = ConverterFileIO.getContentDir(projectFilepath, childId);
		switch(oldData.category) {
		case schema.headingCategory:
			let mdBangs = "";
			let bangs = 0;
			while(bangs < depth) {
				mdBangs = mdBangs.concat("#");
				bangs++;
			}
			text = text.concat(`${mdBangs} ${oldText}\n`);
			rmSync(contentRoot, {recursive:true, force:true});
			return this.extractChildrenAndText(projectFilepath, documentFilename, oldData.children, text, knownChildren, depth+1);
		case schema.commentCategory:
			text = text.concat(`${oldText}\n`);
			rmSync(contentRoot, {recursive:true, force:true});
			return this.extractChildrenAndText(projectFilepath, documentFilename, oldData.children, text, knownChildren, depth+1);
		case schema.userFRCategory:
		case schema.softFRCategory:
		case schema.archFRCategory:
		case schema.desFRCategory:
		case schema.userNFRCategory:
		case schema.softNFRCategory:
		case schema.archNFRCategory:
		case schema.desNFRCategory:
		case schema.userDCCategory:
		case schema.softDCCategory:
		case schema.archDCCategory:
		case schema.desDCCategory:
		case schema.userTestCategory:
		case schema.softTestCategory:
		case schema.archTestCategory:
		case schema.desTestCategory:
		case schema.imageCategory:
		case schema.mermaidCategory:
			text = text.concat(`[SMORES.ID.${oldData.id}]\n`);
			knownChildren.push(oldData.id);
			this.convertContent(projectFilepath, documentFilename, oldData.id);
			rmSync(contentRoot, {recursive:true, force:true});
			return this.extractChildrenAndText(projectFilepath, documentFilename, oldData.children, text, knownChildren, depth+1);
		default:
			window.showErrorMessage("Unknown category found while converting data version");
		}
		return [text, knownChildren];
	}
}

class ConverterFileIO extends FileIO{
	constructor() {super();}

	private static getDataJson(projectFilepath:string, id:number):any {
		const filePath = join(ConverterFileIO.getContentDir(projectFilepath, id), `${id}.json`);
		const data = readFileSync(filePath, 'utf-8');
		return JSON.parse(data);	
	}
	public static getDataDir(projectFilepath:string) {
		return join(dirname(projectFilepath), '.smoresData');
	}
	public static getContentDir(projectFilepath:string, id:number) {
		return join(ConverterFileIO.getDataDir(projectFilepath), `${id}`);
	}
	public static getDocumentNodeJson(projectFilepath:string, id:number):OldDocumentNodeData {
		return this.getDataJson(projectFilepath, id);
	}
	public static getContentJson(projectFilepath:string, id:number):OldDocumentNodeData {
		return this.getDataJson(projectFilepath, id);
	}
	public static getContentText(projectFilepath:string, id:number):string {
		const docPath = join(ConverterFileIO.getContentDir(projectFilepath, id), `Text.txt`);
		return readFileSync(docPath, 'utf-8');
	}
	public static getContentTR(projectFilepath:string, id:number):string {
		const docPath = join(ConverterFileIO.getContentDir(projectFilepath, id), `TranslationRationale.txt`);
		if(existsSync(docPath)) {
			return readFileSync(docPath, 'utf-8');
		} 
		return "";
	}
	public static getContentER(projectFilepath:string, id:number):string {
		const docPath = join(ConverterFileIO.getContentDir(projectFilepath, id), `ExpectedResults.txt`);
		if(existsSync(docPath)) {
			return readFileSync(docPath, 'utf-8');
		} 
		return "";
	}
	public static getDocumentNameFromText(projectFilepath:string, id:number):string {
		const data = ConverterFileIO.getContentText(projectFilepath, id);
		return data.split('\n')[0];
	}
	public static copyFile(commonBase:string, srcRelPath:string, destRelPath:string) {
		const srcPath = join(commonBase, srcRelPath);
		const destPath = join(commonBase, destRelPath);
		const destRoot = dirname(destPath);
		if(!existsSync(destRoot)) {
			mkdirSync(destRoot, {recursive:true});
		}
		copyFileSync(srcPath, destPath);
	}
}