import { workspace } from "vscode";

export function getWorkspaceRoot() :string|undefined {
  const rootPath =
  workspace.workspaceFolders &&
  workspace.workspaceFolders.length > 0
    ? workspace.workspaceFolders[0].uri.fsPath
    : undefined;
  return rootPath;
}
