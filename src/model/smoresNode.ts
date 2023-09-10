import * as vscode from "vscode";
import * as smoresDataSchema from "./smoresDataSchema";
import * as fs from "fs";
import { SmoresProject, getProject } from "./smoresProject";
import { SmoresDataFile } from "./smoresDataFile";

export class SmoresNode extends SmoresDataFile {

  declare public data:smoresDataSchema.BaseNodeDataModel;
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
    if(this.data.parent === null) {
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
  canPromoteNode():boolean {
    const parent = this.getParentNode();
    switch(this.data.category) {
      case "project":
      case "document":
      case "unknown":
        return false;
      case "heading":
        if(parent !== null && parent.data.category === "heading") {
          return true;
        }
        return false;
      default:
        if(parent !== null && parent.canPromoteNode()) {
          return true;
        }
        return false;
    }
  }
  removeChild(id:number){
    const idPos = this.getChildPosition(id);
    if((this.data.children !== undefined) && (idPos >= 0)){
      this.data.children.splice(idPos,1);
      this.write();
    }
  }
  newHeading(title:string) {
    console.log("New heading called");
    const newData:smoresDataSchema.HeadingDataModel = {
      id:0,
      category:"heading",
      text:title,
      parent:this.data.id
    };
    this.newChild(newData);
  }
  newComment() {
    console.log("New comment called");
    const newData:smoresDataSchema.CommentDataModel = {
      id:0,
      category:"comment",
      text:"new comment",
      parent:this.data.id
    };
    this.newChild(newData);    
  }
  newFunctionalRequirement() {
    const newData:smoresDataSchema.RequirementDataModel = {
      id:0,
      category:"comment",
      text:"new comment",
      parent:this.data.id
    };
    this.newChild(newData);    
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
  private canDemoteNode():boolean {
    const parent = this.getParentNode();
    if(parent !== null) {
      const idPos = parent.getChildPosition(this.data.id);
      if(parent.data.children && idPos > 0) {
        const prevSiblingId = parent.data.children[idPos-1];
        const prevSiblingPath = SmoresNode.getNodeFilepath(prevSiblingId);
        const prevSibling = new SmoresNode(prevSiblingPath);
        if(prevSibling.data.category === "heading") {
          return true;
        }
      }
    }
    return false;
  }
  private getChildPosition(childId:number|undefined):number {
    if(this.data.children !== undefined) {
      let siblings:number[] = this.data.children;
      const idPos = siblings.findIndex(id => childId === id);
      return idPos;
    }
    return -1;
  }
  protected newChild(childData:smoresDataSchema.BaseNodeDataModel):void {
    const newId = getProject().getUniqueId();
    childData.id = newId;
    const newNodePath = SmoresDataFile.getNodeFilepath(newId);
    const newDataFile = new SmoresDataFile(newNodePath);
    newDataFile.data = childData;
    newDataFile.write();
    this.addChild(newId);
    this.write();
  }
  protected addChild(childId:number) {
    if(this.data.children === undefined) {
      this.data.children = [childId];
    } else {
      this.data.children.push(childId);
    }
    this.write();
  }
  protected addChildAt(childId:number, insertPos:number) {
    if(childId) {
      if(this.data.children === undefined) {
        if(insertPos !== 0) {
          throw new Error("insert position out of range");
        }
        this.data.children = [childId];
      } else {
        this.data.children.splice(insertPos, 0, childId);
      }
      this.write();  
    }
  }
}
