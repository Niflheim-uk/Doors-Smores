import { pathspec, SimpleGitOptions, simpleGit } from 'simple-git';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { DoorsSmores } from '../doorsSmores';

var _open:boolean = false;
var _pathSpec:string = '.';
var _gitOptions: Partial<SimpleGitOptions> = {
  binary: 'git',
  maxConcurrentProcesses: 6,
  trimmed: false,
};
var _commitMessage:string = "";
var _commitTimer:NodeJS.Timeout;
export class VersionController {
  public static ready() {
    return _open;
  }
  public static close() {
    _open = false;
  }
  public static async repoExists():Promise<boolean> {
    const projDir = DoorsSmores.getProjectDirectory();
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
    _commitMessage = _commitMessage.concat(msg, '\n');
    clearTimeout(_commitTimer);
    _commitTimer = setTimeout(VersionController.actOnCommitChanges, 1000);
    console.log(msg);
  }
  private static async actOnCommitChanges() {
    const project = DoorsSmores.getActiveProject();
    if(project) {
      project.exportAll();
    }
    if(!_open || _commitMessage === "") {
      return; 
    }
    simpleGit(_gitOptions).status([pathspec(_pathSpec)]).then(result=>{
      let filesChanged:string[] = result.not_added;
      filesChanged.push(...result.created);
      filesChanged.push(...result.deleted);
      filesChanged.push(...result.modified);
      const filesToAdd = filterIgnoredFiles(filesChanged, result.ignored);
      simpleGit(_gitOptions).add(filesToAdd).commit(_commitMessage);
      _commitMessage = "";
    });
  }

  public static async initialise() {
    _open = false;
    const projectNode = DoorsSmores.getActiveProject();
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
  public static async getUserName() {
    return simpleGit(_gitOptions).raw('config', 'user.name').catch(err=>{return "Unknown";});
  }
  public static async issueProject(major:number, minor:number, message:string) {
    const project = DoorsSmores.getActiveProject();
    const issueTag = `${String(major).padStart(2, '0')}-${String(minor).padStart(2, '0')}`;
    if(project) {
      if(!_open) {
        await VersionController.makeIssueCopy(issueTag);
      } else {
        await VersionController.tagIssue(issueTag, message);
      }
    }
  }
  private static async makeIssueCopy(tag:string) {
    const srcRoot = DoorsSmores.getDataDirectory();
    const destRoot = srcRoot.concat(`_${tag}`);
    await VersionController.duplicateDirectory(srcRoot, destRoot);
  }
  private static async tagIssue(tag:string, message:string) {
    await simpleGit(_gitOptions).addAnnotatedTag(tag, message);
  }
  private static async duplicateDirectory(src:string, dest:string) {
    const srcContents = await vscode.workspace.fs.readDirectory(vscode.Uri.file(src));
    for(let i=0; i < srcContents.length; i++) {
      const [name, type] = srcContents[i];
      const srcPath = path.join(src, name);
      const destPath = path.join(dest, name);
      if (type === vscode.FileType.File) {
        vscode.workspace.fs.copy(vscode.Uri.file(srcPath),vscode.Uri.file(destPath));
      } else if (type === vscode.FileType.Directory) {
        vscode.workspace.fs.createDirectory(vscode.Uri.file(destPath));
        await VersionController.duplicateDirectory(srcPath, destPath);
      } else {
        vscode.window.showErrorMessage(`Unexpected file type found during directory duplication: ${destPath}`);
      }
    }
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
  _gitOptions.baseDir = DoorsSmores.getProjectDirectory();
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
  const projDir = DoorsSmores.getProjectDirectory();
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
  const projNode = DoorsSmores.getActiveProject();
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
