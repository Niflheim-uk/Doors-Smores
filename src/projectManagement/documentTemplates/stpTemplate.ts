/* eslint-disable @typescript-eslint/naming-convention */
import { SmoresNode } from "../../model/smoresNode";
import * as schema from '../../model/smoresDataSchema';

import { 
  documentStart,
  testProtocolStart
 } from "./documentParts";

export function createNodesForSTPFull(docNode:SmoresNode) {
  documentStart(docNode);
}

export function createNodesForSTPMini(docNode:SmoresNode) {
  documentStart(docNode);
  testProtocolStart(docNode);
}
