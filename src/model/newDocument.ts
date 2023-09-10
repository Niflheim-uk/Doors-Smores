import * as vscode from 'vscode';
import { DocumentNode } from './documentNode';
import * as schema from './schema';
import { createNodesForURSFull, createNodesForURSMini } from './documentTemplates/ursTemplate';
import { createNodesForSRSFull, createNodesForSRSMini } from './documentTemplates/srsTemplate';
import { createNodesForADSFull, createNodesForADSMini } from './documentTemplates/adsTemplate';
import { createNodesForDDSFull, createNodesForDDSMini } from './documentTemplates/ddsTemplate';
import { createNodesForATPFull, createNodesForATPMini } from './documentTemplates/atpTemplate';
import { createNodesForSTPFull, createNodesForSTPMini } from './documentTemplates/stpTemplate';
import { createNodesForITPFull, createNodesForITPMini } from './documentTemplates/itpTemplate';
import { createNodesForUTPFull, createNodesForUTPMini } from './documentTemplates/utpTemplate';
import { VersionController } from '../versionControl/versionController';
import { DoorsSmores, ProjectInfo } from '../doorsSmores';


async function quickPickDocumentType():Promise<string|undefined> {
  const documentTypes:string[] = [
    `Empty document`,
    `${schema.ursDocType} (Mini)`,
    `${schema.ursDocType} (Full)`,
    `${schema.srsDocType} (Mini)`,
    `${schema.srsDocType} (Full)`,
    `${schema.adsDocType} (Mini)`,
    `${schema.adsDocType} (Full)`,
    `${schema.ddsDocType} (Mini)`,
    `${schema.ddsDocType} (Full)`,
    `${schema.atpDocType} (Mini)`,
    `${schema.atpDocType} (Full)`,
    `${schema.stpDocType} (Mini)`,
    `${schema.stpDocType} (Full)`,
    `${schema.itpDocType} (Mini)`,
    `${schema.itpDocType} (Full)`,
    `${schema.utpDocType} (Mini)`,
    `${schema.utpDocType} (Full)`,
  ];

  return await vscode.window.showQuickPick(documentTypes,{
    canPickMany:false
  });      
}
function getDocumentType(typeDescription:string) {
  if(typeDescription === 'Empty document') {
    return schema.emptyDocType;
  } else {
    return typeDescription.replace(' (Full)','').replace(' (Mini)','');
  }
}
async function getDocumentTitle():Promise<string|undefined> {
  return await vscode.window.showInputBox({
    prompt:"Enter document title",
    placeHolder:"Document title"
  });
}
function createDocument(title:string, docType:string):DocumentNode|undefined {
  const project = DoorsSmores.getActiveProject();
  if(project) {
    return project.newDocument(title, docType);
  }
  return undefined;
}

function createTemplateNodes(docNode:DocumentNode, docType:string) {
  switch(docType) {
    case `${schema.ursDocType} (Mini)`:
      createNodesForURSMini(docNode);
      break;
    case `${schema.ursDocType} (Full)`:
      createNodesForURSFull(docNode);
      break;
    case `${schema.srsDocType} (Mini)`:
      createNodesForSRSMini(docNode);
      break;
    case `${schema.srsDocType} (Full)`:
      createNodesForSRSFull(docNode);
      break;
    case `${schema.adsDocType} (Mini)`:
      createNodesForADSMini(docNode);
      break;
    case `${schema.adsDocType} (Full)`:
      createNodesForADSFull(docNode);
      break;
    case `${schema.ddsDocType} (Mini)`:
      createNodesForDDSMini(docNode);
      break;
    case `${schema.ddsDocType} (Full)`:
      createNodesForDDSFull(docNode);
      break;
    case `${schema.atpDocType} (Mini)`:
      createNodesForATPMini(docNode);
      break;
    case `${schema.atpDocType} (Full)`:
      createNodesForATPFull(docNode);
      break;
    case `${schema.stpDocType} (Mini)`:
      createNodesForSTPMini(docNode);
      break;
    case `${schema.stpDocType} (Full)`:
      createNodesForSTPFull(docNode);
      break;
    case `${schema.itpDocType} (Mini)`:
      createNodesForITPMini(docNode);
      break;
    case `${schema.itpDocType} (Full)`:
      createNodesForITPFull(docNode);
      break;
    case `${schema.utpDocType} (Mini)`:
      createNodesForUTPMini(docNode);
      break;
    case `${schema.utpDocType} (Full)`:
      createNodesForUTPFull(docNode);
      break;
    default:
      break;
  }
}

export async function newDocument():Promise<DocumentNode|undefined> {
  const title = await getDocumentTitle();
  if(title === undefined) {
    return;
  }
  const docTypeFull = await quickPickDocumentType();
  if(docTypeFull === undefined) {
    return;
  }
  const docType = getDocumentType(docTypeFull);
  const documentNode = createDocument(title, docType);
  if(documentNode === undefined) {
    return;
  }  
  createTemplateNodes(documentNode, docTypeFull);
  VersionController.commitChanges(`New ${docTypeFull} created`);
  return documentNode;
}