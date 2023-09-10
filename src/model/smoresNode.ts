import * as vscode from "vscode";
import {NodeDataModel} from "./smoresDataSchema";
import * as fs from "fs";
import { SmoresProject, getProject } from "./smoresProject";
import { SmoresDataFile } from "./smoresDataFile";
import { VersionController } from "../versionControl/versionController";

export class SmoresNode extends SmoresDataFile {

  declare public data:NodeDataModel;
  constructor(filePath:fs.PathLike) {
    super(filePath);
  }
  getChildNodes():SmoresNode[] {
    let childNodes = undefined;
    if(this.data.children && this.data.children.length > 0) {
      const children = this.data.children;
      for (let index = 0; index < children.length; index++) {
        const childId = children[index];
        const nodeFilepath = this.getNodeFilepath(childId);
        if(Array.isArray(childNodes)) {
          childNodes.push(new SmoresNode(nodeFilepath));
        } else {
          childNodes = [new SmoresNode(nodeFilepath)];
        }
      }
    }
    if(childNodes) {
      return childNodes;
    }
    return [];
  }
  getParentNode():SmoresNode|null {
    if(this.data.parent === 0) {
      return null;
    } else {
      const nodeFilepath = this.getNodeFilepath(this.data.parent);
      return new SmoresNode(nodeFilepath);
    }
  }
  getContextString():string {
    let context = "";
    context = this.setContextAddOrderStatus(context);
    context = this.setContextAddPromoteStatus(context);
    return `${this.data.category}${context}`;
  }
  getDocumentType():string {
    var documentNode:SmoresNode = this;
    var parent = this.getParentNode();
    while(parent !== null) {
      documentNode = parent;
      parent = parent.getParentNode();
    }
    console.log(documentNode.data.documentData);
    if(documentNode.data.documentData) {
      return documentNode.data.documentData.documentType;
    }
    return "Unknown";
 
  }
  delete() {
    const parent = this.getParentNode();
    const children = this.getChildNodes();
    children.forEach(child => {
      child.delete();
    });
    if(parent !== null) {
      parent.removeChild(this.data.id);
    } else {
      if(this.data.category === "document") {
        const project = getProject();
        if(project) {
          project.deleteDocument(this.data.id);
        }
      }
    }
    // Todo: remove traces when implemented
    this.deleteDataFile();
  }
  swapChildIndex(a:number,b:number) {
    if(this.data.children === undefined) {
      return;
    }
    if((a >= this.data.children.length) || (b >= this.data.children.length)) {
      return;
    }
    if(a < 0 || b < 0) {
      return;
    }
    const temp = this.data.children[a];
    this.data.children[a] = this.data.children[b];
    this.data.children[b] = temp;
    this.write();    
  }
  setNewData(dataMap:any) {
    Object.keys(dataMap).map(dataType =>{
      const dataValue = dataMap[dataType];
      switch(dataType) {
        case 'text': this.data.text = dataValue;
        break;
        case 'translationRationale':
          if(this.data.requirementData === undefined) {
            this.data.requirementData = {translationRationale:dataValue};
          } else {
            this.data.requirementData.translationRationale = dataValue;
          }
          break;
        default:
          console.error(`Unknown new data key ${dataType}`);
      }
    });
    this.write();
  }
  public newItem(category:string,defaultText:string, insertPos?:number):string|undefined {
    console.log(`New ${category} called`);
    VersionController.commitChanges(`New ${category} added`);
    const newData = {
      id:0,
      category:`${category}`,
      text:`${defaultText}`,
      parent:this.data.id
    };
    return this.newChild(newData);
  }  
  public canDemoteNode():boolean {
    const parent = this.getParentNode();
    if(parent !== null) {
      const idPos = parent.getChildPosition(this.data.id);
      if(parent.data.children && idPos > 0) {
        const prevSiblingId = parent.data.children[idPos-1];
        const prevSiblingPath = SmoresNode.getNodeFilepath(prevSiblingId);
        if(prevSiblingPath === undefined) {
          return false;
        }
        const prevSibling = new SmoresNode(prevSiblingPath);
        if(prevSibling.data.category === "heading") {
          return true;
        }
      }
    }
    return false;
  }
  public canPromoteNode():boolean {
    switch(this.data.category) {
      case "project":
      case "document":
      case "unknown":
        return false;
      case "heading":
        return this.canPromoteHeading();
      default:
        return this.canPromoteOther();
    }
  }
  public removeChild(id:number){
    const idPos = this.getChildPosition(id);
    if((this.data.children !== undefined) && (idPos >= 0)){
      this.data.children.splice(idPos,1);
      this.write();
    }
  }
  public getChildPosition(childId:number|undefined):number {
    if(this.data.children !== undefined) {
      let siblings:number[] = this.data.children;
      const idPos = siblings.findIndex(id => childId === id);
      return idPos;
    }
    return -1;
  }
  public addChild(childId:number, insertPos?:number) {
    if(this.data.children === undefined) {
      this.data.children = [childId];
    } else {
      if(insertPos === undefined || insertPos < 0) {
        this.data.children.push(childId);
      } else {
        if(insertPos >= this.data.children.length) {
          this.data.children.push(childId);
        } else {
          this.data.children.splice(insertPos, 0, childId);
        }
      }
    }
    this.write();
  }
  ///////////////////////////////////////////
  // Private methods
  ///////////////////////////////////////////
  private setContextAddOrderStatus(context:string) :string {
    const parent = this.getParentNode();
    if((parent !== null) && (parent.data.children !== undefined)){
      const index = parent.getChildPosition(this.data.id);
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
    if(this.canPromoteNode()) {
      context = context.concat(" PROMOTE");
    }
    if(this.canDemoteNode()) {
      context = context.concat(" DEMOTE");
    }
    return context;
  }
  private canPromoteHeading():boolean {
    const parent = this.getParentNode();
    if(parent !== null && parent.data.category === "heading") {
      return true;
    }
    return false;
  }
  private canPromoteOther():boolean {
    const parent = this.getParentNode();
    if(parent !== null && parent.canPromoteNode()) {
      return true;
    }
    return false;
  }
  protected newChild(childData:NodeDataModel, insertPos?:number):string|undefined {
    const project = getProject();
    if(project === undefined) {
      return;
    }
    const newId = project.getUniqueId();
    childData.id = newId;
    const newNodePath = SmoresDataFile.getNodeFilepath(newId);
    if(newNodePath === undefined) {
      return;
    }
    const newDataFile = new SmoresDataFile(newNodePath);
    newDataFile.data = childData;
    newDataFile.write();
    this.addChild(newId, insertPos);
    this.write();
    vscode.commands.executeCommand('doors-smores.Update-Views');
    return newNodePath;
  }
}
