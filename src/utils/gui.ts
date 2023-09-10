import * as vscode from 'vscode';
import { SmoresNode } from "../model/smoresNode";
import * as schema from "../model/smoresDataSchema";
import { getExtensionBasedPath } from './getExtension';


const ursLevelColour = 'debugConsole.sourceForeground';
const srsLevelColour = 'debugConsole.errorForeground';
const adsLevelColour = 'debugConsole.infoForeground';
const ddsLevelColour = 'debugConsole.warningForeground';
const funcReqColour = 'debugConsole.errorForeground';
const nonFuncReqColour = 'debugConsole.warningForeground';
const desConColour = 'debugIcon.restartForeground';
const imageColour = 'debugConsole.warningForeground';
const mermaidColour = 'debugIcon.restartForeground';
export function getDocumentColour(node:SmoresNode):vscode.ThemeColor|undefined {
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

export function getNodeIcon(node:SmoresNode):vscode.ThemeIcon {
  var iconColour:vscode.ThemeColor|undefined;
  switch(node.data.category) {
  case schema.documentType:
    iconColour = getDocumentColour(node);
    return new vscode.ThemeIcon('book', iconColour);
  case schema.headingType:
    iconColour = new vscode.ThemeColor('foreground');
    return new vscode.ThemeIcon('symbol-text', iconColour);
  case schema.userFRType:
  case schema.softFRType:
  case schema.archFRType:
  case schema.desFRType:
    iconColour = new vscode.ThemeColor(funcReqColour);
    return new vscode.ThemeIcon('law', iconColour);
  case schema.userNFRType:
  case schema.softNFRType:
  case schema.archNFRType:
  case schema.desNFRType:
    iconColour = new vscode.ThemeColor(nonFuncReqColour);
    return new vscode.ThemeIcon('law', iconColour);
  case schema.userDCType:
  case schema.softDCType:
  case schema.archDCType:
  case schema.desDCType:
    iconColour = new vscode.ThemeColor(desConColour);
    return new vscode.ThemeIcon('lock', iconColour);
  case schema.userTestType:
    iconColour = new vscode.ThemeColor(ursLevelColour);
    return new vscode.ThemeIcon('beaker', iconColour);
  case schema.softTestType:
    iconColour = new vscode.ThemeColor(srsLevelColour);
    return new vscode.ThemeIcon('beaker', iconColour);
  case schema.archTestType:
    iconColour = new vscode.ThemeColor(adsLevelColour);
    return new vscode.ThemeIcon('beaker', iconColour);
  case schema.desTestType:
    iconColour = new vscode.ThemeColor(ddsLevelColour);
    return new vscode.ThemeIcon('beaker', iconColour);
  case schema.commentType:
    iconColour = new vscode.ThemeColor('foreground');
    return new vscode.ThemeIcon('selection', iconColour);
  case schema.imageType:
    iconColour = new vscode.ThemeColor(imageColour);
    return new vscode.ThemeIcon('symbol-color', iconColour);
  case schema.mermaidType:
    iconColour = new vscode.ThemeColor(mermaidColour);
    return new vscode.ThemeIcon('symbol-color', iconColour);
  default:
    iconColour = new vscode.ThemeColor('errorForeground');
    return new vscode.ThemeIcon('question', iconColour);
  }
}
export function getDocumentStylePaths():string[] {
  // Local path to css styles
  const stylesPaths:string[] = [
    getExtensionBasedPath(['resources', 'theme.css']),
    getExtensionBasedPath(['resources', 'document.css']),
    getExtensionBasedPath(['resources', 'displayStyle.css']),
    getExtensionBasedPath(['resources', 'pagination.css']),
  ];
  return stylesPaths;
}
export function getTracingStylePaths():string[] {
  const stylesPaths:string[] = [
    getExtensionBasedPath(['resources', 'theme.css']),
    getExtensionBasedPath(['resources', 'tracing.css']),
    getExtensionBasedPath(['resources', 'displayStyle.css']),
    getExtensionBasedPath(['resources', 'pagination.css']),
    getExtensionBasedPath(['node_modules', '@vscode/codicons', 'dist', 'codicon.css'])
  ];
  return stylesPaths;
}
export function getScriptPath():string {
  return getExtensionBasedPath(['resources', 'smoresScript.js']);
}
