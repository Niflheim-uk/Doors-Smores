/* eslint-disable @typescript-eslint/naming-convention */
import { SmoresNode } from "../../model/smoresNode";
import * as schema from '../../model/smoresDataSchema';


export function createHistoryTable(parentNode:SmoresNode) {
  const path = parentNode.newItem(schema.headingType, "History");
  const node = new SmoresNode(path!);
  node.newItem(schema.commentType, 
  `| Date | Issue | Summary     | Author |
   |------|-------|-------------|--------|
   |  TBD | 00-01 | First issue |    TBD |`);
  return node;
}
export function createReferenceTable(parentNode:SmoresNode) {
  const path = parentNode.newItem(schema.headingType, "References");
  const node = new SmoresNode(path!);
  node.newItem(schema.commentType, 
  `| ID | Reference Name | Title          |
   |----|----------------|----------------|
   | [1]| doc1           | Document title |`);
  return node;
}
export function createGlossaryTable(parentNode:SmoresNode) {
  const path = parentNode.newItem(schema.headingType, "Glossary");
  const node = new SmoresNode(path!);
  node.newItem(schema.commentType, "Defined terms are capitalized in this document. These terms are defined in the table below.");
  node.newItem(schema.commentType, 
  `| Term | Definition             |
   |------|------------------------|
   | TERM | The definition for TERM|`);
  return node;
}
export function createIntroduction(parentNode:SmoresNode) {
  const path = parentNode.newItem(schema.headingType, "Introduction");
  const node = new SmoresNode(path!);
  const path_P = node.newItem(schema.headingType, "Purpose");
  const node_P = new SmoresNode(path_P!);
  node_P.newItem(schema.commentType, "This document defines a <document type>.");
  const path_S = node.newItem(schema.headingType, "Scope");
  const node_S = new SmoresNode(path_S!);
  node_S.newItem(schema.commentType, "The scope of this document is the <name> software system.");
  const path_A = node.newItem(schema.headingType, "Intended audience");
  const node_A = new SmoresNode(path_A!);
  node_A.newItem(schema.commentType, "This document is intended for <developers/testers> of the <name> software system.");
  return node;
}

export function documentStart(docNode:SmoresNode) {
  createHistoryTable(docNode);
  const node_1 = createIntroduction(docNode);
  createGlossaryTable(node_1);
  createReferenceTable(node_1);
}
