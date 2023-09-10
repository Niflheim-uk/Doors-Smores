import * as vscode from "vscode";
import * as smoresDataSchema from "./smoresDataSchema";
import * as fs from "fs";
import { SmoresDataFile } from "./smoresDataFile";

export interface ProjectDataModel {
  idBase: number;
  maxContributors: number;
  knownContributors: string[];
  uniqueIds: number[];
  documentIds: number[];
}
export function getProject():SmoresProject {
  return new SmoresProject(SmoresDataFile.getProjectFilePath());
}
export class SmoresProject extends SmoresDataFile {
  declare readonly data:ProjectDataModel;
  constructor (readonly projectFilepath:fs.PathLike) {
    super(projectFilepath);
    SmoresDataFile.setProjectFilePath(projectFilepath);
    this.setDefaults();
  }
  private setDefaults() {
    let change = false;
      if(this.data.idBase === undefined) {
      this.data.idBase = 10000;
      change = true;
    }
    if(this.data.maxContributors === undefined) {
      this.data.maxContributors = 100;
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
  getDocumentPaths():fs.PathLike[] {
    let documentPaths = undefined;
    if(this.data.documentIds && this.data.documentIds.length > 0) {
      const documentIds = this.data.documentIds;
      for (let index = 0; index < documentIds.length; index++) {
        const childId = documentIds[index];
        const nodeFilepath = SmoresDataFile.getNodeFilepath(childId);
        if(Array.isArray(documentPaths)) {
          documentPaths.push(nodeFilepath);
        } else {
          documentPaths = [nodeFilepath];
        }
      }
    }
    if(documentPaths) {
      return documentPaths;
    }
    return [];
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
  newDocument(documentName:string) {
    console.log("New document called");
    const newId = this.getUniqueId();
    const newNodePath = SmoresDataFile.getNodeFilepath(newId);
    const newDocument = new SmoresDataFile(newNodePath);
    const newDocumentData:smoresDataSchema.DocumentDataModel = {
      id:newId,
      category:"document",
      text:documentName,
      parent:null
    };
    newDocument.data = newDocumentData;
    newDocument.write();
    this.data.documentIds.push(newId);
    this.write();
  }


}