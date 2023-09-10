import * as vscode from 'vscode';
import { newProject } from './newProject';
import { matchProjectData, openProject, parseIntoProjectData, setActiveProject } from './openProject';
import { closeProject } from './closeProject';
import { newDocument } from './newDocument';
import { DoorsSmores } from '../doorsSmores';
import { PathLike } from 'fs';
import { ProjectNode } from './projectNode';
import { SmoresProject, getProject } from '../model/smoresProject';
import { SmoresNode } from '../model/smoresNode';
import { DocumentViewer } from '../documentViewer/documentViewer';

export type ProjectData = {
	name:string,
	path:PathLike
};

export class ProjectManagement implements vscode.TreeDataProvider<ProjectNode> {
  private _onDidChangeTreeData: vscode.EventEmitter<ProjectNode | undefined> =
    new vscode.EventEmitter<ProjectNode | undefined>();
  readonly onDidChangeTreeData: vscode.Event<ProjectNode | undefined> =
    this._onDidChangeTreeData.event;
	private static currentInstance:ProjectManagement|undefined;
	constructor() {
		ProjectManagement.matchProjectData = matchProjectData;
		ProjectManagement.parseIntoProjectData = parseIntoProjectData;
		ProjectManagement.newProject = newProject;
		ProjectManagement.openProject = openProject;
		ProjectManagement.closeProject = closeProject;
		ProjectManagement.newDocument = newDocument;
		ProjectManagement.setActiveProject = setActiveProject;
		ProjectManagement.currentInstance = this;
	}
	public getTreeItem(element: ProjectNode): vscode.TreeItem {
    return element;
  }

	private static getProjectNodesFromDocPaths(documentPaths:PathLike[]):ProjectNode[] {
		var nodes:ProjectNode[] =[];
		documentPaths.forEach(docPath => {
			const docNode = new SmoresNode(docPath);
			if(docNode && docNode.data.documentData) {
				const docData:ProjectData = {name:docNode.data.text, path:docPath};
				const projectNode = new ProjectNode(docData, false, true);
				nodes.push(projectNode);
			}
		});
		return nodes;
	}
	public getChildren(element?: ProjectNode): Thenable<ProjectNode[]> {
		const activeProject = getProject();
		const activeProjectData = ProjectManagement.parseIntoProjectData(activeProject);
		if(element) {
			if(ProjectManagement.matchProjectData(element.data, activeProjectData)) {
				const projectDocPaths = activeProject!.getDocumentPaths();
				return Promise.resolve(ProjectManagement.getProjectNodesFromDocPaths(projectDocPaths));
			} else {
				return Promise.resolve([]);
			}
		} else {
			const projects = ProjectManagement.getRecentProjects();
			let projectNodes:ProjectNode[]=[];
			for(let i=0; i<projects.length; i++) {
				var item:ProjectNode;
				if(ProjectManagement.matchProjectData(projects[i], activeProjectData)) {
					item = new ProjectNode(projects[i],true);
				} else {
					item = new ProjectNode(projects[i]);
				}
				projectNodes.push(item);
			}
			return Promise.resolve(projectNodes);
		}
	}
	public static refresh(entry?: ProjectNode): void {
    if(ProjectManagement.currentInstance) {
      ProjectManagement.currentInstance._onDidChangeTreeData.fire(entry);
    }
  }

	private static matchProjectData(project1:ProjectData, project2:ProjectData):boolean {return true;}
	private static parseIntoProjectData(project:SmoresProject|undefined):ProjectData {return {name:"",path:""};};
	public static async newProject() {}
	public static async openProject() {}
	public static closeProject() {}
	public static newDocument() {}
	public static setActiveProject(projectFilepath:string) {}

  public static createAndRegister(context: vscode.ExtensionContext) {
		const view = new ProjectManagement();
		context.subscriptions.push(vscode.window.registerTreeDataProvider('doors-smores.projectView', view));
		context.subscriptions.push(vscode.window.createTreeView('doors-smores.projectView', {treeDataProvider: view}));
		context.subscriptions.push(vscode.commands.registerCommand('doors-smores.Show-Document',ProjectManagement.showDocument));
  }
	private static getMaxRecent():number {
		return 5;
	}
	public static getRecentProjects():ProjectData[] {
		const globalState = DoorsSmores.extensionContext.globalState;
		const storedProjects:string|undefined = globalState.get('recentProjects');
		if(storedProjects) {
			return JSON.parse(storedProjects);
		} else {
			return [];
		}
	}
	public static showDocument(documentPath:string) {
		const documentNode = new SmoresNode(documentPath);
		if(documentNode) {
			DocumentViewer.render(documentNode);
		}
	}
	public static updateRecentProjects(recentProjects:ProjectData[]) {		
		const maxRetain = ProjectManagement.getMaxRecent() -1;
		if(recentProjects.length > maxRetain) {
			recentProjects.splice(maxRetain-1);
		}
		const globalState = DoorsSmores.extensionContext.globalState;
		globalState.update('recentProjects', JSON.stringify(recentProjects));
		ProjectManagement.refresh();
	}
}
