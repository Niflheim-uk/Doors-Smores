import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
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
export function generateTOCxsl(dataPath:string):any {
  const userStylePath = join(dataPath, 'userStyle.json');
  const userTOCxslPath = join(dataPath, 'TOCxsl.xml');
  const userStyleStr = readFileSync(userStylePath, "utf-8");
  const userStyle = JSON.parse(userStyleStr);
  const h1Style:Style = getCombinedStyle(userStyle.headings.h1, userStyle.default);
  const listStyle:Style = getCombinedStyle(userStyle.lists, userStyle.default);
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:outline="http://wkhtmltopdf.org/outline"
  xmlns="http://www.w3.org/1999/xhtml">
  <xsl:output doctype-public="-//W3C//DTD XHTML 1.0 Strict//EN"
    doctype-system="http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"
    indent="yes" />
  <xsl:template match="outline:outline">
    <html>
      <head>
        <title>Contents</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <style>
          h1 {
            text-align: left;
            font-size: ${h1Style.fontSize};
            font-family: ${h1Style.font};
            font-weight: ${h1Style.fontWeight};
            font-style: ${h1Style.fontStyle};
          }
          div {
            border-bottom: 1px dashed rgb(200,200,200);
          }
          span {
            float: right;
          }
          li {
            list-style: none;
          }
          ul {
            font-size: ${listStyle.fontSize};
            font-family: ${listStyle.font};
            font-weight: ${listStyle.fontWeight};
            font-style: ${listStyle.fontStyle};
            padding-left: 0em;
          }
          ul ul {
            padding-left: 1em;
          }
          a {
            text-decoration:none; 
            color: black;
          }
        </style>
      </head>
      <body>
        <h1>Contents</h1>
        <ul>
          <xsl:apply-templates select="outline:item/outline:item" />
        </ul>
      </body>
    </html>
  </xsl:template>
  <xsl:template match="outline:item">
    <li>
      <xsl:if test="@title!=''">
        <div>
          <a>
            <xsl:if test="@link">
              <xsl:attribute name="href"><xsl:value-of select="@link" /></xsl:attribute>
            </xsl:if>
            <xsl:if test="@backLink">
              <xsl:attribute name="name"><xsl:value-of select="@backLink" /></xsl:attribute>
            </xsl:if>
            <xsl:value-of select="@title" />
          </a>
          <span>
            <xsl:value-of select="@page" />
          </span>
        </div>
      </xsl:if>
      <ul>
        <xsl:comment>added to prevent self-closing tags in QtXmlPatterns</xsl:comment>
        <xsl:apply-templates select="outline:item" />
      </ul>
    </li>
  </xsl:template>
</xsl:stylesheet>`;
  writeFileSync(userTOCxslPath, xmlContent);
}
export function generateUserCss(extensionPath:string, dataPath:string):any {
  const userStylePath = join(dataPath, 'userStyle.json');
  const userCssPath = join(dataPath, 'user.css');
  const defaultUserStylePath = join(extensionPath, 'resources', 'userStyle.json');

  if(!existsSync(dataPath)) {
    mkdirSync(dataPath, {recursive:true});
  }

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
  style = style.concat(generateStyle("li", userStyle.default, userStyle.listItems));
  style = style.concat(generateStyle("ol, ul", userStyle.default, userStyle.listBlocks));
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