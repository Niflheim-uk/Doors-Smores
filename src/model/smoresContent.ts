import { Uri, Webview } from "vscode";
import { join } from "path";
import { existsSync } from "fs";
import { FileIO } from "./fileIO";
import { Settings } from "../interface/settings";
import { SmoresDocument } from "./smoresDocument";
import { SmoresContentData, imageCategory, isConstraintCategory, isFuncReqCategory, isNonFuncReqCategory, isTestCategory, mermaidCategory } from "./schema";
import * as markdown from '../interface/markdownConversion';
import * as schema from './schema';
import { getDownstreamTraceRow, getTestsTraceRow, getUpstreamTraceRow } from "../tracing/traceReportContent";

const badHtml = '<h3>Failed to parse content node</h3>';

export class SmoresContent {
	public data:SmoresContentData|undefined;
	constructor(public filepath:string) {
    this.data = this.getData();
	}
  private getData():SmoresContentData|undefined {
    return FileIO.readXmlContentFile(this.filepath);
  }
  public updateData() {
    this.data = this.getData();
  }
  public static getHtml(doc:SmoresDocument, id:number, webview?:Webview):string {
    const dataRoot = FileIO.getContentRoot(doc);
    const itemPath = FileIO.getContentFilepath(doc, id);
    if(dataRoot === undefined || itemPath === undefined) { return badHtml; }
    const item = new SmoresContent(itemPath);
    return item.getItemHtml(doc, webview);
  }
  public static getEditHtml(doc:SmoresDocument, id:number, webview?:Webview):string {
    const dataRoot = FileIO.getContentRoot(doc);
    const itemPath = FileIO.getContentFilepath(doc, id);
    if(dataRoot === undefined || itemPath === undefined) { return badHtml; }
    const item = new SmoresContent(itemPath);
    return item.getEditItemHtml(doc, webview);
  }
  private getItemHtml(doc:SmoresDocument, webview?:Webview):string {
    if(this.data === undefined) { return badHtml; }
    let itemText = badHtml;
    switch(this.data.category) {
    case schema.userFRCategory:
    case schema.softFRCategory:
    case schema.archFRCategory:
    case schema.desFRCategory:
    case schema.userNFRCategory:
    case schema.softNFRCategory:
    case schema.archNFRCategory:
    case schema.desNFRCategory:
      itemText = this.getRequirementHtml(doc);
      break;
    case schema.userDCCategory:
    case schema.softDCCategory:
    case schema.archDCCategory:
    case schema.desDCCategory:
      itemText = this.getConstraintHtml(doc);
      break;
    case schema.userTestCategory:
    case schema.softTestCategory:
    case schema.archTestCategory:
    case schema.desTestCategory:
      itemText = this.getTestHtml(doc);
      break;
    case schema.imageCategory:
      itemText = this.getImageHtml(doc, webview);
      break;
    case schema.mermaidCategory:
      itemText = this.getMermaidHtml(doc, webview);
      break;
    }
    return itemText;
  }
  private getEditItemHtml(doc:SmoresDocument, webview?:Webview):string {
    if(this.data === undefined) { return badHtml; }
    let itemText = badHtml;
    switch(this.data.category) {
    case schema.userFRCategory:
    case schema.softFRCategory:
    case schema.archFRCategory:
    case schema.desFRCategory:
    case schema.userNFRCategory:
    case schema.softNFRCategory:
    case schema.archNFRCategory:
    case schema.desNFRCategory:
      itemText = this.getRequirementEditHtml(doc);
      break;
    case schema.userDCCategory:
    case schema.softDCCategory:
    case schema.archDCCategory:
    case schema.desDCCategory:
      itemText = this.getConstraintEditHtml(doc);
      break;
    case schema.userTestCategory:
    case schema.softTestCategory:
    case schema.archTestCategory:
    case schema.desTestCategory:
      itemText = this.getTestEditHtml(doc);
      break;
    case schema.imageCategory:
      itemText = this.getImageHtml(doc, webview);
      break;
    case schema.mermaidCategory:
      itemText = this.getMermaidHtml(doc, webview);
      break;
    }
    return itemText;
  }
  public getIdLabelHtml() {
    if(this.data === undefined) { return badHtml; }
    
    if(isFuncReqCategory(this.data.category) || isNonFuncReqCategory(this.data.category)) {
      return `Requirement<br/>Id:${this.data.id}`;
    } else if(isConstraintCategory(this.data.category)) {
      return `Constraint<br/>Id:${this.data.id}`;
    } else if(isTestCategory(this.data.category)) {
      return `Test Case<br/>Id:${this.data.id}`;
    } else if(this.data.category === imageCategory || this.data.category === mermaidCategory) {
      return `Image<br/>Id:${this.data.id}`;
    }
    return "";
  }
  
  private getImageHtml(doc:SmoresDocument, webview?:Webview) {
    const contentRoot = FileIO.getContentRoot(doc);
    if(contentRoot === undefined || this.data === undefined) { return badHtml; }
    const imageFilePath = join(contentRoot, this.data.content.relativePath);
    var imageFileUri = Uri.file(imageFilePath);
    if(webview) {
      imageFileUri = webview.asWebviewUri(imageFileUri);
    }
    return `
    <div Id='image-${this.data.id}' class='imageHolder'>
      <img src="${imageFileUri}"/>
    </div>`;
  }
  
