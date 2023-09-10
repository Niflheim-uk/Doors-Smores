import * as vscode from "vscode";
import * as fs from "fs";
import * as guiStyle from '../utils/gui';
import * as schema from '../model/smoresDataSchema';
import { SmoresNode } from "../model/smoresNode";
import { SmoresDataFile } from "../model/smoresDataFile";

export class TreeNode extends vscode.TreeItem {
  public smoresNode:SmoresNode;
  constructor(filePath:fs.PathLike) {
    const node = new SmoresNode(filePath);
    let state = vscode.TreeItemCollapsibleState.None;
    if(node.data === undefined) {
      console.log("WTF?");
    }
    if(node.data.children && node.data.children.length > 0) {
      state = vscode.TreeItemCollapsibleState.Expanded;
    }
    const nodeLabel = `${schema.getLabelPrefix(node.data.category)}${node.data.id} - ${node.data.text.split("\n")[0]}`;
    super(nodeLabel, state);
    this.smoresNode = node;
    this.description = node.data.text;
    this.tooltip = this.description;
    this.iconPath = guiStyle.getNodeIcon(node);
//    this.iconPath = `$(eye)`;
    this.setContextString();
  }
  setContextString() {
    let context = "";
    context = this.setContextAddOrderStatus(context);
    context = this.setContextAddPromoteStatus(context);
    context = this.setContextAddDocumentType(context);
    this.contextValue = `${this.smoresNode.data.category}${context}`;
  }
  private setContextAddOrderStatus(context:string) :string {
    const parent = this.smoresNode.getParentNode();
    if((parent !== null) && (parent.data.children !== undefined)){
      const index = parent.getChildPosition(this.smoresNode.data.id);
      const count = parent.data.children.length;
      if(index === 0) {
        context = context.concat(" MIN_CHILD");
      }
      if(index === (count -1)) {
        context = context.concat(" MAX_CHILD");
      }
    } else {
      context = context.concat(" MIN_CHILD", " MAX_CHILD");
    }
    return context;
  }
  private setContextAddPromoteStatus(context:string):string {
    if(this.smoresNode.canPromoteNode()) {
      context = context.concat(" PROMOTE");
    }
    if(this.smoresNode.canDemoteNode()) {
      context = context.concat(" DEMOTE");
    }
    return context;
  }
  private setContextAddDocumentType(context:string):string {
    const documentType = this.smoresNode.getDocumentType();
    return context.concat(" ", schema.getDocumentTypeAcronym(documentType));
  }
}

