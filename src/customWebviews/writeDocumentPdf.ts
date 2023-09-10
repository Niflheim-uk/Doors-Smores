import { ExecException, exec } from "child_process";
import { SmoresDocument } from "../model/smoresDocument";
import { generateCoverHtmlFile, generateHistoryFile } from "./coverPage";
import { DoorsSmores } from "../doorsSmores";
import { basename, dirname, join } from "path";
import { generateHeaderFooterHtmlFiles } from "./headerAndFooter";


export function writeDocumentPdf(document:SmoresDocument, htmlDocFilepath:string, traceReport:boolean) {
  const dataPath = DoorsSmores.getDataDirectory();
  const margins = "-T 40 -B 25 -L 25 -R 25";
  const coverPath = join(dataPath, "cover.html");
  const headerPath = join(dataPath, "header.html");
  const footerPath = join(dataPath, "footer.html");
  const historyPath = join(dataPath, "history.html");
  const outputName = basename(htmlDocFilepath, ".html");
  const outputFilename = `${outputName}.pdf`;
  const outputPath = join(dirname(htmlDocFilepath), outputFilename);
  const tocStylePath = join(DoorsSmores.getExtensionPath(), 'resources', 'wkhtmltopdfTOCxsl.xml');
  const generalOptions = `--dpi 1200 --print-media-type --enable-local-file-access --outline`;
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
    return;
  }
  console.log(`wkhtmltopdf stdout: ${stdout}`);
  console.error(`wkhtmltopdf stderr: ${stderr}`);
}