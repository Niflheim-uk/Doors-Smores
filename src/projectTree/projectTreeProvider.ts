
import * as vscode from 'vscode';
import { ProjectTreeItem } from './projectTreeItem';
import { DoorsSmores } from '../doorsSmores';


export class ProjectTreeProvider implements vscode.TreeDataProvider<ProjectTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ProjectTreeItem | undefined> =
    new vscode.EventEmitter<ProjectTreeItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<ProjectTreeItem | undefined> =
    this._onDidChangeTreeData.event;
	private static tree:ProjectTreeProvider|undefined;
	constructor() {
    ProjectTreeProvider.tree = this;
	}

	public getTreeItem(element: ProjectTreeItem): vscode.TreeItem {
    return element;
  }

	public getChildren(element?: ProjectTreeItem): Thenable<ProjectTreeItem[]> {
    const activeProject = DoorsSmores.getActiveProject();
		if(element) {
      return Promise.resolve(element.getChildren());
		} else {
      const recentProjects = DoorsSmores.getRecentProjects();
      var children:ProjectTreeItem[] = [];
      recentProjects.forEach(info => {
        const item = new ProjectTreeItem(info, true);
        children.push(item);
      });
      return Promise.resolve(children);
		}
	}
	public static refresh(entry?: ProjectTreeItem): void {
    if(ProjectTreeProvider.tree) {
      ProjectTreeProvider.tree._onDidChangeTreeData.fire(entry);
    } else {
      ProjectTreeProvider.tree = new ProjectTreeProvider();
      const registrations = [
        vscode.window.registerTreeDataProvider('doors-smores.projectTree', ProjectTreeProvider.tree),
        vscode.window.createTreeView('doors-smores.projectTree', {treeDataProvider: ProjectTreeProvider.tree, showCollapseAll: false}),
        vscode.commands.registerCommand("doors-smores.NewProject", DoorsSmores.newProjectGui),
        vscode.commands.registerCommand("doors-smores.OpenProject", DoorsSmores.openProjectGui),
        vscode.commands.registerCommand("doors-smores.CloseProject", DoorsSmores.closeActiveProject),
        vscode.commands.registerCommand("doors-smores.OnProjectTreeItemClick", (item)=>item.onClick()),
        vscode.commands.registerCommand("doors-smores.DeleteDocument", ProjectTreeProvider.deleteDocument),
        vscode.commands.registerCommand("doors-smores.RemoveRecentProject", ProjectTreeProvider.removeRecentProject)
      ];
      DoorsSmores.register(registrations);
    }
  }
  private static deleteDocument(item:ProjectTreeItem) {
    if(!ProjectTreeItem.isProjectTreeItem(item)) {
      console.error(`deleteDocument called with unknown item ${item}`);
      return;
    }
    DoorsSmores.deleteDocument(item.getItemId());
  }
  private static removeRecentProject(item:ProjectTreeItem) {
    if(!ProjectTreeItem.isProjectTreeItem(item)) {
      console.error(`removeRecentProject called with unknown item ${item}`);
      return;
    }
    let recentProjects = DoorsSmores.getRecentProjects();
    recentProjects = DoorsSmores.stripProjectInfoFromArray(item.info, recentProjects);
    DoorsSmores.writeRecentProjects(recentProjects);
  }
}
