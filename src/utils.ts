import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { SmoresNode } from "./model/smoresNode";

export function getWorkspaceRoot() :string|undefined {
  const rootPath =
  vscode.workspace.workspaceFolders &&
  vscode.workspace.workspaceFolders.length > 0
    ? vscode.workspace.workspaceFolders[0].uri.fsPath
    : undefined;
  return rootPath;
}

