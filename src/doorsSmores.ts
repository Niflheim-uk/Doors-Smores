import * as vscode from 'vscode';
import { basename, dirname, join } from 'path';
import { SmoresFile } from './model/smoresFile';
import { SmoresProject } from './model/smoresProject';
import { DocumentNode } from './model/documentNode';
import { ProjectTreeProvider } from './treeViews/projectTree/projectTreeProvider';
import { DocumentTreeProvider } from './treeViews/documentTree/documentTreeProvider';
import { registerNewContentCommands } from './model/newContext';
import { DocumentView } from './customWebviews/documentView/documentView';
import { TraceView } from './customWebviews/traceView/traceView';
import { newDocument } from './model/newDocument';
import { VersionController } from './versionControl/versionController';
import { SmoresDocument } from './model/smoresDocument';

export function activate(context: vscode.ExtensionContext) {
  vscode.commands.executeCommand('setContext', 'doors-smores.projectOpen', false);
  new DoorsSmores(context);
}
export function deactivate() {}

export type ProjectInfo = {
  name:string,
  path:string
};
const recentProjectsKey = 'recentProjects2';
export class DoorsSmores {
  private extensionContext:vscode.ExtensionContext;
  private recentProjects:ProjectInfo[];
  private activeProject:SmoresProject|undefined;
  private activeDocument:SmoresDocument|undefined;
  private static app:DoorsSmores;
  private statusBarItem: vscode.StatusBarItem;
  constructor(context:vscode.ExtensionContext) {
    this.extensionContext = context;
    const jsonString:string|undefined = context.globalState.get(recentProjectsKey);
    if(jsonString) {
      this.recentProjects = JSON.parse(jsonString);
    } else {
      this.recentProjects = [];
    }
    DoorsSmores.app = this;
  	this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    DoorsSmores.refreshViews();

    const registrations = [
      vscode.commands.registerCommand('doors-smores.RefreshViews', DoorsSmores.refreshViews),
      vscode.commands.registerCommand('doors-smores.GetTraceReport', DoorsSmores.getTraceReport),
      this.statusBarItem
    ];
    context.subscriptions.push(...registrations);
    registerNewContentCommands(context);
    DocumentView.registerCommands();
  }
  public static register(registrations:vscode.Disposable[]) {
    if(DoorsSmores.app) {
      DoorsSmores.app.extensionContext.subscriptions.push(...registrations);
    }
  }
  public static refreshViews() {
    DocumentTreeProvider.refresh();
    ProjectTreeProvider.refresh();
    DocumentView.refresh();
    TraceView.refresh();
    DoorsSmores.updateStatusBar();
  }
  public static getWorkspaceDirectory() {
    const rootPath =
    vscode.workspace.workspaceFolders &&
    vscode.workspace.workspaceFolders.length > 0
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : undefined;
    return rootPath;
  }
  public static getExtensionPath() {
    return DoorsSmores.app.extensionContext.extensionPath;
  }
  public static getProjectDirectory():string {
    if(DoorsSmores.app.activeProject) {
      return DoorsSmores.app.activeProject.getDirPath();
    } else {
      return "";
    }
  }
  public static getDataDirectory():string {
    const projectDirectory = DoorsSmores.getProjectDirectory();
    return join(projectDirectory, SmoresFile.dataSubDirName);
  }
  public static getNodeDirectory(id:number):string {
    const dataDirectory = DoorsSmores.getDataDirectory();
    return join(dataDirectory, `${id}`);
  }
  public static getNodeFilepath(id:number):string {
    const nodeFilename = `${id}.${SmoresFile.nodeExtension}`;
    const nodeDirectory = DoorsSmores.getNodeDirectory(id);
    return join(nodeDirectory, nodeFilename);
  }

