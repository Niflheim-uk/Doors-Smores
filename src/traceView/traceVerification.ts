import { window } from "vscode";
import { SmoresNode, getNodeFromId } from "../model/smoresNode";
import * as schema from '../model/smoresDataSchema';

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
export enum TraceValidity {
  valid,
  invalidNode,
  invalidTestingTest,
  invalidTargetDocument,
  invalidCategory,
  invalidTargetCategory,
  invalidDirection
}
export function getTraceName(origin:TraceNode, target:TraceNode) {
  if(isTestTrace(origin)) {
    if(isRequirementTrace(target)) {
      return "Verified By";
    } 
  } else if(isRequirementTrace(origin)) {
    if(isTestTrace(target)) {
      return "Verifies";
    } else if(isRequirementTrace(target)) {
      return getInterRequirementTraceName(origin, target);
    }
  }
  return "Invalid";
}
export function isTestTrace(trace:TraceNode):boolean {
  switch(trace.category) {
  case "userAcceptanceTest":
  case "softwareSystemTest":
  case "softwareIntegrationTest":
  case "softwareUnitTest":
    return true;
  default:
    return false;
  }      
}
export function isRequirementTrace(trace:TraceNode):boolean {
  switch(trace.category) {
  case 'userRequirement':
  case 'functionalRequirement':
  case 'nonFunctionalRequirement':
  case 'designConstraint':
    return true;
  default:
    return false;
  }      
}
function getInterRequirementTraceName(origin:TraceNode, target:TraceNode) {
  switch(target.documentType) {
  case schema.ursDocType:
    if(origin.documentType !== schema.ursDocType) {
      return "Decomposed From"; // Upstream
    } else {
      return "Undefined Trace";
    }
  case schema.srsDocType:
    if(origin.documentType === schema.ursDocType) {
      return "Decomposes To"; // Downstream
    } else if(origin.documentType === schema.adsDocType) {
      return "Satisfies"; // Upstream
    } else if(origin.documentType === schema.ddsDocType) {
      return "Details"; // Upstream
    } else {
      return "Undefined Trace";
    }
  case schema.adsDocType:
    if(origin.documentType === schema.srsDocType) {
      return "Satisfied By"; // Downstream
    } else if(origin.documentType === schema.ddsDocType) {
      return "Details"; // Upstream
    } else {
      return "Undefined Trace";
    }
  case schema.ddsDocType:
    if(origin.documentType === schema.srsDocType) {
      return "Detailed By"; // Downstream
    } else if(origin.documentType === schema.adsDocType) {
      return "Detailed By"; // Upstream
    } else {
      return "Undefined Trace";
    }
  }
}
function isValidMix(origin:TraceNode, target:TraceNode):TraceValidity {
  if(isTestTrace(origin)) {
    if(isRequirementTrace(target)) {
      return TraceValidity.valid;
    } else {
      return TraceValidity.invalidTestingTest; // tests cant trace to tests
    }
  } else if(isRequirementTrace(origin)) {
    if(isTestTrace(target)) {
      return TraceValidity.valid;
    } else if(isRequirementTrace(target)) {
      return TraceValidity.valid;
    }
  }
  return TraceValidity.invalidCategory;
}
function getTraceDirection(origin:TraceNode, target:TraceNode):number {
  let dir = 0;
  if(isTestTrace(origin)) {
    if(isRequirementTrace(target)) {
      dir = 1;
    }
  } else if(isRequirementTrace(origin)) {
    if(isTestTrace(target)) {
      dir = -1;
    } else {
      switch(origin.documentType) {
      case schema.ursDocType:
        if(target.documentType === schema.srsDocType ||
          target.documentType === schema.adsDocType ||
          target.documentType === schema.ddsDocType) 
        {
          dir = -1;
        }
        break;
      case schema.srsDocType:
        if(target.documentType === schema.ursDocType) {
          dir = 1;
        } else if(target.documentType === schema.adsDocType || target.documentType === schema.ddsDocType) {
          dir = -1;
        }
        break;
      case schema.adsDocType:
        if(target.documentType === schema.ursDocType || target.documentType === schema.srsDocType) {
          dir = 1;
        } else if(target.documentType === schema.ddsDocType) {
          dir = -1;
        }
        break;
      case schema.ddsDocType:
        if(target.documentType === schema.ursDocType ||
          target.documentType === schema.srsDocType ||
          target.documentType === schema.adsDocType) 
        {
          dir = 1;
        }
        break;
      }
    }
  }
  return dir;
}

