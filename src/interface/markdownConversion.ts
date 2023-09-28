import { Converter, ConverterOptions, ShowdownExtension } from "showdown";

export class SmoresHeading {
  private static readonly maxDepth = 6;
  static digits:number[] = [0,0,0,0,0,0];
  public static clear(section1?:number) {
    SmoresHeading.digits = [0,0,0,0,0,0];
    if(section1) {
      SmoresHeading.digits[0] = section1;
    }
  }
  public static getDigit(depth:number) {
    if(depth < SmoresHeading.maxDepth) {
      SmoresHeading.digits[depth-1]++;
      let headingStr = "";
      for(let i=0; i < SmoresHeading.maxDepth; i++) {
        if(i < depth) {
          headingStr = headingStr.concat(`${SmoresHeading.digits[i]}.`);
        } else {
          SmoresHeading.digits[i] = 0;
        }
      }
      return headingStr.slice(0, headingStr.length-1);
    }
    return "9.9.9.9.9.9.9";
  }
  public static getHeadingHtml(hLevel:number, attrs:string, headingText:string, closing:string) {
    const hPrefix = SmoresHeading.getDigit(hLevel);
    let html = `<div class="heading"><h${hLevel} ${attrs}>${hPrefix}&nbsp;&nbsp;<span class="headingLabel">${headingText}</span>${closing}></div>`;
    if(hLevel === 1) {
      html = `<div class="sectionBreak">${html}</div>`;
    }
    return html;
  }
}
class ListIndention {
  private static indentCount:number = 0;
  public static startIndentedList(listTag:string) {
    ListIndention.indentCount++;
    if(ListIndention.indentCount > 1) {
      return listTag;
    } else {
      return `<div class='indented'>${listTag}`;
    }
  }
  public static endIndentedList(listTag:string) {
    ListIndention.indentCount--;
    if(ListIndention.indentCount === 0) {
      return `${listTag}</div>`;
    } else {
      return listTag;
    }
  }
}

class SmoresMdExtensions {
  private static readonly indentClassMap = {
    p: 'indented',
    table: 'indented'
  };
  private static readonly tableTextClassmap = {
    p: 'tableText',
    ul: 'tableText',
    ol: 'tableText',
    span: 'tableText'
  };
  public static readonly indentInserter:ShowdownExtension[] = Object.keys(SmoresMdExtensions.indentClassMap).map(key => ({
    type: 'output',
    regex: new RegExp(`<${key}(.*)>`, 'g'),
    //@ts-ignore
    replace: `<${key} class="${SmoresMdExtensions.indentClassMap[key]}" $1>`
  }));
  public static readonly tableTextInserter = Object.keys(SmoresMdExtensions.tableTextClassmap).map(key => ({
    type: 'output',
    regex: new RegExp(`<${key}(.*)>`, 'g'),
    //@ts-ignore
    replace: `<${key} class="${SmoresMdExtensions.tableTextClassmap[key]}" $1>`
  }));
  public static readonly headingExtension:ShowdownExtension = {
    type: 'lang',
    filter: function(text, converter, options) {
      const converterE = SmoresMdExtensions.getConverter([...SmoresMdExtensions.indentInserter]);
      const html = converterE.makeHtml(text);
      const headingRegex = new RegExp(`<h(\\d)([^>]*)>([^<]*)([^>]*)>`, 'g');
      text = html.replace(headingRegex, function(match, hLevel, attrs, inner, closing) {
        const hNumber = Number(hLevel);
        return SmoresHeading.getHeadingHtml(hNumber, attrs, inner, closing);
      });
      return text;
    }
  };
  public static readonly indentListExtension:ShowdownExtension = {
    type: 'lang',
    filter: function(text, converter, options) {
      const converterE = SmoresMdExtensions.getConverter([...SmoresMdExtensions.indentInserter]);
      const html = converterE.makeHtml(text);
      const listRegex = new RegExp('<([/]*)ul(.*)>', 'g');
      text = html.replace(listRegex, function(match, endmarker, inner) {
        if(endmarker === '/') {
          return ListIndention.endIndentedList(`<${endmarker}ul${inner}>`);
        } else {
          return ListIndention.startIndentedList(`<${endmarker}ul${inner}>`);
        }
      });
      return text;
    }
  };
  public static getConverter(exts:ShowdownExtension[]) {
    const options:ConverterOptions = {
      simpleLineBreaks: true,
      tables: true,
      extensions: [...exts]
    };
    return new Converter(options);
  }
}


export function getBodyHtmlFromMd(mdString:string):string {
  const converter = SmoresMdExtensions.getConverter([...SmoresMdExtensions.indentInserter, SmoresMdExtensions.headingExtension, SmoresMdExtensions.indentListExtension]);
  return converter.makeHtml(mdString);  
}
 
export function getTableTextHtmlFromMd(mdString:string):string {
  mdString=`<span>${mdString}</span>`;
  const converter = SmoresMdExtensions.getConverter([...SmoresMdExtensions.tableTextInserter]);
  return converter.makeHtml(mdString);  
}

