import * as vscode from 'vscode';
import * as schema from "../model/schema";
import { DocumentNode } from '../model/documentNode';

const ursLevelColour = 'terminal.ansiGreen';
const srsLevelColour = 'debugConsole.errorForeground';
const adsLevelColour = 'debugConsole.infoForeground';
const ddsLevelColour = 'debugConsole.warningForeground';
const funcReqColour = 'debugConsole.errorForeground';
const nonFuncReqColour = 'debugConsole.warningForeground';
const desConColour = 'debugIcon.restartForeground';
const imageColour = 'debugConsole.warningForeground';
const mermaidColour = 'debugIcon.restartForeground';
export function getDocumentColour(node:DocumentNode):vscode.ThemeColor|undefined {
  switch(node.getDocumentType()) {
    case `${schema.ursDocType}`: 
      return new vscode.ThemeColor(ursLevelColour);

    case `${schema.srsDocType}`: 
      return new vscode.ThemeColor(srsLevelColour);

    case `${schema.adsDocType}`: 
      return new vscode.ThemeColor(adsLevelColour);

    case `${schema.ddsDocType}`: 
      return new vscode.ThemeColor(ddsLevelColour);

    case `${schema.atpDocType}`: 
      return new vscode.ThemeColor(ursLevelColour);

    case `${schema.stpDocType}`: 
      return new vscode.ThemeColor(srsLevelColour);

    case `${schema.itpDocType}`: 
      return new vscode.ThemeColor(adsLevelColour);

    case `${schema.utpDocType}`: 
      return new vscode.ThemeColor(ddsLevelColour);
  }
  return undefined;
}

export function getNodeIcon(node:DocumentNode):vscode.ThemeIcon {
  var iconColour:vscode.ThemeColor|undefined;
  const projectData:any = node.data;
  if(projectData.documentIds) {
    return vscode.ThemeIcon.Folder;
  }
  switch(node.data.category) {
  case schema.projectCategory:
    return vscode.ThemeIcon.Folder;
  case schema.documentCategory:
    iconColour = getDocumentColour(node);
    return new vscode.ThemeIcon('book', iconColour);
  case schema.headingCategory:
    iconColour = new vscode.ThemeColor('foreground');
    return new vscode.ThemeIcon('symbol-text', iconColour);
  case schema.userFRCategory:
  case schema.softFRCategory:
  case schema.archFRCategory:
  case schema.desFRCategory:
    iconColour = new vscode.ThemeColor(funcReqColour);
    return new vscode.ThemeIcon('law', iconColour);
  case schema.userNFRCategory:
  case schema.softNFRCategory:
  case schema.archNFRCategory:
  case schema.desNFRCategory:
    iconColour = new vscode.ThemeColor(nonFuncReqColour);
    return new vscode.ThemeIcon('law', iconColour);
  case schema.userDCCategory:
  case schema.softDCCategory:
  case schema.archDCCategory:
  case schema.desDCCategory:
    iconColour = new vscode.ThemeColor(desConColour);
    return new vscode.ThemeIcon('lock', iconColour);
  case schema.userTestCategory:
    iconColour = new vscode.ThemeColor(ursLevelColour);
    return new vscode.ThemeIcon('beaker', iconColour);
  case schema.softTestCategory:
    iconColour = new vscode.ThemeColor(srsLevelColour);
    return new vscode.ThemeIcon('beaker', iconColour);
  case schema.archTestCategory:
    iconColour = new vscode.ThemeColor(adsLevelColour);
    return new vscode.ThemeIcon('beaker', iconColour);
  case schema.desTestCategory:
    iconColour = new vscode.ThemeColor(ddsLevelColour);
    return new vscode.ThemeIcon('beaker', iconColour);
  case schema.commentCategory:
    iconColour = new vscode.ThemeColor('foreground');
    return new vscode.ThemeIcon('selection', iconColour);
  case schema.imageCategory:
    iconColour = new vscode.ThemeColor(imageColour);
    return new vscode.ThemeIcon('symbol-color', iconColour);
  case schema.mermaidCategory:
    iconColour = new vscode.ThemeColor(mermaidColour);
    return new vscode.ThemeIcon('symbol-color', iconColour);
  default:
    iconColour = new vscode.ThemeColor('errorForeground');
    return new vscode.ThemeIcon('question', iconColour);
  }
}
