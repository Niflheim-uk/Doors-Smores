/* eslint-disable @typescript-eslint/naming-convention */
import { DocumentNode } from "../documentNode";
import { newComment, newHeading } from "../newContext";

export async function createHistoryTable(parentNode:DocumentNode) {
  const hNode = await newHeading(parentNode, "History");
  newComment(hNode, 
  `| Date | Issue | Summary     | Author |
|------|-------|-------------|--------|
|  TBD | 00-01 | First issue |    TBD |`);
  return hNode;
}
export async function createReferenceTable(parentNode:DocumentNode) {
  const hNode = await newHeading(parentNode, "References");
  newComment(hNode, 
`| ID | Reference Name | Title          |
|----|----------------|----------------|
| [1]| doc1           | Document title |`);
  return hNode;
}
export async function createGlossaryTable(parentNode:DocumentNode) {
  const hNode = await newHeading(parentNode, "Glossary");
  newComment(hNode, "Defined terms are capitalized in this document. These terms are defined in the table below.");
  newComment(hNode, 
`| Term | Definition             |
|------|------------------------|
| TERM | The definition for TERM|`);
  return hNode;
}
export async function createIntroduction(parentNode:DocumentNode) {
  const hNode = await newHeading(parentNode, "Introduction");
  const hNode1 = await newHeading(hNode, "Purpose");
  newComment(hNode1, "This document defines a *document type*.");
  const hNode2 = await newHeading(hNode, "Scope");
  newComment(hNode2, "The scope of this document is the *project name* software system.");
  const hNode3 = await newHeading(hNode, "Intended audience");
  newComment(hNode3, "This document is intended for *developers/testers* of the *project name* software system.");
  return hNode;
}

export async function documentStart(docNode:DocumentNode) {
  await createHistoryTable(docNode);
  const node_1 = await createIntroduction(docNode);
  await createGlossaryTable(node_1!);
  await createReferenceTable(node_1!);
}
export async function testProtocolStart(docNode:DocumentNode) {

}
export async function createOverallDescription(parentNode:DocumentNode) {
  const hNode = await newHeading(parentNode, "Overall description");
  newComment(hNode, "*Give an overview of what this software should do / how it fits into any larger system (i.e. if this is one component of a planned system, show how it fits into the larger scheme).*");
}

