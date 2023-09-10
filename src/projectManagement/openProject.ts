import * as vscode from 'vscode';
import { SmoresDataFile } from '../model/smoresDataFile';
import { VersionController } from '../versionControl/versionController';
import { SmoresProject, getProject } from '../model/smoresProject';
import { ProjectManagement, ProjectData } from './projectManagement';
import { basename } from 'path';

async function getProjectWorkspace():Promise<string|undefined> {
  const uri = await vscode.window.showOpenDialog({
    canSelectMany:false,
    /* eslint-disable  @typescript-eslint/naming-convention */
    filters:{'Smores Project':['smores-project']},
    openLabel:"Select Smores Project File"
  });
  if(uri && basename(uri[0].fsPath).match(".smores-project")) {
    SmoresDataFile.setProjectFilepath(uri[0].fsPath);
    vscode.commands.executeCommand('setContext', 'doors-smores.projectOpen', true);
    return uri[0].fsPath;
  }
  return undefined;
}
export function parseIntoProjectData(project:SmoresProject|undefined):ProjectData {
  if(project) {
    const name = basename(project.filePath.toString(), '.smores-project');
    const path = project.filePath.toString();
    const recentProject:ProjectData = {name, path};
    return recentProject;
  } else {
    return {name:"",path:""};
  }
}
export function matchProjectData(project1:ProjectData, project2:ProjectData):boolean {
  if(project1.name !== project2.name) {
    return false;
  }
  if(project1.path !== project2.path) {
    return false;
  }
  return true;
}
function removeEntryIfPresent(test:ProjectData, array:ProjectData[]) {
  for(let i=0; i<array.length; i++) {
    const entry = array[i];
    if(matchProjectData(test, entry)) {
      array.splice(i,1);
      return array;
    }
  }
  return array;
}

function updateRecentProjects() {
  const project = getProject();
  if(project) {
    const currentProject = parseIntoProjectData(project);
		var recentProjects = ProjectManagement.getRecentProjects();
    if(Array.isArray(recentProjects)) {
      recentProjects = removeEntryIfPresent(currentProject, recentProjects); // ensures this project is first
      recentProjects = [currentProject, ...recentProjects];
    } else {
      recentProjects = [currentProject];
    }
    ProjectManagement.updateRecentProjects(recentProjects);
  }
}
export function setActiveProject(projectFilepath:string) {
  if(projectFilepath) {
    SmoresDataFile.setProjectFilepath(projectFilepath);
    vscode.commands.executeCommand('setContext', 'doors-smores.projectOpen', true);
    updateRecentProjects();
    VersionController.initialise();
    vscode.commands.executeCommand('doors-smores.Update-Views');
  }
}
export async function openProject() {
  const projectFilepath = await getProjectWorkspace();
  if(projectFilepath) {
    setActiveProject(projectFilepath);
  }
}