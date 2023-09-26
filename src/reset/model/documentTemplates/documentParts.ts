/* eslint-disable @typescript-eslint/naming-convention */
import { DoorsSmores } from "../../doorsSmores";
import { DocumentNode } from "../documentNode";
import { newComment, newHeading, newImage, newMermaidImage } from "../newContext";
import { adsDocType } from "../schema";

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
  const docType = parentNode.getDocumentType();
  var indefiniteArticle = "a";
  if(docType === adsDocType) {
    indefiniteArticle = "an";
  }
  var audience = "testers";
  if(docType.match("Specification")) {
    audience = "developers";
  }
  const project = DoorsSmores.getActiveProject();
  const projectName = project!.getFilenameNoExt();
  const hNode = await newHeading(parentNode, "Introduction");
  const hNode1 = await newHeading(hNode, "Purpose");
  newComment(hNode1, `This document defines ${indefiniteArticle} ${docType}.`);
  const hNode2 = await newHeading(hNode, "Scope");
  newComment(hNode2, `The scope of this document is the ${projectName} software system.`);
  const hNode3 = await newHeading(hNode, "Intended audience");
  newComment(hNode3, `This document is intended for ${audience} of the ${projectName} software system.`);
  return hNode;
}

export async function documentStart(docNode:DocumentNode) {
  const node_1 = await createIntroduction(docNode);
  await createReferenceTable(node_1!);
  await createGlossaryTable(node_1!);
}

async function createTestSetup(parentNode:DocumentNode) {
  const hNode = await newHeading(parentNode, "Test setup");
  newComment(hNode, `Tests described within this test protocol are executed using the following test setup.`);
  newImage(hNode);
  newComment(hNode, "The following table details the components of the test system shown in the diagram above");
  newComment(hNode,
`| ID | Name       | Detail               | Notes                     |
|----|------------|----------------------|---------------------------|
| C1 | Name of C1 | Make and model of C1 | Any other relevant detail |`);  
}
export async function testProtocolStart(docNode:DocumentNode) {
  await createTestSetup(docNode);
  const hNode = await newHeading(docNode, "Test cases");
}
export async function createOverallDescription(parentNode:DocumentNode) {
  const hNode = await newHeading(parentNode, "Overall description");
  newComment(hNode, "*Give an overview of what this software should do / how it fits into any larger system (i.e. if this is one component of a planned system, show how it fits into the larger scheme).*");
}

