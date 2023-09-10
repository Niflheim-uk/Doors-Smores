
export function getMarkdownParagraphs(originalText:string):string {
  while(originalText[-1]==="\n") {
    originalText = originalText.slice(0,originalText.length-2);
  }
  return (originalText.concat("\n"));
}
