export interface BaseNodeDataModel {
  id: number;
  parent: number | null;
  category: string;
  text: string;
  children?: number[];
}
export interface ProjectDataModel extends BaseNodeDataModel {
  idBase: number;
  maxContributors: number;
  knownContributors: string[];
  uniqueIds: number[];
}
export interface DocumentDataModel extends BaseNodeDataModel {
  documentType: string;
}
export interface RequirementDataModel extends BaseNodeDataModel {
  translationRationale?: string;
}
export interface CommentDataModel extends BaseNodeDataModel {}

