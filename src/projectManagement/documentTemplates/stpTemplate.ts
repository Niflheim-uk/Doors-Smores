/* eslint-disable @typescript-eslint/naming-convention */
import { SmoresNode } from "../../model/smoresNode";
import { newComment, newHeading } from "../newNode";

export function createNodesForSTPFull(docNode:SmoresNode) {
}

export function createNodesForSTPMini(docNode:SmoresNode) {
  const path_1 = docNode.newItem("heading", "THIS IS NOT DONE");
  const node_1 = new SmoresNode(path_1!);
  newComment(node_1, "The introduction should outline the document. What is its purpose? Who is it for? What will the rest of the document contain?");
  const path_2 = docNode.newItem("heading", "Overall description");
  const node_2 = new SmoresNode(path_2!);
  newComment(node_2, "Give an overview of **WRITE MORE WORDS**");
  const path_3 = docNode.newItem("heading", "User Requirements");
  const node_3 = new SmoresNode(path_3!);
  newComment(node_3, "If you plan on breaking requirements down into categories, explain that. Then get down to it.");
}
