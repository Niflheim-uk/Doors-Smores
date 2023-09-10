import { join } from "path";
import { DoorsSmores } from "../doorsSmores";
import { clearNonce, getNonce } from "./getNonce";
import { writeFileSync } from "fs";
import { Uri } from "vscode";

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
  const nonce = getNonce();
  const extensionPath = DoorsSmores.getExtensionPath();
  const scriptPath = Uri.file(join(extensionPath, 'resources', 'wkhtmltopdfScript.js'));
  clearNonce();
  return `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Security-Policy" 
    content="default-src 'self'; 
    style-src 'unsafe-inline';
  "/>
</head>
<body style="border:0; margin: 0;">
  ${content}
  <script nonce="${nonce}" src="${scriptPath}"></script>
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
  <table style="width: 100%; font-family: Arial; font-size: 7pt;">
    <tr>
      <td>${saveFilename}</td>
      <td style="text-align:right">Page <span class="page"></span> of <span class="topage"></span></td>
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