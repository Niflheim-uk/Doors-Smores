import { window } from 'vscode';
import { FileIO } from '../model/fileIO';
import * as schema from '../model/schema';
import { SmoresDocument } from '../model/smoresDocument';
import { SmoresProject } from '../model/smoresProject';

const ursReqPattern = /^U((FR)|(NFR)|(DC))$/;
const srsReqPattern = /^S((FR)|(NFR)|(DC))$/;
const adsReqPattern = /^A((FR)|(NFR)|(DC))$/;
const srsAdsReqPattern = /^(S|A)((FR)|(NFR)|(DC))$/;
const ddsReqPattern = /^D((FR)|(NFR)|(DC))$/;
const userTestPattern = /^UT$/;
const softTestPattern = /^ST$/;
const archTestPattern = /^AT$/;
const desTestPattern = /^DT$/;

export function getTraceCategoryLabels(doc:SmoresDocument, traceIds:number[]):string[] {
  var labels =[];
  for(let i=0; i<traceIds.length; i++) {
    const traceIdFilename = FileIO.getContentFilepath(doc, traceIds[i]);
    if(traceIdFilename) {
      const traceIdData = FileIO.readContentFile(traceIdFilename);
      if(traceIdData) {
        labels.push(schema.getLabelPrefix(traceIdData.category));
      } else {
        labels.push(schema.getLabelPrefix("unknown"));
      }
    } else {
      labels.push(schema.getLabelPrefix("unknown"));
    }
  }
  return labels;
}
export function isCategoryTraceable(category:string):boolean {
  switch(category) {
  case schema.userFRCategory:
  case schema.softFRCategory:
  case schema.archFRCategory:
  case schema.desFRCategory:
  case schema.userNFRCategory:
  case schema.softNFRCategory:
  case schema.archNFRCategory:
  case schema.desNFRCategory:
  case schema.userDCCategory:
  case schema.softDCCategory:
  case schema.archDCCategory:
  case schema.desDCCategory:
  case schema.userTestCategory:
  case schema.softTestCategory:
  case schema.archTestCategory:
  case schema.desTestCategory:
    return true;    
  default:
    return false;
  }
}
export function getValidCategoryOptions(originCategory:string):string[] {
  switch(originCategory) {
  case schema.userFRCategory:
    return [
      schema.userTestCategory, // tests
      schema.softFRCategory, schema.softDCCategory // downstream
    ];
  case schema.userNFRCategory:
    return [
      schema.userTestCategory, // tests
      schema.softNFRCategory, schema.softDCCategory // downstream
    ];
  case schema.userDCCategory:
    return [
      schema.userTestCategory, //tests
      schema.softDCCategory
    ];
  case schema.softFRCategory:
    return [
      schema.userFRCategory, // upstream
      schema.softTestCategory, schema.archTestCategory, // tests
      schema.archFRCategory, schema.archDCCategory, schema.desFRCategory, schema.desDCCategory // downstream
    ];
  case schema.softNFRCategory:
    return [
      schema.userNFRCategory, // upstream
      schema.softTestCategory, schema.archTestCategory, // test
      schema.archNFRCategory, schema.archDCCategory, schema.desNFRCategory, schema.desDCCategory // downstream
    ];
  case schema.softDCCategory:
    return [
      schema.userNFRCategory, schema.userDCCategory,
      schema.softTestCategory, schema.archTestCategory,
      schema.archDCCategory, schema.desDCCategory
    ];
  case schema.archFRCategory:
    return [
      schema.softFRCategory, // upstream
      schema.archTestCategory, schema.desTestCategory, // tests
      schema.desFRCategory, schema.desDCCategory // downstream
    ];
  case schema.archNFRCategory:
    return [
      schema.softNFRCategory, // upstream
      schema.archTestCategory, schema.desTestCategory, // tests
      schema.desNFRCategory, schema.desDCCategory // downstream
    ];
  case schema.archDCCategory:
    return [
      schema.softNFRCategory, schema.softDCCategory,
      schema.archTestCategory, schema.desTestCategory,
      schema.desDCCategory
    ];
  case schema.desFRCategory:
    return [
      schema.softFRCategory, schema.archFRCategory, // upstream
      schema.desTestCategory, schema.archTestCategory, // tests
    ];
  case schema.desNFRCategory:
    return [
      schema.softNFRCategory, schema.archNFRCategory, // upstream
      schema.desTestCategory, schema.archTestCategory, // tests
    ];
  case schema.desDCCategory:
    return [
      schema.softFRCategory, schema.softNFRCategory, schema.softDCCategory, schema.archFRCategory, schema.archNFRCategory, schema.archDCCategory,
      schema.desTestCategory, schema.archTestCategory,
    ];
  case schema.userTestCategory:
    return [schema.userFRCategory, schema.userNFRCategory, schema.userDCCategory];
  case schema.softTestCategory:
    return [schema.softFRCategory, schema.softNFRCategory, schema.softDCCategory];
  case schema.archTestCategory:
    return [schema.softFRCategory, schema.softNFRCategory, schema.softDCCategory, schema.archFRCategory, schema.archNFRCategory, schema.archDCCategory, schema.desFRCategory, schema.desNFRCategory, schema.desDCCategory];
  case schema.desTestCategory:
    return [schema.archFRCategory, schema.archNFRCategory, schema.archDCCategory, schema.desFRCategory, schema.desNFRCategory, schema.desDCCategory];
  }  
  return[];
}
export function getTargetableDocumentTypes(originDocumentType:string) {
  switch(originDocumentType) {
    case schema.emptyDocType:
      return [schema.ursDocType, schema.srsDocType, schema.adsDocType, schema.ddsDocType, schema.atpDocType, schema.stpDocType, schema.itpDocType, schema.utpDocType, schema.emptyDocType];
    case schema.ursDocType:
      return [schema.srsDocType, schema.atpDocType, schema.emptyDocType];
    case schema.srsDocType:
      return [schema.ursDocType, schema.srsDocType, schema.adsDocType, schema.ddsDocType, schema.stpDocType, schema.itpDocType, schema.emptyDocType];
    case schema.adsDocType:
      return [schema.srsDocType, schema.ddsDocType, schema.itpDocType, schema.utpDocType, schema.emptyDocType];
    case schema.ddsDocType:
      return [schema.srsDocType, schema.adsDocType, schema.itpDocType, schema.utpDocType, schema.emptyDocType];
    case schema.atpDocType:
      return [schema.ursDocType, schema.emptyDocType];
    case schema.stpDocType:
      return [schema.srsDocType, schema.adsDocType, schema.emptyDocType];
    case schema.itpDocType:
      return [schema.srsDocType, schema.adsDocType, schema.ddsDocType, schema.emptyDocType];
    case schema.utpDocType:
      return [schema.adsDocType, schema.ddsDocType, schema.emptyDocType];
    }
    return [];
}
function getMatchingTraceTypes(originCategoryLabel:string, traces:number[], traceCategoryLabels:string[], patterns:RegExp[]):number[] {
  if(traces.length !== traceCategoryLabels.length) {
    console.error("Mismatch in array lengths when getting trace types");
    return [];
  }
  var matchedTraces = [];
  if(originCategoryLabel.match(patterns[0])) {
    for(let i=0; i< traces.length; i++) {
      if(traceCategoryLabels[i].match(patterns[1])) {
        matchedTraces.push(traces[i]);
      }
    }
  }
  return matchedTraces;
}
export function getDecomposedFromTraceType(originCategoryLabel:string, traces:number[], traceCategoryLabels:string[]):number[] {
  return getMatchingTraceTypes(originCategoryLabel, traces, traceCategoryLabels, [srsReqPattern, ursReqPattern]);
}
export function getDecomposesToTraceType(originCategoryLabel:string, traces:number[], traceCategoryLabels:string[]):number[] {
  return getMatchingTraceTypes(originCategoryLabel, traces, traceCategoryLabels, [ursReqPattern, srsReqPattern]);
}
export function getSatisfiedByTraceType(originCategoryLabel:string, traces:number[], traceCategoryLabels:string[]):number[] {
  return getMatchingTraceTypes(originCategoryLabel, traces, traceCategoryLabels, [srsReqPattern, adsReqPattern]);
}
export function getSatisfiesTraceType(originCategoryLabel:string, traces:number[], traceCategoryLabels:string[]):number[] {
  return getMatchingTraceTypes(originCategoryLabel, traces, traceCategoryLabels, [adsReqPattern, srsReqPattern]);
}
export function getDetailedByTraceType(originCategoryLabel:string, traces:number[], traceCategoryLabels:string[]):number[] {
  return getMatchingTraceTypes(originCategoryLabel, traces, traceCategoryLabels, [srsAdsReqPattern, ddsReqPattern]);
}
export function getDetailsTraceType(originCategoryLabel:string, traces:number[], traceCategoryLabels:string[]):number[] {
  return getMatchingTraceTypes(originCategoryLabel, traces, traceCategoryLabels, [ddsReqPattern, srsAdsReqPattern]);
}
export function getVerifiedByTraceType(originCategoryLabel:string, traces:number[], traceCategoryLabels:string[]):number[] {
  const userLevelMatches = getMatchingTraceTypes(originCategoryLabel, traces, traceCategoryLabels, [ursReqPattern, userTestPattern]);
  const softLevelMatches = getMatchingTraceTypes(originCategoryLabel, traces, traceCategoryLabels, [srsReqPattern, softTestPattern]);
  const softLevelMatches2 = getMatchingTraceTypes(originCategoryLabel, traces, traceCategoryLabels, [srsReqPattern, archTestPattern]);
  const archLevelMatches = getMatchingTraceTypes(originCategoryLabel, traces, traceCategoryLabels, [adsReqPattern, archTestPattern]);
  const archLevelMatches2 = getMatchingTraceTypes(originCategoryLabel, traces, traceCategoryLabels, [adsReqPattern, desTestPattern]);
  const desLevelMatches = getMatchingTraceTypes(originCategoryLabel, traces, traceCategoryLabels, [ddsReqPattern, desTestPattern]);
  const desLevelMatches2 = getMatchingTraceTypes(originCategoryLabel, traces, traceCategoryLabels, [ddsReqPattern, archTestPattern]);
  return [
    ...userLevelMatches, 
    ...softLevelMatches, 
    ...softLevelMatches2, 
    ...archLevelMatches, 
    ...archLevelMatches2, 
    ...desLevelMatches,
    ...desLevelMatches2
  ];
}
export function getVerifiesTraceType(originCategoryLabel:string, traces:number[], traceCategoryLabels:string[]):number[] {
  const userLevelMatches = getMatchingTraceTypes(originCategoryLabel, traces, traceCategoryLabels, [userTestPattern, ursReqPattern]);
  const softLevelMatches = getMatchingTraceTypes(originCategoryLabel, traces, traceCategoryLabels, [softTestPattern, srsReqPattern]);
  const softLevelMatches2 = getMatchingTraceTypes(originCategoryLabel, traces, traceCategoryLabels, [archTestPattern, srsReqPattern]);
  const archLevelMatches = getMatchingTraceTypes(originCategoryLabel, traces, traceCategoryLabels, [archTestPattern, adsReqPattern]);
  const archLevelMatches2 = getMatchingTraceTypes(originCategoryLabel, traces, traceCategoryLabels, [desTestPattern, adsReqPattern]);
  const desLevelMatches = getMatchingTraceTypes(originCategoryLabel, traces, traceCategoryLabels, [desTestPattern, ddsReqPattern]);
  const desLevelMatches2 = getMatchingTraceTypes(originCategoryLabel, traces, traceCategoryLabels, [archTestPattern, ddsReqPattern]);
  return [
    ...userLevelMatches, 
    ...softLevelMatches, 
    ...softLevelMatches2, 
    ...archLevelMatches, 
    ...archLevelMatches2, 
    ...desLevelMatches,
    ...desLevelMatches2
  ];
}

