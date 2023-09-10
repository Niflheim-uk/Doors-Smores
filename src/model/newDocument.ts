import * as vscode from 'vscode';
import { DocumentNode } from './documentNode';
import * as schema from './schema';
import { createNodesForURSFull} from './documentTemplates/ursTemplate';
import { createNodesForSRSFull, createNodesForSRSMini } from './documentTemplates/srsTemplate';
import { createNodesForADSFull} from './documentTemplates/adsTemplate';
import { createNodesForDDSFull} from './documentTemplates/ddsTemplate';
import { createNodesForATPFull} from './documentTemplates/atpTemplate';
import { createNodesForSTPFull} from './documentTemplates/stpTemplate';
import { createNodesForITPFull} from './documentTemplates/itpTemplate';
import { createNodesForUTPFull} from './documentTemplates/utpTemplate';
import { VersionController } from '../versionControl/versionController';
import { DoorsSmores } from '../doorsSmores';
import { SmoresDocument } from './smoresDocument';


async function quickPickDocumentType():Promise<string|undefined> {
  const documentTypes:string[] = [
    `Empty document`,
    `${schema.ursDocType}`,
    `${schema.srsDocType} (Mini)`,
    `${schema.srsDocType} (Full)`,
    `${schema.adsDocType}`,
    `${schema.ddsDocType}`,
    `${schema.atpDocType}`,
    `${schema.stpDocType}`,
    `${schema.itpDocType}`,
    `${schema.utpDocType}`,
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
function createDocument(title:string, docType:string):SmoresDocument|undefined {
  const project = DoorsSmores.getActiveProject();
  if(project) {
    return project.newDocument(title, docType);
  }
  return undefined;
}

function createTemplateNodes(docNode:DocumentNode, docType:string) {
  switch(docType) {
    case `${schema.ursDocType}`:
      createNodesForURSFull(docNode);
      break;
    case `${schema.srsDocType} (Mini)`:
      createNodesForSRSMini(docNode);
      break;
    case `${schema.srsDocType} (Full)`:
      createNodesForSRSFull(docNode);
      break;
    case `${schema.adsDocType}`:
      createNodesForADSFull(docNode);
      break;
    case `${schema.ddsDocType}`:
      createNodesForDDSFull(docNode);
      break;
    case `${schema.atpDocType}`:
      createNodesForATPFull(docNode);
      break;
    case `${schema.stpDocType}`:
      createNodesForSTPFull(docNode);
      break;
    case `${schema.itpDocType}`:
      createNodesForITPFull(docNode);
      break;
    case `${schema.utpDocType}`:
      createNodesForUTPFull(docNode);
      break;
    default:
      break;
  }
}

export async function newDocument():Promise<SmoresDocument|undefined> {
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