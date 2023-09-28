import { Uri, Webview } from "vscode";
import { getNonce } from "./getNonce";

function getStyleUri(extensionUri:Uri, dataUri:Uri, webview?:Webview) {
  // Local path to css styles
  const baseUri = {
    base:Uri.joinPath(extensionUri, 'resources', 'base.css'),
    gui:Uri.joinPath(extensionUri, 'resources', 'gui.css'),
    tracing:Uri.joinPath(extensionUri, 'resources', 'tracing.css'),
    autogrow:Uri.joinPath(extensionUri, 'resources', 'autogrow.css'),
    user:Uri.joinPath(dataUri, 'user.css'),
    icons:Uri.joinPath(extensionUri, 'resources', 'vendor', 'vscode', 'codicon.css')
  };
  if(webview) {
    const webviewUri = {
      base:webview.asWebviewUri(baseUri.base),
      gui:webview.asWebviewUri(baseUri.gui),
      tracing:webview.asWebviewUri(baseUri.tracing),
      autogrow:webview.asWebviewUri(baseUri.autogrow),
      user:webview.asWebviewUri(baseUri.user),
      icons:webview.asWebviewUri(baseUri.icons)
    };
    return webviewUri;
  } else {
    return baseUri;
  }
}
function getScriptUri(extensionUri:Uri, webview?:Webview) {
  const baseUri = Uri.joinPath(extensionUri, 'resources', 'smoresScript.js');
  if(webview) {
    return webview.asWebviewUri(baseUri);
  } else {
    return baseUri;
  }
}
function getMermaidUri(extensionUri:Uri, webview?:Webview) {
  const baseUri = Uri.joinPath(extensionUri, 'resources', 'vendor', 'mermaid', 'mermaid.min.js');
  if(webview) {
    return webview.asWebviewUri(baseUri);
  } else {
    return baseUri;
  }
}

export function getEditorStyleBlock(extensionUri:Uri, dataUri:Uri, webview?:Webview):string {
  const nonce = getNonce();
  let styleUri = getStyleUri(extensionUri, dataUri, webview);
  if(webview) {
    return `
  <link nonce="${nonce}" href="${styleUri.base.toString()}" rel="stylesheet"/>
  <link nonce="${nonce}" href="${styleUri.autogrow.toString()}" rel="stylesheet"/>
  <link nonce="${nonce}" href="${styleUri.user.toString()}" rel="stylesheet"/>
  <link nonce="${nonce}" href="${styleUri.gui.toString()}" rel="stylesheet"/>
  <link nonce="${nonce}" href="${styleUri.icons.toString()}" rel="stylesheet"/>`;
  } else {
    return `
  <link nonce="${nonce}" href="${styleUri.base.toString()}" rel="stylesheet"/>
  <link nonce="${nonce}" href="${styleUri.user.toString()}" rel="stylesheet"/>`;
  }
}
export function getScriptBlock(extensionUri:Uri, webview?:Webview):string {
  const nonce = getNonce();
  const scriptUri = getScriptUri(extensionUri, webview);
  if(webview) {
    return `
  <script nonce="${nonce}" src="${scriptUri}"></script>`;
  } else {
    return "";
  }
}

export function getMermaidBlock(extensionUri:Uri, webview?:Webview):string {
  const nonce = getNonce();
  const mermaidUri = getMermaidUri(extensionUri, webview);
  const mermaidConfig = `{ 
        startOnLoad: true, 
        theme: 'neutral',
        flowchart: {
          useMaxWidth: false, 
          htmlLabels: true 
        } 
      }`;
  return `
  <script nonce="${nonce}" src="${mermaidUri}"></script>
  <script nonce="${nonce}">
    mermaid.initialize(
      ${mermaidConfig}
    );
  </script>`;
}