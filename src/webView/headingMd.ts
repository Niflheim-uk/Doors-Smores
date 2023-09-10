import { SmoresNode } from "../model/smoresNode";

export function getHeadingMd(node:SmoresNode):string {
  let parent = node.getParentNode();
  let depth = 0;
  while(parent !== null) {
    parent = parent.getParentNode();
    depth++;
  }
  let mdString = "";
  while(depth > 0) {
    mdString = mdString.concat("#");
    depth--;
  }
  mdString = mdString.concat(" ", node.data.text.split("\n")[0]);
  return mdString;
}
