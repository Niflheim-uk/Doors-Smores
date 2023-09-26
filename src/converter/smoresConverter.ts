import { CancellationToken, CustomTextEditorProvider, Disposable, ExtensionContext, TextDocument, WebviewPanel, window, workspace } from 'vscode';
import { RevisionHistoryData, SmoresDocumentData } from '../model/smoresDocument';
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import { readFileSync, writeFileSync } from 'fs';
import { basename, dirname, join, relative } from 'path';
import * as schema from '../model/schema';


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
export interface TraceData {
  traceIds:number[];
  suspectIds:number[];
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
  documentData: {
		documentType: string;
		revisionHistory:RevisionHistoryData[];
		traceReportRevisionHistory:RevisionHistoryData[];
	}
}
interface DocumentInfo {
	name: string;
	relativePath: string;
}
interface SmoresProjectData {
	dataVersion:number;
	repository: {
		relativeRoot: string;
		pathspec: string;
		remote: string;
	}
	contributors: {
		max: number;
		id:string[];
	}
	data : {
		relativeRoot :string;
		documents : {
			document:DocumentInfo[];
		}
		uniqueIds: {
			id:number[];
		}
	}
}
enum SmoresConverterResult {
	success,
	failure,
	noAction
}
export class SmoresConverterProvider implements CustomTextEditorProvider {
	private static readonly viewType = 'doors-smores.smoresConverter';
	private fileIO:FileIO;

	public static register(): Disposable {
		const provider = new SmoresConverterProvider();
		const providerRegistration = window.registerCustomEditorProvider(SmoresConverterProvider.viewType, provider);
		return providerRegistration;
	}

	constructor() {
		this.fileIO = new FileIO();
	 }

	public async resolveCustomTextEditor(document: TextDocument,	webviewPanel: WebviewPanel, _token: CancellationToken): Promise<void> {
		// Setup initial content for the webview
		webviewPanel.webview.options = {
			enableScripts: true,
		};

		const result:SmoresConverterResult = this.convert(document);
		webviewPanel.webview.html = this.getHtmlForResult(result);

		const changeDocumentSubscription = workspace.onDidChangeTextDocument(e => {
			if (e.document.uri.toString() === document.uri.toString()) {
				const result:SmoresConverterResult = this.convert(document);
				webviewPanel.webview.html = this.getHtmlForResult(result);
					}
		});

		// Make sure we get rid of the listener when our editor is closed.
		webviewPanel.onDidDispose(() => {
			changeDocumentSubscription.dispose();
		});
	}

	private getHtmlForResult(result: SmoresConverterResult): string {
		let msg = "Failed to convert file.";
		if(result === SmoresConverterResult.success) {
			msg = "Completed conversion of file.";
		} else if (result === SmoresConverterResult.noAction) {
			msg = "File was already converted. No action taken";
		}
		return `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Doors Smores</title>
			</head>
			<body>
				<h1>${msg}</h1>
			</body>
			</html>`;
	}
	private convert(projectDocument:TextDocument) {
		var result = SmoresConverterResult.noAction;
		let projectJS = this.fileIO.parseProjectXml(projectDocument.getText());
		if(this.fileIO.isEmpty(projectJS)) {
			console.log('Project file is not xml');
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
			const docRoot = join(dirname(src.fileName), '.smoresData', `${docId}`);
			const [docResult, docName, docPath] = this.convertDocument(src.fileName, docId);
			if(docResult === SmoresConverterResult.failure) {
				return docResult;
			}
			documentInfo.push({name:docName, relativePath:docPath});
		}
		const newData:SmoresProjectData = {
			dataVersion: 1,
			repository: {
				relativeRoot:relative(dirname(src.fileName), oldData.repoRoot),
				remote:oldData.repoRemote,
				pathspec:oldData.repoPathspec
			},
			contributors: {
				max:oldData.maxContributors,
				id:oldData.knownContributors
			},
			data: {
				relativeRoot: "./smoresData",
				documents:{document:documentInfo},
				uniqueIds: {
					id: oldData.uniqueIds
				}
			}
		};
		const outputFilepath = join(dirname(src.fileName), `${basename(src.fileName, '.smores-project')}2.smores-project`);
		console.log(src.fileName);
		console.log(outputFilepath);
		this.fileIO.writeXmlFile(outputFilepath, newData, 'project');
		console.log(newData);
		return result;
	}
	private convertDocument(projPath:string, docId:number):[SmoresConverterResult, string, string] {
		let result = SmoresConverterResult.success;
		const oldData = this.fileIO.getDocumentJson(projPath, docId);
		const name = this.fileIO.getDocumentNameFromText(projPath, docId);
		const outputFilename = `${name}.smores`;
		const outputFilepath = join(dirname(projPath), outputFilename);
		const relPath = `./${outputFilename}`;
		var newChildren:number[] = [];
		var newText:string = "";
		[newText, newChildren] = this.extractChildrenAndText(projPath, oldData.children, newText, newChildren, 1);
	
		const newData:SmoresDocumentData = {
			relativeProjectPath: `./${basename(projPath)}`,
			type: oldData.documentData.documentType,
			name: name,
			history: {
				document: {
					revision: oldData.documentData.revisionHistory
				},
				traceReport: {
					revision: oldData.documentData.traceReportRevisionHistory
				}
			},
			content: {
				id: newChildren,
				text: newText
			}
		};
		this.fileIO.writeXmlFile(outputFilepath, newData, 'document');
		return [result, name, relPath];
	}

