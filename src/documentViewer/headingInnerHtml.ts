import { SmoresNode } from "../model/smoresNode";
import { Converter } from "showdown";

function getHeadingBangs(node:SmoresNode):string {
  let parent = node.getParentNode();
  let depth = 0;
  while(parent !== null) {
    parent = parent.getParentNode();
    depth++;
  }
  let mdBangs = "";
  while(depth > 0) {
    mdBangs = mdBangs.concat("#");
    depth--;
  }
  return mdBangs;
}

export function getHeadingHtml(node:SmoresNode):[string, boolean] {
  let pageBreakRequired = false;
  const convert = new Converter();
  const bangs = getHeadingBangs(node);
  if(bangs.length === 1) {
    pageBreakRequired = true;
  }
  const headingLabel = convert.makeHtml(`${bangs} `)
    .replace(`id=""`,`class="label"`)
    .replace(`> <`,`><`)
    ;
  const headingMd = `${bangs} ${node.data.text.split("\n")[0]}`;
  const headingHtml = convert.makeHtml(headingMd);
  return [`<table class="heading"><tr>
    <td class="heading">${headingLabel}</td>
    <td class="heading">${headingHtml}</td>
  </tr></table>`, pageBreakRequired];
}