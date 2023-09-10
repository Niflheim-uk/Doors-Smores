/* eslint-disable @typescript-eslint/naming-convention */
import { SmoresNode } from "../../model/smoresNode";
import { 
  createHistoryTable,
  createReferenceTable,
  createGlossaryTable,
  createIntroduction
 } from "./documentParts";

export function createNodesForSTPFull(docNode:SmoresNode) {
}

export function createNodesForSTPMini(docNode:SmoresNode) {
  createHistoryTable(docNode);
  const node_1 = createIntroduction(docNode);
  createGlossaryTable(node_1);
  createReferenceTable(node_1);

  const path_2 = docNode.newItem("heading", "Overall description");
  const node_2 = new SmoresNode(path_2!);
  node_2.newItem("comment", "Give an overview of **WRITE MORE WORDS**");
  const path_3 = docNode.newItem("heading", "User Requirements");
  const node_3 = new SmoresNode(path_3!);
  node_3.newItem("comment", "If you plan on breaking requirements down into categories, explain that. Then get down to it.");
}
