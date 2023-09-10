export interface BaseNodeDataModel {
  id: number;
  parent: number;
  category: string;
  text: string;
  children?: number[];
}
export interface DocumentDataModel extends BaseNodeDataModel {
  documentType?: string;
}
export interface RequirementDataModel extends BaseNodeDataModel {
  translationRationale?: string;
}
export interface CommentDataModel extends BaseNodeDataModel {}
export interface HeadingDataModel extends BaseNodeDataModel {}

