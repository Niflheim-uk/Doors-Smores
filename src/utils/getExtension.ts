import { join } from "path";
import { Uri } from "vscode";
import { DoorsSmores } from "../doorsSmores";

export function getExtensionPath():string {
  return DoorsSmores.extensionContext.extensionPath;
}

export function getExtensionUri():Uri {
  return DoorsSmores.extensionContext.extensionUri;
}

export function getExtensionBasedPath(pathList:string[]) {
  const extensionPath = getExtensionPath();
  return join(extensionPath, ...pathList);
}

export function getExtensionBasedUri(pathList:string[]) {
  return Uri.file(getExtensionBasedPath(pathList));
}