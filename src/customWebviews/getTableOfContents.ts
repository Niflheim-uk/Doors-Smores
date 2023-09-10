import { getPageBreak } from "./getPageBreak";

export function getTableOfContents(body:string, tocPage:number):string {
  const pageBreak = getPageBreak();
  return `${pageBreak}
  <h1>Contents</h1>
  <p>TBC</p>`;
}