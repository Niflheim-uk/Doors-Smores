import { DoorsSmores } from "../doorsSmores";
import { SmoresFile } from "./smoresFile";
import * as schema from './schema';
import { VersionController } from "../versionControl/versionController";
import { basename, join } from "path";
import { rmSync } from "fs";

interface DocumentData {
  documentType: string;
}
interface RequirementData {
  translationRationale: string;
}
interface TestData {
  expectedResults: string;
}
export interface TraceData {
  traceIds:number[];
  suspectIds:number[];
}
export interface DocumentNodeData {
  id: number;
  parent: number;
  category: string;
  text: string;
  traces:TraceData;
  children: number[];
  documentData?:DocumentData;
  requirementData?:RequirementData;
  testData?:TestData;
}
const defaultData:DocumentNodeData = {     
  id: -1,
  parent: 0,
  category: "",
  text: "TBD",
  traces: {traceIds:[],suspectIds:[]},
  children: []
};

function fixData(data:DocumentNodeData) : DocumentNodeData {
  if(data.children === undefined) {
    data.children = [];
  }
  if(data.traces === undefined) {
    data.traces = {traceIds:[],suspectIds:[]};
  }
  return data;
}
export class DocumentNode extends SmoresFile {

  declare public data:DocumentNodeData;
  constructor(filepath:string) {
    super(filepath);
    if(this.data.id === undefined) {
      const nodeId = basename(filepath, SmoresFile.nodeExtension);
      this.data = defaultData;
      this.data.id = Number(nodeId);
      this.write();
    }
    this.data = fixData(this.data);
  }
  static createFromId(id:number) {
    const filepath = DoorsSmores.getNodeFilepath(id);
    return new DocumentNode(filepath);
  }
  static createNewDocumentNode(parent:DocumentNode, category:string, defaultText:string, insertPos?:number) {
    console.log(`New ${category} called`);
    const id = DoorsSmores.getUniqueId();
    const newDocumentNode = DocumentNode.createFromId(id);
    const newData:DocumentNodeData = {
      id,
      parent:parent.data.id,
      category:`${category}`,
      text:`${defaultText}`,
      traces:{traceIds:[],suspectIds:[]},
      children:[]
    };
    newDocumentNode.data = newData;
    newDocumentNode.write();
    parent.addChild(id, insertPos);
    VersionController.commitChanges(`New ${category} added`);
    DoorsSmores.refreshViews();
    return DocumentNode.createFromId(id);
  }  
  static isDocumentNode(test:any) {
    if(test === undefined) {return false;}
    if(test.filepath === undefined) {return false;}
    if(test.data === undefined) {return false;}
    if(test.data.id === undefined) {return false;}
    if(test.data.category === undefined) {return false;}
    if(test.data.children === undefined) {return false;}
    if(test.data.parent === undefined) {return false;}
    if(test.data.text === undefined) {return false;}
    return true;
  }

  public getParent():DocumentNode|null {
    if(this.data.parent === 0) {
      return null;
    } else {
      const nodeFilepath = DoorsSmores.getNodeFilepath(this.data.parent);
      return new DocumentNode(nodeFilepath);
    }
  }
  public getChildren():DocumentNode[] {
    var childDocNodes:DocumentNode[] = [];
    if(this.data.children.length > 0) {
      for (let index = 0; index < this.data.children.length; index++) {
        const childId = this.data.children[index];
        const nodeFilepath = DoorsSmores.getNodeFilepath(childId);
        childDocNodes.push(new DocumentNode(nodeFilepath));
      }
    }
    return childDocNodes;
  }
  public getDocument():DocumentNode {
    var document:DocumentNode = this;
    var parent = this.getParent();
    while(parent !== null) {
      document = parent;
      parent = parent.getParent();
    }
    return document;
  }
  public getDocumentType():string {
    const documentNode = this.getDocument();
    if(documentNode.data.documentData) {
      return documentNode.data.documentData.documentType;
    }
    return schema.unknown; 
  }
  public delete() {
    const parent = this.getParent();
    const children = this.getChildren();
    children.forEach(child => {
      child.delete();
    });
    if(parent !== null) {
      parent.removeChild(this.data.id);
    }
    this.data.traces.traceIds.forEach(id => {
      this.removeTrace(id);
    });
    this.deleteFile();
  }
  public update(dataMap:any) {
    let commitMessage = "";
    if(dataMap.text) {
      this.data.text = dataMap.text;
      commitMessage = commitMessage.concat(`Updated text field on ${this.data.id}\n`);  
      if(this.data.category === schema.mermaidCategory) {
        const dirPath = this.getDirPath();
        const renderedPath = join(dirPath, 'rendered.svg');
        rmSync(renderedPath);
      }
    }
    if(dataMap.translationRationale) {
      this.data.requirementData = {translationRationale:dataMap.translationRationale};
      commitMessage = commitMessage.concat(`Updated translation rationale field on ${this.data.id}\n`);  
    }
    if(dataMap.expectedResults) {
      this.data.testData = {expectedResults:dataMap.expectedResults};
      commitMessage = commitMessage.concat(`Updated expected results field on ${this.data.id}\n`);  
    }
    this.markTracesSuspect();
    this.write();
    if(commitMessage !== "") {
      VersionController.commitChanges(commitMessage);
    }
  }

