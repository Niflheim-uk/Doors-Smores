import { exec } from "child_process";
import { SmoresDocument } from "../model/smoresDocument";
import { generateCoverHtmlFile, generateHistoryFile } from "./coverPage";
import { DoorsSmores } from "../doorsSmores";
import { basename, dirname, join } from "path";


export function writeDocumentPdf(document:SmoresDocument, htmlDocFilepath:string, traceReport:boolean) {
  generateCoverHtmlFile(document, traceReport);
  generateHistoryFile(document, traceReport);
  const dataPath = DoorsSmores.getDataDirectory();
  const margins = "-T 40 -B 25 -L 25 -R 25";
  const generalOptions = "--print-media-type --enable-local-file-access --outline  ";
  const headerOptions = "--header-line --header-spacing 10";
  const footerOptions = "--footer-line --footer-center Confidential";
  const coverPath = join(dataPath, "cover.html");
  const historyPath = join(dataPath, "history.html");
  const outputName = basename(htmlDocFilepath, ".html");
  const outputPath = join(dirname(htmlDocFilepath), `${outputName}.pdf`);
  const paths = `cover ${coverPath} ${historyPath} toc ${htmlDocFilepath} ${outputPath}`;
  const cmd = `wkhtmltopdf ${margins} ${generalOptions} ${headerOptions} ${footerOptions} ${paths}`;
  console.log(cmd);
  exec(cmd,(output)=>{console.log(output);});
}
