import { join } from 'path';
import { DoorsSmores } from '../doorsSmores';
import { writeFileSync } from 'fs';
import { getCoverStylePaths } from './resources';
import { SmoresDocument } from '../model/smoresDocument';
import { RevisionHistoryItem } from '../model/documentNode';

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function generateCoverHtmlFile(document:SmoresDocument, traceReport:boolean) {
  const project = DoorsSmores.getActiveProject();
  if(project === undefined) {
    return;
  }
  const projectName = project.getFilenameNoExt();
  const projectDir = DoorsSmores.getDataDirectory();
  const coverFilepath = join(projectDir, 'cover.html');
  const coverHtml = getCoverHtml(document, projectName, traceReport);
  writeFileSync(coverFilepath, coverHtml);
}
export function generateHistoryFile(document:SmoresDocument, traceReport:boolean) {
  const projectDir = DoorsSmores.getDataDirectory();
  const historyFilepath = join(projectDir, 'history.html');
  const historyHtml = getHistoryHtml(document, traceReport);
  writeFileSync(historyFilepath, historyHtml);
}
function getCoverHtml(document:SmoresDocument, projectName:string, traceReport:boolean) {
  if(document.data.documentData === undefined) {
    return "";
  }
  const stylePaths = getCoverStylePaths();
  const date = new Date();
  var tracePrelude = "";
  if(traceReport) {
    tracePrelude = "Trace Report: ";
  }
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="file:///${stylePaths[0]}" rel="stylesheet"/>
    <link href="file:///${stylePaths[1]}" rel="stylesheet"/>
    <link href="file:///${stylePaths[2]}" rel="stylesheet"/>
    <link href="file:///${stylePaths[3]}" rel="stylesheet"/>
  </head>
  <body >
    <h1 class="frontpage">${tracePrelude}${document.data.documentData.documentType}</h1>
    <h2 class="frontpage">${document.data.text}</h1>
    <h3 class="frontpage">${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}</h3>
    <h2 class="frontpage">${projectName}</h2>
  </body>    
</html>
  `;
}

export function getHistoryHtml(document:SmoresDocument, traceReport:boolean) {
  const stylePaths = getCoverStylePaths();
  const historyTableRows = getHistoryTable(document, traceReport);
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="file:///${stylePaths[0]}" rel="stylesheet"/>
    <link href="file:///${stylePaths[1]}" rel="stylesheet"/>
    <link href="file:///${stylePaths[2]}" rel="stylesheet"/>
    <link href="file:///${stylePaths[3]}" rel="stylesheet"/>
  </head>
  <body >
    <h1 class="historyDiv">History</h1>
      <div>
        <table class="history">
          <thead>
            <tr><th>Date</th><th>Issue</th><th>Summary</th><th>Author</th></tr>
          </thead>
          <tbody>
            ${historyTableRows}
          </tbody>
        </table>
      </div>
    </div>
  </body>    
</html>
`;
}

function getHistoryTable(document:SmoresDocument, traceReport:boolean) {
  var historyItems:RevisionHistoryItem[];
  if(document.data.documentData === undefined) {
    return [""];
  }
  if(traceReport) {
    historyItems = document.data.documentData.traceReportRevisionHistory;
  } else {
    historyItems = document.data.documentData.revisionHistory;
  }
  if(historyItems === undefined) {
    return [""];
  }
  var rows:string[] = [];
  for(let i=0; i<historyItems.length; i++) {
    const item = historyItems[i];
    rows.push(item.getTableRow());
  }
  if(rows.length === 0) {
    rows.push(`<tr><td>TBD</td><td>00-01</td><td>TBD</td><td>TBD</td></tr>`);
  }
  return rows;
}