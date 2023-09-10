import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { SmoresDataFile } from '../model/smoresDataFile';
import { SmoresProject } from '../model/smoresProject';
import { getWorkspaceRoot } from '../utils/getWorkspaceRoot';
import { VersionController } from '../versionControl/versionController';
import { ProjectManagement } from './projectManagement';

async function getProjectName():Promise<string|undefined> {
  return await vscode.window.showInputBox({
    prompt:"Enter project name",
    placeHolder:"Project name"
  });
}
async function getProjectParent():Promise<string|undefined> {
  const workspaceRoot = getWorkspaceRoot();
  if(workspaceRoot === undefined) {
    return undefined;
  }
  const uri = await vscode.window.showOpenDialog({
    canSelectMany:false,
    /* eslint-disable  @typescript-eslint/naming-convention */
    openLabel:"Select root directory",
    canSelectFolders:true,
    canSelectFiles:false,
    defaultUri:vscode.Uri.file(workspaceRoot)
  });
  if(uri) {
    return uri[0].fsPath;
  }
  return undefined;  
}
function isNewProjectUnique(parentPath:string, projName:string) {
  const desiredPath = path.join(parentPath, projName);
  return !fs.existsSync(desiredPath);
}
function createNewWorkspace(parentPath:string, projName:string) {
  const desiredPath = path.join(parentPath, projName);
  fs.mkdirSync(desiredPath, {recursive:true});
  const projPath = path.join(desiredPath, `${projName}.smores-project`);
  SmoresDataFile.setProjectFilepath(projPath);
  return new SmoresProject(projPath);
}
async function newProjectWorkspace():Promise<boolean> {
  const projName = await getProjectName();
  if(projName === undefined) {
    return false;
  }
  const projParentPath = await getProjectParent();
  if(projParentPath === undefined) {
    return false;
  }
  if(isNewProjectUnique(projParentPath, projName) === false) {
    vscode.window.showErrorMessage("A folder already exists at that location");
    return false;
  }
  createNewWorkspace(projParentPath, projName);
  vscode.commands.executeCommand('setContext', 'doors-smores.projectOpen', true);
  return true;
}

export async function newProject() {
  console.log('ffs');
  if(await newProjectWorkspace()) {
    if(await VersionController.repoExists()) {
      VersionController.queryExistingRepoUse();
    } else {
      VersionController.queryStartRepoUse();
      }
    }
    vscode.commands.executeCommand('doors-smores.Update-Views');
  }