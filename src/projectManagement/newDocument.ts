import * as vscode from 'vscode';
import { getProject } from '../model/smoresProject';
import { SmoresNode } from '../model/smoresNode';
import { createNodesForSRSFull, createNodesForSRSMini } from './documentTemplates/srsTemplate';
import { createNodesForURSFull, createNodesForURSMini } from './documentTemplates/ursTemplate';
import { createNodesForSTPFull, createNodesForSTPMini } from './documentTemplates/stpTemplate';

async function getDocumentType():Promise<string|undefined> {
  const documentTypes:string[] = [
    "Empty document",
    // "User Requirements Specification",
    "Software Requirements Specification",
    // "Architecture Design Specification",
    // "Detailed Design Specification",
    // "Software Acceptance Test Protocol",
    // "Software System Test Protocol",
    // "Software Integration Test Protocol",
    // "Software Unit Test Protocol"
  ];

  return await vscode.window.showQuickPick(documentTypes,{
    canPickMany:false
  });      
}
async function getDocumentTitle():Promise<string|undefined> {
  return await vscode.window.showInputBox({
    prompt:"Enter document title",
    placeHolder:"Document title"
  });
}
function createDocument(title:string, docType:string):string|undefined {
  const project = getProject();
  if(project) {
    return project.newDocument(title, docType);
  }
  return undefined;
}

function createTemplateNodes(docNode:SmoresNode, docType:string) {
  switch(docType) {
    case "Empty Document":
      break;
    case "User Requirements Specification (Mini)":
      createNodesForURSMini(docNode);
      break;
    case "Software Requirements Specification (Full)":
      createNodesForSRSFull(docNode);
      break;
    case "Software Requirements Specification (Mini)":
      createNodesForSRSMini(docNode);
      break;
      // case "Architecture Design Specification":
    // case "Detailed Design Specification":
    // case "Software Acceptance Test Protocol":
    case "Software System Test Protocol (Mini)":
      createNodesForSTPMini(docNode);
      break;
    // case "Software Integration Test Protocol":
    // case "Software Unit Test Protocol":

  }
}

export async function newDocumentFromTemplate() {
  const title = await getDocumentTitle();
  if(title === undefined) {
    return;
  }
  const docType = await getDocumentType();
  if(docType === undefined) {
    return;
  }
  const docFilePath = createDocument(title, docType);
  if(docFilePath === undefined) {
    return;
  }  
  const documentNode = new SmoresNode(docFilePath);
  createTemplateNodes(documentNode, docType);
}