/* eslint-disable @typescript-eslint/naming-convention */
import { DocumentNode } from "../documentNode";

import { 
  documentStart, testProtocolStart
 } from "./documentParts";

export async function createNodesForATPFull(docNode:DocumentNode) {
  await documentStart(docNode);
  await testProtocolStart(docNode);
}
