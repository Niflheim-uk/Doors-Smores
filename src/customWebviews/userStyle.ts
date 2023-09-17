import { copyFileSync, existsSync, readFileSync, writeFileSync } from "fs";
import { DoorsSmores } from "../doorsSmores";
import { join } from "path";
import { window } from "vscode";


export interface Style {
  font: string;
  fontSize: any;
  fontStyle: string;
  fontWeight: string;
  marginTop: any;
  marginBottom: any;
  paddingTop: any;
  paddingBottom: any;
  textDecoration: string;
}

export function generateUserCss():any {
  const dataPath = DoorsSmores.getDataDirectory();
  const extensionPath = DoorsSmores.getExtensionPath();
  const userStylePath = join(dataPath, 'userStyle.json');
  const userCssPath = join(dataPath, 'user.css');
  const defaultUserStylePath = join(extensionPath, 'resources', 'userStyle.json');

  if(!existsSync(userStylePath)) {
    copyFileSync(defaultUserStylePath, userStylePath);
  }
  const userStyleStr = readFileSync(userStylePath, "utf-8");
  const userStyle = JSON.parse(userStyleStr);
  var style = "";
  if(userStyle.page === undefined || userStyle.page.indentation === undefined || isNaN(userStyle.page.indentation)) {
    window.showErrorMessage('userStyle.json does not supply "page.indentation" as a number');
  } else {
    style = style.concat(generateIndent(userStyle.page.indentation));
  }
  style = style.concat(`
table.footer, table.footer th, table.footer tr, table.footer td {
  font-family: ${userStyle.default.font};
  font-size: ${userStyle.page.footer.fontSize};
  font-style: normal;
  font-weight: normal;
  margin: 0;
  padding: 0;
  text-decoration: none;
}
table.header, table.header th, table.header tr, table.header td {
  font-family: ${userStyle.default.font};
  font-size: ${userStyle.page.header.fontSize};
  font-style: normal;
  font-weight: normal;
  margin: 0;
  padding: 0;
  text-decoration: none;
}
  `);
  style = style.concat(generateStyle("p, td, table", userStyle.default, userStyle.default));
  style = style.concat(generateStyle("code", userStyle.default, userStyle.code));
  style = style.concat(generateStyle("h1", userStyle.default, userStyle.headings.h1));
  style = style.concat(generateStyle("h2", userStyle.default, userStyle.headings.h2));
  style = style.concat(generateStyle("h3", userStyle.default, userStyle.headings.h3));
  style = style.concat(generateStyle("h4", userStyle.default, userStyle.headings.h4));
  style = style.concat(generateStyle("h1.frontpage", userStyle.default, userStyle.headings.h1Frontpage));
  style = style.concat(generateStyle("h2.frontpage", userStyle.default, userStyle.headings.h2Frontpage));
  style = style.concat(generateStyle("h3.frontpage", userStyle.default, userStyle.headings.h3Frontpage));
  style = style.concat(generateStyle("td, .tableText", userStyle.default, userStyle.tables.standard));
  style = style.concat(generateStyle(".tableSmall", userStyle.default, userStyle.tables.small));
  style = style.concat(generateStyle("th", userStyle.default, userStyle.tables.heading));
  style = style.concat(generateStyle("li, ol, ul", userStyle.default, userStyle.lists));
  writeFileSync(userCssPath, style);
}

function generateIndent(indentation:number):string {
  const leftStr = `${indentation}%`;
  const weightStr = `${100 - indentation}%`;
  return `
table.indented2ColSmall {
  margin-left: ${leftStr};
  width: ${weightStr};
}
.indented {
  margin-left: ${leftStr};
  width: ${weightStr};
}
.imageHolder {
  margin-left: ${leftStr};
  width: ${weightStr};
}
span.headingLabel {
  left:${leftStr};
}
`;
      
}
function generateStyle(name:string, defaultStyle:Style, style:Style):string {
  if(defaultStyle && style) {
    var combined:Style = getCombinedStyle(style, defaultStyle);
    return `
${name} {
  font-family: ${combined.font};
  font-size: ${combined.fontSize};
  font-style: ${combined.fontStyle};
  font-weight: ${combined.fontWeight};
  margin-top: ${combined.marginTop};
  margin-bottom: ${combined.marginBottom};
  padding-top: ${combined.paddingTop};
  padding-bottom: ${combined.paddingBottom};
  text-decoration: ${combined.textDecoration};    
}`;
  }
  return "";
}

function getCombinedStyle(primary:Style, secondary:Style) {
  var combined:Style = {
    font:"",
    fontSize:"",
    fontStyle:"",
    fontWeight:"",
    marginTop:"",
    marginBottom:"",
    paddingTop:"",
    paddingBottom:"",
    textDecoration:""
  };
  if(primary.font) {
    combined.font = primary.font;
  } else {
    combined.font = secondary.font;
  }
  if(primary.fontSize) {
    combined.fontSize = primary.fontSize;
  } else {
    combined.fontSize = secondary.fontSize;
  }
  if(primary.fontStyle) {
    combined.fontStyle = primary.fontStyle;
  } else {
    combined.fontStyle = secondary.fontStyle;
  }
  if(primary.fontWeight) {
    combined.fontWeight = primary.fontWeight;
  } else {
    combined.fontWeight = secondary.fontWeight;
  }
  if(primary.marginTop) {
    combined.marginTop = primary.marginTop;
  } else {
    combined.marginTop = secondary.marginTop;
  }
  if(primary.marginBottom) {
    combined.marginBottom = primary.marginBottom;
  } else {
    combined.marginBottom = secondary.marginBottom;
  }
  if(primary.paddingTop) {
    combined.paddingTop = primary.paddingTop;
  } else {
    combined.paddingTop = secondary.paddingTop;
  }
  if(primary.paddingBottom) {
    combined.paddingBottom = primary.paddingBottom;
  } else {
    combined.paddingBottom = secondary.paddingBottom;
  }
  if(primary.textDecoration) {
    combined.textDecoration = primary.textDecoration;
  } else {
    combined.textDecoration = secondary.textDecoration;
  }
  return combined;
}