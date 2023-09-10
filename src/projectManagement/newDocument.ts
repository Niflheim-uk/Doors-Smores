import * as vscode from 'vscode';
import { getProject } from '../model/smoresProject';
import { SmoresNode } from '../model/smoresNode';
import * as smoresDataSchema from '../model/smoresDataSchema';
import { createNodesForURSFull, createNodesForURSMini } from './documentTemplates/ursTemplate';
import { createNodesForSRSFull, createNodesForSRSMini } from './documentTemplates/srsTemplate';
import { createNodesForADSFull, createNodesForADSMini } from './documentTemplates/adsTemplate';
import { createNodesForDDSFull, createNodesForDDSMini } from './documentTemplates/ddsTemplate';
import { createNodesForATPFull, createNodesForATPMini } from './documentTemplates/atpTemplate';
import { createNodesForSTPFull, createNodesForSTPMini } from './documentTemplates/stpTemplate';
import { createNodesForITPFull, createNodesForITPMini } from './documentTemplates/itpTemplate';
import { createNodesForUTPFull, createNodesForUTPMini } from './documentTemplates/utpTemplate';
import { VersionController } from '../versionControl/versionController';


async function quickPickDocumentType():Promise<string|undefined> {
  const documentTypes:string[] = [
    `Empty document`,
    `${smoresDataSchema.ursDocType} (Mini)`,
    `${smoresDataSchema.ursDocType} (Full)`,
    `${smoresDataSchema.srsDocType} (Mini)`,
    `${smoresDataSchema.srsDocType} (Full)`,
    `${smoresDataSchema.adsDocType} (Mini)`,
    `${smoresDataSchema.adsDocType} (Full)`,
    `${smoresDataSchema.ddsDocType} (Mini)`,
    `${smoresDataSchema.ddsDocType} (Full)`,
    `${smoresDataSchema.atpDocType} (Mini)`,
    `${smoresDataSchema.atpDocType} (Full)`,
    `${smoresDataSchema.stpDocType} (Mini)`,
    `${smoresDataSchema.stpDocType} (Full)`,
    `${smoresDataSchema.itpDocType} (Mini)`,
    `${smoresDataSchema.itpDocType} (Full)`,
    `${smoresDataSchema.utpDocType} (Mini)`,
    `${smoresDataSchema.utpDocType} (Full)`,
  ];

  return await vscode.window.showQuickPick(documentTypes,{
    canPickMany:false
  });      
}
function getDocumentType(typeDescription:string) {
  if(typeDescription === 'Empty document') {
    return smoresDataSchema.emptyDocType;
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
function createDocument(title:string, docType:string):string|undefined {
  const project = getProject();
  if(project) {
    return project.newDocument(title, docType);
  }
  return undefined;
}

function createTemplateNodes(docNode:SmoresNode, docType:string) {
  switch(docType) {
    case `${smoresDataSchema.ursDocType} (Mini)`:
      createNodesForURSMini(docNode);
      break;
    case `${smoresDataSchema.ursDocType} (Full)`:
      createNodesForURSFull(docNode);
      break;
    case `${smoresDataSchema.srsDocType} (Mini)`:
      createNodesForSRSMini(docNode);
      break;
    case `${smoresDataSchema.srsDocType} (Full)`:
      createNodesForSRSFull(docNode);
      break;
    case `${smoresDataSchema.adsDocType} (Mini)`:
      createNodesForADSMini(docNode);
      break;
    case `${smoresDataSchema.adsDocType} (Full)`:
      createNodesForADSFull(docNode);
      break;
    case `${smoresDataSchema.ddsDocType} (Mini)`:
      createNodesForDDSMini(docNode);
      break;
    case `${smoresDataSchema.ddsDocType} (Full)`:
      createNodesForDDSFull(docNode);
      break;
    case `${smoresDataSchema.atpDocType} (Mini)`:
      createNodesForATPMini(docNode);
      break;
    case `${smoresDataSchema.atpDocType} (Full)`:
      createNodesForATPFull(docNode);
      break;
    case `${smoresDataSchema.stpDocType} (Mini)`:
      createNodesForSTPMini(docNode);
      break;
    case `${smoresDataSchema.stpDocType} (Full)`:
      createNodesForSTPFull(docNode);
      break;
    case `${smoresDataSchema.itpDocType} (Mini)`:
      createNodesForITPMini(docNode);
      break;
    case `${smoresDataSchema.itpDocType} (Full)`:
      createNodesForITPFull(docNode);
      break;
    case `${smoresDataSchema.utpDocType} (Mini)`:
      createNodesForUTPMini(docNode);
      break;
    case `${smoresDataSchema.utpDocType} (Full)`:
      createNodesForUTPFull(docNode);
      break;
    default:
      break;
  }
}

export async function newDocument() {
  const title = await getDocumentTitle();
  if(title === undefined) {
    return;
  }
  const docTypeFull = await quickPickDocumentType();
  if(docTypeFull === undefined) {
    return;
  }
  const docType = getDocumentType(docTypeFull);
  const docFilePath = createDocument(title, docType);
  if(docFilePath === undefined) {
    return;
  }  
  const documentNode = new SmoresNode(docFilePath);
  createTemplateNodes(documentNode, docTypeFull);
  VersionController.commitChanges(`New ${docTypeFull} created`);
}