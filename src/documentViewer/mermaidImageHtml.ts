import { SmoresNode } from "../model/smoresNode";

export function getInnerHtmlForMermaid(node:SmoresNode) {
  return `<span class="tabStop"><pre class='mermaid'>${node.data.text}</pre></span>`;
}
