import { pathspec, SimpleGitOptions, simpleGit } from 'simple-git';
import { SmoresDataFile } from '../model/smoresDataFile';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { SmoresProject, getProject } from '../model/smoresProject';

var _open:boolean = false;
var _pathSpec:string = '.';
var _gitOptions: Partial<SimpleGitOptions> = {
  binary: 'git',
  maxConcurrentProcesses: 6,
  trimmed: false,
};

export class VersionController {
  public static ready() {
    return _open;
  }
  public static close() {
    _open = false;
  }
  public static async repoExists():Promise<boolean> {
    const projDir = SmoresDataFile.getProjectRoot();
    const options: Partial<SimpleGitOptions> = {
      binary: 'git',
      maxConcurrentProcesses:6,
      trimmed: false,
      baseDir:projDir
    };
    let repoExists = false;
    await simpleGit(options).checkIsRepo().then(result=> {
      if(result) {
        repoExists = true;
      }
    });
    return repoExists;
  }

  public static async commitChanges(msg:string) {
    if(!_open) {
      return; 
    }
    simpleGit(_gitOptions).status([pathspec(_pathSpec)]).then(result=>{
      let filesChanged:string[] = result.not_added;
      filesChanged.push(...result.created);
      filesChanged.push(...result.deleted);
      filesChanged.push(...result.modified);
      const filesToAdd = filterIgnoredFiles(filesChanged, result.ignored);
      simpleGit(_gitOptions).add(filesToAdd).commit(msg);
    });
  }

  public static async initialise() {
    const projectNode = getProject();
    if(projectNode === undefined || !projectNode.data.gitInUse) {
      console.log("Repo not in use");
      return;
    }
    _gitOptions.baseDir = projectNode.data.repoRoot;
    if(_gitOptions.baseDir && projectNode.data.repoPathspec) {
      _pathSpec = projectNode.data.repoPathspec;
      if(!await testRepo()) {
        vscode.window.showErrorMessage(`Git repository not found.\nExpected root: ${_gitOptions.baseDir}`);
      } else {
        console.log("Opened pre-existing repo");
        _open = true;
      }
    }
  }
  public static queryStartRepoUse() {
    const msg = "Would you like to initialise a Git repository for version control?";
    const items:vscode.MessageItem[] = [{title: "Yes"}, {title: "No"}];
    vscode.window.showInformationMessage(msg,...items).then(item=>{
      if(item) {
        if(item.title === "Yes") {
          makeRepo();
        }
      }
    },err=>{
      console.error(err);
    });
  }
  public static queryExistingRepoUse() {
    const msg = "The project resides inside a Git repository.\nWould you like to auto-commit changes within the active Doors Smores project folder?";
    const items:vscode.MessageItem[] = [{title: "Yes"}, {title: "No"}];
    vscode.window.showInformationMessage(msg,...items).then(item=>{
      if(item && item.title === "Yes") {
        startRepoUse();
      }
    },err=>{
      console.error(err);
    });
  }
}
  
function filterIgnoredFiles(filesChanged:string[], filesIgnored?:string[]):string[] {
  var filteredFiles:string[]|undefined;
  if(filesIgnored) {
    filesChanged.forEach(file => {
      const filePos = filesIgnored.findIndex(ignored => file === ignored);
      if(filePos === -1) /* not found */ {
        if(Array.isArray(filteredFiles)) {
          filteredFiles.push(file);
        } else {
          filteredFiles = [file];
        }
      }
    });
  } else {
    filteredFiles = filesChanged;
  }
  if(filteredFiles) {
    return filteredFiles;
  } else {
    return [];
  }
}
function makeRepo() {
  _gitOptions.baseDir = SmoresDataFile.getProjectRoot();
  _pathSpec = '.';
  simpleGit(_gitOptions)
  .init()
  .add(`${_pathSpec}/*`)
  .commit('Initial commit').then(()=>{
    _open = true;
    console.log("Made new project repo");
    updateProjectNodeWithGitUse();
  });
}
function startRepoUse():void {
  const projDir = SmoresDataFile.getProjectRoot();
  _gitOptions.baseDir = projDir;
  if(projDir === undefined) {
    return;
  }
  simpleGit(_gitOptions).revparse('--show-toplevel').then(gitRoot=>{
    _gitOptions.baseDir = gitRoot;
    _pathSpec = path.relative(gitRoot, projDir);
    simpleGit(_gitOptions).add(`${_pathSpec}/*`)
    .commit('Initial commit of Doors Smores project').then(()=>{
      _open = true;
      console.log("Started using existing repo");
      updateProjectNodeWithGitUse();
    });
  });
}
async function updateProjectNodeWithGitUse():Promise<void> {
  const projNode = getProject();
  if(projNode === undefined) {
    return;
  }
  projNode.data.gitInUse = _open;
  if(_open) {
    projNode.data.repoPathspec = _pathSpec;
    projNode.data.repoRoot = await getGitRoot();
  } else {
    projNode.data.repoPathspec = undefined;
    projNode.data.repoRoot = undefined;
  }
  projNode.write();
  await VersionController.commitChanges("Updated git use");
}
async function testRepo():Promise<boolean> {
  let repoAsExpected = false;
  if(await VersionController.repoExists()) {
    if(await getGitRoot() === _gitOptions.baseDir) {
      repoAsExpected = true;
    } 
  }    
  return repoAsExpected;
}
async function getGitRoot():Promise<string> {
  const gitRoot = await simpleGit(_gitOptions).revparse('--show-toplevel');
  return gitRoot;
}
