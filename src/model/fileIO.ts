import { XMLParser, XMLBuilder } from "fast-xml-parser";
import { existsSync, readFile, readFileSync, writeFileSync } from 'fs';
import { window } from "vscode";
import { DocumentInfo, RevisionHistoryData, SmoresContentData, SmoresDocumentData, SmoresProjectData, unknown } from "./schema";
import { SmoresDocument } from "./smoresDocument";
import { dirname, join } from "path";


export class FileIO {
	private static readonly parserOptions = {ignorePiTags:true};

	constructor() {}
	
	private static parseXml(rawXml:string) {
		const parser = new XMLParser(FileIO.parserOptions);
		return parser.parse(rawXml);
	}
	private static storeAsArray(data:any):any[] {
		if(Array.isArray(data)) {
			return data;
		} else {
			return [data];
		}
	}
	public static parseProjectRawXml(rawXml:string, fix:boolean=true):SmoresProjectData|undefined {
		const jsObject = FileIO.parseXml(rawXml);
		const data = FileIO.parseProjectObject(jsObject);
		if(data) {
			return FileIO.validateProjectData(data, fix);
		}
		return undefined;
	}
	public static parseDocumentRawXml(rawXml:string, fix:boolean=true):SmoresDocumentData|undefined {
		const jsObject = FileIO.parseXml(rawXml);
		const data = FileIO.parseDocumentObject(jsObject);
		if(data) {
			return FileIO.validateDocumentData(data, fix);
		}
		return undefined;
	}
	public static parseContentRawXml(rawXml:string, fix:boolean=true):SmoresContentData|undefined {
		const jsObject = FileIO.parseXml(rawXml);
		const data = FileIO.parseContentObject(jsObject);
		if(data) {
			return FileIO.validateContentData(data, fix);
		}
		return undefined;
	}

