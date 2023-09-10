import * as vscode from "vscode";
import { ProjectData } from "./projectManagement";
import { SmoresNode } from "../model/smoresNode";
import { getNodeIcon } from "../utils/gui";
import { TreeNode } from "../treeView/treeNode";

export class ProjectNode extends vscode.TreeItem {
  constructor(readonly data:ProjectData, active:boolean=false, document:boolean=false) {
    var state = vscode.TreeItemCollapsibleState.None;
    if(active) {
      state = vscode.TreeItemCollapsibleState.Expanded;
    }
    super(data.name, state);
    this.tooltip = `${data.name}\n\n${data.path}`;
    const smoresNode = new SmoresNode(data.path);
    this.iconPath = getNodeIcon(smoresNode);
    if(document) {
      this.command = {
        title: 'View',
        command :'doors-smores.Show-Document',
        arguments: [data.path]
      };
    } else {
      this.command = {
        title: 'Open',
        command :'doors-smores.Set-Active-Project',
        arguments: [data.path]
      };
    }
  }
}

