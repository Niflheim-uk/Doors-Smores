import * as vscode from 'vscode';
import * as schema from '../model/schema';
import { DocumentTreeItem } from "../treeViews/documentTree/documentTreeItem";
import { DocumentNode } from './documentNode';

function getNodeFromContext(context:any):DocumentNode|undefined {
  if(context.nodeId === undefined) {
    vscode.window.showErrorMessage("Undefined Node Id from webview context");
    return;
  }
  const nodeId:number = Number(context.nodeId);
  return DocumentNode.createFromId(nodeId);
}
function getInsertionNodeAndPosition(source:any):[DocumentNode|undefined, number] {
  var originNode:DocumentNode|undefined;
  if(DocumentNode.isDocumentNode(source)) {
    const node:DocumentNode = source;
    originNode = node;
  } else if(DocumentTreeItem.isDocumentTreeItem(source)) {
    const item:DocumentTreeItem = source;
    originNode = item.node;
  } else {
    originNode = getNodeFromContext(source);
  }
  if(originNode === undefined) {
    return [undefined,-1];
  }
  if(originNode.data.category === schema.headingCategory || originNode.data.category === schema.documentCategory) {
    return [originNode, -1];
  } else {
    const parent = originNode.getParent();
    if(parent !== null) {
      const insertPos = parent.getChildPosition(originNode.data.id);
      return [parent, insertPos+1];
    }
  }
  return [originNode, -1];
}


export async function newHeading(source:any, content?:string) {
  const [parent, insertPos] = getInsertionNodeAndPosition(source);
  if(parent) {
    if(content === undefined) {
      content = await vscode.window.showInputBox({ placeHolder: 'new heading?' });
    }
    if(content) {
      return DocumentNode.createNewDocumentNode(parent, schema.headingCategory, content, insertPos);
    }
  }
}

export function newComment(source:any, content?:string) {
  const [parent, insertPos] = getInsertionNodeAndPosition(source);
  if(parent) {
    if(content === undefined) {
      content = "new comment";
    }
    return DocumentNode.createNewDocumentNode(parent, schema.commentCategory, content, insertPos);
  }
}

export function newFuncReq(source:any) {
  const [parent, insertPos] = getInsertionNodeAndPosition(source);
  if(parent) {
    const content = "New functional requirement.";
    switch(parent.getDocumentType()) {
    case schema.ursDocType:
      return DocumentNode.createNewDocumentNode(parent, schema.userFRCategory, content, insertPos);
    case schema.srsDocType:
      return DocumentNode.createNewDocumentNode(parent, schema.softFRCategory, content, insertPos);
    case schema.adsDocType:
      return DocumentNode.createNewDocumentNode(parent, schema.archFRCategory, content, insertPos);
    case schema.ddsDocType:
      return DocumentNode.createNewDocumentNode(parent, schema.desFRCategory, content, insertPos);
    }
  }
}
export function newNonFuncReq(source:any) {
  const [parent, insertPos] = getInsertionNodeAndPosition(source);
  if(parent) {
    const content = "New non-functional requirement.";
    switch(parent.getDocumentType()) {
    case schema.ursDocType:
      return DocumentNode.createNewDocumentNode(parent, schema.userNFRCategory, content, insertPos);
    case schema.srsDocType:
      return DocumentNode.createNewDocumentNode(parent, schema.softNFRCategory, content, insertPos);
    case schema.adsDocType:
      return DocumentNode.createNewDocumentNode(parent, schema.archNFRCategory, content, insertPos);
    case schema.ddsDocType:
      return DocumentNode.createNewDocumentNode(parent, schema.desNFRCategory, content, insertPos);
    }
  }
}
export function newDesCon(source:any) {
  const [parent, insertPos] = getInsertionNodeAndPosition(source);
  if(parent) {
    const content = "New design constraint.";
    switch(parent.getDocumentType()) {
    case schema.ursDocType:
      return DocumentNode.createNewDocumentNode(parent, schema.userDCCategory, content, insertPos);
    case schema.srsDocType:
      return DocumentNode.createNewDocumentNode(parent, schema.softDCCategory, content, insertPos);
    case schema.adsDocType:
      return DocumentNode.createNewDocumentNode(parent, schema.archDCCategory, content, insertPos);
    case schema.ddsDocType:
      return DocumentNode.createNewDocumentNode(parent, schema.desDCCategory, content, insertPos);
    }
  }
}
export function newTest(source:any) {
  const [parent, insertPos] = getInsertionNodeAndPosition(source);
  if(parent) {
    var content:string;
    content = "New user acceptance test.";
    const docType = parent.getDocumentType();
    switch(docType) {
    case schema.atpDocType:
      content = "New user acceptance test.";
      return DocumentNode.createNewDocumentNode(parent, schema.userTestCategory, content, insertPos);
    case schema.stpDocType:
      content = "New software system test.";
      return DocumentNode.createNewDocumentNode(parent, schema.softTestCategory, content, insertPos);
    case schema.itpDocType:
      content = "New software integration test.";
      return DocumentNode.createNewDocumentNode(parent, schema.archTestCategory, content, insertPos);
    case schema.utpDocType:
      content = "New unit test.";
      return DocumentNode.createNewDocumentNode(parent, schema.desTestCategory, content, insertPos);
    }
  }
}
export function newImage(source:any) {
  const [parent, insertPos] = getInsertionNodeAndPosition(source);
  if(parent) {
    return DocumentNode.createNewDocumentNode(parent, schema.imageCategory, "../defaultImage.jpg", insertPos);
  }
}
export function newMermaidImage(source:any) {
  const [parent, insertPos] = getInsertionNodeAndPosition(source);
  if(parent) {
    const mermaid = `sequenceDiagram
    Alice->>John: Hello John, how are you?
    John-->>Alice: Great!
    Alice-)John: See you later!`;
    return DocumentNode.createNewDocumentNode(parent, schema.mermaidCategory, mermaid, insertPos);
  }
}
export function registerNewContentCommands(context:vscode.ExtensionContext) {
  const registrations = [
    vscode.commands.registerCommand('doors-smores.NewHeading', newHeading),
    vscode.commands.registerCommand('doors-smores.NewComment', newComment),
    vscode.commands.registerCommand('doors-smores.NewFuncReq', newFuncReq),
    vscode.commands.registerCommand('doors-smores.NewNonFuncReq', newNonFuncReq),
    vscode.commands.registerCommand('doors-smores.NewDesCon', newDesCon),
    vscode.commands.registerCommand('doors-smores.NewTest', newTest),
    vscode.commands.registerCommand('doors-smores.NewImage', newImage),
    vscode.commands.registerCommand('doors-smores.NewMermaidImage', newMermaidImage),
  ];
  context.subscriptions.push(...registrations);
}
