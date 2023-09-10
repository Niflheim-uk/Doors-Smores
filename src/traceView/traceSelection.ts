import { SmoresNode, getNodeFromId } from "../model/smoresNode";
import * as schema from '../model/smoresDataSchema';
import { getProject } from "../model/smoresProject";
import { window } from "vscode";

export type TraceNode = {
  category:string;
  documentType:string;
};
export type DetailedTraceNode = {
  category:string;
  documentType:string;
  nodeId:number;
  documentId:number;
};

export async function getTraceSelection(originId:number):Promise<number|undefined> {
  const originTraceNode = getOriginNode(originId);
  if(originTraceNode === undefined) {
    return undefined;
  }

  // get valid document options
  const documentOptions = getValidDocumentOptions(originTraceNode);
  if(documentOptions === undefined) {
    window.showErrorMessage("No valid target documents found");
    return undefined;
  }
  // get valid node categories
  const categoryOptions = getValidCategoryOptions(originTraceNode);

  // get user selection of document
  const targetDocument = await getTargetDocument(documentOptions);
  if(targetDocument === undefined) {
    return undefined;
  }
  // get valid node ids and names
  const traceOptions = getTraceOptions(targetDocument, categoryOptions);
  if(traceOptions === undefined) {
    window.showErrorMessage("No valid trace targets found in selected document");
    return undefined;
  }
  // get user selection of node id
  const traceTarget = await getTraceTarget(traceOptions);
  if(traceTarget) {
    return traceTarget.data.id;
  } else {
    return undefined;
  }
}
function isCategoryTraceable(category:string):boolean {
  switch(category) {
  case schema.userFRType:
  case schema.softFRType:
  case schema.archFRType:
  case schema.desFRType:
  case schema.userNFRType:
  case schema.softNFRType:
  case schema.archNFRType:
  case schema.desNFRType:
  case schema.userDCType:
  case schema.softDCType:
  case schema.archDCType:
  case schema.desDCType:
  case schema.userTestType:
  case schema.softTestType:
  case schema.archTestType:
  case schema.desTestType:
    return true;    
  default:
    return false;
  }
}
function getOriginNode(originId:number):DetailedTraceNode|undefined {
  const originNode = getNodeFromId(originId);
  if(originNode === undefined) {
    window.showErrorMessage("Invalid origin for trace");
    return undefined;
  }
  const originCategory = originNode.data.category;
  const originTrace:TraceNode = {
    category:originCategory,
    documentType:originNode.getDocumentType(),
  };
  if(isCategoryTraceable(originCategory)) {
    const documentNode = originNode.getDocument();
    const detailedTraceNode:DetailedTraceNode = {
      category:originCategory,
      documentType:originTrace.documentType,
      nodeId:originId,
      documentId:documentNode.data.id
    };
    return detailedTraceNode;
  } else {
    window.showErrorMessage("Invalid origin for trace");
    return undefined;
  }
}
function getAllDocumentOptions(originDocId:number):SmoresNode[]|undefined {
  const projectNode = getProject();
  if(projectNode === undefined) {
    window.showErrorMessage("Could not find project");
    return undefined;
  }
  var allOptions;
  const documentPaths = projectNode.getDocumentPaths();
  for(let i=0; i<documentPaths.length; i++) {
    const docPath = documentPaths[i];
    const document = new SmoresNode(docPath);
    if(document.data.id !== originDocId) {
      if(Array.isArray(allOptions)) {
        allOptions.push(document);
      } else {
        allOptions = [document];
      }
    }
  }
  return allOptions;
}
function filterNodesByCategory(nodes:SmoresNode[], acceptableCategories:string[]):SmoresNode[]|undefined {
  var filtered;
  for(let i=0; i<nodes.length; i++) {
    const node = nodes[i];
    for(let j=0; j<acceptableCategories.length; j++) {
      const category = acceptableCategories[j];
      if(node.data.category === category) {
        if(Array.isArray(filtered) && !filtered.includes(node)) {
          filtered.push(node);
        } else {
          filtered = [node];
        }
      }
    }
  }
  return filtered;
}
function filterNodesByDocType(nodes:SmoresNode[], acceptableTypes:string[]):SmoresNode[]|undefined {
  var filtered;
  for(let i=0; i<nodes.length; i++) {
    const node = nodes[i];
    for(let j=0; j<acceptableTypes.length; j++) {
      const documentType = acceptableTypes[j];
      if(node.data.documentData!.documentType === documentType) {
        if(Array.isArray(filtered) && !filtered.includes(node)) {
          filtered.push(node);
        } else {
          filtered = [node];
        }
      }
    }
  }
  return filtered;
}

