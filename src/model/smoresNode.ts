import * as vscode from "vscode";
import * as dataModel from "./smoresDataSchema";
import * as fs from "fs";
import * as path from "path";
import { SmoresDataFile } from "./smoresDataFile";

export class SmoresNode extends SmoresDataFile {
  declare public data:dataModel.BaseNodeDataModel;
  constructor(filePath:fs.PathLike, protected projectNode?:SmoresNode) {
    super(filePath);
  }
  getChildNodes():SmoresNode[] {
    let childNodes = undefined;
    if(this.data.children && this.data.children.length > 0) {
      const children = this.data.children;
      for (let index = 0; index < children.length; index++) {
        const childId = children[index];
        const nodeFilepath = this.getNodeFilepath(childId);
        if(Array.isArray(childNodes)) {
          childNodes.push(new SmoresNode(nodeFilepath, this.projectNode));
        } else {
          childNodes = [new SmoresNode(nodeFilepath, this.projectNode)];
        }
      }
    }
    if(childNodes) {
      return childNodes;
    }
    return [];
  }
  getParentNode():SmoresNode|null {
    if(this.data.parent === null) {
      return null;
    } else {
      const nodeFilepath = this.getNodeFilepath(this.data.parent);
      return new SmoresNode(nodeFilepath, this.projectNode);
    }
  }
}
