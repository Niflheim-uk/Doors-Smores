/* eslint-disable @typescript-eslint/naming-convention */
import { DocumentNode } from "../documentNode";
import { newComment, newHeading } from "../newContext";

import { 
  documentStart
 } from "./documentParts";

export async function createNodesForURSFull(docNode:DocumentNode) {
  await documentStart(docNode);
}

export async function createNodesForURSMini(docNode:DocumentNode) {
  await documentStart(docNode);

  const hNode1 = await newHeading(docNode, "Overall description");
  newComment(hNode1, "Give an overview of **WRITE MORE WORDS**");
  const hNode2 = await newHeading(docNode, "User Requirements");
  newComment(hNode2, "If you plan on breaking requirements down into categories, explain that. Then get down to it.");
}
