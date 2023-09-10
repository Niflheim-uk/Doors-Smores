import * as vscode from "vscode";
import * as schema from "./schema"
import { SmoresFile } from "./smoresFile";
import { DoorsSmores } from "../doorsSmores";
import { DocumentNode, DocumentNodeData } from "./documentNode";
import { documentCategory } from "./schema";
import { VersionController } from "../versionControl/versionController";
import { join } from "path";
import { getMdForDocument } from "../customWebviews/markdownExport";
import { writeFileSync } from "fs";
import { SmoresDocument } from "./smoresDocument";

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
export class SmoresProject extends SmoresFile {
  declare readonly data:ProjectDataModel;
  constructor (filepath:string) {
    super(filepath);
    if(this.setDefaults()) {
      this.setDefaultImage();
    }
  }
  getDocuments():SmoresDocument[] {
    let documents:SmoresDocument[] = [];
    if(this.data.documentIds && this.data.documentIds.length > 0) {
      const documentIds = this.data.documentIds;
      for (let index = 0; index < documentIds.length; index++) {
        const document:SmoresDocument = SmoresDocument.createDocumentFromId(documentIds[index]);
        documents.push(document);
      }
    }
    return documents;
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
  newDocument(documentName:string, documentType:string):SmoresDocument {
    const documentId = this.getUniqueId();
    const newDocument:SmoresDocument = SmoresDocument.createDocumentFromId(documentId);
    const newDocumentData:DocumentNodeData = {
      id:documentId,
      category:documentCategory,
      text:documentName,
      parent:0,
      children:[],
      traces:{traceIds:[],suspectIds:[]},
      documentData:{documentType}
    };
    newDocument.data = newDocumentData;
    newDocument.write();
    this.data.documentIds.push(documentId);
    this.write();
    return newDocument;
  }

  deleteDocument(documentId:number) {
    let change = false;
    if(SmoresFile.exists(documentId)) {
      const document:SmoresDocument = SmoresDocument.createDocumentFromId(documentId);
      document.delete();
      change = true;
    }
    const idPos = this.data.documentIds.findIndex(id => documentId === id);
    if(idPos >= 0) {
      this.data.documentIds.splice(idPos,1);
      change = true;
      this.write();
    }
    if(change) {
      VersionController.commitChanges(`Document ${documentId} and child nodes deleted`);
    }
  }
  exportAll() {
    if(this.data.documentIds && this.data.documentIds.length > 0) {
      const documentIds = this.data.documentIds;
      for(let i=0; i<documentIds.length; i++) {
        const document:DocumentNode = DocumentNode.createFromId(documentIds[i]);
        this.exportDocument(document);
      }
    }
  }
  public static ursExists ():boolean {
    return SmoresProject.docTypeExists(schema.ursDocType);
  }
  public static srsExists ():boolean {
    return SmoresProject.docTypeExists(schema.srsDocType);
  }
  public static adsExists ():boolean {
    return SmoresProject.docTypeExists(schema.adsDocType);
  }
  public static ddsExists ():boolean {
    return SmoresProject.docTypeExists(schema.ddsDocType);
  }
  public static atpExists ():boolean {
    return SmoresProject.docTypeExists(schema.atpDocType);
  }
  public static stpExists ():boolean {
    return SmoresProject.docTypeExists(schema.stpDocType);
  }
  public static itpExists ():boolean {
    return SmoresProject.docTypeExists(schema.itpDocType);
  }
  public static utpExists ():boolean {
    return SmoresProject.docTypeExists(schema.utpDocType);
  }

  private static docTypeExists(docType:string) {
    const activeProject = DoorsSmores.getActiveProject();
    if(activeProject) {
      const documents = activeProject.getDocuments();
      for(let i=0; i<documents.length; i++) {
        if(documents[i].getDocumentType() === docType) {
          return true;
        }
      }
    }
    return false;
  }
  private async exportDocument(document:DocumentNode) {
    const defaultFilename = `${document.data.text}.Md`;
    const filePath = join(this.getDirPath(), defaultFilename);
    const content = await getMdForDocument(document!);
    writeFileSync(filePath, content);
  }
  private async createDataDir() {
    const dataPath = join(this.getDirPath(), SmoresFile.dataSubDirName);
    const dataUri = vscode.Uri.file(dataPath);
    await vscode.workspace.fs.createDirectory(dataUri);
  }
  private async setDefaultImage() {
    await this.createDataDir();
    const srcPath = join(DoorsSmores.getExtensionPath(), 'resources', SmoresFile.defaultImage);
    const srcUri = vscode.Uri.file(srcPath);
    const destPath = join(this.getDirPath(), SmoresFile.dataSubDirName, SmoresFile.defaultImage);
    const destUri = vscode.Uri.file(destPath);
    vscode.workspace.fs.copy(srcUri, destUri, {overwrite:true});
  }
  private setDefaults():boolean {
    let change = false;
    if(this.data.idBase === undefined) {
      this.data.idBase = 10000;
      this.data.maxContributors = 100;
      this.data.gitInUse = false;
      this.data.repoPathspec = "";
      this.data.repoRoot = "";
      this.data.knownContributors = [];
      this.data.uniqueIds = [];
      this.data.documentIds = [];
      change = true;
    }
    if(change) {
      this.write();
    }
    // empty arrays don't get saved
    if(this.data.knownContributors === undefined) {
      this.data.knownContributors = [];
    }
    if(this.data.uniqueIds === undefined) {
      this.data.uniqueIds = [];
    }
    if(this.data.documentIds === undefined) {
      this.data.documentIds = [];
    }
    return change;
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