function getValidURSOptions(allOptions:SmoresNode[]):SmoresNode[]|undefined{
  return filterNodesByDocType(allOptions, [schema.srsDocType, schema.atpDocType, schema.emptyDocType]);
}
function getValidSRSOptions(allOptions:SmoresNode[]):SmoresNode[]|undefined{
  return filterNodesByDocType(allOptions, [schema.ursDocType, schema.srsDocType, schema.adsDocType, schema.ddsDocType, schema.stpDocType, schema.itpDocType, schema.emptyDocType]);
}
function getValidADSOptions(allOptions:SmoresNode[]):SmoresNode[]|undefined{
  return filterNodesByDocType(allOptions, [schema.srsDocType, schema.ddsDocType, schema.stpDocType, schema.itpDocType, schema.utpDocType, schema.emptyDocType]);
}
function getValidDDSOptions(allOptions:SmoresNode[]):SmoresNode[]|undefined{
  return filterNodesByDocType(allOptions, [schema.srsDocType, schema.adsDocType, schema.itpDocType, schema.utpDocType, schema.emptyDocType]);
}
function getValidATPOptions(allOptions:SmoresNode[]):SmoresNode[]|undefined{
  return filterNodesByDocType(allOptions, [schema.ursDocType, schema.emptyDocType]);
}
function getValidSTPOptions(allOptions:SmoresNode[]):SmoresNode[]|undefined{
  return filterNodesByDocType(allOptions, [schema.srsDocType, schema.adsDocType, schema.emptyDocType]);
}
function getValidITPOptions(allOptions:SmoresNode[]):SmoresNode[]|undefined{
  return filterNodesByDocType(allOptions, [schema.srsDocType, schema.adsDocType, schema.ddsDocType, schema.emptyDocType]);
}
function getValidUTPOptions(allOptions:SmoresNode[]):SmoresNode[]|undefined{
  return filterNodesByDocType(allOptions, [schema.adsDocType, schema.ddsDocType, schema.emptyDocType]);
}

