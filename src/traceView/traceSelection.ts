import { SmoresNode } from "../model/smoresNode";
import { TraceNode } from "../model/traceVerification";

export async function getTraceSelection(origin:TraceNode):Promise<number> {

  // get valid document options
  const documentOptions = getValidDocumentOptions(origin.documentType);
  // get user selection of document
  const targetDocument = await getTargetDocument(documentOptions);
  // get valid node categories
  const categoryOptions = getValidCategoryOptions(origin.category);
  // get valid node ids and names
  const traceOptions = getTraceOptions(targetDocument, categoryOptions);
  // get user selection of node id
  const traceTarget = await getTraceTarget(traceOptions);

  return traceTarget.data.id;
}

function getValidDocumentOptions(originDocType:string):SmoresNode[] {
  return [];
}
async function getTargetDocument(options:SmoresNode[]):Promise<SmoresNode> {
  return new SmoresNode("");
}
function getValidCategoryOptions(originCategory:string):string[] {
  return[];
}
function getTraceOptions(targetDocument:SmoresNode, categoryOptions:string[]):SmoresNode[] {
  return [];
}
async function getTraceTarget(targetOptions:SmoresNode[]):Promise<SmoresNode> {
  return new SmoresNode("");
}