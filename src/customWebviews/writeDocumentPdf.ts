import { ExecException, exec } from "child_process";
import { SmoresDocument } from "../model/smoresDocument";
import { generateCoverHtmlFile, generateHistoryFile } from "./coverAndHistoryPages";
import { DoorsSmores } from "../doorsSmores";
import { basename, dirname, join } from "path";
import { generateHeaderFooterHtmlFiles } from "./headerAndFooter";
import { window, workspace } from "vscode";
import { existsSync, readFileSync, rmSync } from "fs";

var _htmlDocFilepath:string|undefined="";

export function writeDocumentPdf(document:SmoresDocument, htmlDocFilepath:string, traceReport:boolean) {
  _htmlDocFilepath = htmlDocFilepath;
  const dataPath = DoorsSmores.getDataDirectory();   
  const userStylePath = join(dataPath, 'userStyle.json');
  const userStyleStr = readFileSync(userStylePath, "utf-8");
  const userStyle = JSON.parse(userStyleStr);
  const margins = `-T ${userStyle.page.margins.top} -B ${userStyle.page.margins.bottom} -L ${userStyle.page.margins.left} -R ${userStyle.page.margins.right}`;
  const coverPath = join(dataPath, "cover.html");
  const historyPath = join(dataPath, "history.html");
  const headerPath = getHeaderPath();
  const footerPath = getFooterPath();
  const outputName = basename(htmlDocFilepath, ".html");
  const outputFilename = `${outputName}.pdf`;
  const outputPath = join(dirname(htmlDocFilepath), outputFilename);
  const tocStylePath = join(DoorsSmores.getExtensionPath(), 'resources', 'wkhtmltopdfTOCxsl.xml');
  const generalOptions = `--dpi 1200 --print-media-type --enable-local-file-access --outline --zoom 1.25`;
  const headerOptions = `--header-html "${headerPath}"`;
  const footerOptions = `--footer-html "${footerPath}"`;
  const pages = `cover "${coverPath}" "${historyPath}" toc --xsl-style-sheet "${tocStylePath}" "${htmlDocFilepath}" "${outputPath}"`;
  const cmd = `wkhtmltopdf ${margins} ${generalOptions} ${headerOptions} ${footerOptions} ${pages}`;
  console.log(cmd);
  generateHeaderFooterHtmlFiles(outputFilename);
  generateCoverHtmlFile(document, traceReport);
  generateHistoryFile(document, traceReport);
  exec(cmd, wkhtmltopdfCallback);
}

function wkhtmltopdfCallback(error:ExecException|null, stdout:string, stderr:string) {
  if (error) {
    console.error(`wkhtmltopdf error: ${error}`);
    window.showErrorMessage("Failed to generate PDF document. Is file open?");
    return;
  }
  console.log(`wkhtmltopdf stdout: ${stdout}`);
  console.error(`wkhtmltopdf stderr: ${stderr}`);
  if(_htmlDocFilepath) {
  //  rmSync(_htmlDocFilepath);
    _htmlDocFilepath = undefined;
  }
}

function getHeaderPath() {
  const dataPath = DoorsSmores.getDataDirectory();
  const customHeader = workspace.getConfiguration('customisation.header').get("customHeader");
  const customHeaderPath:string|undefined = workspace.getConfiguration('customisation.header').get("customHeaderHtml");
  if(customHeaderPath) {
    const parts = customHeaderPath.split(/[\/\\]/);
    const userHeaderHtml = join(dataPath, '..', ...parts);
    if(customHeader) {
      if (existsSync(userHeaderHtml)){
        return userHeaderHtml;
      } else {
        window.showErrorMessage(`Could not find user specified header: ${userHeaderHtml}.`);
      }
    }
  }
  return join(dataPath, "header.html");
}

function getFooterPath() {
  const dataPath = DoorsSmores.getDataDirectory();
  const customFooter = workspace.getConfiguration('customisation.footer').get("customFooter");
  const customFooterPath:string|undefined = workspace.getConfiguration('customisation.footer').get("customFooterHtml");
  if(customFooterPath) {
    const parts = customFooterPath.split(/[\/\\]/);
    const userFooterHtml = join(dataPath, '..', ...parts);
    if(customFooter) {
      if (existsSync(userFooterHtml)){
        return userFooterHtml;
      } else {
        window.showErrorMessage(`Could not find user specified footer: ${userFooterHtml}.`);
      }
    }
  }
  return join(dataPath, "footer.html");
}
