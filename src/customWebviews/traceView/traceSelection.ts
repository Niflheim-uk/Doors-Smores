import * as schema from '../../model/schema';
import { window } from "vscode";
import { getTargetableDocumentTypes, getValidCategoryOptions, isCategoryTraceable } from "./traceSorting";
import { DocumentNode } from '../../model/documentNode';
import { DoorsSmores } from '../../doorsSmores';

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
  const originNode = DocumentNode.createFromId(originId);
  const originTraceNode = getOriginNode(originId);
  if(originTraceNode === undefined || originNode === undefined) {
    return undefined;
  }

  // get valid document options
  const documentOptions = getValidDocumentOptions(originTraceNode);
  if(documentOptions.length === 0) {
    window.showInformationMessage("No valid target documents found");
    return undefined;
  }
  // get valid node categories
  const categoryOptions = getValidCategoryOptions(originTraceNode.category);

  // get user selection of document
  const targetDocument = await getTargetDocument(documentOptions);
  if(targetDocument === undefined) {
    return undefined;
  }
  const traceOptions = getTraceOptions(targetDocument, categoryOptions);
  const remainingOptions = removeExistingTraces(originNode.data.traces.traceIds, traceOptions);
  const traceTarget = await getTraceTarget(remainingOptions);
  if(traceTarget) {
    return traceTarget.data.id;
  } else {
    return undefined;
  }
}
function getOriginNode(originId:number):DetailedTraceNode|undefined {
  const originNode = DocumentNode.createFromId(originId);
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
function getAllDocumentOptions(originDocId:number):DocumentNode[] {
  var allOptions:DocumentNode[] =[];
  const documents = DoorsSmores.getDocuments();
  for(let i=0; i<documents.length; i++) {
    if(documents[i].data.id !== originDocId) {
      allOptions.push(documents[i]);
    }
  }
  return allOptions;
}
function filterNodesByCategory(nodes:DocumentNode[], acceptableCategories:string[]):DocumentNode[] {
  var filtered:DocumentNode[] =[];
  for(let i=0; i<nodes.length; i++) {
    const node = nodes[i];
    for(let j=0; j<acceptableCategories.length; j++) {
      const category = acceptableCategories[j];
      if(node.data.category === category) {
        if(!filtered.includes(node)) {
          filtered.push(node);
        }
      }
    }
  }
  return filtered;
}
function filterNodesByDocType(nodes:DocumentNode[], acceptableTypes:string[]):DocumentNode[] {
  var filtered:DocumentNode[] =[];
  for(let i=0; i<nodes.length; i++) {
    const node = nodes[i];
    for(let j=0; j<acceptableTypes.length; j++) {
      const documentType = acceptableTypes[j];
      if(node.data.documentData!.documentType === documentType) {
        if(!filtered.includes(node)) {
          filtered.push(node);
        } 
      }
    }
  }
  return filtered;
}

function getValidDocumentOptions(origin:DetailedTraceNode):DocumentNode[] {
  const allOptions = getAllDocumentOptions(origin.documentId);
  const validTargetDocumentTypes = getTargetableDocumentTypes(origin.documentType);
  return filterNodesByDocType(allOptions, validTargetDocumentTypes);
}
async function getTargetDocument(options:DocumentNode[]):Promise<DocumentNode|undefined> {
  var quickPickOptions:string[] = [];
  for(let i=0; i<options.length; i++) {
    const id = options[i].data.id;
    const name = options[i].data.text.split("\n")[0];
    const optString = `(${id}) ${name}`;
    quickPickOptions.push(optString);
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

function getValidChildNodes(parentNode:DocumentNode, categoryOptions:string[]):DocumentNode[] {
  var validChildNodes:DocumentNode[] = [];
  const childNodes = parentNode.getChildren();
  validChildNodes = filterNodesByCategory(childNodes,categoryOptions);
  for(let i=0; i<childNodes.length; i++) {
    const child = childNodes[i];
    const recursedChildNodes = getValidChildNodes(child, categoryOptions);
    validChildNodes.push(...recursedChildNodes);
  }
  return validChildNodes;
}
function getTraceOptions(targetDocument:DocumentNode, categoryOptions:string[]):DocumentNode[] {
  return getValidChildNodes(targetDocument, categoryOptions);
}
async function getTraceTarget(targetOptions:DocumentNode[]):Promise<DocumentNode|undefined> {
  var quickPickOptions:string[] = [];
  for(let i=0; i<targetOptions.length; i++) {
    const id = targetOptions[i].data.id;
    const category = targetOptions[i].data.category;
    const label = schema.getLabelPrefix(category);
    const name = targetOptions[i].data.text.split("\n")[0];
    const optString = `(${label}:${id}) ${name}`;
    quickPickOptions.push(optString);
  }
  if(quickPickOptions.length > 0) {
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
  } else {
    window.showInformationMessage("No available trace targets found in selected document");
  }
}
function removeExistingTraces(existingTraceIds:number[], traceOptions:DocumentNode[]):DocumentNode[] {
  for(let i=0; i<existingTraceIds.length; i++) {
    const idPos = traceOptions.findIndex(option => option.data.id === existingTraceIds[i]);
    if(idPos !== -1) {
      traceOptions.splice(idPos,1);
    }
  }
  return traceOptions;
}
