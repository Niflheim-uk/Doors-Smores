export const unknownType = "Unknown";

export const ursDocType = "User Requirements Specification";
export const srsDocType = "Software Requirements Specification";
export const adsDocType = "Architecture Design Specification";
export const ddsDocType = "Detailed Design Specification";
export const atpDocType = "Software Acceptance Test Protocol";
export const stpDocType = "Software System Test Protocol";
export const itpDocType = "Software Integration Test Protocol";
export const utpDocType = "Software Unit Test Protocol";
export const emptyDocType = unknownType;

export const projectType = "Project";
export const documentType= "Document";
export const headingType = "Heading";
export const commentType = "Comment";
export const   imageType = "Image";
export const mermaidType = "Mermaid Format Image";
export const userFRType = "User Functional Requirement";
export const softFRType = "Software Functional Requirement";
export const archFRType = "Architectural Functional Requirement";
export const  desFRType = "Design  Functional Requirement";
export const userNFRType = "User Non-Functional Requirement";
export const softNFRType = "Software Non-Functional Requirement";
export const archNFRType = "Architectural Non-Functional Requirement";
export const  desNFRType = "Design Non-Functional Requirement";
export const userDCType = "User Design Constraint";
export const softDCType = "Software Design Constraint";
export const archDCType = "Architectural Design Constraint";
export const  desDCType = "Design Design Constraint";
export const userTestType = "User Acceptance Test";
export const softTestType = "Software System Test";
export const archTestType = "Integration Test";
export const  desTestType = "Unit Test";

interface DocumentData {
  documentType: string;
}
interface RequirementData {
  translationRationale: string;
}
interface TestData {
  expectedResults: string;
}
export interface TraceData {
  traceIds:number[];
  suspectIds:number[];
}
export interface NodeDataModel {
  id: number;
  parent: number;
  category: string;
  text: string;
  traces:TraceData;
  children?: number[];
  documentData?:DocumentData;
  requirementData?:RequirementData;
  testData?:TestData;
  childData?:NodeDataModel[];
}
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
  case projectType :
    return "PRJ";
  case documentType:
    return "DOC";
  case headingType :
    return "H";
  case commentType :
    return "C";
  case   imageType :
    return "I";
  case mermaidType :
    return "MI";
  case userFRType  :
    return "UFR";
  case softFRType  :
    return "SFR";
  case archFRType  :
    return "AFR";
  case  desFRType  :
    return "DFR";
  case userNFRType :
    return "UNFR";
  case softNFRType :
    return "SNFR";
  case archNFRType :
    return "ANFR";
  case  desNFRType :
    return "DNFR";
  case userDCType  :
    return "UDC";
  case softDCType  :
    return "SDC";
  case archDCType  :
    return "ADC";
  case  desDCType  :
    return "DDC";
  case userTestType:
    return "UT";
  case softTestType:
    return "ST";
  case archTestType:
    return "AT";
  case  desTestType:
    return "DT";
  default:
    return "X";
  }
}