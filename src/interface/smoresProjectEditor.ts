import * as vscode from 'vscode';
import { clearNonce, getNonce } from './getNonce';
import { SmoresDocument } from '../model/smoresDocument';
import { FileIO } from '../model/fileIO';
import { getEditorStyleBlock, getMermaidBlock, getScriptBlock } from './resources';
import { generateTOCxsl, generateUserCss } from './userStyle';
import * as schema from '../model/schema';
import { SmoresProject } from '../model/smoresProject';
import { dirname, join } from 'path';
import { SmoresConverter, SmoresConverterResult } from '../converter/smoresConverter';
import { HTML } from './html';
import { SmoresEditorProvider } from './smoresEditor';

interface HtmlConstants {
	smoresProject:SmoresProject;
	dataUri:vscode.Uri;
	webview:vscode.Webview;
};
interface DocumentationRowConstants {
  title:string;
  leftDocumentType:string;
  rightDocumentType:string;
  leftDocuments:schema.DocumentInfo[];
  rightDocuments:schema.DocumentInfo[];
}

export class SmoresProjectEditorProvider implements vscode.CustomTextEditorProvider {
	private static readonly viewType = 'doors-smores.projectEditor';
	
	public static register(context: vscode.ExtensionContext): vscode.Disposable {
		const provider = new SmoresProjectEditorProvider(context);
		const providerRegistration = vscode.window.registerCustomEditorProvider(SmoresProjectEditorProvider.viewType, provider);
		return providerRegistration;
	}

	constructor(private readonly context: vscode.ExtensionContext) { }

