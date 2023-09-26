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
	revisionHistory: {
		entry:RevisionHistoryData[];
	}
	traceReportRevisionHistory: {
		entry:RevisionHistoryData[];
	}
	content: {
		children: {
			id:number[];
		}
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
		if(parsedXml.document.revisionHistory != '') {
			revHistory = parsedXml.document.revisionHistory.entry;
		}
		let trRevHistory:RevisionHistoryData[] = [];
		if(parsedXml.document.traceReportRevisionHistory != '') {
			trRevHistory = parsedXml.document.traceReportRevisionHistory.entry;
		}
		let childId:number[] = [];
		if(parsedXml.document.content.children != '') {
			childId = parsedXml.document.content.children.id;
		}
		const textData = parsedXml.document.content.text;
		const outputData:SmoresDocumentData = {
			relativeProjectPath:parsedXml.document.relativeProjectPath,
			type:parsedXml.document.type,
			name:parsedXml.document.name,
			revisionHistory: { entry:revHistory	},
			traceReportRevisionHistory: { entry:trRevHistory },
			content: {children: {id:childId},	text:textData }
		};
		return outputData;
	}
}