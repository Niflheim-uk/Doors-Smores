import * as vscode from "vscode";
import * as fs from "fs";
import * as dataModel from '../model/smoresDataSchema';
import { SmoresNode } from "../model/smoresNode";

export class TreeNode extends vscode.TreeItem {
  public smoresNode:SmoresNode;
  constructor(filePath:fs.PathLike) {
    const node = new SmoresNode(filePath);
    let state = vscode.TreeItemCollapsibleState.None;
    if(node.data === undefined) {
      console.log("WTF?");
    }
    if(node.data.children && node.data.children.length > 0) {
      state = vscode.TreeItemCollapsibleState.Collapsed;
    }
    const nodeLabel = `${getLabelPrefix(node.data)}${node.data.id} - ${node.data.text.split("\n")[0]}`;
    super(nodeLabel, state);
    this.smoresNode = node;
    this.description = node.data.text;
    this.tooltip = this.description;
//    this.iconPath = `$(eye)`;
    this.contextValue = node.getContextString();
  }
}

function getLabelPrefix(nodeData:dataModel.BaseNodeDataModel):string {
  switch(nodeData.category) {
    case "project":
      return "PRJ";
    case "document":
      return "D";
    case "heading":
      return "H";
    case "comment":
      return "C";
    case "mermaidImage":
      return "MI";
    case "functionalRequirement":
      return "FR";
    default:
      return "X";
  }
}
