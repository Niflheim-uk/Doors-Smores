import * as vscode from "vscode";
import * as fs from "fs";
import * as dataModel from './dataModel';
import { SmoresNode } from "./smoresNode";
import { SmoresProject } from "./smoresProject";

export class TreeNode extends vscode.TreeItem {
  public smoresNode:SmoresNode;
  constructor(filePath:fs.PathLike, projectNode?:SmoresNode) {
    const node = new SmoresNode(filePath, projectNode);
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
    this.iconPath = vscode.ThemeIcon.Folder;
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
    default:
      return "X";
  }
}
