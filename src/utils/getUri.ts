import { Uri, Webview } from "vscode";
import { getExtensionPath, getExtensionUri } from "./getExtension";
import { join } from "path";

export function getUri(webview: Webview, pathList: string[]) {
  const extensionUri = getExtensionUri();
  if(extensionUri) {
    return webview.asWebviewUri(Uri.joinPath(extensionUri, ...pathList));
  }
  return Uri.file("");
}
export function getPath(pathList: string[]) {
  const extensionPath = getExtensionPath();
  if(extensionPath) {
    return join(extensionPath, ...pathList);
  }
  return "";
}