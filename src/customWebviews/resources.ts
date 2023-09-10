import { join } from "path";
import { DoorsSmores } from "../doorsSmores";

export function getDocumentStylePaths():string[] {
  const extensionPath = DoorsSmores.getExtensionPath();
  // Local path to css styles
  const stylesPaths:string[] = [
    join(extensionPath, 'resources', 'document.css'),
    join(extensionPath, 'resources', 'displayStyle.css'),
    join(extensionPath, 'resources', 'pagination.css'),
    join(extensionPath, 'resources', 'vendor', 'vscode', 'codicon.css')
  ];
  return stylesPaths;
}
export function getTracingStylePaths():string[] {
  const extensionPath = DoorsSmores.getExtensionPath();
  const stylesPaths:string[] = [
    join(extensionPath, 'resources', 'tracing.css'),
    join(extensionPath, 'resources', 'displayStyle.css'),
    join(extensionPath, 'resources', 'pagination.css'),
    join(extensionPath, 'resources', 'vendor', 'vscode', 'codicon.css')
  ];
  return stylesPaths;
}
export function getScriptPath():string {
  const extensionPath = DoorsSmores.getExtensionPath();
  return join(extensionPath, 'resources', 'smoresScript.js');
}
