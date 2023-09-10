import { Converter, ConverterOptions } from "showdown";

const converterOptions:ConverterOptions = {
  simpleLineBreaks:true,
  tables:true
};
export function getHtmlFromMd(mdString:string):string {
  const converter = new Converter(converterOptions);
  const html =  converter.makeHtml(mdString);
  return paragraphHtml(html);
}
function paragraphHtml(html:string):string {
  if(html.slice(-4) === '</p>') {
    return html;
  }
  return `<p>${html}</p>`;
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
  const tableTextInserter = Object.keys(classMap).map(key => ({
    type: 'output',
    regex: new RegExp(`<${key}(.*)>`, 'g'),
    //@ts-ignore
    replace: `<${key} class="${classMap[key]}" $1>`
  }));
  mdString=`<span>${mdString}</span>`;
  var options = converterOptions;
  options.extensions = [...tableTextInserter];  
  const converter = new Converter(options);
  return converter.makeHtml(mdString);  
}