import * as vscode from "vscode";
import * as schema from "./smoresDataSchema";
import * as fs from "fs";
import { getProject } from "./smoresProject";
import { SmoresDataFile } from "./smoresDataFile";
import { VersionController } from "../versionControl/versionController";

export function getNodeFromId(nodeId:number) {
  const filePath = SmoresDataFile.getNodeFilepath(nodeId);
  if(filePath) {
    return new SmoresNode(filePath);
  }
  vscode.window.showErrorMessage(`Undefined filepath for id: ${nodeId}`);
}

export class SmoresNode extends SmoresDataFile {

  declare public data:schema.NodeDataModel;
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
  getDocument():SmoresNode {
    var documentNode:SmoresNode = this;
    var parent = this.getParentNode();
    while(parent !== null) {
      documentNode = parent;
      parent = parent.getParentNode();
    }
    return documentNode;
  }
  getDocumentType():string {
    const documentNode = this.getDocument();
    if(documentNode.data.documentData) {
      return documentNode.data.documentData.documentType;
    }
    return schema.unknownType; 
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
      if(this.data.category === schema.documentType) {
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
    let commitMessage = "";
    if(dataMap.text) {
      this.data.text = dataMap.text;
      commitMessage = `Updated text field on ${this.data.id}`;  
    }
    if(dataMap.translationRationale) {
      if(this.data.requirementData === undefined) {
        this.data.requirementData = {translationRationale:dataMap.translationRationale};
      } else {
        this.data.requirementData.translationRationale = dataMap.translationRationale;
      }
      commitMessage = `Updated translation rationale field on ${this.data.id}`;  
    }
    if(dataMap.expectedResults) {
      if(this.data.testData === undefined) {
        this.data.testData = {expectedResults:dataMap.expectedResults};
      } else {
        this.data.testData.expectedResults = dataMap.expectedResults;
      }
      commitMessage = `Updated expected results field on ${this.data.id}`;  
    }
    this.markTracesSuspect();
    this.write();
    if(commitMessage !== "") {
      VersionController.commitChanges(commitMessage);
    }  
  }
  public newItem(category:string,defaultText:string, insertPos?:number):string|undefined {
    console.log(`New ${category} called`);
    const newData = {
      id:0,
      category:`${category}`,
      text:`${defaultText}`,
      parent:this.data.id,
      traces:{traceIds:[],suspectIds:[]}
    };
    const node = this.newChild(newData, insertPos);
    VersionController.commitChanges(`New ${category} added`);
    return node;
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
        if(prevSibling.data.category === schema.headingType) {
          return true;
        }
      }
    }
    return false;
  }
  public canPromoteNode():boolean {
    switch(this.data.category) {
      case schema.projectType:
      case schema.documentType:
      case schema.unknownType:
        return false;
      case schema.headingType:
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
  public addTrace(traceId:number, reciprocate:boolean=true) {
    if(this.data.traces.traceIds.includes(traceId)) {
      return;
    }
    const tracedNode = getNodeFromId(traceId);
    if(tracedNode === undefined) {
      return;
    }
    const thisLabel = schema.getLabelPrefix(this.data.category);
    const traceLabel = schema.getLabelPrefix(tracedNode.data.category);
    this.data.traces.traceIds.push(traceId);
    this.write();
    VersionController.commitChanges(`Added trace from ${thisLabel}${this.data.id} to ${traceLabel}${traceId}`);
    if(reciprocate) {
      tracedNode.addTrace(this.data.id, false);
    }
  }
  public removeTrace(traceId:number, reciprocate:boolean=true) {
    if(this.data.traces.traceIds.includes(traceId)) {
      return;
    }
    const tracedNode = getNodeFromId(traceId);
    if(tracedNode === undefined) {
      return;
    }
    const thisLabel = schema.getLabelPrefix(this.data.category);
    const traceLabel = schema.getLabelPrefix(tracedNode.data.category);
    this.data.traces.traceIds.push(traceId);
    this.write();
    VersionController.commitChanges(`Added trace from ${thisLabel}${this.data.id} to ${traceLabel}${traceId}`);
    if(reciprocate) {
      tracedNode.addTrace(this.data.id, false);
    }
  }
  public isTraceSuspect(traceId:number):boolean {
    return this.data.traces.suspectIds.includes(traceId);
  }
  public addSuspectTrace(traceId:number) {
    if(!this.isTraceSuspect(traceId)) {
      this.data.traces!.suspectIds.push(traceId);
      this.write();
    }
  }
  public verifyTrace(traceId:number, reciprocate:boolean=true) {
    if(this.isTraceSuspect(traceId)) {
      this.removeSuspectTrace(traceId);
    }
    const tracedNode = getNodeFromId(traceId);
    if(tracedNode === undefined) {
      return;
    }
    const thisLabel = schema.getLabelPrefix(this.data.category);
    const traceLabel = schema.getLabelPrefix(tracedNode.data.category);
    if(reciprocate) {
      const traceNode = getNodeFromId(traceId);
      if(traceNode) {
        traceNode.verifyTrace(this.data.id, false);
      }
      VersionController.commitChanges(`Verified trace from ${thisLabel}${this.data.id} to ${traceLabel}${traceId}`);
    }    
  }
  ///////////////////////////////////////////
  // Private methods
  ///////////////////////////////////////////
  private removeSuspectTrace(nodeId:number) {
    const suspects = this.data.traces.suspectIds;
    const idPos = suspects.findIndex(id => nodeId === id);
    suspects.splice(idPos,1);
    this.data.traces.suspectIds = suspects;
    this.write();
  }
  private markTracesSuspect() {
    for(let i = 0; i < this.data.traces.traceIds.length; i++) {
      const trace = this.data.traces.traceIds[i];
      this.addSuspectTrace(trace);
      const traceNode = getNodeFromId(trace);
      if(traceNode) {
        traceNode.addSuspectTrace(this.data.id);
      }
    }
  }

  private canPromoteHeading():boolean {
    const parent = this.getParentNode();
    if(parent !== null && parent.data.category === schema.headingType) {
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
  protected newChild(childData:schema.NodeDataModel, insertPos?:number):string|undefined {
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
