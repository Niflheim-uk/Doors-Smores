/* eslint-disable @typescript-eslint/naming-convention */
import { SmoresNode } from "../../model/smoresNode";

export function createHistoryTable(parentNode:SmoresNode) {
  const path = parentNode.newItem("heading", "History");
  const node = new SmoresNode(path!);
  node.newItem("comment", 
  `| Date | Issue | Summary     | Author |\n
   |------|-------|-------------|--------|\n
   |  TBD | 00-01 | First issue |    TBD |`);
  return node;
}
export function createReferenceTable(parentNode:SmoresNode) {
  const path = parentNode.newItem("heading", "References");
  const node = new SmoresNode(path!);
  node.newItem("comment", 
  `| ID | Reference Name | Title          |\n
   |----|----------------|----------------|\n
   | [1]| doc1           | Document title |`);
  return node;
}
export function createGlossaryTable(parentNode:SmoresNode) {
  const path = parentNode.newItem("heading", "Glossary");
  const node = new SmoresNode(path!);
  node.newItem("comment", "Defined terms are capitalized in this document. These terms are defined in the table below.");
  node.newItem("comment", 
  `| Term | Definition             |\n
   |------|------------------------|\n
   | TERM | The definition for TERM|`);
  return node;
}
export function createIntroduction(parentNode:SmoresNode) {
  const path = parentNode.newItem("heading", "Introduction");
  const node = new SmoresNode(path!);
  const path_P = node.newItem("heading", "Purpose");
  const node_P = new SmoresNode(path_P!);
  node_P.newItem("comment", "This document defines a <document type>.");
  const path_S = node.newItem("heading", "Scope");
  const node_S = new SmoresNode(path_S!);
  node_S.newItem("comment", "The scope of this document is the <name> software system.");
  const path_A = node.newItem("heading", "Intended audience");
  const node_A = new SmoresNode(path_A!);
  node_A.newItem("comment", "This document is intended for <developers/testers> of the <name> software system.");
  return node;
}

export function documentStart(docNode:SmoresNode) {
  createHistoryTable(docNode);
  const node_1 = createIntroduction(docNode);
  createGlossaryTable(node_1);
  createReferenceTable(node_1);
}
