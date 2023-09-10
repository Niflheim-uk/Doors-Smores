import { SmoresNode } from "../model/smoresNode";

export function newHeading(node:SmoresNode, title:string) {
  return node.newItem("heading", title);
}
export function newComment(node:SmoresNode, content?:string) {
  if(content === undefined) {
    content = "new comment";
  }
  return node.newItem("comment", content);
}
export function newNonFunctionalRequirement(node:SmoresNode) {
  return node.newItem("nonFunctionalRequirement", "new non functional requirement");
}
export function newFunctionalRequirement(node:SmoresNode) {
  return node.newItem("functionalRequirement", "new functional requirement");
}
export function newImage(node:SmoresNode) {
  return node.newItem("image", "../defaultImage.jpg");
}
export function newMermaidImage(node:SmoresNode) {
  return node.newItem("mermaid", `sequenceDiagram
Alice->>John: Hello John, how are you?
John-->>Alice: Great!
Alice-)John: See you later!`);
}
export function newSoftwareSystemTest(node:SmoresNode) {
  return node.newItem("nonSoftwareSystemTest", "new software system test");
}
export function newSoftwareIntegrationTest(node:SmoresNode) {
  return node.newItem("nonSoftwareIntegrationTest", "new software integration test");
}
export function newSoftwareUnitTest(node:SmoresNode) {
  return node.newItem("nonSoftwareUnitTest", "new software unit test");
}
