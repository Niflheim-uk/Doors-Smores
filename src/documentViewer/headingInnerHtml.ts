import { SmoresNode } from "../model/smoresNode";
import { Converter } from "showdown";

var _headerDepth:number = -1;
var _headingCounters:number[] = [0,0,0,0,0,0,0,0,0,0];

function clearHeadingCounter() {
  if(_headerDepth >= 0 && _headerDepth < _headingCounters.length) {
    _headingCounters[_headerDepth] = 0;
  }
}
function incrementHeadingCounter() {
  if(_headerDepth <0) {
    _headerDepth = 0;
    clearHeadingCounter();
  }
  if( _headerDepth < _headingCounters.length) {
    _headingCounters[_headerDepth]++;
  }
}
function getHeadingDigit(index:number):string {
  if(index >= 0 && index < _headingCounters.length) {
    return `${_headingCounters[index]}`;
  }
  return "";
}
function getHeadingPrefix() {
  let prefix = getHeadingDigit(0);
  for(let index=1; index <= _headerDepth; index++ ) {
    prefix = prefix.concat(".", getHeadingDigit(index));
  }
  return prefix;
}

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

export function increaseHeaderDepth() {
  _headerDepth++;
  clearHeadingCounter();
}
export function decreaseHeaderDepth() {
  _headerDepth--;
  if(_headerDepth < -1) {
    console.error("Broke header depth");
  }
}
export function resetHeaderDepth() {
  _headerDepth = -1;
  _headingCounters = [0,0,0,0,0,0,0,0,0,0];
}

export function getHeadingHtml(node:SmoresNode):[string, boolean] {
  incrementHeadingCounter();
  let pageBreakRequired = false;
  const convert = new Converter({noHeaderId:true});
  const bangs = getHeadingBangs(node);
  const headingMd = `${bangs} ${node.data.text.split("\n")[0]}`;
  const headingHtml = convert.makeHtml(headingMd);
  const hFront = headingHtml.substring(0, 4);
  const hMiddle = headingHtml.substring(4, headingHtml.length-5);
  const hRear = headingHtml.substring(headingHtml.length-5);
  const hPrefix = getHeadingPrefix();
  if(hFront === '<h1>') {
    pageBreakRequired = true;
  }
  return [`<div class="section">${hFront}${hPrefix}<span class="tabStop">${hMiddle}</span>${hRear}</div>`,
    pageBreakRequired];
}