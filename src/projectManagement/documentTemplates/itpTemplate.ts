/* eslint-disable @typescript-eslint/naming-convention */
import { SmoresNode } from "../../model/smoresNode";
import * as schema from '../../model/smoresDataSchema';

import { 
  documentStart
 } from "./documentParts";

export function createNodesForITPFull(docNode:SmoresNode) {
  documentStart(docNode);
}

export function createNodesForITPMini(docNode:SmoresNode) {
  documentStart(docNode);

  const path_2 = docNode.newItem(schema.headingType, "Overall description");
  const node_2 = new SmoresNode(path_2!);
  node_2.newItem(schema.commentType, "Give an overview of **WRITE MORE WORDS**");
  const path_3 = docNode.newItem(schema.headingType, "User Requirements");
  const node_3 = new SmoresNode(path_3!);
  node_3.newItem(schema.commentType, "If you plan on breaking requirements down into categories, explain that. Then get down to it.");
}