function testInvalidTestTrace(origin:TraceNode, target:TraceNode):TraceValidity {
  // Quick exit if no test trace to validate
  if(!isTestTrace(origin) && !isTestTrace(target)) {
    return TraceValidity.valid;
  }
  // cant validate without a document type
  if(origin.documentType === schema.emptyDocType || target.documentType === schema.emptyDocType) {
    return TraceValidity.valid; 
  }
  // Normalize language for easier testing
  var test:TraceNode;
  var req:TraceNode;
  if(isTestTrace(origin)) {
    test = origin;
    req = target;
  } else {
    test = target;
    req = origin;
  }
  switch(req.documentType) {
  case schema.ursDocType:
    if(test.documentType !== schema.utpDocType) {
      return TraceValidity.invalidTargetDocument;
    }
    break;
  case schema.srsDocType:
    if(test.documentType !== schema.stpDocType && test.documentType !== schema.itpDocType) {
      return TraceValidity.invalidTargetDocument;
    }
    break;
  case schema.adsDocType:
    if(test.documentType !== schema.stpDocType && test.documentType !== schema.itpDocType) {
      return TraceValidity.invalidTargetDocument;
    }
    break;
  case schema.ddsDocType:
    if(test.documentType !== schema.itpDocType && test.documentType !== schema.utpDocType) {
      return TraceValidity.invalidTargetDocument;
    }
    break;
  }
  return TraceValidity.valid;
}
function testInvalidRequirementTrace(origin:TraceNode, target:TraceNode):TraceValidity {
  // Only requirement to requirement traces should remain
  if(!isRequirementTrace(origin) || !isRequirementTrace(target)) {
    return TraceValidity.invalidTargetCategory;
  }
  // cant validate without a document type
  if(origin.documentType === schema.emptyDocType || target.documentType === schema.emptyDocType) {
    return TraceValidity.valid; 
  }
  switch(origin.documentType) {
  case schema.ursDocType:
    if(target.documentType !== schema.srsDocType) {
      return TraceValidity.invalidTargetDocument;
    }
    break;
  case schema.srsDocType:
    if(target.documentType !== schema.ursDocType && 
      target.documentType !== schema.srsDocType && 
      target.documentType !== schema.adsDocType && 
      target.documentType !== schema.ddsDocType) {
      return TraceValidity.invalidTargetDocument;
    }
    break;
  case schema.adsDocType:
    if(target.documentType !== schema.srsDocType && 
      target.documentType !== schema.ddsDocType) {
      return TraceValidity.invalidTargetDocument;
    }
    break;
  case schema.ddsDocType:
    if(target.documentType !== schema.srsDocType && 
      target.documentType !== schema.adsDocType) {
      return TraceValidity.invalidTargetDocument;
    }
    break;
  }
  return TraceValidity.valid;
}

function _verifyTraceLink(origin:TraceNode, target:TraceNode, isUpstream:boolean):TraceValidity {
  let expectedDir = -1;
  if(isUpstream) {
    expectedDir = 1;
  }
  var validity = isValidMix(origin, target);
  if(validity !== TraceValidity.valid) {
    return validity;
  }
  const traceDir = getTraceDirection(origin, target);
  if(traceDir !== expectedDir) {
    return TraceValidity.invalidDirection;
  }
  validity = testInvalidTestTrace(origin, target);
  if(validity !== TraceValidity.valid) {
    return validity;
  }
  validity = testInvalidRequirementTrace(origin, target);
  if(validity !== TraceValidity.valid) {
    return validity;
  }
  return TraceValidity.valid;
}
export function verifyTraceLink(origin:TraceNode, traceId:number, isUpstream:boolean) {
  const traceNode = getNodeFromId(traceId);
  if(traceNode === undefined) {
    return TraceValidity.invalidNode;
  }
  const documentType = traceNode.getDocumentType();
  const category = traceNode.data.category;
  return _verifyTraceLink(origin, {category, documentType}, isUpstream);
}
var _origin:TraceNode = {category:"", documentType:""};
var _upstream:boolean = false;
export function setTraceValidationOrigin(origin:TraceNode, upstream:boolean) {
  _origin = origin;
  _upstream = upstream;
}
export function validateTraceInput(text:string):string|null {
  if(/^\d+$/.test(text)) {
    switch(verifyTraceLink(_origin, Number(text), _upstream)) {
    case TraceValidity.valid:
      console.log('Ok');
      return null;
    case TraceValidity.invalidNode:
      console.log('invalidNode');
      return 'Unknown node Id';
    case TraceValidity.invalidCategory:
      console.log('invalidCategory');
      return 'The specified node is an invalid category for tracing';
    case TraceValidity.invalidDirection:
      console.log('invalidDirection');
      return 'The specified node is not in the requested trace direction';
    case TraceValidity.invalidTargetCategory:
      console.log('invalidTargetCategory');
      return 'The specified node category may not be traced to this object';
    case TraceValidity.invalidTargetDocument:
      console.log('invalidTargetDocument');
      return 'The specified node is in an invalid target document type';
    case TraceValidity.invalidTestingTest:
      console.log('invalidTestingTest');
      return 'Tests may not trace to tests';
    }
    return null;
  } else {
    console.log('Not a number');
    return 'Not a valid node Id. Please enter an integer number.';
  }
}  