	public async resolveCustomTextEditor(document: vscode.TextDocument,	webviewPanel: vscode.WebviewPanel, _token: vscode.CancellationToken): Promise<void> {
		let smoresProject = new SmoresProject(document);
		if(smoresProject.data === undefined) {
			const converter = new SmoresConverter();
			if(converter.convert(document) !== SmoresConverterResult.success) {
				return;
			} else {
				smoresProject = new SmoresProject(document);
				if(smoresProject.data === undefined) {
					return;
				}
			}
		}
		const projRoot = dirname(document.fileName);
		const dataPath = join(projRoot, smoresProject.data.data.relativeRoot);
		const dataUri = vscode.Uri.file(dataPath);
		generateUserCss(this.context.extensionUri.fsPath, dataUri.fsPath);
    
		webviewPanel.webview.options = {
			enableScripts: true,
			localResourceRoots:[
				vscode.Uri.joinPath(this.context.extensionUri, 'resources'),
				dataUri
			]
		};
		const htmlConstants:HtmlConstants = {
			smoresProject,
			webview:webviewPanel.webview,
			dataUri
		};
		webviewPanel.webview.html = this.getHtmlForDocument(htmlConstants);

		const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
			if (e.document.uri.toString() === document.uri.toString()) {
				smoresProject.updateData();
				webviewPanel.webview.html = this.getHtmlForDocument(htmlConstants);
			}
		});

		// Make sure we get rid of the listener when our editor is closed.
		webviewPanel.onDidDispose(() => {
			changeDocumentSubscription.dispose();
		});

		// Receive message from the webview.
		webviewPanel.webview.onDidReceiveMessage(async e => {
			switch (e.command) {
			case 'newDocument':
				const docTitle = await vscode.window.showInputBox({
					prompt:"Enter document title",
					placeHolder:"Document title"
				});
				if(docTitle && smoresProject.data) {
					const docInfo:schema.DocumentInfo = {
						name: docTitle,
						type: e.documentType,
						relativePath: `./${docTitle}.smores`
					};
					if(SmoresDocument.generateNewDocument(docInfo, document.fileName)) {
						smoresProject.data.data.documents.document.push(docInfo);
						FileIO.writeXmlFile(document.fileName, smoresProject.data, 'project');
					}
				}
				break;
			case 'openDocument':
				const docPath = join(projRoot, e.relativePath);
				vscode.commands.executeCommand("vscode.openWith", vscode.Uri.file(docPath), SmoresEditorProvider.viewType);
				break;
			case 'dataClick':
				//, item: item});
				break;
			}
		});

	}

	private getHtmlForDocument(htmlConstants:HtmlConstants): string {
		const nonce = getNonce();
		const documentHtml = this.getProjectHtml(htmlConstants.smoresProject);
		const styleBlock = getEditorStyleBlock(this.context.extensionUri, htmlConstants.dataUri, htmlConstants.webview);
    const scriptBlock = getScriptBlock(this.context.extensionUri, htmlConstants.webview);
		clearNonce();
		return `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="Content-Security-Policy" 
	content="default-src 'none'; 
	font-src ${htmlConstants.webview.cspSource} 'nonce-${nonce}'; 
	img-src ${htmlConstants.webview.cspSource} 'nonce-${nonce}'; 
	script-src ${htmlConstants.webview.cspSource} 'nonce-${nonce}';
	style-src ${htmlConstants.webview.cspSource} 'unsafe-inline';
"/>
${styleBlock}
<title>Doors Smores</title>
</head>
<body data-vscode-context='{"preventDefaultContextMenuItems": true}'>
${documentHtml}
${scriptBlock}
</body>    

</html>`;
	}
	private getProjectHtml(smoresProject:SmoresProject):string {
		if(smoresProject.data === undefined) { return '<h1>Invalid projecct document</h1>';}
    const projectName = SmoresProject.getProjectNameFromFilepath(smoresProject.document.fileName);
    const projRow = this.getProjectRow(smoresProject);
    const dataPath = this.getDataPathRow(smoresProject);
    const repoRoot = this.getRepoRootRow(smoresProject);
    const repoRemote = this.getRepoRemoteRow(smoresProject);
    const projectTableRows = [projRow, dataPath, repoRoot, repoRemote];
    const projectTable = HTML.getTableHtml(projectTableRows, 'projectTable');

    const title = `<h1><b>Project:</b> ${projectName}</h1>`;
    const docTitle = "<h2>Project documents:</h2>";
    const docTable = this.getDocumentTableHtml(smoresProject);
    return `
    ${title}
    ${projectTable}
    ${docTitle}
    ${docTable}`;
	}
  private getDocumentTableHtml(smoresProject:SmoresProject) {
    const userRow = this.getDocumentTableUserRow(smoresProject);
    const systemRow = this.getDocumentTableSystemRow(smoresProject);
    const archRow = this.getDocumentTableArchRow(smoresProject);
    const designRow = this.getDocumentTableDesignRow(smoresProject);
    return `
  <table class='docTable'>
    <tbody>
      <tr>
        <th></th>
        <th>Specification</th>
        <th>Test Protocol</th>
      </tr>
      ${userRow}
      ${systemRow}
      ${archRow}
      ${designRow}
    </tbody>
  </table>`;
  }
  private getDocumentTableUserRow(smoresProject:SmoresProject) {
		if(smoresProject.data === undefined) {return "";}
    const specs = SmoresProject.getURSInfos(smoresProject.data.data.documents.document);
    const tests = SmoresProject.getATPInfos(smoresProject.data.data.documents.document);
    const rowConstants:DocumentationRowConstants = {
      title:"User / Acceptance",
      leftDocumentType:schema.ursDocType,
      rightDocumentType:schema.atpDocType,
      leftDocuments:specs,
      rightDocuments:tests
    };
    return this.getDocumentationRow(rowConstants);
  }
  private getDocumentTableSystemRow(smoresProject:SmoresProject) {
		if(smoresProject.data === undefined) {return "";}
    const specs = SmoresProject.getSRSInfos(smoresProject.data.data.documents.document);
    const tests = SmoresProject.getSTPInfos(smoresProject.data.data.documents.document);
    const rowConstants:DocumentationRowConstants = {
      title:"System",
      leftDocumentType:schema.srsDocType,
      rightDocumentType:schema.stpDocType,
      leftDocuments:specs,
      rightDocuments:tests
    };
    return this.getDocumentationRow(rowConstants);
  }
  private getDocumentTableArchRow(smoresProject:SmoresProject) {
		if(smoresProject.data === undefined) {return "";}
    const specs = SmoresProject.getADSInfos(smoresProject.data.data.documents.document);
    const tests = SmoresProject.getITPInfos(smoresProject.data.data.documents.document);
    const rowConstants:DocumentationRowConstants = {
      title:"Architecture / Integration",
      leftDocumentType:schema.adsDocType,
      rightDocumentType:schema.itpDocType,
      leftDocuments:specs,
      rightDocuments:tests
    };
    return this.getDocumentationRow(rowConstants);
  }
  private getDocumentTableDesignRow(smoresProject:SmoresProject) {
		if(smoresProject.data === undefined) {return "";}
    const specs = SmoresProject.getDDSInfos(smoresProject.data.data.documents.document);
    const tests = SmoresProject.getUTPInfos(smoresProject.data.data.documents.document);
    const rowConstants:DocumentationRowConstants = {
      title:"Design / Unit",
      leftDocumentType:schema.ddsDocType,
      rightDocumentType:schema.utpDocType,
      leftDocuments:specs,
      rightDocuments:tests
    };
    return this.getDocumentationRow(rowConstants);
  }

  private getDocumentationRow(docRowConstants:DocumentationRowConstants) {
    const leftAddIcon = HTML.getIcon(docRowConstants.leftDocumentType, 'new-file');
    const rightAddIcon = HTML.getIcon(docRowConstants.rightDocumentType, 'new-file');
		const leftDataset = `data-document-type='${docRowConstants.leftDocumentType}'`;
		const rightDataset = `data-document-type='${docRowConstants.rightDocumentType}'`;
    let leftDocs = "";
    for(let i=0; i<docRowConstants.leftDocuments.length; i++) {
      leftDocs = leftDocs.concat(this.getDocumentButton(docRowConstants.leftDocuments[i]));
    }
    leftDocs = leftDocs.concat(`
        <button class='toolbarButton projectNewDoc' ${leftDataset}>${leftAddIcon} New</button>`);
    let rightDocs = "";
    for(let i=0; i<docRowConstants.rightDocuments.length; i++) {
      rightDocs = rightDocs.concat(this.getDocumentButton(docRowConstants.rightDocuments[i]));
    }
    rightDocs = rightDocs.concat(`
        <button class='toolbarButton projectNewDoc' ${rightDataset}>${rightAddIcon} New</button>`);
    return `
    <tr>
      <td>${docRowConstants.title}</td>
      <td>${leftDocs}</td>
      <td>${rightDocs}</td>
    </tr>`;
  }
	private getDocumentButton(docInfo:schema.DocumentInfo) {
    const icon = HTML.getIcon(docInfo.type, schema.documentCategory);
		const dataset = `data-rel-path='${docInfo.relativePath}'`;
		return `
				<button class='toolbarButton projectOpenDoc' ${dataset}>${icon}${docInfo.name}</button>`;
	}
	private getProjectRow(smoresProject:SmoresProject) {
    const tableClasses =  {c1:'projectTableC1', c2:'projectTableC2'};
		return HTML.get2ColTableRowHtml('Path', smoresProject.document.fileName, tableClasses);
	}
	private getDataPathRow(smoresProject:SmoresProject) {
		if(smoresProject.data === undefined) { return '<h1>Invalid projecct document</h1>';}
    const tableClasses =  {c1:'projectTableC1', c2:'projectTableC2'};
    const projectRoot = dirname(smoresProject.document.fileName);
		const dataPath = join(projectRoot, smoresProject.data.data.relativeRoot);
		const dataset = `data-item='dataPath'`;
		const button = `<button class='toolbarButton projectItem' ${dataset}>${dataPath}</button>`;
		return HTML.get2ColTableRowHtml('Data root', button, tableClasses);
	}
	private getRepoRootRow(smoresProject:SmoresProject) {
		if(smoresProject.data === undefined) { return '<h1>Invalid projecct document</h1>';}
    const tableClasses =  {c1:'projectTableC1', c2:'projectTableC2'};
    const projectRoot = dirname(smoresProject.document.fileName);
		const repoRoot = join(projectRoot, smoresProject.data.repository.relativeRoot);
		const dataset = `data-item='repoRoot'`;
		const button = `<button class='toolbarButton projectItem' ${dataset}>${repoRoot}</button>`;
		return HTML.get2ColTableRowHtml('Repository<br>root', button, tableClasses);
	}
	private getRepoRemoteRow(smoresProject:SmoresProject) {
		if(smoresProject.data === undefined) { return '<h1>Invalid projecct document</h1>';}
    const tableClasses =  {c1:'projectTableC1', c2:'projectTableC2'};
		const dataset = `data-item='repoRemote'`;
		const button = `<button class='toolbarButton projectItem' ${dataset}>${smoresProject.data.repository.remote}</button>`;
		return HTML.get2ColTableRowHtml('Repository<br>remote', button, tableClasses);
	}

}
