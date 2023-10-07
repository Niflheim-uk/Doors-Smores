import { TextDocument, Webview } from 'vscode';
import { FileIO } from './fileIO';
import { SmoresDocumentData, SmoresProjectData } from './schema';
import * as schema from './schema';
import { HTML } from '../interface/html';
import { basename, dirname, extname, join } from 'path';
import { SmoresDocument } from './smoresDocument';

const badHtml = '<h1>Invalid projecct document</h1>';

export class SmoresProject {
	public data:SmoresProjectData|undefined;
	constructor(public document:TextDocument) {
    this.data = this.getData();
	}
  private getData():SmoresProjectData|undefined {
    return FileIO.parseProjectRawXml(this.document.getText());
  }
  public updateData() {
    this.data = this.getData();
  }
	public static ursExists (documentInfos:schema.DocumentInfo[]):boolean {
    return SmoresProject.docTypeExists(documentInfos, schema.ursDocType);
  }
  public static srsExists (documentInfos:schema.DocumentInfo[]):boolean {
    return SmoresProject.docTypeExists(documentInfos, schema.srsDocType);
  }
  public static adsExists (documentInfos:schema.DocumentInfo[]):boolean {
    return SmoresProject.docTypeExists(documentInfos, schema.adsDocType);
  }
  public static ddsExists (documentInfos:schema.DocumentInfo[]):boolean {
    return SmoresProject.docTypeExists(documentInfos, schema.ddsDocType);
  }
  public static atpExists (documentInfos:schema.DocumentInfo[]):boolean {
    return SmoresProject.docTypeExists(documentInfos, schema.atpDocType);
  }
  public static stpExists (documentInfos:schema.DocumentInfo[]):boolean {
    return SmoresProject.docTypeExists(documentInfos, schema.stpDocType);
  }
  public static itpExists (documentInfos:schema.DocumentInfo[]):boolean {
    return SmoresProject.docTypeExists(documentInfos, schema.itpDocType);
  }
  public static utpExists (documentInfos:schema.DocumentInfo[]):boolean {
    return SmoresProject.docTypeExists(documentInfos, schema.utpDocType);
  }

  private static docTypeExists(documentInfos:schema.DocumentInfo[], docType:string) {
    for(let i=0; i<documentInfos.length; i++) {
      if(documentInfos[i].type === docType) {
        return true;
      }
    }
    return false;
  }
	public static getURSInfos (documentInfos:schema.DocumentInfo[]):schema.DocumentInfo[] {
    return SmoresProject.getDocTypeInfos(documentInfos, schema.ursDocType);
  }
  public static getSRSInfos (documentInfos:schema.DocumentInfo[]):schema.DocumentInfo[] {
    return SmoresProject.getDocTypeInfos(documentInfos, schema.srsDocType);
  }
  public static getADSInfos (documentInfos:schema.DocumentInfo[]):schema.DocumentInfo[] {
    return SmoresProject.getDocTypeInfos(documentInfos, schema.adsDocType);
  }
  public static getDDSInfos (documentInfos:schema.DocumentInfo[]):schema.DocumentInfo[] {
    return SmoresProject.getDocTypeInfos(documentInfos, schema.ddsDocType);
  }
  public static getATPInfos (documentInfos:schema.DocumentInfo[]):schema.DocumentInfo[] {
    return SmoresProject.getDocTypeInfos(documentInfos, schema.atpDocType);
  }
  public static getSTPInfos (documentInfos:schema.DocumentInfo[]):schema.DocumentInfo[] {
    return SmoresProject.getDocTypeInfos(documentInfos, schema.stpDocType);
  }
  public static getITPInfos (documentInfos:schema.DocumentInfo[]):schema.DocumentInfo[] {
    return SmoresProject.getDocTypeInfos(documentInfos, schema.itpDocType);
  }
  public static getUTPInfos (documentInfos:schema.DocumentInfo[]):schema.DocumentInfo[] {
    return SmoresProject.getDocTypeInfos(documentInfos, schema.utpDocType);
  }

  private static getDocTypeInfos(documentInfos:schema.DocumentInfo[], docType:string) {
    let result:schema.DocumentInfo[] = [];
    for(let i=0; i<documentInfos.length; i++) {
      if(documentInfos[i].type === docType) {
        result.push(documentInfos[i]);
      }
    }
    return result;
  }

  public static getProjectNameFromFilepath(projectFilepath:string):string {
    const extension = extname(projectFilepath);
    const name = basename(projectFilepath, extension);
    return name;
  }
}
