import * as vscode from "vscode";
import {NodeDataModel} from "./smoresDataSchema";
import * as fs from "fs";
import * as path from "path";
import { SmoresDataFile } from "./smoresDataFile";
import { getExtensionBasedUri } from "../utils/getExtension";

export interface ProjectDataModel {
  idBase: number;
  gitInUse: boolean;
  repoRoot?: string;
  repoPathspec?: string;
  maxContributors: number;
  knownContributors: string[];
  uniqueIds: number[];
  documentIds: number[];
}
export function getProject():SmoresProject|undefined {
  const projectFilepath = SmoresDataFile.getProjectFilepath();
  if(projectFilepath) {
    return new SmoresProject(projectFilepath);
  }
  return undefined;
}
export class SmoresProject extends SmoresDataFile {
  declare readonly data:ProjectDataModel;
  constructor (readonly projectFilepath:fs.PathLike) {
    super(projectFilepath);
    SmoresDataFile.setProjectFilepath(projectFilepath);
    if(this.setDefaults()) {
      this.setDefaultImage();
    }
  }
  private setDefaultImage() {
    const imageSrcUri = getExtensionBasedUri(['resources', 'defaultImage.jpg']);
    const projectDataUri = vscode.Uri.file(SmoresDataFile.getDataFilepath());
    const imageDestUri = vscode.Uri.joinPath(projectDataUri, 'defaultImage.jpg');
    vscode.workspace.fs.copy(imageSrcUri, imageDestUri, {overwrite:true});
  }
  private setDefaults():boolean {
    let change = false;
    if(this.data.idBase === undefined) {
      this.data.idBase = 10000;
      change = true;
    }
    if(this.data.gitInUse === undefined) {
      this.data.gitInUse = false;
    }
    if(this.data.maxContributors === undefined) {
      this.data.maxContributors = 100;
      change = true;
    }
    if(change) {
      this.write();
    }
    return change;
  }
  verifyId(nodeId:number):boolean {
    const nodePath = SmoresDataFile.getNodeFilepath(nodeId);
    if(nodePath) {
      if(fs.existsSync(nodePath)) {
        return true;
      }
    }
    return false;
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
        if(nodeFilepath === undefined) {
          return [];
        }
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
  newDocument(title:string, docType:string): string|undefined {
    console.log("New document called");
    const newId = this.getUniqueId();
    const newNodePath = SmoresDataFile.getNodeFilepath(newId);
    if(newNodePath === undefined) {
      return undefined;
    }
    const newDocument = new SmoresDataFile(newNodePath);
    const newDocumentData:NodeDataModel = {
      id:newId,
      category:"document",
      text:title,
      parent:0,
      documentData:{documentType:docType}
    };
    newDocument.data = newDocumentData;
    newDocument.write();
    if(this.data.documentIds && this.data.documentIds.length > 0) {
      this.data.documentIds.push(newId);
    } else {
      this.data.documentIds = [newId];
    }
    this.write();
    return newNodePath;
  }
  deleteDocument(documentId:number) {
    if(this.data.documentIds !== undefined) {
      let docs:number[] = this.data.documentIds;
      const idPos = docs.findIndex(id => documentId === id);
      if(idPos >= 0) {
        this.data.documentIds.splice(idPos,1);
      }
      this.write();
    }
  }




  private getUserId():string {
    return vscode.env.machineId;
  }
  private getUserIndex():number {
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