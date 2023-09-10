import { SmoresNode } from "../model/smoresNode";

export function promoteNode(node:SmoresNode) {
  const parent = node.getParentNode();
  if(!node.canPromoteNode() || parent === null) {
    return;
  }
  const grandparent = parent.getParentNode();
  if(grandparent) {
    const parentPos = grandparent.getChildPosition(parent.data.id);
    grandparent.addChildAt(node.data.id, parentPos+1);
    parent.removeChild(node.data.id);
    node.data.parent = grandparent.data.id;
    node.write();
  }
}
export function demoteNode(node:SmoresNode) {
  const parent = node.getParentNode();
  if(!node.canDemoteNode() || parent === null) {
    return;
  }
  const idPos = parent.getChildPosition(node.data.id);
  // idPos is greater than 0 or couldnt demote
  const prevSiblingPos = idPos -1;
  const siblings = parent.getChildNodes();
  siblings[prevSiblingPos].addChild(node.data.id);
  parent.removeChild(node.data.id);
  node.data.parent = siblings[prevSiblingPos].data.id;
  node.write();
}
export function moveNodeUp(node:SmoresNode) {
  const parent = node.getParentNode();
  if(parent === null) {
    return;
  }
  const index = parent.getChildPosition(node.data.id);
  parent.swapChildIndex(index, index-1);
}
export function moveNodeDown(node:SmoresNode) {
  const parent = node.getParentNode();
  if(parent === null) {
    return;
  }
  const index = parent.getChildPosition(node.data.id);
  parent.swapChildIndex(index, index+1);
}
