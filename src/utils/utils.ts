
export function getMarkdownParagraphs(originalText:string):string {
  while(originalText[-1]==="\n") {
    originalText = originalText.slice(0,originalText.length-2);
  }
  return (originalText.concat("\n"));
}

export function getDataTypeDisplayName(dataType:string):string {
  switch(dataType) {
    case 'text':
      return 'Text';
    case 'translationRationale':
      return 'Translation Rationale';
    case 'expectedResults':
      return 'Expected Results';
    case 'documentType':
      return 'Document Type';
    default:
      return 'unknown';
  }
}