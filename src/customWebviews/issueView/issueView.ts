import { clearNonce, getNonce } from "../getNonce";
import { RevisionHistoryItem } from "../../model/documentNode";
import { DoorsSmores } from "../../doorsSmores";
import { join } from "path";
import { getCoverStylePaths } from "../resources";
import { SmoresDocument } from "../../model/smoresDocument";
import { Disposable, Uri, ViewColumn, WebviewPanel, commands, window } from "vscode";
import { VersionController } from "../../versionControl/versionController";

export class IssueView {
  public static currentPanel: IssueView | undefined;
  private _disposables: Disposable[] = [];
  private readonly panel: WebviewPanel;

  private constructor(private document:SmoresDocument, private traceReport:boolean) {
    this.panel = this.createPanel();
    this.panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this.panel.webview.onDidReceiveMessage( (item) =>{this.handleMessage(item);});
  }
  public static async issueDocument(document:SmoresDocument, traceReport:boolean) {
    if (IssueView.currentPanel) {
      IssueView.currentPanel.panel.reveal(ViewColumn.One);
      await commands.executeCommand('workbench.action.closeActiveEditor');
      IssueView.currentPanel = undefined;
    }
    IssueView.currentPanel = new IssueView(document, traceReport);
    IssueView.refresh();
  }
  public static async refresh() {
    if(IssueView.currentPanel) {
      const panel = IssueView.currentPanel.panel;
      panel.webview.html = await IssueView.currentPanel.getPageHtml();
    }
  }
  private async handleMessage(item:RevisionHistoryItem) {
    if(this.traceReport) {
      this.document.data.documentData!.traceReportRevisionHistory.push(item);
    } else {
      this.document.data.documentData!.revisionHistory.push(item);
    }
    this.document.write();
    await commands.executeCommand('workbench.action.closeActiveEditor');
    IssueView.currentPanel = undefined;      
    if(this.traceReport) {
      this.document.exportTraceReport();
    } else {
      this.document.exportDocument();
    }
    await VersionController.issueDocument(this.document, this.traceReport);
  }
  private dispose() {
    IssueView.currentPanel = undefined;
    this.panel.dispose();
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
  private createPanel() {
    const projUri = Uri.file(DoorsSmores.getProjectDirectory());    
    const extensionUri = Uri.file(DoorsSmores.getExtensionPath());
    var title="Issue document";
    if(this.traceReport) {
      title="Issue trace report";
    }
    const panel = window.createWebviewPanel(
      "doors-smores.issueView", // Identifies the type of the webview. Used internally
      title, // Title of the panel displayed to the user
      ViewColumn.One, // Editor column to show the new webview panel in.
      {
        enableScripts: true,
        localResourceRoots:[
          Uri.joinPath(extensionUri, 'resources'),
          projUri,
        ]
      }  
    );
    return panel;
  }
  private async getPageHtml():Promise<string> {
    const nonce = getNonce();
    const bodyHtml = await this.getBodyHtml();
    let scriptBlock = "";
    var styleUri:string[];
    const stylePaths = getCoverStylePaths();
    const extensionPath = DoorsSmores.getExtensionPath();
    const scriptPath = join(extensionPath, 'resources', 'issueScript.js');
    const scriptUri = this.panel.webview.asWebviewUri(Uri.file(scriptPath)).toString();
    scriptBlock = `<script nonce="${nonce}" src="${scriptUri}"></script>`;
    styleUri = [
      this.panel.webview.asWebviewUri(Uri.file(stylePaths[0])).toString(),
      this.panel.webview.asWebviewUri(Uri.file(stylePaths[1])).toString(),
      this.panel.webview.asWebviewUri(Uri.file(stylePaths[2])).toString(),
      this.panel.webview.asWebviewUri(Uri.file(stylePaths[3])).toString()
    ];
    const styleBlock = `
    <link nonce="${nonce}" href="${styleUri[0]}" rel="stylesheet"/>
    <link nonce="${nonce}" href="${styleUri[1]}" rel="stylesheet"/>
    <link nonce="${nonce}" href="${styleUri[2]}" rel="stylesheet"/>
    <link nonce="${nonce}" href="${styleUri[3]}" rel="stylesheet"/>
    `;
    clearNonce();
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'none'; 
    font-src   ${this.panel.webview.cspSource} 'nonce-${nonce}';
    img-src    ${this.panel.webview.cspSource} 'nonce-${nonce}';
    script-src ${this.panel.webview.cspSource} 'nonce-${nonce}';
    style-src  ${this.panel.webview.cspSource} 'nonce-${nonce}';
  "/>
  <style nonce="${nonce}">
    textarea {
      margin-left:1%;
      width:49%;
    }
    div.radioDiv {
      display:flex; 
      flex-direction:column;
    }
  </style>
  ${styleBlock}
</head>
<body data-vscode-context='{"preventDefaultContextMenuItems": true}'>
  ${bodyHtml}
  ${scriptBlock}
</body>    
</html>`;  
  }
  private async getBodyHtml() {
    var html = "";
    const revisionHistory = this.getRevisionHistory();
    html = html.concat(this.getIssueSection());
    html = html.concat(await this.getAuthorSection());
    html = html.concat(this.getSubmitSection());
    html = html.concat(this.getHistoricSections(revisionHistory));
    return html;
  }

  private getIssueSection():string {
    var html = this.getIssueSelectionSection();
    html = html.concat(this.getSummarySection());
    return html;
  }
  private getIssueSelectionSection() {
    const lastRev = this.document.getLatestRevision(false);
    const majorForMajor = lastRev.major+1;
    const minorForMajor = 0;
    const majorForMinor = lastRev.major;
    const minorForMinor = lastRev.minor+1;
    const minorString = `Minor: ${lastRev.getIssueString(majorForMinor, minorForMinor)}`;
    const majorString = `Major: ${lastRev.getIssueString(majorForMajor, minorForMajor)}`;
    return `
    <br>
    <div>
      <h1>Select issue type</h1>
      <div class="radioDiv">
        <div><input type="radio" id="minorIssue" name="issueType" data-major=${majorForMinor} data-minor=${minorForMinor} checked="checked">${minorString}</div>
        <div><input type="radio" id="majorIssue" name="issueType" data-major=${majorForMajor} data-minor=${minorForMajor}                  >${majorString}</div>
      </div>
    </div>`;
  }
  private getSummarySection() {
    var summaryContent = "";
    return `
    <br>
    <div>
      <h1>Enter issue summary</h1>
      <textarea id='issueSummary' rows="8">${summaryContent}</textarea>
    </div>`;
  }
  private async getAuthorSection() {
    const author = await VersionController.getUserName();
    return `
    <br>
    <div>
      <h1>Enter issue author</h1>
      <textarea id='issueAuthor' rows="1">${author.split("\n")[0]}</textarea>
    </div>`;
  }
  private getSubmitSection() {
    return `
    <br>
    <button id='issueButton'>Issue document</button>`;
  }

  private getHistoricSections(revisionHistory:RevisionHistoryItem[]):string {
    var html = "";
    if(revisionHistory.length > 0) {
      for(let i=revisionHistory.length-1; i >= 0; i--) {
        const item = RevisionHistoryItem.make(revisionHistory[i]);
        const row = `${item.getTableRow()}
      `;
        html = html.concat(row);
      }
    }
    return `
    <br><br>
    <h1>Previous issues</h1>
    <table class="history">
      <thead>
        <tr><th>Date</th><th>Issue</th><th>Summary</th><th>Author</th></tr>
      </thead>
      <tbody>
        ${html}
      </tbody>
    </table>`;
  }

  private getRevisionHistory():RevisionHistoryItem[] {
    if(this.document.data.documentData) {
      if(this.traceReport) {
        return this.document.data.documentData.traceReportRevisionHistory;
      } else {
        return this.document.data.documentData.revisionHistory;
      }
    } else {
      return [];
    }
  }
}