  private getMermaidHtml(doc:SmoresDocument, webview?:Webview) {
    const contentRoot = FileIO.getContentRoot(doc);
    if(contentRoot === undefined || this.data === undefined) { return badHtml; }
    const renderedFilepath = join(contentRoot, 'images', `${this.data.id}-rendered.svg`);
    var html;
    if(existsSync(renderedFilepath)) {
      var imageFileUri = Uri.file(renderedFilepath);
      if(webview) {
        imageFileUri = webview.asWebviewUri(imageFileUri);
      }
      html = `<img src="${imageFileUri}"/>`;
    } else {
      html = `<pre class="mermaid" id="mermaid-${this.data.id}">
        ${this.data.content.text}
      </pre>`;
    }
    return `
    <div class="imageHolder">
      ${html}
    </div>`;
  }
  
  private getRequirementHtml(doc:SmoresDocument):string {
    const row1 = this.getFirstRow();
    const row2 = this.getTranslationRationaleRow();
    return this.getTracableItemHtml(doc, row1, row2);
  }
  private getConstraintHtml(doc:SmoresDocument):string {
    return this.getRequirementHtml(doc);
  }
  private getTestHtml(doc:SmoresDocument):string {
    const row1 = this.getFirstRow();
    const row2 = this.getExpectedResultsRow();
    return this.getTracableItemHtml(doc, row1, row2);
  }
  private getRequirementEditHtml(doc:SmoresDocument):string {
    const row1 = this.getFirstEditRow();
    const row2 = this.getTranslationRationaleEditRow();
    return this.getTracableItemEditHtml(doc, row1, row2);
  }
  private getConstraintEditHtml(doc:SmoresDocument):string {
    return this.getRequirementEditHtml(doc);
  }
  private getTestEditHtml(doc:SmoresDocument):string {
    const row1 = this.getFirstEditRow();
    const row2 = this.getExpectedResultsEditRow();
    return this.getTracableItemEditHtml(doc, row1, row2);
  }
  private getTracableItemHtml(doc:SmoresDocument, row1:string, row2:string):string {
    if(doc.data === undefined || this.data === undefined) { return badHtml; }
    const documentType = doc.data.type;
    let upstreamRow:string = "";
    let testTraceRow:string = "";
    let downstreamRow:string = "";

    if(Settings.getIncludeTracing()) {
      upstreamRow = getUpstreamTraceRow(doc, this.data);
      testTraceRow = getTestsTraceRow(doc, this.data);
      downstreamRow = getDownstreamTraceRow(doc, this.data);
    }
    return `
    <table class="indented2ColSmall indented">
      <tbody>
        ${row1}
        ${row2}
        ${upstreamRow}
        ${testTraceRow}
        ${downstreamRow}
      </tbody>
    </table>`;
  }
  private getTracableItemEditHtml(doc:SmoresDocument, row1:string, row2:string):string {
    if(doc.data === undefined || this.data === undefined) { return badHtml; }
    return `
    <table class="indented2ColSmall indented">
      <tbody>
        ${row1}
        ${row2}
      </tbody>
    </table>`;
  }
  private getTextArea(initialText:string) {
    return `
    		<div class="autogrow" data-replicated-value="${initialText}">
		    	<textarea>${initialText}</textarea>
		    </div>`;
  }
  private getFirstRow() {
    if(this.data === undefined) { return badHtml; }
    const c1 = this.getIdLabelHtml();
    const c2 = markdown.getTableTextHtmlFromMd(this.data.content.text);
    return SmoresContent.getTableRowHtml(c1, c2);
  }
  private getFirstEditRow() {
    if(this.data === undefined) { return badHtml; }
    const c1 = this.getIdLabelHtml();
    const c2 = this.getTextArea(this.data.content.text);
    return SmoresContent.getTableRowHtml(c1, c2);
  }
  private getTranslationRationaleRow() {
    if(this.data === undefined) { return badHtml; }
    let translationRationaleHtml = markdown.getTableTextHtmlFromMd("-");
    if(this.data.content.translationRationale !== "") {
      translationRationaleHtml = markdown.getTableTextHtmlFromMd(this.data.content.translationRationale);
    }
    return SmoresContent.getTableRowHtml("Translation<br/>Rationale", translationRationaleHtml);
  }
  private getTranslationRationaleEditRow() {
    if(this.data === undefined) { return badHtml; }
    const c1 = "Translation<br/>Rationale";
    const c2 = this.getTextArea(this.data.content.translationRationale);
    return SmoresContent.getTableRowHtml(c1, c2);
  }
  private getExpectedResultsRow() {
    if(this.data === undefined) { return badHtml; }
    let expectedResultsHtml = markdown.getTableTextHtmlFromMd("TBD");
    if(this.data.content.expectedResults !== "") {
      expectedResultsHtml = markdown.getTableTextHtmlFromMd(this.data.content.expectedResults);
    }
    return SmoresContent.getTableRowHtml("Expected<br/>Results", expectedResultsHtml);
  }
  private getExpectedResultsEditRow() {
    if(this.data === undefined) { return badHtml; }
    const c1 = "Expected<br/>Results";
    const c2 = this.getTextArea(this.data.content.expectedResults);
    return SmoresContent.getTableRowHtml(c1, c2);
  }
  public static getTableRowHtml(c1:string, c2:string) {
    return `<tr><td class="tableSmall">${c1}</td><td>${c2}</td></tr>`;
  }
  
  
}