  public static getActiveProject() {
    return DoorsSmores.app.activeProject;
  }
  public static getRecentProjects() {
    return DoorsSmores.app.recentProjects;
  }
  public static async newProjectGui() {
    var defaultUri;
    const workspace = DoorsSmores.getWorkspaceDirectory();
    if(workspace) {
      defaultUri = vscode.Uri.file(workspace);
    }
    const directory = await vscode.window.showOpenDialog({
      openLabel:"Select project location",
      canSelectFolders:true,
      canSelectFiles:false,
      canSelectMany:false,
      defaultUri
    });  
    if(directory) {
      const projectName = await vscode.window.showInputBox({
        title:"Enter project name",
      });
      if(projectName) {
        const projectUri = vscode.Uri.joinPath(directory[0], `${projectName}`, `${projectName}.${SmoresFile.projectExtension}`);
        DoorsSmores.openProjectPath(projectUri.fsPath);
        if(await VersionController.repoExists()) {
          VersionController.queryExistingRepoUse();
        } else {
          VersionController.queryStartRepoUse();
        }
      }
    }
  }
  public static async openProjectGui() {
    var defaultUri;
    const workspace = DoorsSmores.getWorkspaceDirectory();
    if(workspace) {
      defaultUri = vscode.Uri.file(workspace);
    }
    const uri = await vscode.window.showOpenDialog({
      openLabel:"Select project",
      canSelectFiles:true,
      canSelectFolders:false,
      canSelectMany:false,
      /* eslint-disable-next-line  @typescript-eslint/naming-convention */
      filters:{'Smores Projects': [SmoresFile.projectExtension]},
      defaultUri
    });
    if(uri) {
      DoorsSmores.openProjectPath(uri[0].fsPath);
    }
  }
  public static openProjectPath(path:string) {
    DoorsSmores.app.activeProject = new SmoresProject(path);
    vscode.commands.executeCommand('setContext', 'doors-smores.projectOpen', true);
    DoorsSmores.updateRecentProjects();
    const projectDocuments = DoorsSmores.getDocuments();
    if(projectDocuments.length > 0) {
      DoorsSmores.openDocument(projectDocuments[0]);
    } else {
      DoorsSmores.app.activeDocument = undefined;
      DoorsSmores.refreshViews();  
    }
  }
  public static closeActiveProject() {
    DoorsSmores.app.activeProject = undefined;
    DoorsSmores.app.activeDocument = undefined;
    vscode.commands.executeCommand('setContext', 'doors-smores.projectOpen', false);
    DoorsSmores.refreshViews();  
  }
  public static stripProjectInfoFromArray(project:ProjectInfo, array:ProjectInfo[]):ProjectInfo[] {
    for(let i=0; i<array.length; i++) {
      const entry = array[i];
      if(DoorsSmores.matchProjectData(project, entry)) {
        array.splice(i,1);
        return array;
      }
    }
    return array;
  }
  public static updateRecentProjects() {
    if(DoorsSmores.app.activeProject) {
      const activeProjectInfo:ProjectInfo = {
        name:DoorsSmores.app.activeProject.getFilenameNoExt(),
        path:DoorsSmores.app.activeProject.getFilepath()
      };
      var recentProjects = DoorsSmores.getRecentProjects();
      recentProjects = DoorsSmores.stripProjectInfoFromArray(activeProjectInfo, recentProjects);
      recentProjects = [activeProjectInfo, ...recentProjects];
      DoorsSmores.writeRecentProjects(recentProjects);
    }
  }
  public static getActiveDocument():DocumentNode|undefined {
    if(DoorsSmores.app.activeProject) {
      return DoorsSmores.app.activeDocument;
    } else {
      return undefined;
    }
  }
  public static getDocuments():SmoresDocument[] {
    if(DoorsSmores.app.activeProject) {
      return DoorsSmores.app.activeProject.getDocuments();
    } else {
      return [];
    }
  }
  public static openDocument(document:SmoresDocument) {
    DoorsSmores.app.activeDocument = document;
    if(DocumentView.currentPanel) {
      DocumentView.render(document);
    }
    DoorsSmores.refreshViews();  
  }
  public static closeDocument() {
    DoorsSmores.app.activeDocument = undefined;
    DoorsSmores.refreshViews();
  }
  public static async newDocumentGui() {
    if(DoorsSmores.app.activeProject) {
      const document = await newDocument();
      if(document) {
        DoorsSmores.openDocument(document);
      }
    }
  }
  public static async deleteDocument(documentId:number) {
    const confirmationString = 'delete me';
    const confirmation= await vscode.window.showInputBox({
      prompt:`Enter '${confirmationString}' to confirm`,
      placeHolder:`${confirmationString}`
    });
    if(confirmation === confirmationString) {    
      if(DoorsSmores.app.activeDocument?.data.id === documentId) {
        DoorsSmores.closeDocument();
      }
      if(DoorsSmores.app.activeProject) {
        DoorsSmores.app.activeProject.deleteDocument(documentId);
      }
      DoorsSmores.refreshViews();
    }
  }
  public static getUniqueId():number {
    if(DoorsSmores.app.activeProject) {
      return DoorsSmores.app.activeProject.getUniqueId();
    } else {
      return -1;
    }
  }

  public static writeRecentProjects(newList:ProjectInfo[]) {
    const settings = vscode.workspace.getConfiguration('projectView');
    const maxRecentProjects:number|undefined = settings.get("maximumRecentProjects");
    if(maxRecentProjects && newList.length > maxRecentProjects) {
      newList.splice(maxRecentProjects);
    }
    const jsonString = JSON.stringify(newList);
    DoorsSmores.app.extensionContext.globalState.update(recentProjectsKey, jsonString);
    DoorsSmores.app.recentProjects = newList;
    DoorsSmores.refreshViews(); 
  }

  public static updateStatusBar() {
    if(DoorsSmores.app ) {
      if(DoorsSmores.app.activeDocument) {
        const activeDoc = DoorsSmores.app.activeDocument;
        const numTraces = activeDoc.getNumberTraces();
        const numMissing = activeDoc.getNumberMissingTraces();
        DoorsSmores.app.statusBarItem.text = `$(link): ${numTraces}$(thumbsup) ${numMissing}$(thumbsdown)`;
        DoorsSmores.app.statusBarItem.show();
        DoorsSmores.app.statusBarItem.command = {title:'Get Trace Report',command:'doors-smores.GetTraceReport',arguments:[activeDoc]};
      } else {
        DoorsSmores.app.statusBarItem.hide();
      }
    }
  }
  public static getTraceReport(document:SmoresDocument) {
    if(document) {
      document.getTraceReport();
    } else {
      if(DoorsSmores.app.activeDocument) {
        DoorsSmores.app.activeDocument.exportTraceReport();
      }
    }
  }

  private static matchProjectData(project1:ProjectInfo, project2:ProjectInfo):boolean {
    if(project1.name !== project2.name) {return false;}
    if(project1.path !== project2.path) {return false;}
    return true;
  } 

}

