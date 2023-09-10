import * as vscode from "vscode";
import * as dataModel from "./smoresDataSchema";
import * as fs from "fs";
import * as path from "path";
import { SmoresNode } from "./smoresNode";

export class SmoresProject extends SmoresNode{
  declare readonly data:dataModel.ProjectDataModel;
  constructor (readonly projectFilepath:fs.PathLike) {
    const baseFolder = path.dirname(projectFilepath.toString());
    const dataFolder = path.basename(projectFilepath.toString(), '.smores-project');
    const projectNodePath = path.join(baseFolder, dataFolder, '0.smores');
    super(projectNodePath);
    super.projectNode = this;
    this.setDefaults();
  }
  private setDefaults() {
    let change = false;
    if(this.data.parent === undefined) {
      this.data.parent = null;
      change = true;
    }
    if(this.data.category === undefined) {
      this.data.category = "project";
      change = true;
    }
    if(this.data.text === undefined) {
      const name = path.basename(this.filePath.toString()).split('.')[0];
      this.data.text = `${name}`;
      change = true;
    }
  
    if(this.data.idBase === undefined) {
      this.data.idBase = 10000;
      change = true;
    }
    if(this.data.maxContributors === undefined) {
      this.data.maxContributors = 100;
      change = true;
    }
  
    if(this.data.id === undefined) {
      this.data.id = this.getUniqueId();
      change = true;
    }
    if(change) {
      this.write();
    }
  }
  getUniqueId():number {
    const userIndex = this.getUserIndex();
    const nextId = this.getNextId(userIndex);
    if((this.data.uniqueIds === undefined) || (this.data.uniqueIds.length === 0)) {
      this.data.uniqueIds = [nextId];
    } else {
      this.data.uniqueIds.push(nextId);
    }
    this.write();
    return nextId;
  }
  private getUserId():string {
    return vscode.env.machineId;
  }
  private getUserIndex() : number {
    const userId = this.getUserId();
    if((this.data.knownContributors === undefined) || (this.data.knownContributors.length === 0)) {
      this.data.knownContributors = [userId];
      this.write();
      return 0;
    } else if(this.data.knownContributors.includes(userId)) {
      const index = this.data.knownContributors.findIndex(contrib => userId === contrib);
      return index;
    } else {
      this.data.knownContributors.push(userId);
      this.write();
      return this.data.knownContributors.length;
    }
  }
  private getNextId(userIndex:number) {
    if(this.data.idBase === undefined) {
      throw new Error("idBase is undefined");
    }
    if(this.data.maxContributors === undefined) {
      throw new Error("maxContributors is undefined");
    }
    let testNumber = this.data.idBase + userIndex;
    if(this.data.uniqueIds !== undefined) {
      while (this.data.uniqueIds.includes(testNumber)) {
        testNumber += this.data.maxContributors;
      }
    }
    return testNumber;
  }
}