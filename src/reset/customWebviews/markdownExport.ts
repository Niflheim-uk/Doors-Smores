import { join } from "path";
import { DocumentNode } from "../model/documentNode";
import * as schema from '../model/schema';
import * as vscode from 'vscode';
import { existsSync } from "fs";

type TableParts = {
  row1:string;
  divider:string;
  row2:string;
};
export async function getMdForDocument(node:DocumentNode):Promise<string> {
  return await getMdForDocumentNode(node, 0);
}

async function getMdForDocumentNode(node:DocumentNode, headingDepth:number):Promise<string> {
  let mdString = "";
  mdString = mdString.concat(await getMdForCategory(node, headingDepth));
  if(node.data.children.length > 0) {
    headingDepth++;
    for(let i=0; i<node.data.children.length; i++) {
      const child = DocumentNode.createFromId(node.data.children[i]);
      if(child) {
        mdString = mdString.concat(await getMdForDocumentNode(child, headingDepth));
      }
    }
  }
  return mdString;
}

async function getMdForCategory(node:DocumentNode, headingDepth:number):Promise<string> {
  if(node.data.category === schema.documentCategory) {
    return getMdForDocumentCategory(node);
  } else if(node.data.category === schema.headingCategory) {
    return getMdForHeadingCategory(node, headingDepth);
  } else if(node.data.category === schema.commentCategory) {
    return getMdForCommentCategory(node);
  } else if(schema.isFuncReqCategory(node.data.category) || schema.isNonFuncReqCategory(node.data.category)) {
    return getMdForRequirementCategory(node);
  } else if(schema.isConstraintCategory(node.data.category)) {
    return getMdForConstraintCategory(node);
  } else if(schema.isTestCategory(node.data.category)) {
    return getMdForTestCategory(node);
  } else if(node.data.category === schema.mermaidCategory) {
    return getMdForMermaidImageCategory(node);
  } else if(node.data.category === schema.imageCategory) {
    return await getMdForImageCategory(node);
  } else {
    return `Unknown category for node ${node.data.id}    \n`;
  }
}
function getMdForDocumentCategory(node:DocumentNode):string {
  return `# ${node.data.documentData?.documentType} - ${node.data.text}\n`;
}
function getMdForHeadingCategory(node:DocumentNode, headingDepth:number):string {
  let bangs='';
  for(let i=0; i<headingDepth; i++) {
    bangs = bangs.concat('#');
  }
  return `${bangs} ${node.data.text}    \n`;
}
function getMdForCommentCategory(node:DocumentNode):string {
  return `${node.data.text}    \n\n`;
}
function getMdForRequirementCategory(node:DocumentNode):string {
  const text = node.data.text.replace("\n",'<br/>');
  let rationale = node.data.requirementData?.translationRationale;
  if(rationale) {
    rationale = rationale.replace("\n",'<br/>');
  }
  const parts = getTableParts(`Requirement ${node.data.id}`,text,"Translation rationale",`${rationale}`);
  return `${parts.row1}    \n${parts.divider}    \n${parts.row2}    \n\n`;
}
function getMdForConstraintCategory(node:DocumentNode):string {
  const text = node.data.text.replace("\n",'<br/>');
  let rationale = node.data.requirementData?.translationRationale;
  if(rationale) {
    rationale = rationale.replace("\n",'<br/>');
  }
  const parts = getTableParts(`Constraint ${node.data.id}`,text,"Translation rationale",`${rationale}`);
  return `${parts.row1}    \n${parts.divider}    \n${parts.row2}    \n\n`;
}
function getMdForTestCategory(node:DocumentNode):string {
  const text = node.data.text.replace(/\n/g,'<br/>');
  let results = node.data.testData?.expectedResults;
  if(results) {
    results = results.replace(/\n/g,'<br/>');
  }
  const parts = getTableParts(`Test case ${node.data.id}`,text,"Expected results",`${results}`);
  return `${parts.row1}    \n${parts.divider}    \n${parts.row2}    \n\n`;
}
function getMdForMermaidImageCategory(node:DocumentNode):string {
  return `Mermaid ${node.data.id}:    \n\`\`\`\n${node.data.text}\n\`\`\`\n\n`;
}
async function getMdForImageCategory(node:DocumentNode):Promise<string> {
  const imageFilepath = join(node.getDirPath(), `${node.data.text}`);
  if (existsSync(imageFilepath)){
    const fileStat = await vscode.workspace.fs.stat(vscode.Uri.file(imageFilepath));
    const creationDate = new Date(fileStat.ctime).toDateString();
    const modifyDate = new Date(fileStat.mtime).toDateString();
    return `Image ${node.data.id}:    \n\`\`\`\nFile: ${node.data.text}    \nSize: ${fileStat.size}    \nCreated: ${creationDate}    \nModified: ${modifyDate}\n\`\`\`\n\n`;
  } else {
    return `Image ${node.data.id}:    \n\`\`\`\nFile: ${node.data.text} (Not found)\n\`\`\`\n\n`;
  }
}

function getPadding(fullWidth:number, consumedWidth:number):string {
  let padding = "";
  for(let i=0; i<(fullWidth - consumedWidth); i++) {
    padding = padding.concat(' ');
  }
  return padding;
}
function getDivider(col1Width:number, col2Width:number):string {
  let divider = "|";
  for(let i=0; i<col1Width; i++) {
    divider = divider.concat("-");
  }  
  divider = divider.concat("|");
  for(let i=0; i<col2Width; i++) {
    divider = divider.concat("-");
  }  
  divider = divider.concat("|");
  return divider;
}
function getTableParts(cell11:string,cell12:string,cell21:string,cell22:string):TableParts {
  const cell11Width = cell11.length + 2 /*spaces*/ + 2 /*italics*/;
  const cell12Width = cell12.length + 2 /*spaces*/;
  const cell21Width = cell21.length + 2 /*spaces*/ + 2 /*italics*/ + 4 /*bold*/;
  const cell22Width = cell22.length + 2 /*spaces*/ + 4 /*bold*/;
  let col1Width = cell11Width;
  if(col1Width < cell21Width) {
    col1Width = cell21Width;
  }
  let col2Width = cell12Width;
  if(col2Width < cell22Width) {
    col2Width = cell22Width;
  }
  const c11 = ` _${cell11}_ ${getPadding(col1Width, cell11Width)}`;
  const c12 = ` ${cell12} ${getPadding(col2Width, cell12Width)}`;
  const c21 = ` ___${cell21}___ ${getPadding(col1Width, cell21Width)}`;
  const c22 = ` __${cell22}__ ${getPadding(col2Width, cell22Width)}`;
  const tableParts:TableParts = {
    row1:`|${c11}|${c12}|`,
    divider:getDivider(col1Width, col2Width),
    row2:`|${c21}|${c22}|`
  };
  return tableParts;
}
