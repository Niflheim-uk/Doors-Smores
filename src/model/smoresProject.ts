import { TextDocument, Webview } from 'vscode';
import { FileIO } from './fileIO';
import { SmoresDocumentData, SmoresProjectData } from './schema';
import * as schema from './schema';

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
	public static ursExists (documentFilepaths:string[]):boolean {
    return SmoresProject.docTypeExists(documentFilepaths, schema.ursDocType);
  }
  public static srsExists (documentFilepaths:string[]):boolean {
    return SmoresProject.docTypeExists(documentFilepaths, schema.srsDocType);
  }
  public static adsExists (documentFilepaths:string[]):boolean {
    return SmoresProject.docTypeExists(documentFilepaths, schema.adsDocType);
  }
  public static ddsExists (documentFilepaths:string[]):boolean {
    return SmoresProject.docTypeExists(documentFilepaths, schema.ddsDocType);
  }
  public static atpExists (documentFilepaths:string[]):boolean {
    return SmoresProject.docTypeExists(documentFilepaths, schema.atpDocType);
  }
  public static stpExists (documentFilepaths:string[]):boolean {
    return SmoresProject.docTypeExists(documentFilepaths, schema.stpDocType);
  }
  public static itpExists (documentFilepaths:string[]):boolean {
    return SmoresProject.docTypeExists(documentFilepaths, schema.itpDocType);
  }
  public static utpExists (documentFilepaths:string[]):boolean {
    return SmoresProject.docTypeExists(documentFilepaths, schema.utpDocType);
  }

  private static docTypeExists(documentFilepaths:string[], docType:string) {

    return false;
  }

	public getHtml(webview: Webview):string {
		if(this.data === undefined) {
			return badHtml;
		}
		return 'ToDo';
	}
}