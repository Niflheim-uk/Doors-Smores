import { clearNonce, getNonce } from "../getNonce";
import { RevisionHistoryItem } from "../../model/documentNode";
import { DoorsSmores } from "../../doorsSmores";
import { join } from "path";
import { getStylePaths } from "../resources";
import { SmoresDocument } from "../../model/smoresDocument";
import { Disposable, Uri, ViewColumn, WebviewPanel, commands, window, workspace } from "vscode";
import { VersionController } from "../../versionControl/versionController";

export class IssueView {
  public static currentPanel: IssueView | undefined;
  private _disposables: Disposable[] = [];
  private readonly panel: WebviewPanel;

  private constructor(private document:SmoresDocument, private traceReport:boolean) {
    this.panel = this.createPanel();
    this.panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this.panel.webview.onDidReceiveMessage( (msg) =>{this.handleMessage(msg);});
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
  private async handleMessage(msg:any) {
    switch(msg.command) {
    case "submit":
      this.handleSubmitMessage(msg.item);
      break;
    }
    return;
  }
  private async handleSubmitMessage(item:RevisionHistoryItem) {
    if(this.traceReport) {
      this.document.data.documentData!.traceReportRevisionHistory.push(item);
    } else {
      this.document.data.documentData!.revisionHistory.push(item);
    }
    this.document.write();
    if(this.traceReport) {
      await this.document.exportTraceReport();
    } else {
      await this.document.exportDocument();
    }
    setTimeout(IssueView.storeVersion, 2000);
  }
  private static async storeVersion() {
    var commitPrefix = "";
    if(IssueView.currentPanel === undefined) {
      return;
    }
    if(IssueView.currentPanel.traceReport) {
      commitPrefix = "trace report for ";
    }
    await VersionController.commitChanges(`Issued ${commitPrefix}document ${IssueView.currentPanel.document.data.id}`);
    await VersionController.issueDocument(IssueView.currentPanel.document, IssueView.currentPanel.traceReport);
    await commands.executeCommand('workbench.action.closeActiveEditor');
    IssueView.currentPanel = undefined;      
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
    const stylePaths = getStylePaths();
    const extensionPath = DoorsSmores.getExtensionPath();
    const scriptPath = join(extensionPath, 'resources', 'issueScript.js');
    const scriptUri = this.panel.webview.asWebviewUri(Uri.file(scriptPath)).toString();
    scriptBlock = `<script nonce="${nonce}" src="${scriptUri}"></script>`;
    styleUri = [
      this.panel.webview.asWebviewUri(Uri.file(stylePaths.base)).toString(),
      this.panel.webview.asWebviewUri(Uri.file(stylePaths.user)).toString(),
      this.panel.webview.asWebviewUri(Uri.file(stylePaths.gui)).toString(),
      this.panel.webview.asWebviewUri(Uri.file(stylePaths.tracing)).toString(),
      this.panel.webview.asWebviewUri(Uri.file(stylePaths.icons)).toString()
    ];
    const styleBlock = `
    <link nonce="${nonce}" href="${styleUri[0]}" rel="stylesheet"/>
    <link nonce="${nonce}" href="${styleUri[1]}" rel="stylesheet"/>
    <link nonce="${nonce}" href="${styleUri[2]}" rel="stylesheet"/>
    <link nonce="${nonce}" href="${styleUri[3]}" rel="stylesheet"/>
    <link nonce="${nonce}" href="${styleUri[4]}" rel="stylesheet"/>
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
      width:45%;
    }
    div.radioDiv {
      display:flex; 
      flex-direction:column;
    }
    div.summaryDiv {display:flex;}
    div.deltaDiv, div.detailInnerDiv {
      display:flex; 
      flex-direction:column;
    }
    div.deltaDiv {width:50%;}
    div.detailDiv {
      position:absolute;
      right:0;
      top:0;
      background-color:var(--vscode-editor-background);
      border: solid;
      border-color: var(--vscode-input-border);
      padding: 15px 15px;
      border-radius: 5px;
      z-index:1;
      visibility:hidden;
    }
    button {width:unset !important;}
    button#detailButton {
      position:absolute;
      border-radius: 5px;
      right:0;
      top:0;
    }
    span.deltaSpan:hover {
      background-color:var(--vscode-editor-hoverHighlightBackground);
    }
    .insertion {color:green;}
    .notation {color:blue;}
    .deletion {color:red;}
    .whitespace {white-space:pre-wrap;}
  </style>
  ${styleBlock}
</head>
<body data-vscode-context='{"preventDefaultContextMenuItems": true}'>
  <div>${bodyHtml}</div>
  ${scriptBlock}
</body>    
</html>`;  
  }
  private async getBodyHtml() {
    var html = this.getDeltaDetailDiv();;
    const revisionHistory = this.getRevisionHistory();
    html = html.concat(await this.getIssueSection());
    html = html.concat(await this.getAuthorSection());
    html = html.concat(this.getSubmitSection());
    html = html.concat(this.getHistoricSections(revisionHistory));
    return html;
  }
  private getDeltaDetailDiv():string {
    return `
    <div class="detailDiv" id="detailDiv">
      <button id="detailButton">Return</button>
      <div class="detailInnerDiv" id="detailDivInner">
      </div>
    </div>
    `;
  }
  private async getIssueSection() {
    var html = this.getIssueSelectionSection();
    html = html.concat(await this.getSummarySection());
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
  private async getSummarySection() {
    var summaryContent = "";
    const deltaHtml = await this.getDeltaHtml();
    return `
    <br>
    <div>
      <h1>Enter issue summary</h1>
      <div class="summaryDiv">
        <textarea id='issueSummary' rows="8">${summaryContent}</textarea>
        ${deltaHtml}
      </div>
    </div>`;
  }
  private async getDeltaHtml() {
    const diffRecords = await VersionController.getDiffRecords(this.document, this.traceReport);
    var html='<div class="deltaDiv">';
    for(let i=0; i<diffRecords.length; i++) {
      const fileClass = this.getModificationClass(diffRecords[i].fileModification);
      const filepath = `<span class='${fileClass}'>${diffRecords[i].filepath}</span>`;
      const ins = `<span class='insertion'> +${diffRecords[i].insertions} </span>`;
      const del = `<span class='deletion'> +${diffRecords[i].deletions} </span>`;
      const dataFile = `data-file="${diffRecords[i].filepath}"`;
      const dataDetail = `data-detail="${diffRecords[i].detail}"`;
      html = html.concat(`<span ${dataFile} ${dataDetail} class="deltaSpan">&nbsp;&nbsp;(${ins}|${del}) ${filepath}</span>`);
    }
    return html.concat("</div>");
  }
  private getModificationClass(fileMod:string) {
    switch(fileMod) {
    case 'M':
      return "modification";
    case 'D':
      return "deletion";
    case 'A':
      return "insertion";
    case 'R050':
      return 'rename';
    default:
      window.showErrorMessage("Unknown modification code");
      return "unchanged";
    }
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
    var draft="";
    var draftComplete = false;
    const settings = workspace.getConfiguration('documentRelease');
    if(settings.get("rollUpMinorReleasesIntoMajor") === false) {
      draftComplete = true;
    }

    if(revisionHistory.length > 0) {
      for(let i=revisionHistory.length-1; i >= 0; i--) {
        const item = RevisionHistoryItem.make(revisionHistory[i]);
        if(item.minor === 0) {
          draftComplete = true;
        }
        if(!draftComplete) {
          draft = draft.concat(item.detail.replace(/"/g,"&#34;"), "\n");
        }
        html = html.concat(item.getTableRow(), "\n", "        ");
      }
    }
    return `
    <br><br>
    <h1>Previous issues</h1>
    <table class="history" id="historyTable" data-draft="${draft}">
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
