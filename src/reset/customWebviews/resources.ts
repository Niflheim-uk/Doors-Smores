import { join } from "path";
import { DoorsSmores } from "../doorsSmores";

export function getStylePaths() {
  const extensionPath = DoorsSmores.getExtensionPath();
  const dataDirectory = DoorsSmores.getDataDirectory();
  // Local path to css styles
  const stylesPaths = {
    base:join(extensionPath, 'resources', 'base.css'),
    gui:join(extensionPath, 'resources', 'gui.css'),
    tracing:join(extensionPath, 'resources', 'tracing.css'),
    user:join(dataDirectory, 'user.css'),
    icons:join(extensionPath, 'resources', 'vendor', 'vscode', 'codicon.css')
  };
  return stylesPaths;
}
export function getScriptPath():string {
  const extensionPath = DoorsSmores.getExtensionPath();
  return join(extensionPath, 'resources', 'smoresScript.js');
}
