interface DocumentData {
  documentType: string;
}
interface RequirementData {
  translationRationale: string;
}
export interface NodeDataModel {
  id: number;
  parent: number;
  category: string;
  text: string;
  children?: number[];
  documentData?:DocumentData;
  requirementData?:RequirementData;
  childData?:NodeDataModel[];
}