function getValidDocumentOptions(origin:DetailedTraceNode):SmoresNode[]|undefined {
  const allOptions = getAllDocumentOptions(origin.documentId);
  if(allOptions === undefined) {
    return undefined;
  }
  switch(origin.documentType) {
  case schema.emptyDocType:
    return allOptions;
  case schema.ursDocType:
    return getValidURSOptions(allOptions);
  case schema.srsDocType:
    return getValidSRSOptions(allOptions);
  case schema.adsDocType:
    return getValidADSOptions(allOptions);
  case schema.ddsDocType:
    return getValidDDSOptions(allOptions);
  case schema.atpDocType:
    return getValidATPOptions(allOptions);
  case schema.stpDocType:
    return getValidSTPOptions(allOptions);
  case schema.itpDocType:
    return getValidITPOptions(allOptions);
  case schema.utpDocType:
    return getValidUTPOptions(allOptions);
  }
  return undefined;
}
async function getTargetDocument(options:SmoresNode[]):Promise<SmoresNode|undefined> {
  var quickPickOptions;
  for(let i=0; i<options.length; i++) {
    const id = options[i].data.id;
    const name = options[i].data.text.split("\n")[0];
    const optString = `(${id}) ${name}`;
    if(Array.isArray(quickPickOptions)) {
      quickPickOptions.push(optString);
    } else {
      quickPickOptions = [optString];
    }
  }
  if(quickPickOptions) {
    const selection = await window.showQuickPick(quickPickOptions,{
      canPickMany:false,
      title:"Select target document"
    });
    if(selection) {
      for(let i=0; i<quickPickOptions.length; i++) { 
        if(selection === quickPickOptions[i]) {
          return options[i];
        }
      }
    }
  }
}
function getValidCategoryOptions(origin:DetailedTraceNode):string[] {
  switch(origin.category) {
  case schema.userFRType:
    return [
      schema.userTestType, // tests
      schema.softFRType, schema.softDCType // downstream
    ];
  case schema.softFRType:
    return [
      schema.softTestType, schema.archTestType, // tests
      schema.userFRType, // upstream
      schema.archFRType, schema.archDCType // downstream
    ];
  case schema.archFRType:
    return [
      schema.archTestType, schema.desTestType, // tests
      schema.softFRType, // upstream
      schema.desFRType, schema.desDCType // downstream
    ];
  case schema.desFRType:
    return [
      schema.desTestType, // tests
      schema.archFRType, // upstream
    ];
  case schema.userNFRType:
    return [
      schema.userTestType, // tests
      schema.softNFRType, schema.softDCType // downstream
    ];
  case schema.softNFRType:
    return [
      schema.softTestType, schema.archTestType, // test
      schema.userNFRType, // upstream
      schema.archNFRType, schema.archDCType, schema.desNFRType, schema.desDCType // downstream
    ];
  case schema.archNFRType:
    return [
      schema.archTestType, schema.desTestType, // tests
      schema.softNFRType, // upstream
      schema.desNFRType, schema.desDCType // downstream
    ];
  case schema.desNFRType:
    return [
      schema.desTestType, // tests
      schema.archNFRType, schema.softNFRType // upstream
    ];
  case schema.userDCType:
    return [
      schema.userTestType, //tests
      schema.softDCType
    ];
  case schema.softDCType:
    return [
      schema.softTestType, schema.archTestType,
      schema.userNFRType, schema.userDCType,
      schema.archDCType, schema.desDCType
    ];
  case schema.archDCType:
    return [
      schema.archTestType, schema.desTestType,
      schema.softNFRType, schema.softDCType,
      schema.desDCType
    ];
  case schema.desDCType:
    return [
      schema.desTestType,
      schema.archNFRType, schema.archDCType, schema.softNFRType, schema.softDCType
    ];
  case schema.userTestType:
    return [schema.userFRType, schema.userNFRType, schema.userDCType];
  case schema.softTestType:
    return [schema.softFRType, schema.softNFRType, schema.softDCType];
  case schema.archTestType:
    return [schema.archFRType, schema.archNFRType, schema.archDCType];
  case schema.desTestType:
    return [schema.desFRType, schema.desNFRType, schema.desDCType];
  }  
  return[];
}

function getValidChildNodes(parentNode:SmoresNode, categoryOptions:string[]):SmoresNode[]|undefined {
  var validChildNodes;
  const childNodes = parentNode.getChildNodes();
  validChildNodes = filterNodesByCategory(childNodes,categoryOptions);
  for(let i=0; i<childNodes.length; i++) {
    const child = childNodes[i];
    const recursedChildNodes = getValidChildNodes(child, categoryOptions);
    if(recursedChildNodes) {
      if(Array.isArray(validChildNodes)) {
        validChildNodes.push(...recursedChildNodes);
      } else {
        validChildNodes = [...recursedChildNodes];
      }
    }
  }
  return validChildNodes;
}
function getTraceOptions(targetDocument:SmoresNode, categoryOptions:string[]):SmoresNode[]|undefined {
  return getValidChildNodes(targetDocument, categoryOptions);
}
async function getTraceTarget(targetOptions:SmoresNode[]):Promise<SmoresNode|undefined> {
  var quickPickOptions;
  for(let i=0; i<targetOptions.length; i++) {
    const id = targetOptions[i].data.id;
    const category = targetOptions[i].data.category;
    const name = targetOptions[i].data.text.split("\n")[0];
    const optString = `(${id}) ${name}`;
    if(Array.isArray(quickPickOptions)) {
      quickPickOptions.push(optString);
    } else {
      quickPickOptions = [optString];
    }
  }
  if(quickPickOptions) {
    const selection = await window.showQuickPick(quickPickOptions,{
      canPickMany:false,
      title:"Select target item"
    });
    if(selection) {
      for(let i=0; i<quickPickOptions.length; i++) { 
        if(selection === quickPickOptions[i]) {
          return targetOptions[i];
        }
      }
    }
  }
}
