import * as vscode from "vscode";
import * as fs from "fs";
import * as path from 'path';
import * as smoresDataSchema from '../model/smoresDataSchema';
import { SmoresNode } from "../model/smoresNode";
import { SmoresDataFile } from "../model/smoresDataFile";

export class TreeNode extends vscode.TreeItem {
  public smoresNode:SmoresNode;
  constructor(filePath:fs.PathLike) {
    const node = new SmoresNode(filePath);
    let state = vscode.TreeItemCollapsibleState.None;
    if(node.data === undefined) {
      console.log("WTF?");
    }
    if(node.data.children && node.data.children.length > 0) {
      state = vscode.TreeItemCollapsibleState.Expanded;
    }
    const nodeLabel = `${getLabelPrefix(node.data)}${node.data.id} - ${node.data.text.split("\n")[0]}`;
    super(nodeLabel, state);
    this.smoresNode = node;
    this.description = node.data.text;
    this.tooltip = this.description;
    this.iconPath = getTreeNodeIcon(node);
//    this.iconPath = `$(eye)`;
    this.setContextString();
  }
  setContextString() {
    let context = "";
    context = this.setContextAddOrderStatus(context);
    context = this.setContextAddPromoteStatus(context);
    context = this.setContextAddDocumentType(context);
    this.contextValue = `${this.smoresNode.data.category}${context}`;
  }
  private setContextAddOrderStatus(context:string) :string {
    const parent = this.smoresNode.getParentNode();
    if((parent !== null) && (parent.data.children !== undefined)){
      const index = parent.getChildPosition(this.smoresNode.data.id);
      const count = parent.data.children.length;
      if(index === 0) {
        context = context.concat(" MIN_CHILD");
      }
      if(index === (count -1)) {
        context = context.concat(" MAX_CHILD");
      }
    } else {
      context = context.concat(" MIN_CHILD", " MAX_CHILD");
    }
    return context;
  }
  private setContextAddPromoteStatus(context:string):string {
    if(this.smoresNode.canPromoteNode()) {
      context = context.concat(" PROMOTE");
    }
    if(this.smoresNode.canDemoteNode()) {
      context = context.concat(" DEMOTE");
    }
    return context;
  }
  private setContextAddDocumentType(context:string):string {
    return context.concat(" ", this.getDocumentTypeAcronym());
  }
  private getDocumentTypeAcronym():string {
    const documentType = this.smoresNode.getDocumentType();
    switch (documentType) {
      case 'User Requirements Specification': return "URS";
      case 'Software Requirements Specification': return "SRS";
      case "Architecture Design Specification": return "ADS";
      case "Detailed Design Specification": return "DDS";
      case "Software Acceptance Test Protocol": return "ATP";
      case "Software System Test Protocol": return "STP";
      case "Software Integration Test Protocol": return "ITP";
      case "Software Unit Test Protocol": return "UTP";
      default: return "EMPTY";
    }
  }
}

const ursLevelColour = 'debugConsole.sourceForeground';
const srsLevelColour = 'debugConsole.errorForeground';
const adsLevelColour = 'debugConsole.infoForeground';
const ddsLevelColour = 'debugConsole.warningForeground';
const funcReqColour = 'debugConsole.errorForeground';
const nonFuncReqColour = 'debugConsole.warningForeground';
const desConColour = 'debugIcon.restartForeground';
const imageColour = 'debugConsole.warningForeground';
const mermaidColour = 'debugIcon.restartForeground';
function getDocumentColour(node:SmoresNode):vscode.ThemeColor|undefined {
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
function getTreeNodeIcon(node:SmoresNode):vscode.ThemeIcon {
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
      return new vscode.ThemeIcon('gear', iconColour);
    case "nonFunctionalRequirement":
      iconColour = new vscode.ThemeColor(nonFuncReqColour);
      return new vscode.ThemeIcon('gear', iconColour);
    case "designConstraint":
      iconColour = new vscode.ThemeColor(desConColour);
      return new vscode.ThemeIcon('gear', iconColour);
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

function getLabelPrefix(nodeData:smoresDataSchema.NodeDataModel):string {
  switch(nodeData.category) {
    case "project": return "PRJ";
    case "document": return "D";
    case "heading": return "H";
    case "userRequirement": return "UR";
    case "functionalRequirement": return "FR";
    case "nonFunctionalRequirement": return "NFR";
    case "designConstraint": return "DC";
    case "softwareSystemTest": return "ST";
    case "softwareIntegrationTest": return "IT";
    case "softwareUnitTest": return "UT";
    case "comment": return "C";
    case "image": return "I";
    case "mermaid": return "M";
    default:
      return "X";
  }
}
