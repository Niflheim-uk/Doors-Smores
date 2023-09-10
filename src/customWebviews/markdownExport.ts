import { join } from "path";
import { DocumentNode } from "../model/documentNode";
import * as schema from '../model/schema';
import * as vscode from 'vscode';
import { existsSync } from "fs";

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
    return `Unknown category for node ${node.data.id}`;
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
  return `${bangs} ${node.data.text}\n`;
}
function getMdForCommentCategory(node:DocumentNode):string {
  return `${node.data.text}\n`;
}
function getMdForRequirementCategory(node:DocumentNode):string {
  const text = node.data.text.replace("\n",'<br/>');
  let rationale = node.data.requirementData?.translationRationale;
  if(rationale) {
    rationale = rationale.replace("\n",'<br/>');
  }
  return `| | |
|-|-|
|__Requirement ${node.data.id}__|${text}|
|__Translation rationale__|${rationale}|\n`;
}
function getMdForConstraintCategory(node:DocumentNode):string {
  const text = node.data.text.replace("\n",'<br/>');
  let rationale = node.data.requirementData?.translationRationale;
  if(rationale) {
    rationale = rationale.replace("\n",'<br/>');
  }
  return `| | |
|-|-|
|__Constraint ${node.data.id}__|${text}|
|__Translation rationale__|${rationale}|\n`;
}
function getMdForTestCategory(node:DocumentNode):string {
  const text = node.data.text.replace(/\n/g,'<br/>');
  let results = node.data.testData?.expectedResults;
  if(results) {
    results = results.replace(/\n/g,'<br/>');
  }
  return `| | |
|-|-|
|__Test case ${node.data.id}__|${text}|
|__Expected results__|${results}|\n`;
}
function getMdForMermaidImageCategory(node:DocumentNode):string {
  return `${node.data.text}\n`;
}
async function getMdForImageCategory(node:DocumentNode):Promise<string> {
  const imageFilepath = join(node.getDirPath(), `${node.data.text}`);
  if (existsSync(imageFilepath)){
    const fileStat = await vscode.workspace.fs.stat(vscode.Uri.file(imageFilepath));
    const creationDate = new Date(fileStat.ctime).toDateString();
    const modifyDate = new Date(fileStat.mtime).toDateString();
    return `Image file: ${node.data.text}\nSize: ${fileStat.size}\nCreated: ${creationDate}\nModified: ${modifyDate}\n`;
  } else {
    return `Image file: ${node.data.text} (Not found)`;
  }
}
