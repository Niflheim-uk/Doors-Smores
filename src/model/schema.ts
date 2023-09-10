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
  case projectCategory :
    return "PRJ";
  case documentCategory:
    return "DOC";
  case headingCategory :
    return "H";
  case commentCategory :
    return "C";
  case   imageCategory :
    return "I";
  case mermaidCategory :
    return "MI";
  case userFRCategory  :
    return "UFR";
  case softFRCategory  :
    return "SFR";
  case archFRCategory  :
    return "AFR";
  case  desFRCategory  :
    return "DFR";
  case userNFRCategory :
    return "UNFR";
  case softNFRCategory :
    return "SNFR";
  case archNFRCategory :
    return "ANFR";
  case  desNFRCategory :
    return "DNFR";
  case userDCCategory  :
    return "UDC";
  case softDCCategory  :
    return "SDC";
  case archDCCategory  :
    return "ADC";
  case  desDCCategory  :
    return "DDC";
  case userTestCategory:
    return "UT";
  case softTestCategory:
    return "ST";
  case archTestCategory:
    return "AT";
  case  desTestCategory:
    return "DT";
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