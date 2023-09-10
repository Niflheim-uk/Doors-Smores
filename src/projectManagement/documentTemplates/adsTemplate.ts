/* eslint-disable @typescript-eslint/naming-convention */
import { SmoresNode } from "../../model/smoresNode";
import { 
  documentStart
 } from "./documentParts";

export function createNodesForADSFull(docNode:SmoresNode) {
  documentStart(docNode);
}

export function createNodesForADSMini(docNode:SmoresNode) {
  documentStart(docNode);

  const path_2 = docNode.newItem("heading", "Overall description");
  const node_2 = new SmoresNode(path_2!);
  node_2.newItem("comment", "Give an overview of **WRITE MORE WORDS**");
  const path_3 = docNode.newItem("heading", "User Requirements");
  const node_3 = new SmoresNode(path_3!);
  node_3.newItem("comment", "If you plan on breaking requirements down into categories, explain that. Then get down to it.");
}
