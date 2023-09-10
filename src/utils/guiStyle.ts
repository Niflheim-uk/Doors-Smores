import * as vscode from 'vscode';
import { SmoresNode } from "../model/smoresNode";
import * as smoresDataSchema from "../model/smoresDataSchema";

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
    case `${smoresDataSchema.ursDocType}`: 
      return new vscode.ThemeColor(ursLevelColour);

    case `${smoresDataSchema.srsDocType}`: 
      return new vscode.ThemeColor(srsLevelColour);

    case `${smoresDataSchema.adsDocType}`: 
      return new vscode.ThemeColor(adsLevelColour);

    case `${smoresDataSchema.ddsDocType}`: 
      return new vscode.ThemeColor(ddsLevelColour);

    case `${smoresDataSchema.atpDocType}`: 
      return new vscode.ThemeColor(ursLevelColour);

    case `${smoresDataSchema.stpDocType}`: 
      return new vscode.ThemeColor(srsLevelColour);

    case `${smoresDataSchema.itpDocType}`: 
      return new vscode.ThemeColor(adsLevelColour);

    case `${smoresDataSchema.utpDocType}`: 
      return new vscode.ThemeColor(ddsLevelColour);
  }
  return undefined;
}

export function getNodeIcon(node:SmoresNode):vscode.ThemeIcon {
  var iconColour:vscode.ThemeColor|undefined;
  switch(node.data.category) {
    case "document":
      iconColour = getDocumentColour(node);
      return new vscode.ThemeIcon('book', iconColour);
    case "heading":
      iconColour = new vscode.ThemeColor('foreground');
      return new vscode.ThemeIcon('symbol-text', iconColour);
    case "userRequirement":
      iconColour = new vscode.ThemeColor(ursLevelColour);
      return new vscode.ThemeIcon('person', iconColour);
    case "functionalRequirement":
      iconColour = new vscode.ThemeColor(funcReqColour);
      return new vscode.ThemeIcon('law', iconColour);
    case "nonFunctionalRequirement":
      iconColour = new vscode.ThemeColor(nonFuncReqColour);
      return new vscode.ThemeIcon('law', iconColour);
    case "designConstraint":
      iconColour = new vscode.ThemeColor(desConColour);
      return new vscode.ThemeIcon('lock', iconColour);
    case "softwareSystemTest":
      iconColour = new vscode.ThemeColor(srsLevelColour);
      return new vscode.ThemeIcon('beaker', iconColour);
    case "softwareIntegrationTest":
      iconColour = new vscode.ThemeColor(adsLevelColour);
      return new vscode.ThemeIcon('beaker', iconColour);
    case "softwareUnitTest":
      iconColour = new vscode.ThemeColor(ddsLevelColour);
      return new vscode.ThemeIcon('beaker', iconColour);
    case "comment":
      iconColour = new vscode.ThemeColor('foreground');
      return new vscode.ThemeIcon('selection', iconColour);
    case "image":
      iconColour = new vscode.ThemeColor(imageColour);
      return new vscode.ThemeIcon('symbol-color', iconColour);
    case "mermaid":
      iconColour = new vscode.ThemeColor(mermaidColour);
      return new vscode.ThemeIcon('symbol-color', iconColour);
    default:
      iconColour = new vscode.ThemeColor('errorForeground');
      return new vscode.ThemeIcon('question', iconColour);
  }
}
