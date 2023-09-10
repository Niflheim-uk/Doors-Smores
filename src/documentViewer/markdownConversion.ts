import { Converter } from "showdown";

export function getHtmlFromMd(mdString:string):string {
  const converter = new Converter({simpleLineBreaks:true});
  return converter.makeHtml(mdString);
}

export function getIndentedHtmlFromMd(mdString:string):string {
  return `<div class="indented">${getHtmlFromMd(mdString)}</div>`;
}

export function getTableTextHtmlFromMd(mdString:string):string {
  const classMap = {
    p: 'tableText',
    ul: 'tableText',
    ol: 'tableText',
    span: 'tableText'
  };
  const tableTextInserter = Object.keys(classMap)
    .map(key => ({
      type: 'output',
      regex: new RegExp(`<${key}(.*)>`, 'g'),
      //@ts-ignore
      replace: `<${key} class="${classMap[key]}" $1>`
    }));

  mdString=`<span>${mdString}</span>`;
  const converter = new Converter({
    extensions: [...tableTextInserter]
  });
  return converter.makeHtml(mdString);  
}