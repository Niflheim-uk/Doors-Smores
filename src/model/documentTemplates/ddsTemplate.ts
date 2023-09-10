/* eslint-disable @typescript-eslint/naming-convention */
import { DocumentNode } from "../documentNode";
import { newComment, newHeading } from "../newContext";

import { 
  documentStart
 } from "./documentParts";

export async function createNodesForDDSFull(docNode:DocumentNode) {
  await documentStart(docNode);
}

export async function createNodesForDDSMini(docNode:DocumentNode) {
  await documentStart(docNode);

  const ODNode = await newHeading(docNode, "Overall description");
  newComment(ODNode, "Give an overview of **WRITE MORE WORDS**");
  const URNode = await newHeading(docNode, "User Requirements");
  newComment(URNode, "If you plan on breaking requirements down into categories, explain that. Then get down to it.");
}