  public getChildPosition(childId:number):number {
    return this.data.children.findIndex(id => childId === id);
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
  public removeChild(id:number){
    const idPos = this.getChildPosition(id);
    if((this.data.children !== undefined) && (idPos >= 0)){
      this.data.children.splice(idPos,1);
      this.write();
    }
  }

  public canDemoteNode():boolean {
    const parent = this.getParent();
    if(parent !== null) {
      const idPos = parent.getChildPosition(this.data.id);
      if(idPos > 0) {
        const prevSiblingId = parent.data.children[idPos-1];
        const prevSiblingPath = DoorsSmores.getNodeFilepath(prevSiblingId);
        const prevSibling = new DocumentNode(prevSiblingPath);
        if(prevSibling.data.category === schema.headingCategory) {
          return true;
        }
      }
    }
    return false;
  }
  public canPromoteNode():boolean {
    switch(this.data.category) {
      case schema.projectCategory:
      case schema.documentCategory:
      case schema.unknown:
        return false;
      case schema.headingCategory:
        return this.canPromoteHeading();
      default:
        return this.canPromoteOther();
    }
  }

  public promote() {
    const parent = this.getParent();
    if(!this.canPromoteNode() || parent === null) {
      return;
    }
    const grandparent = parent.getParent();
    if(grandparent !== null) {
      const parentPos = grandparent.getChildPosition(parent.data.id);
      grandparent.addChild(this.data.id, parentPos+1);
      parent.removeChild(this.data.id);
      this.data.parent = grandparent.data.id;
      this.write();
      VersionController.commitChanges(`Node ${this.data.id} document level decreased`);
      DoorsSmores.refreshViews();
    }
  }
  public demote() {
    const parent = this.getParent();
    if(!this.canDemoteNode() || parent === null) {
      return;
    }
    const idPos = parent.getChildPosition(this.data.id);
    // idPos is greater than 0 or couldn't demote
    const prevSiblingPos = idPos -1;
    const siblings = parent.getChildren();
    siblings[prevSiblingPos].addChild(this.data.id);
    parent.removeChild(this.data.id);
    this.data.parent = siblings[prevSiblingPos].data.id;
    this.write();
    VersionController.commitChanges(`Node ${this.data.id} document level increased`);
    DoorsSmores.refreshViews();
  }
  public moveUp() {
    const parent = this.getParent();
    if(parent !== null) {
      const index = parent.getChildPosition(this.data.id);
      parent.swapChildIndex(index, index-1);
      VersionController.commitChanges(`Node ${this.data.id} document order decreased`);
      DoorsSmores.refreshViews();
    }
  }
  public moveDown() {
    const parent = this.getParent();
    if(parent !== null) {
      const index = parent.getChildPosition(this.data.id);
      parent.swapChildIndex(index, index+1);
      VersionController.commitChanges(`Node ${this.data.id} document order increased`);
      DoorsSmores.refreshViews();
    }
  }
  
  public addTrace(traceId:number, reciprocate:boolean=true) {
    if(this.data.traces.traceIds.includes(traceId)) {
      return;
    }
    const tracedNode = DocumentNode.createFromId(traceId);
    this.data.traces.traceIds.push(traceId);
    this.write();
    if(reciprocate) {
      tracedNode.addTrace(this.data.id, false);
      const thisLabel = schema.getLabelPrefix(this.data.category);
      const traceLabel = schema.getLabelPrefix(tracedNode.data.category);
      VersionController.commitChanges(`Added trace from ${thisLabel}${this.data.id} to ${traceLabel}${traceId}`);
      DoorsSmores.refreshViews();
    }
  }
  public removeTrace(traceId:number, reciprocate:boolean=true) {
    if(!this.data.traces.traceIds.includes(traceId)) {
      return;
    }
    const tracedNode = DocumentNode.createFromId(traceId);
    const idPos = this.data.traces.traceIds.findIndex(id => traceId === id);
    this.data.traces.traceIds.splice(idPos,1);
    this.write();
    if(reciprocate) {
      tracedNode.removeTrace(this.data.id, false);
      const thisLabel = schema.getLabelPrefix(this.data.category);
      const traceLabel = schema.getLabelPrefix(tracedNode.data.category);
      VersionController.commitChanges(`Removed trace from ${thisLabel}${this.data.id} to ${traceLabel}${traceId}`);
      DoorsSmores.refreshViews();
    }
  }
  public isTraceSuspect(traceId:number):boolean {
    return this.data.traces.suspectIds.includes(traceId);
  }
  public addSuspectTrace(traceId:number) {
    if(!this.isTraceSuspect(traceId)) {
      this.data.traces.suspectIds.push(traceId);
      this.write();
      DoorsSmores.refreshViews();
    }
  }
  public verifyTrace(traceId:number, reciprocate:boolean=true) {
    if(this.isTraceSuspect(traceId)) {
      this.removeSuspectTrace(traceId);
    }
    const tracedNode = DocumentNode.createFromId(traceId);
    const thisLabel = schema.getLabelPrefix(this.data.category);
    const traceLabel = schema.getLabelPrefix(tracedNode.data.category);
    if(reciprocate) {
      const traceNode = DocumentNode.createFromId(traceId);
      traceNode.verifyTrace(this.data.id, false);
      VersionController.commitChanges(`Verified trace from ${thisLabel}${this.data.id} to ${traceLabel}${traceId}`);
      DoorsSmores.refreshViews();
    }
  }
  ///////////////////////////////////////////
  // Private methods
  ///////////////////////////////////////////
  private canPromoteHeading():boolean {
    const parent = this.getParent();
    if(parent !== null && parent.data.category === schema.headingCategory) {
      return true;
    }
    return false;
  }
  private canPromoteOther():boolean {
    const parent = this.getParent();
    if(parent !== null && parent.canPromoteNode()) {
      return true;
    }
    return false;
  }

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
      const traceNode = DocumentNode.createFromId(trace);
      if(traceNode) {
        traceNode.addSuspectTrace(this.data.id);
      }
    }
  }
  
  private swapChildIndex(a:number,b:number) {
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
}
