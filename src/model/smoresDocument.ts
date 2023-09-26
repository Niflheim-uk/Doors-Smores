import { TextDocument } from 'vscode';
import { XMLParser, XMLBuilder } from "fast-xml-parser";

export interface RevisionHistoryData {
	day: number;
	month: number;
	year: number;
	major: number;
	minor: number;
	detail: string;
	author: string;
	isMajor: boolean;
}
export interface SmoresDocumentData {
	relativeProjectPath: string;
	type: string;
	name: string;
	history: {
		document: {
			revision: RevisionHistoryData[];
		},
		traceReport: {
			revision: RevisionHistoryData[];
		}
	}
	content: {
		id:number[];
		text:string;
	}
}
export class SmoresDocument {
	public data:SmoresDocumentData;
	constructor(public document:TextDocument) {
		this.data = this.updateDocumentData();
	}
	public updateDocumentData():SmoresDocumentData {
		const raw = this.document.getText();
		const parser = new XMLParser({ignorePiTags:true});
		const parsedXml = parser.parse(raw);
		let revHistory:RevisionHistoryData[] = [];
		if(parsedXml.document.history.document !== '' && parsedXml.document.history.document.revision !== undefined) {
			revHistory = parsedXml.document.history.document.revision;
		}
		let trRevHistory:RevisionHistoryData[] = [];
		if(parsedXml.document.history.traceReport !== '' && parsedXml.document.history.document.revision !== undefined) {
			revHistory = parsedXml.document.history.document.revision;
		}
		let childId:number[] = [];
		if(parsedXml.document.content.id !== '' && parsedXml.document.content.id !== undefined) {
			childId = parsedXml.document.content.id;
		}
		const textData = parsedXml.document.content.text;
		const outputData:SmoresDocumentData = {
			relativeProjectPath:parsedXml.document.relativeProjectPath,
			type:parsedXml.document.type,
			name:parsedXml.document.name,
			history:{
				document:{ revision:revHistory },
				traceReport:{ revision:trRevHistory }
			},
			content: {id:childId,	text:textData }
		};
		return outputData;
	}
}