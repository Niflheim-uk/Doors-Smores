import * as schema from '../model/smoresDataSchema';

const ursReqPattern = /^U((FR)|(NFR)|(DC))$/;
const srsReqPattern = /^S((FR)|(NFR)|(DC))$/;
const adsReqPattern = /^A((FR)|(NFR)|(DC))$/;
const srsAdsReqPattern = /^(S|A)((FR)|(NFR)|(DC))$/;
const ddsReqPattern = /^D((FR)|(NFR)|(DC))$/;
const userTestPattern = /^AT$/;
const softTestPattern = /^ST$/;
const archTestPattern = /^IT$/;
const desTestPattern = /^UT$/;

export function isCategoryTraceable(category:string):boolean {
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
export function getTargetableDocumentTypes(originDocumentType:string) {
  switch(originDocumentType) {
    case schema.emptyDocType:
      return [schema.ursDocType, schema.srsDocType, schema.adsDocType, schema.ddsDocType, schema.atpDocType, schema.stpDocType, schema.itpDocType, schema.utpDocType, schema.emptyDocType];
    case schema.ursDocType:
      return [schema.srsDocType, schema.atpDocType, schema.emptyDocType];
    case schema.srsDocType:
      return [schema.ursDocType, schema.srsDocType, schema.adsDocType, schema.ddsDocType, schema.stpDocType, schema.itpDocType, schema.emptyDocType];
    case schema.adsDocType:
      return [schema.srsDocType, schema.ddsDocType, schema.stpDocType, schema.itpDocType, schema.utpDocType, schema.emptyDocType];
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
    return undefined;
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
  const archLevelMatches = getMatchingTraceTypes(originCategoryLabel, traces, traceCategoryLabels, [adsReqPattern, archTestPattern]);
  const desLevelMatches = getMatchingTraceTypes(originCategoryLabel, traces, traceCategoryLabels, [ddsReqPattern, desTestPattern]);
  return [...userLevelMatches, ...softLevelMatches, ...archLevelMatches, ...desLevelMatches];
}
export function getVerifiesTraceType(originCategoryLabel:string, traces:number[], traceCategoryLabels:string[]):number[] {
  const userLevelMatches = getMatchingTraceTypes(originCategoryLabel, traces, traceCategoryLabels, [userTestPattern, ursReqPattern]);
  const softLevelMatches = getMatchingTraceTypes(originCategoryLabel, traces, traceCategoryLabels, [softTestPattern, srsReqPattern]);
  const archLevelMatches = getMatchingTraceTypes(originCategoryLabel, traces, traceCategoryLabels, [archTestPattern, adsReqPattern]);
  const desLevelMatches = getMatchingTraceTypes(originCategoryLabel, traces, traceCategoryLabels, [desTestPattern, ddsReqPattern]);
  return [...userLevelMatches, ...softLevelMatches, ...archLevelMatches, ...desLevelMatches];
}
