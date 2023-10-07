import { Uri } from "vscode";
import * as schema from '../model/schema';


export class HTML {
  public static getAutogrowDivHtml(initialText:string, blockNumber:number) {
    return `
    <div class="autogrow" data-replicated-value="${initialText}">
      <textarea data-block-number="${blockNumber}">${initialText}</textarea>
    </div>`;
    
  }
  public static getBlockDiv(inner:string, blockNumber:number) {
    return `
    <div class="block" data-block-number="${blockNumber}" id="block${blockNumber}">
      ${inner}
    </div>`;
  }
  
  public static getStandardTableRowHtml(c1:string, c2:string) {
    return HTML.get2ColTableRowHtml(c1, c2, {c1:"tableSmall"});
  }
  public static getStandardTableHtml(rows:string[]):string {
    return HTML.getTableHtml(rows, 'indented2ColSmall indented');
  }
  public static get2ColTableRowHtml(c1:string, c2:string, classes?:{c1?:string, c2?:string}) {
    let class1 = "", class2="";
    if(classes && classes.c1) {
      class1 = ` class="${classes.c1}`;
    }
    if(classes && classes.c2) {
      class2 = ` class="${classes.c2}`;
    }
    return `<tr><td${class1}">${c1}</td><td${class2}">${c2}</td></tr>`;
  }
  public static getTableHtml(rows:string[], tableClass:string):string {
    return `
    <table class="${tableClass}">
      <tbody>
        ${rows.join('\n')}
      </tbody>
    </table>`;
  }
  private static getImageHolderHtml(id:number, inner:string) {
    return `
    <div Id='image-${id}' class='imageHolder'>
      ${inner}
    </div>`;
  }
  public static getImageHtml(id:number, uri:Uri) {
    return HTML.getImageHolderHtml(id, `<img src="${uri}"/>`);
  }
  public static getMermaidHtml(id:number, mermaidText:string) {
    const inner = `<pre class="mermaid" id="mermaid-${id}">
        ${mermaidText}
      </pre>`;
    return HTML.getImageHolderHtml(id, inner);
  }

  public static getIcon(docType:string, category:string) {
    let docColourClass = 'ursLevelIconColour';
		switch(docType) {
		case schema.ursDocType:
		case schema.atpDocType:
			docColourClass = 'ursLevelIconColour';
			break;
		case schema.srsDocType:
		case schema.stpDocType:
			docColourClass = 'srsLevelIconColour';
			break;
		case schema.adsDocType:
		case schema.itpDocType:
			docColourClass = 'adsLevelIconColour';
			break;
		case schema.ddsDocType:
		case schema.utpDocType:
			docColourClass = 'ddsLevelIconColour';
			break;
		}
    switch(category) {
    case schema.userFRCategory:
    case schema.softFRCategory:
    case schema.archFRCategory:
    case schema.desFRCategory:
      return `<i class='codicon codicon-${schema.requirementIcon} FRIconColour'></i>`;

    case schema.userNFRCategory:
    case schema.softNFRCategory:
    case schema.archNFRCategory:
    case schema.desNFRCategory:
      return `<i class='codicon codicon-${schema.requirementIcon} NFRIconColour'></i>`;

    case schema.userDCCategory:
    case schema.softDCCategory:
    case schema.archDCCategory:
    case schema.desDCCategory:
      return `<i class='codicon codicon-${schema.constraintIcon} DCIconColour'></i>`;

    case schema.userTestCategory:
    case schema.softTestCategory:
    case schema.archTestCategory:
    case schema.desTestCategory:
      return `<i class='codicon codicon-${schema.testIcon} ${docColourClass}'></i>`;

    case schema.imageCategory:
      return `<i class='codicon codicon-${schema.imageIcon} imageIconColour'></i>`;

    case schema.mermaidCategory:
      return `<i class='codicon codicon-${schema.imageIcon} mermaidIconColour'></i>`;

    case schema.documentCategory:
      return `<i class='codicon codicon-${schema.documentIcon} ${docColourClass}'></i>`;

    case schema.commentCategory:
      return `<i class='codicon codicon-${schema.textIcon} textIconColour'></i>`;
    }
    return `<i class='codicon codicon-${category} ${docColourClass}'></i>`;
  }
}