	public static parseProjectObject(data:any):SmoresProjectData|undefined {
		try {
			let contributorData:string[] = [];
			if(data.project.contributors.id !== '' && data.project.contributors.id !== undefined) {
				contributorData = FileIO.storeAsArray(data.project.contributors.id);
			}
			let documentInfo:DocumentInfo[] = [];
			if(data.project.data.documents !== '' && data.project.data.documents.document !== undefined) {
				documentInfo = FileIO.storeAsArray(data.project.data.documents.document);
			}
			let idData:number[] = [];
			if(data.project.data.uniqueIds.id !== '' && data.project.data.uniqueIds.id !== undefined) {
				idData = FileIO.storeAsArray(data.project.data.uniqueIds.id);
			}
			const parsedData:SmoresProjectData = {
				dataVersion: data.project.dataVersion,
				repository: {
					relativeRoot: data.project.repository.relativeRoot,
					pathspec: data.project.repository.pathspec,
					remote: data.project.repository.remote,
				},
				contributors: {
					max: data.project.contributors.max,
					id: contributorData,
				},
				data: {
					relativeRoot: data.project.data.relativeRoot,
					documents: {
						document: documentInfo,
					},
					uniqueIds: {
						idBase: data.project.data.uniqueIds.idBase,
						id: idData
					}
				}
			};
			return parsedData;
		} catch (err) {
			window.showErrorMessage("Failed to parse object as SmoresProjectData");
    }
		return undefined;
	}
	public static parseDocumentObject(data:any):SmoresDocumentData|undefined {
		try {
			let revHistory:RevisionHistoryData[] = [];
			if(data.document.history.document !== '' && data.document.history.document.revision !== undefined) {
				revHistory = FileIO.storeAsArray(data.document.history.document.revision);
			}
			let trRevHistory:RevisionHistoryData[] = [];
			if(data.document.history.traceReport !== '' && data.document.history.traceReport.revision !== undefined) {
				trRevHistory = FileIO.storeAsArray(data.document.history.traceReport.revision);
			}
			let childId:number[] = [];
			if(data.document.content.id !== '' && data.document.content.id !== undefined) {
				childId = FileIO.storeAsArray(data.document.content.id);
			}
			const textData = data.document.content.text;
			const parsedData:SmoresDocumentData = {
				relativeProjectPath:data.document.relativeProjectPath,
				type:data.document.type,
				name:data.document.name,
				history:{
					document:{ revision:revHistory },
					traceReport:{ revision:trRevHistory }
				},
				content: {id:childId,	text:textData }
			};
			return parsedData;
		} catch (err) {
			window.showErrorMessage("Failed to parse object as SmoresDocumentData");
    }
		return undefined;
	}
	public static parseContentObject(data:any):SmoresContentData|undefined {
		try {
			let traceIds:number[] = [];
			if(data.item.traceData.traces !== '' && data.item.traceData.traces.id !== undefined) {
				traceIds = FileIO.storeAsArray(data.content.traceData.traces.id);
			}
			let suspectIds:number[] = [];
			if(data.item.traceData.suspects !== '' && data.item.traceData.suspects.id !== undefined) {
				suspectIds = FileIO.storeAsArray(data.item.traceData.suspects.id);
			}
			const parsedData:SmoresContentData = {
				relativeProjectPath: data.item.relativeProjectPath,
				relativeDocumentPath: data.item.relativeDocumentPath,
				category: data.item.category,
				id: data.item.id,
				traceData: {
					traces: { id:traceIds }, 
					suspects: { id: suspectIds }
				},
				content: {
					text: data.item.content.text,
					translationRationale: data.item.content.translationRationale,
					expectedResults: data.item.content.expectedResults,
					relativePath: data.item.content.relativePath,
					caption: data.item.content.caption
				}
			};
			return parsedData;
		} catch (err) {
			window.showErrorMessage("Failed to parse object as SmoresDocumentData");
    }
		return undefined;
	}
	private static isType(test:any, typeName:string) {
		if(test !== undefined && typeof test === typeName) {
			return true;
		}
		return false;
	}
	private static isDocumentInfo(test:any, arg:any) {
		if(FileIO.isType(test.name, 'string') && FileIO.isType(test.relativePath, 'string')) {
			return true;
		}
		return false;
	}
	private static isRevisionHistoryData(test:any, arg:any) {
		if(FileIO.isType(test.day, 'number') === false) { return false; }
		if(FileIO.isType(test.month, 'number') === false) { return false; }
		if(FileIO.isType(test.year, 'number') === false) { return false; }
		if(FileIO.isType(test.major, 'number') === false) { return false; }
		if(FileIO.isType(test.minor, 'number') === false) { return false; }
		if(FileIO.isType(test.detail, 'string') === false) { return false; }
		if(FileIO.isType(test.author, 'string') === false) { return false; }
		if(FileIO.isType(test.isMajor, 'boolean') === false) { return false; }
		return true;
	}
	private static validateNumber(test:any, fix:boolean, defaultVal:number):number|undefined {
		if(FileIO.isType(test, 'number')) {
			return test;
		} else if(fix) {
			return defaultVal;
		} else {
			return undefined;
		}
	}
	private static validateString(test:any, fix:boolean, defaultVal:string):string|undefined {
		if(FileIO.isType(test, 'string')) {
			return test;
		} else if(fix) {
			return defaultVal;
		} else {
			return undefined;
		}
	}
	private static validateArray(test:any, fix:boolean, testFunction: (test:any, arg:any) => boolean, testFunctionArg:any):any[]|undefined {
		let result:any[] = [];
		if(Array.isArray(test)) {
			const testArray:any[] = test;
			for(let i=0; i < testArray.length; i++) {
				if(testFunction(testArray[i], testFunctionArg)) {
					result.push(testArray[i]);
				} else {
					if(!fix) {
						return undefined;
					}
				}
			}
			return result;
		} else if(fix) {
			return result;
		} else {
			return undefined;
		}
	}
	private static validateNumberArray(test:any, fix:boolean) {
		return FileIO.validateArray(test, fix, FileIO.isType, 'number');
	}
	private static validateStringArray(test:any, fix:boolean):string[]|undefined {
		return FileIO.validateArray(test, fix, FileIO.isType, 'string');
	}
	private static validateDocumentInfoArray(test:any, fix:boolean):DocumentInfo[]|undefined {
		return FileIO.validateArray(test, fix, FileIO.isDocumentInfo, null);
	}
	private static validateRevisionHistoryDataArray(test:any, fix:boolean):RevisionHistoryData[]|undefined {
		return FileIO.validateArray(test, fix, FileIO.isRevisionHistoryData, null);
	}
	private static validateObject(test:any, fix:boolean):any|undefined {
		if(test) {
			return test;
		} else if(fix) {
			return {};
		} else {
			return undefined;
		}
	}
	private static validateProjectData(projData:SmoresProjectData, fix:boolean):SmoresProjectData|undefined {
		const dataVer = FileIO.validateNumber(projData.dataVersion, fix, 1);
		if(dataVer === undefined) {
			return undefined;
		}
		const repository = FileIO.validateObject(projData.repository, fix);
		if(repository === undefined) {
			return undefined;
		}
		const repoRelativeRoot = FileIO.validateString(repository.relativeRoot, fix, ".");
		if(repoRelativeRoot === undefined) {
			return undefined;
		}
		const repoPathspec = FileIO.validateString(repository.pathspec, fix, ".");
		if(repoPathspec === undefined) {
			return undefined;
		}
		const repoRemote = FileIO.validateString(repository.remote, fix, "");
		if(repoRemote === undefined) {
			return undefined;
		}
		const contributors = FileIO.validateObject(projData.contributors, fix);
		if(contributors === undefined) {
			return undefined;
		}
		const contMax = FileIO.validateNumber(contributors.max, fix, 100);
		if(contMax === undefined) {
			return undefined;
		}
		const contId = FileIO.validateStringArray(contributors.id, fix);
		if(contId === undefined) {
			return undefined;
		}
		const data = FileIO.validateObject(projData.data, fix);
		if(data === undefined) {
			return undefined;
		}
		const dataRelRoot = FileIO.validateString(data.relativeRoot, fix, "./.smoresData");
		if(dataRelRoot === undefined) {
			return undefined;
		}
		const documents = FileIO.validateObject(data.documents, fix);
		if(documents === undefined) {
			return undefined;
		} 
		const docInfo = FileIO.validateDocumentInfoArray(documents.document, fix);
		if(docInfo === undefined) {
			return undefined;
		}		
		const uniqueIds = FileIO.validateObject(data.uniqueIds, fix);
		if(uniqueIds === undefined) {
			return undefined;
		}
		const uniqueBase = FileIO.validateNumber(uniqueIds.idBase, fix, 10000);
		if(uniqueBase === undefined) {
			return undefined;
		}
		const uniqueId = FileIO.validateNumberArray(uniqueIds.id, fix);
		if(uniqueId === undefined) {
			return undefined;
		}
		const outputData:SmoresProjectData = {
			dataVersion: dataVer,
			repository: {
				relativeRoot: repoRelativeRoot,
				pathspec: repoPathspec,
				remote: repoRemote,
			},
			contributors: {
				max: contMax,
				id: contId,
			},
			data: {
				relativeRoot: dataRelRoot,
				documents: { document: docInfo },
				uniqueIds: {
					idBase: uniqueBase,
					id: uniqueId
				}
			}
		};
		return outputData;		
	}
	private static validateDocumentData(docData:SmoresDocumentData, fix:boolean):SmoresDocumentData|undefined {
		const relProjPath = FileIO.validateString(docData.relativeProjectPath, fix, './unknown.smores-project');
		if(relProjPath === undefined) {
			return undefined;
		}
		const docType = FileIO.validateString(docData.type, fix, unknown);
		if(docType === undefined) {
			return undefined;
		}
		const docName = FileIO.validateString(docData.name, fix, 'untitled');
		if(docName === undefined) {
			return undefined;
		}
		const history = FileIO.validateObject(docData.history, fix);
		if(history === undefined) {
			return undefined;
		}
		const documentHistory = FileIO.validateObject(history.document, fix);
		if(documentHistory === undefined) {
			return undefined;
		}
		const traceReportHistory = FileIO.validateObject(history.traceReport, fix);
		if(traceReportHistory === undefined) {
			return undefined;
		}
		const documentRevisions = FileIO.validateRevisionHistoryDataArray(documentHistory.revision, fix);
		if(documentRevisions === undefined) {
			return undefined;
		}
		const traceReportRevisions = FileIO.validateRevisionHistoryDataArray(traceReportHistory.revision, fix);
		if(traceReportRevisions === undefined) {
			return undefined;
		}
		const content = FileIO.validateObject(docData.content, fix);
		if(content === undefined) {
			return undefined;
		}
		const contentId = FileIO.validateNumberArray(content.id, fix);
		if(contentId === undefined) {
			return undefined;
		}
		const contentText = FileIO.validateString(content.text, fix, "");
		if(contentText === undefined) {
			return undefined;
		}

		const outputData:SmoresDocumentData = {
			relativeProjectPath: relProjPath,
			type: docType,
			name: docName,
			history: {
				document: { revision: documentRevisions },
				traceReport: { revision: traceReportRevisions }
			},
			content: {
				id: contentId,
				text: contentText
			}
		};
		return outputData;
	}
	private static validateContentData(itemData:SmoresContentData, fix:boolean):SmoresContentData|undefined {
		const relProjPath = FileIO.validateString(itemData.relativeProjectPath, fix, '../../unknown.smores-project');
		if(relProjPath === undefined) {
			return undefined;
		}
		const relDocPath = FileIO.validateString(itemData.relativeDocumentPath, fix, '../../untitled.smores');
		if(relDocPath === undefined) {
			return undefined;
		}
		const itemCategory = FileIO.validateString(itemData.category, fix, unknown);
		if(itemCategory === undefined) {
			return undefined;
		}
		const itemId = FileIO.validateNumber(itemData.id, fix, 0);
		if(itemId === undefined) {
			return undefined;
		}
		const traceData = FileIO.validateObject(itemData.traceData, fix);
		if(traceData === undefined) {
			return undefined;
		}
		const traces = FileIO.validateObject(traceData.traces, fix);
		if(traces === undefined) {
			return undefined;
		}
		const suspects = FileIO.validateObject(traceData.suspects, fix);
		if(suspects === undefined) {
			return undefined;
		}
		const traceIds = FileIO.validateNumberArray(traces.id, fix);
		if(traceIds === undefined) {
			return undefined;
		}
		const suspectIds = FileIO.validateNumberArray(suspects.id, fix);
		if(suspectIds === undefined) {
			return undefined;
		}
		const content = FileIO.validateObject(itemData.content, fix);
		if(content === undefined) {
			return undefined;
		}
		const contentText = FileIO.validateString(content.text, fix, "");
		if(contentText === undefined) {
			return contentText;
		}
		const contentTR = FileIO.validateString(content.translationRationale, fix, "");
		if(contentTR === undefined) {
			return undefined;
		}
		const contentER = FileIO.validateString(content.expectedResults, fix, "");
		if(contentER === undefined) {
			return undefined;
		}
		const contentRP = FileIO.validateString(content.relativePath, fix, "");
		if(contentRP === undefined) {
			return undefined;
		}
		const contentCap = FileIO.validateString(content.caption, fix, "");
		if(contentCap === undefined) {
			return undefined;
		}

		const outputData:SmoresContentData = {
			relativeProjectPath: relProjPath,
			relativeDocumentPath: relDocPath,
			category: itemCategory,
			id: itemId,
			traceData: {
				traces: { id: traceIds},
				suspects: { id: suspectIds}
			},
			content: {
				text: contentText,
				translationRationale: contentTR,
				expectedResults: contentER,
				relativePath: contentRP,
				caption: contentCap
			}	
		};
		return outputData;
	}
	public static readXmlProjectFile(filepath:string, fix:boolean=true) {
		if(!existsSync(filepath)) {return undefined;}
		const rawXml = readFileSync(filepath, 'utf-8');
		return FileIO.parseProjectRawXml(rawXml, fix);
	}
	public static readXmlDocumentFile(filepath:string, fix:boolean=true) {
		if(!existsSync(filepath)) {return undefined;}
		const rawXml = readFileSync(filepath, 'utf-8');
		return FileIO.parseDocumentRawXml(rawXml, fix);
	}
	public static readXmlContentFile(filepath:string, fix:boolean=true) {
		if(!existsSync(filepath)) {return undefined;}
		const rawXml = readFileSync(filepath, 'utf-8');
		return FileIO.parseContentRawXml(rawXml, fix);
	}
	public static writeXmlFile(filepath:string, jsObject:any, baseNode:string) {
		const xml = FileIO.getXml(jsObject, baseNode);
		writeFileSync(filepath, xml);
	}
	public static isEmpty(obj:any) {
    return Object.keys(obj).length === 0;
	}
	private static getXml(jsObject:any, baseNode:string) {
		const builder = new XMLBuilder({format:true, arrayNodeName:`${baseNode}`});
		return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ${baseNode}>
${builder.build([jsObject])}
`;
	}
	public static readProjectFile(filepath:string, fix:boolean=true):SmoresProjectData|undefined {
		const jsObject = FileIO.readXmlProjectFile(filepath, fix);
		if(jsObject === undefined || FileIO.isEmpty(jsObject)) {
			return undefined;
		}
		return jsObject;
	}
	public static readDocumentFile(filepath:string, fix:boolean=true):SmoresDocumentData|undefined {
		const jsObject = FileIO.readXmlDocumentFile(filepath, fix);
		if(jsObject === undefined || FileIO.isEmpty(jsObject)) {
			return undefined;
		}
		return jsObject;
	}
	public static readContentFile(filepath:string, fix:boolean=true):SmoresContentData|undefined {
		const jsObject = FileIO.readXmlContentFile(filepath, fix);
		if(jsObject === undefined || FileIO.isEmpty(jsObject)) {
			return undefined;
		}
		return jsObject;
	}
	public static getProjectPath(doc:SmoresDocument):string|undefined {
		if(doc.data) {
			const projectPath = join(dirname(doc.document.fileName), doc.data.relativeProjectPath);
			return projectPath;
		}
		return undefined;
	}
	public static getProjectDocumentInfos(projectFilepath:string):DocumentInfo[]|undefined {
    const projectData = FileIO.readProjectFile(projectFilepath);
    if(projectData) {
			return projectData.data.documents.document;
		}
		return undefined;
	}
	public static getContentRoot(doc:SmoresDocument):string|undefined {
		const projectPath = FileIO.getProjectPath(doc);
		if(projectPath === undefined) { return undefined; }
		const projectData = FileIO.readProjectFile(projectPath, false);
		if(projectData === undefined) { return undefined; }
		return join(dirname(projectPath), projectData.data.relativeRoot);
	}
	public static getContentFilepath(doc:SmoresDocument, id:number):string|undefined {
    const dataRoot = FileIO.getContentRoot(doc);
    if(dataRoot === undefined) { 
      return undefined; 
    }
    return join(dataRoot, `${id}.smores-item`);
  }

}