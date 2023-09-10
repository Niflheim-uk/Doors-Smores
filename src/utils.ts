import * as vscode from "vscode";

export function getWorkspaceRoot() :string|undefined {
  const rootPath =
  vscode.workspace.workspaceFolders &&
  vscode.workspace.workspaceFolders.length > 0
    ? vscode.workspace.workspaceFolders[0].uri.fsPath
    : undefined;
  return rootPath;
}

export function getMarkdownParagraphs(originalText:string):string {
  while(originalText[-1]==="\n") {
    originalText = originalText.slice(0,originalText.length-2);
  }
  return (originalText.concat("\n"));
}

export function insertHtmlClass(html:string, className:string) {
  const classPattern1 = `(.*)class="(.*)`;
  const classPattern2 = `(<[^ >])(.*)`;
  const match1 = html.match(classPattern1);
  if(Array.isArray(match1)) {
    html = `${match1[1]}class="${className}, ${match1[2]}`;
  } else {
    const match2 = html.match(classPattern2);
    if(Array.isArray(match2)) {
      html = `${match2[1]} class="${className}"${match2[2]}`;
    } else {
      console.log('failed to match html');
    }
  }
  return html;
}