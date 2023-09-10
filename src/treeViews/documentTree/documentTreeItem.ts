import * as vscode from "vscode";
import { DocumentNode } from "../../model/documentNode";
import * as schema from '../../model/schema';
import { getNodeIcon } from "../treeIcons";
import { VersionController } from "../../versionControl/versionController";

export class DocumentTreeItem extends vscode.TreeItem {
  // - category
  // - document type
  // - Filepath
  readonly node:DocumentNode;
  constructor(readonly filePath:string) {
    const documentNode = new DocumentNode(filePath);
    let state = vscode.TreeItemCollapsibleState.None;
    if(documentNode.data.children.length > 0) {
      state = vscode.TreeItemCollapsibleState.Expanded;
    } 
    const nodeLabel = `${schema.getLabelPrefix(documentNode.data.category)}${documentNode.data.id} - ${documentNode.data.text.split("\n")[0]}`;
    super(nodeLabel, state);
    this.node = documentNode;
    this.description = documentNode.data.text;
    this.tooltip = this.description;
    this.iconPath = getNodeIcon(documentNode);
    this.setContextString();
  }
  public getChildren():DocumentTreeItem[] {
    var children:DocumentTreeItem[] = [];
    const childNodes = this.node.getChildren();
    for(let i=0; i< childNodes.length; i++) {
      const item = new DocumentTreeItem(childNodes[i].getFilepath());
      children.push(item);
    }
    return children;
  }
  public deleteNode() {
    this.node.delete();
    VersionController.commitChanges(`Node ${this.node.data.id} and child nodes deleted`);
  }
  public static isDocumentTreeItem(item:DocumentTreeItem) {
    if(item.node) {
      return DocumentNode.isDocumentNode(item.node);
    } 
    return false;
  }

  private setContextString() {
    let context = schema.getLabelPrefix(this.node.data.category);
    context = this.setContextAddOrderStatus(context);
    context = this.setContextAddPromoteStatus(context);
    context = this.setContextAddDocumentType(context);
    this.contextValue = context;
  }
  private setContextAddOrderStatus(context:string) :string {
    const parent = this.node.getParent();
    if((parent !== null) && (parent.data.children !== undefined)){
      const index = parent.getChildPosition(this.node.data.id);
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
    if(this.node.canPromoteNode()) {
      context = context.concat(" PROMOTE");
    }
    if(this.node.canDemoteNode()) {
      context = context.concat(" DEMOTE");
    }
    return context;
  }
  private setContextAddDocumentType(context:string):string {
    const documentType = this.node.getDocumentType();
    return context.concat(" ", schema.getDocumentTypeAcronym(documentType));
  }

}