export function isUpstreamTraceMissing(doc:SmoresDocument, itemData:schema.SmoresContentData) {
  const traceCategoryLabels = getTraceCategoryLabels(doc, itemData.traceData.traces.id);
  const projectFilepath = FileIO.getProjectPath(doc);
  if(projectFilepath === undefined) { 
    window.showErrorMessage("Failed to obtain project filepath");
    return false; 
  }
  const documentFilepaths = FileIO.getProjectDocumentFilepaths(projectFilepath);
  if(documentFilepaths === undefined) { 
    window.showErrorMessage("Failed to obtain document filepaths");
    return false; 
  }

  switch(doc.data!.type) {
  case schema.ursDocType:
  case schema.atpDocType:
  case schema.stpDocType:
  case schema.itpDocType:
  case schema.utpDocType:
    return false;
  case schema.srsDocType:
    if(itemData.category === schema.softFRCategory) {
      if(!SmoresProject.ursExists(documentFilepaths)) {
        return false;
      } else if(!traceCategoryLabels.includes(schema.userFRPrefix)) {
        return true;
      }
    }
    return false;
  case schema.adsDocType:
    if(itemData.category === schema.archFRCategory) {
      if(!SmoresProject.srsExists(documentFilepaths)) {
        return false;
      } else if(!traceCategoryLabels.includes(schema.softFRPrefix)) {
        return true;
      }
    }
    return false;
  case schema.ddsDocType:
    if(itemData.category === schema.desFRCategory) {
      if(!SmoresProject.srsExists(documentFilepaths) && !SmoresProject.adsExists(documentFilepaths)) {
        return false;
      } else if(!traceCategoryLabels.includes(schema.softFRPrefix) && !traceCategoryLabels.includes(schema.archFRPrefix)) {
        return true;
      }
    }
    return false;
  }
  return false;
}
export function isDownstreamTraceMissing(doc:SmoresDocument, itemData:schema.SmoresContentData) {
  const traceCategoryLabels = getTraceCategoryLabels(doc, itemData.traceData.traces.id);
  const projectFilepath = FileIO.getProjectPath(doc);
  if(projectFilepath === undefined) { 
    window.showErrorMessage("Failed to obtain project filepath");
    return false; 
  }
  const documentFilepaths = FileIO.getProjectDocumentFilepaths(projectFilepath);
  if(documentFilepaths === undefined) { 
    window.showErrorMessage("Failed to obtain document filepaths");
    return false; 
  }

  switch(doc.data!.type) {
  case schema.ursDocType:
    if(itemData.category === schema.userFRCategory) {
      if(!SmoresProject.srsExists(documentFilepaths)) {
        return false;
      } else if(!traceCategoryLabels.includes(schema.softFRPrefix)) {
        return true;
      }
    }
    return false;
  case schema.srsDocType:
    if(itemData.category === schema.softFRCategory) {
      if(!SmoresProject.adsExists(documentFilepaths) && !SmoresProject.ddsExists(documentFilepaths)) {
        return false;
      } else if(!traceCategoryLabels.includes(schema.archFRPrefix) && !traceCategoryLabels.includes(schema.desFRPrefix)) {
        return true;
      }
    }
    return false;
  case schema.adsDocType:
    if(itemData.category === schema.archFRCategory) {
      if(!SmoresProject.ddsExists(documentFilepaths)) {
        return false;
      } else if(!traceCategoryLabels.includes(schema.desFRPrefix)) {
        return true;
      }
    }
    return false;
  case schema.ddsDocType:
  case schema.atpDocType:
  case schema.stpDocType:
  case schema.itpDocType:
  case schema.utpDocType:
    return false;
  }
  return false;
}
export function isTestTraceMissing(doc:SmoresDocument, itemData:schema.SmoresContentData) {
  const traceCategoryLabels = getTraceCategoryLabels(doc, itemData.traceData.traces.id);
  const projectFilepath = FileIO.getProjectPath(doc);
  if(projectFilepath === undefined) { 
    window.showErrorMessage("Failed to obtain project filepath");
    return false; 
  }
  const documentFilepaths = FileIO.getProjectDocumentFilepaths(projectFilepath);
  if(documentFilepaths === undefined) { 
    window.showErrorMessage("Failed to obtain document filepaths");
    return false; 
  }

  switch(doc.data!.type) {
  case schema.ursDocType:
    if(itemData.category === schema.userFRCategory || itemData.category === schema.userNFRCategory) {
      if(!SmoresProject.atpExists(documentFilepaths)) {
        return false;
      } else if(!traceCategoryLabels.includes(schema.userTestPrefix)) {
        return true;
      }
    }
    return false;
  case schema.srsDocType:
    if(itemData.category === schema.softFRCategory || itemData.category === schema.softNFRCategory) {
      if(!SmoresProject.stpExists(documentFilepaths) && !SmoresProject.itpExists(documentFilepaths)) {
        return false;
      } else if(!traceCategoryLabels.includes(schema.softTestPrefix) && !traceCategoryLabels.includes(schema.archTestPrefix)) {
        return true;
      }
    }
    return false;
  case schema.adsDocType:
    if(itemData.category === schema.archFRCategory || itemData.category === schema.archNFRCategory) {
      if(!SmoresProject.itpExists(documentFilepaths) && !SmoresProject.utpExists(documentFilepaths)) {
        return false;
      } else if(!traceCategoryLabels.includes(schema.archTestPrefix) && !traceCategoryLabels.includes(schema.desTestPrefix)) {
        return true;
      }
    }
    return false;
  case schema.ddsDocType:
    if(itemData.category === schema.desFRCategory || itemData.category === schema.desNFRCategory) {
      if(!SmoresProject.itpExists(documentFilepaths) && !SmoresProject.utpExists(documentFilepaths)) {
        return false;
      } else if(!traceCategoryLabels.includes(schema.archTestPrefix) && !traceCategoryLabels.includes(schema.desTestPrefix)) {
        return true;
      }
    }
    return false;
  case schema.atpDocType:
    if(itemData.category === schema.userTestCategory) {
      if(!SmoresProject.ursExists(documentFilepaths)) {
        return false;
      } else if(!traceCategoryLabels.includes(schema.userFRPrefix) && !traceCategoryLabels.includes(schema.userNFRPrefix)) {
        return true;
      }
    }
    return false;
  case schema.stpDocType:
    if(itemData.category === schema.softTestCategory) {
      if(!SmoresProject.srsExists(documentFilepaths)) {
        return false;
      } else if(!traceCategoryLabels.includes(schema.softFRPrefix) && !traceCategoryLabels.includes(schema.softNFRPrefix)) {
        return true;
      }
    }
    return false;
  case schema.itpDocType:
    if(itemData.category === schema.archTestCategory) {
      if(!SmoresProject.srsExists(documentFilepaths) && !SmoresProject.adsExists(documentFilepaths) && !SmoresProject.ddsExists(documentFilepaths)) {
        return false;
      } else if(!traceCategoryLabels.includes(schema.softFRPrefix) && 
        !traceCategoryLabels.includes(schema.softNFRPrefix) &&
        !traceCategoryLabels.includes(schema.archFRPrefix) &&
        !traceCategoryLabels.includes(schema.archNFRPrefix) &&
        !traceCategoryLabels.includes(schema.desFRPrefix) &&
        !traceCategoryLabels.includes(schema.desNFRPrefix)) {
        return true;
      }
    }
    return false;
  case schema.utpDocType:
    if(itemData.category === schema.desTestCategory) {
      if(!SmoresProject.adsExists(documentFilepaths) && !SmoresProject.ddsExists(documentFilepaths)) {
        return false;
      } else if(!traceCategoryLabels.includes(schema.archFRPrefix) && 
        !traceCategoryLabels.includes(schema.archNFRPrefix) &&
        !traceCategoryLabels.includes(schema.desFRPrefix) &&
        !traceCategoryLabels.includes(schema.desNFRPrefix)) {
        return true;
      }
    }
    return false;
  }
  return false;
}
