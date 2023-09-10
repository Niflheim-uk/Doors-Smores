import { SmoresNode, getNodeFromId } from "../model/smoresNode";
import { DetailedTraceNode, TraceNode, isRequirementTrace, isTestTrace } from "./traceVerification";
import * as schmea from '../model/smoresDataSchema';
import { getProject } from "../model/smoresProject";
import { window } from "vscode";

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
function getOriginNode(originId:number):DetailedTraceNode|undefined {
  const originNode = getNodeFromId(originId);
  if(originNode === undefined) {
    window.showErrorMessage("Invalid origin for trace");
    return undefined;
  }
  const originCategory = originNode.data.category;
  const originTrace:TraceNode = {
    category:originNode.data.category,
    documentType:originNode.getDocumentType(),
  };
  if(isTestTrace(originTrace) || isRequirementTrace(originTrace)) {
    const documentNode = originNode.getDocument();
    const detailedTraceNode:DetailedTraceNode = {
      category:originTrace.category,
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
  return filterNodesByDocType(allOptions, [schmea.srsDocType, schmea.atpDocType, schmea.emptyDocType]);
}
function getValidSRSOptions(allOptions:SmoresNode[]):SmoresNode[]|undefined{
  return filterNodesByDocType(allOptions, [schmea.ursDocType, schmea.srsDocType, schmea.adsDocType, schmea.ddsDocType, schmea.stpDocType, schmea.itpDocType, schmea.emptyDocType]);
}
function getValidADSOptions(allOptions:SmoresNode[]):SmoresNode[]|undefined{
  return filterNodesByDocType(allOptions, [schmea.srsDocType, schmea.ddsDocType, schmea.stpDocType, schmea.itpDocType, schmea.utpDocType, schmea.emptyDocType]);
}
function getValidDDSOptions(allOptions:SmoresNode[]):SmoresNode[]|undefined{
  return filterNodesByDocType(allOptions, [schmea.srsDocType, schmea.adsDocType, schmea.itpDocType, schmea.utpDocType, schmea.emptyDocType]);
}
function getValidATPOptions(allOptions:SmoresNode[]):SmoresNode[]|undefined{
  return filterNodesByDocType(allOptions, [schmea.ursDocType, schmea.emptyDocType]);
}
function getValidSTPOptions(allOptions:SmoresNode[]):SmoresNode[]|undefined{
  return filterNodesByDocType(allOptions, [schmea.srsDocType, schmea.adsDocType, schmea.emptyDocType]);
}
function getValidITPOptions(allOptions:SmoresNode[]):SmoresNode[]|undefined{
  return filterNodesByDocType(allOptions, [schmea.srsDocType, schmea.adsDocType, schmea.ddsDocType, schmea.emptyDocType]);
}
function getValidUTPOptions(allOptions:SmoresNode[]):SmoresNode[]|undefined{
  return filterNodesByDocType(allOptions, [schmea.adsDocType, schmea.ddsDocType, schmea.emptyDocType]);
}

function getValidDocumentOptions(origin:DetailedTraceNode):SmoresNode[]|undefined {
  const allOptions = getAllDocumentOptions(origin.documentId);
  if(allOptions === undefined) {
    return undefined;
  }
  switch(origin.documentType) {
  case schmea.emptyDocType:
    return allOptions;
  case schmea.ursDocType:
    return getValidURSOptions(allOptions);
  case schmea.srsDocType:
    return getValidSRSOptions(allOptions);
  case schmea.adsDocType:
    return getValidADSOptions(allOptions);
  case schmea.ddsDocType:
    return getValidDDSOptions(allOptions);
  case schmea.atpDocType:
    return getValidATPOptions(allOptions);
  case schmea.stpDocType:
    return getValidSTPOptions(allOptions);
  case schmea.itpDocType:
    return getValidITPOptions(allOptions);
  case schmea.utpDocType:
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
    const selection = await window.showQuickPick(quickPickOptions,{canPickMany:false});
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
  case schmea.userFRType:
    return [
      schmea.userTestType, // tests
      schmea.softFRType, schmea.softDCType // downstream
    ];
  case schmea.softFRType:
    return [
      schmea.softTestType, schmea.archTestType, // tests
      schmea.userFRType, // upstream
      schmea.archFRType, schmea.archDCType // downstream
    ];
  case schmea.archFRType:
    return [
      schmea.archTestType, schmea.desTestType, // tests
      schmea.softFRType, // upstream
      schmea.desFRType, schmea.desDCType // downstream
    ];
  case schmea.desFRType:
    return [
      schmea.desTestType, // tests
      schmea.archFRType, // upstream
    ];
  case schmea.userNFRType:
    return [
      schmea.userTestType, // tests
      schmea.softNFRType, schmea.softDCType // downstream
    ];
  case schmea.softNFRType:
    return [
      schmea.softTestType, schmea.archTestType, // test
      schmea.userNFRType, // upstream
      schmea.archNFRType, schmea.archDCType, schmea.desNFRType, schmea.desDCType // downstream
    ];
  case schmea.archNFRType:
    return [
      schmea.archTestType, schmea.desTestType, // tests
      schmea.softNFRType, // upstream
      schmea.desNFRType, schmea.desDCType // downstream
    ];
  case schmea.desNFRType:
    return [
      schmea.desTestType, // tests
      schmea.archNFRType, schmea.softNFRType // upstream
    ];
  case schmea.userDCType:
    return [
      schmea.userTestType, //tests
      schmea.softDCType
    ];
  case schmea.softDCType:
    return [
      schmea.softTestType, schmea.archTestType,
      schmea.userNFRType, schmea.userDCType,
      schmea.archDCType, schmea.desDCType
    ];
  case schmea.archDCType:
    return [
      schmea.archTestType, schmea.desTestType,
      schmea.softNFRType, schmea.softDCType,
      schmea.desDCType
    ];
  case schmea.desDCType:
    return [
      schmea.desTestType,
      schmea.archNFRType, schmea.archDCType, schmea.softNFRType, schmea.softDCType
    ];
  case schmea.userTestType:
    return [schmea.userFRType, schmea.userNFRType, schmea.userDCType];
  case schmea.softTestType:
    return [schmea.softFRType, schmea.softNFRType, schmea.softDCType];
  case schmea.archTestType:
    return [schmea.archFRType, schmea.archNFRType, schmea.archDCType];
  case schmea.desTestType:
    return [schmea.desFRType, schmea.desNFRType, schmea.desDCType];
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
    const selection = await window.showQuickPick(quickPickOptions,{canPickMany:false});
    if(selection) {
      for(let i=0; i<quickPickOptions.length; i++) { 
        if(selection === quickPickOptions[i]) {
          return targetOptions[i];
        }
      }
    }
  }
}
