import { join } from "path";
import { DoorsSmores } from "../doorsSmores";
import { clearNonce, getNonce } from "./getNonce";
import { writeFileSync } from "fs";
import { Uri } from "vscode";

export function generateHeaderFooterHtmlFiles() {
  const projectDir = DoorsSmores.getDataDirectory();
  const filepath1 = join(projectDir, 'header.html');
  const html1 = getHeaderHtml();
  writeFileSync(filepath1, html1);
  const filepath2 = join(projectDir, 'footer.html');
  const html2 = getFooterHtml();
  writeFileSync(filepath2, html2);
}
function getHeaderHtml() {
  const content = getHeaderBody();
  return getHtml(content);
}
function getFooterHtml() {
  const content = getFooterBody();
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

function getHeaderBody() {
  const projectPath = Uri.file(DoorsSmores.getProjectDirectory());
  return `
  <img src="${projectPath}/logo.png" style="height:0.8cm;" />
  <hr/>
  <br/>
  `;
}

function getFooterBody() {
  const projectPath = Uri.file(DoorsSmores.getProjectDirectory());
  return `
  <table style="width: 100%; font-family: Arial; font-size: 7pt;">
    <tr>
      <td class="doctitle"></td>
      <td style="text-align:center">Confidental</td>
      <td style="text-align:right">Page <span class="page"></span> of <span class="topage"></span></td>
    </tr>
  </table>
  `;
}