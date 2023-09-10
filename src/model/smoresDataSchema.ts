export const ursDocType = "User Requirements Specification";
export const srsDocType = "Software Requirements Specification";
export const adsDocType = "Architecture Design Specification";
export const ddsDocType = "Detailed Design Specification";
export const atpDocType = "Software Acceptance Test Protocol";
export const stpDocType = "Software System Test Protocol";
export const itpDocType = "Software Integration Test Protocol";
export const utpDocType = "Software Unit Test Protocol";
export const emptyDocType = "Unknown";


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
  decompose?:number[];
  detail?:number[];
  implement?:number[];
  satisfy?:number[];
  verify?:number[];
}
interface TraceDataSet {
  upstream:TraceData;
  downstream:TraceData;
  suspectTrace?:number[];
}
export interface NodeDataModel {
  id: number;
  parent: number;
  category: string;
  text: string;
  children?: number[];
  documentData?:DocumentData;
  requirementData?:RequirementData;
  testData?:TestData;
  childData?:NodeDataModel[];
  traces?:TraceDataSet;
}
