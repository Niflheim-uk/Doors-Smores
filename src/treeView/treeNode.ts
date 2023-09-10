import * as vscode from "vscode";
import * as fs from "fs";
import * as guiStyle from '../utils/gui';
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
    this.iconPath = guiStyle.getNodeIcon(node);
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
