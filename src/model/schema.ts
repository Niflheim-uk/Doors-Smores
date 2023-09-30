export interface DocumentInfo {
	name: string;
	relativePath: string;
}
export interface SmoresProjectData {
	dataVersion: number;
	repository: {
		relativeRoot: string;
		pathspec: string;
		remote: string;
	}
	contributors: {
		max: number;
		id: string[];
	}
	data: {
		relativeRoot: string;
		documents: { document: DocumentInfo[] }
		uniqueIds: {
      idBase: number;
			id: number[];
		}
	}
}
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
		document: { revision: RevisionHistoryData[] }
		traceReport: { revision: RevisionHistoryData[] }
	}
	content: {
		id: number[];
		text: string;
	}
}
export interface TraceData {
  traces: { id: number[] };
  suspects: { id: number[] };
}
export interface SmoresContentData {
	relativeProjectPath: string;
	relativeDocumentPath: string;
	category: string;
	id: number;
  traceData: TraceData;
	content: {
		text: string;
    translationRationale: string;
    expectedResults: string;
    relativePath: string;
    caption: string;
	}
}
export const documentIcon = 'book';
export const requirementIcon = 'law';
export const constraintIcon = 'lock';
export const testIcon = 'beaker';
export const textIcon = 'selection';
export const imageIcon = 'symbol-color';

export const unknown = "Unknown";

export const ursDocType = "User Requirements Specification";
export const srsDocType = "Software Requirements Specification";
export const adsDocType = "Architecture Design Specification";
export const ddsDocType = "Detailed Design Specification";
export const atpDocType = "Software Acceptance Test Protocol";
export const stpDocType = "Software System Test Protocol";
export const itpDocType = "Software Integration Test Protocol";
export const utpDocType = "Software Unit Test Protocol";
export const emptyDocType = unknown;

export const projectCategory = "Project";
export const documentCategory= "Document";
export const headingCategory = "Heading";
export const commentCategory = "Comment";
export const   imageCategory = "Image";
export const mermaidCategory = "Mermaid Format Image";
export const userFRCategory = "User Functional Requirement";
export const softFRCategory = "Software Functional Requirement";
export const archFRCategory = "Architectural Functional Requirement";
export const  desFRCategory = "Design  Functional Requirement";
export const userNFRCategory = "User Non-Functional Requirement";
export const softNFRCategory = "Software Non-Functional Requirement";
export const archNFRCategory = "Architectural Non-Functional Requirement";
export const  desNFRCategory = "Design Non-Functional Requirement";
export const userDCCategory = "User Design Constraint";
export const softDCCategory = "Software Design Constraint";
export const archDCCategory = "Architectural Design Constraint";
export const  desDCCategory = "Design Design Constraint";
export const userTestCategory = "User Acceptance Test";
export const softTestCategory = "Software System Test";
export const archTestCategory = "Integration Test";
export const  desTestCategory = "Unit Test";
export const userFRPrefix = "UFR";
export const softFRPrefix = "SFR";
export const archFRPrefix = "AFR";
export const  desFRPrefix = "DFR";
export const userNFRPrefix = "UNFR";
export const softNFRPrefix = "SNFR";
export const archNFRPrefix = "ANFR";
export const  desNFRPrefix = "DNFR";
export const userDCPrefix = "UDC";
export const softDCPrefix = "SDC";
export const archDCPrefix = "ADC";
export const  desDCPrefix = "DDC";
export const userTestPrefix = "UT";
export const softTestPrefix = "ST";
export const archTestPrefix = "IT";
export const  desTestPrefix = "UT";
export function getDocumentTypeAcronym(documentType:string):string {
  switch (documentType) {
  case ursDocType:
    return "URS";
  case srsDocType:
    return "SRS";
  case adsDocType:
    return "ADS";
  case ddsDocType:
    return "DDS";
  case atpDocType:
    return "ATP";
  case stpDocType:
    return "STP";
  case itpDocType:
    return "ITP";
  case utpDocType:
    return "UTP";
  case emptyDocType:
    return "UKN";
  }
  return "-";
}

export function getLabelPrefix(category:string):string {
  switch(category) {
  case projectCategory:
    return "PRJ";
  case documentCategory:
    return "DOC";
  case headingCategory:
    return "H";
  case commentCategory:
    return "C";
  case   imageCategory:
    return "I";
  case mermaidCategory:
    return "MI";
  case userFRCategory:
    return userFRPrefix;
  case softFRCategory:
    return softFRPrefix;
  case archFRCategory:
    return archFRPrefix;
  case  desFRCategory:
    return desFRPrefix;
  case userNFRCategory:
    return userNFRPrefix;
  case softNFRCategory:
    return softNFRPrefix;
  case archNFRCategory:
    return archNFRPrefix;
  case  desNFRCategory:
    return desNFRPrefix;
  case userDCCategory:
    return userDCPrefix;
  case softDCCategory:
    return softDCPrefix;
  case archDCCategory:
    return archDCPrefix;
  case  desDCCategory:
    return desDCPrefix;
  case userTestCategory:
    return userTestPrefix;
  case softTestCategory:
    return softTestPrefix;
  case archTestCategory:
    return archTestPrefix;
  case  desTestCategory:
    return desTestPrefix;
  default:
    return "X";
  }
}
export function isTestCategory(category:string) {
  switch(category) {
  case userTestCategory:
  case softTestCategory:
  case archTestCategory:
  case desTestCategory:
    return true;
  }
  return false;
}
export function isFuncReqCategory(category:string) {
  switch(category) {
  case userFRCategory:
  case softFRCategory:
  case archFRCategory:
  case desFRCategory:
    return true;
  }
  return false;
}
export function isNonFuncReqCategory(category:string) {
  switch(category) {
  case userNFRCategory:
  case softNFRCategory:
  case archNFRCategory:
  case desNFRCategory:
    return true;
  }
  return false;
}export function isConstraintCategory(category:string) {
  switch(category) {
  case userDCCategory:
  case softDCCategory:
  case archDCCategory:
  case desDCCategory:
    return true;
  }
  return false;
}