	private extractChildrenAndText(projectFilepath:string, children:number[], text:string, knownChildren:number[], depth:number):[string, number[]] {
		if(children !== undefined) {
			for(let i=0; i < children.length; i++) {
				[text, knownChildren] = this.extractChild(projectFilepath, children[i], text, knownChildren, depth);
			}
		}
		return [text, knownChildren];
	}
	private extractChild(projectFilepath:string, childId:number, text:string, knownChildren:number[], depth:number):[string, number[]] {
		const oldData:OldDocumentNodeData = this.fileIO.getContentJson(projectFilepath, childId);
		const oldText = this.fileIO.getContentText(projectFilepath, childId);
		switch(oldData.category) {
		case schema.headingCategory:
			let mdBangs = "";
			let bangs = 0;
			while(bangs < depth) {
				mdBangs = mdBangs.concat("#");
				bangs++;
			}
			text = text.concat(`${mdBangs} ${oldText}\n`);
			return this.extractChildrenAndText(projectFilepath, oldData.children, text, knownChildren, depth+1);
		case schema.commentCategory:
			text = text.concat(`${oldText}\n`);
			return this.extractChildrenAndText(projectFilepath, oldData.children, text, knownChildren, depth+1);
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
			return this.extractChildrenAndText(projectFilepath, oldData.children, text, knownChildren, depth+1);
		default:
			window.showErrorMessage("Unknown category found while converting data version");
		}
		return [text, knownChildren];
	}
}

class FileIO {
	private parser:XMLParser;

	constructor() {
		const parserOptions = {ignorePiTags:true};
		this.parser = new XMLParser(parserOptions);
	}
	public parseProjectXml(rawXml:string) {
		const jsObject = this.parser.parse(rawXml);
		return jsObject;
	}
	private parseDocumentXml(rawXml:string) {
		const jsObject = this.parser.parse(rawXml);
		return jsObject;
	}
	public readXmlDocumentFile(filepath:string) {
		const rawXml = readFileSync(filepath, 'utf-8');
		return this.parseDocumentXml(rawXml);
	}
	public writeXmlFile(filepath:string, jsObject:any, baseNode:string) {
		const xml = this.getXml(jsObject, baseNode);
		writeFileSync(filepath, xml);
	}
	public isEmpty(obj:any) {
    return Object.keys(obj).length === 0;
	}
	private getDataJson(projectFilepath:string, id:number):any {
		const filePath = join(this.getContentDir(projectFilepath, id), `${id}.json`);
		const data = readFileSync(filePath, 'utf-8');
		return JSON.parse(data);	
	}
	public getContentDir(projectFilepath:string, id:number) {
		return join(dirname(projectFilepath), '.smoresData', `${id}`);
	}
	public getDocumentJson(projectFilepath:string, id:number):OldDocumentNodeData {
		return this.getDataJson(projectFilepath, id);
	}
	public getContentJson(projectFilepath:string, id:number):OldDocumentNodeData {
		return this.getDataJson(projectFilepath, id);
	}
	public getContentText(projectFilepath:string, id:number):string {
		const docPath = join(this.getContentDir(projectFilepath, id), `text.txt`);
		return readFileSync(docPath, 'utf-8');
	}
	public getDocumentNameFromText(projectFilepath:string, id:number):string {
		const data = this.getContentText(projectFilepath, id);
		return data.split('\n')[0];
	}

	private getXml(jsObject:any, baseNode:string) {
		const builder = new XMLBuilder({format:true, arrayNodeName:`${baseNode}`});
		return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ${baseNode}>
${builder.build([jsObject])}
`;
	}
}