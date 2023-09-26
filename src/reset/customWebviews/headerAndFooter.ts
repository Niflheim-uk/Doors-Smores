import { join } from "path";
import { DoorsSmores } from "../doorsSmores";
import { clearNonce, getNonce } from "./getNonce";
import { writeFileSync } from "fs";
import { Uri } from "vscode";
import { getStylePaths } from "./resources";

export function generateHeaderFooterHtmlFiles(saveFilename:string) {
  const projectDir = DoorsSmores.getDataDirectory();
  const filepath1 = join(projectDir, 'header.html');
  const html1 = getHeaderHtml(saveFilename);
  writeFileSync(filepath1, html1);
  const filepath2 = join(projectDir, 'footer.html');
  const html2 = getFooterHtml(saveFilename);
  writeFileSync(filepath2, html2);
}
function getHeaderHtml(saveFilename:string) {
  const content = getHeaderBody(saveFilename);
  return getHtml(content);
}
function getFooterHtml(saveFilename:string) {
  const content = getFooterBody(saveFilename);
  return getHtml(content);
}
function getHtml(content:string) {
  const extensionPath = DoorsSmores.getExtensionPath();
  const stylePaths = getStylePaths();
  const scriptPath = Uri.file(join(extensionPath, 'resources', 'wkhtmltopdfScript.js'));
  clearNonce();
  return `<!DOCTYPE html>
<html>
<head>
  <link href="file:///${stylePaths.base}" rel="stylesheet"/>
  <link href="file:///${stylePaths.user}" rel="stylesheet"/>
</head>
<body>
  ${content}
  <script src="${scriptPath}"></script>
</body>
</html>`;
}

function getHeaderBody(saveFilename:string) {
  return getDefaultHeaderHtml();
}

function getFooterBody(saveFilename:string) {
  return getDefaultFooterHtml(saveFilename);
}
function getDefaultFooterHtml(saveFilename:string) {
  return `
  <table class="footer">
    <tr>
      <td class="footer">${saveFilename}</td>
      <td class="footer" style="text-align:right">Page <span class="page"></span> of <span class="topage"></span></td>
    </tr>
  </table>
  `;
}

function getDefaultHeaderHtml() {
  const extensionPath = DoorsSmores.getExtensionPath();
  const imagePath = Uri.file(join(extensionPath, 'resources', 'smores.png'));
  return `
  <img src="${imagePath}" style="height:0.8cm;" />
  <hr/>
  <br/>`;
}