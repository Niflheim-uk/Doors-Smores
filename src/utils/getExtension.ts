import { join } from "path";
import { Uri, extensions } from "vscode";

export function getExtensionPath():string {
  const _extension = extensions.getExtension("Niflheim.doors-smores");
  if(_extension) {
    return _extension.extensionPath;
  }
  return "";
}

export function getExtensionUri():Uri {
  const _extension = extensions.getExtension("Niflheim.doors-smores");
  if(_extension) {
    return Uri.file(_extension.extensionPath);
  }
  return Uri.file("");
}

export function getExtensionBasedPath(pathList:string[]) {
  const extensionPath = getExtensionPath();
  return join(extensionPath, ...pathList);
}

export function getExtensionBasedUri(pathList:string[]) {
  return Uri.file(getExtensionBasedPath(pathList));
}