import * as vscode from "vscode";
import { DocumentTreeItem } from "./documentTreeItem";
import { DoorsSmores } from "../../doorsSmores";
import { DocumentView } from "../../customWebviews/documentView/documentView";
import { TraceView } from "../../customWebviews/traceView/traceView";

export class DocumentTreeProvider implements vscode.TreeDataProvider<DocumentTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<DocumentTreeItem | undefined> =
    new vscode.EventEmitter<DocumentTreeItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<DocumentTreeItem | undefined> =
    this._onDidChangeTreeData.event;
	private static tree:DocumentTreeProvider|undefined;
	constructor() {
    DocumentTreeProvider.tree = this;
	}

	public getTreeItem(element: DocumentTreeItem): vscode.TreeItem {
    return element;
  }

	public getChildren(element?: DocumentTreeItem): Thenable<DocumentTreeItem[]> {
		if(element) {
      const children = element.getChildren();
      return Promise.resolve(children);
		} else {
      const activeDocument = DoorsSmores.getActiveDocument();
      if(activeDocument) {
        const documentTreeItem = new DocumentTreeItem(activeDocument.getFilepath());
        return Promise.resolve([documentTreeItem]);
		  } else {
        return Promise.resolve([]);
      }
    }
	}
  public static issueDocument() {
    const document = DoorsSmores.getActiveDocument();
    if(document) {
      document.issueDocument();
    }
  }
	public static refresh(entry?: DocumentTreeItem): void {
    if(DocumentTreeProvider.tree) {
      DocumentTreeProvider.tree._onDidChangeTreeData.fire(entry);
    } else {
      DocumentTreeProvider.tree = new DocumentTreeProvider();
      const registrations = [
        vscode.window.registerTreeDataProvider('doors-smores.documentTree', DocumentTreeProvider.tree),
        vscode.window.createTreeView('doors-smores.documentTree', {treeDataProvider: DocumentTreeProvider.tree, showCollapseAll: false}),
        vscode.commands.registerCommand('doors-smores.NewDocument', DoorsSmores.newDocumentGui),
        vscode.commands.registerCommand('doors-smores.ExportDocument', ()=>{DocumentView.exportDocument(DoorsSmores.getActiveDocument());}),
        vscode.commands.registerCommand('doors-smores.IssueDocument', DocumentTreeProvider.issueDocument),
        vscode.commands.registerCommand('doors-smores.ViewDocumentNode', (item:DocumentTreeItem)=>{DocumentView.render(item.node);}),
        vscode.commands.registerCommand('doors-smores.DeleteDocumentNode', (item:DocumentTreeItem)=>{item.deleteNode();}),
        vscode.commands.registerCommand('doors-smores.ViewTraces', TraceView.render),
        vscode.commands.registerCommand('doors-smores.Promote', (item:DocumentTreeItem)=>{item.node.promote();}),
        vscode.commands.registerCommand('doors-smores.Demote', (item:DocumentTreeItem)=>{item.node.demote();}),
        vscode.commands.registerCommand('doors-smores.MoveUp', (item:DocumentTreeItem)=>{item.node.moveUp();}),
        vscode.commands.registerCommand('doors-smores.MoveDown', (item:DocumentTreeItem)=>{item.node.moveDown();}),
      ];
      DoorsSmores.register(registrations);
    }
  }

}
