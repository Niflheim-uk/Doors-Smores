import { pathspec, SimpleGitOptions, simpleGit } from 'simple-git';
import { SmoresDataFile } from '../model/smoresDataFile';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { SmoresProject, getProject } from '../model/smoresProject';

export class VersionController {
  private open:boolean;
  private pathSpec:string;
  private gitOptions: Partial<SimpleGitOptions> = {
    binary: 'git',
    maxConcurrentProcesses: 6,
    trimmed: false,
  };

  constructor(){
    this.open = false;
    this.pathSpec = '.';
  }
  public ready() {
    return this.open;
  }
  public close() {
    this.open = false;
  }
  public async repoExists():Promise<boolean> {
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

  public async commitChanges(msg:string) {
    if(!this.open) {
      return; 
    }
    simpleGit(this.gitOptions).status([pathspec(this.pathSpec)]).then(result=>{
      let filesChanged:string[] = result.not_added;
      filesChanged.push(...result.created);
      filesChanged.push(...result.deleted);
      filesChanged.push(...result.modified);
      const filesToAdd = this.filterIgnoredFiles(filesChanged, result.ignored);
      simpleGit(this.gitOptions).add(filesToAdd).commit(msg);
    });
  }

  public async initialise() {
    const projectNode = getProject();
    if(projectNode === undefined || !projectNode.data.gitInUse) {
      console.log("Repo not in use");
      return;
    }
    this.gitOptions.baseDir = projectNode.data.repoRoot;
    if(this.gitOptions.baseDir && projectNode.data.repoPathspec) {
      this.pathSpec = projectNode.data.repoPathspec;
      if(!await this.testRepo()) {
        vscode.window.showErrorMessage(`Git repository not found.\nExpected root: ${this.gitOptions.baseDir}`);
      } else {
        console.log("Opened pre-existing repo");
        this.open = true;
      }
    }
  }
  public queryStartRepoUse() {
    const msg = "Would you like to initialise a Git repository for version control?";
    const items:vscode.MessageItem[] = [{title: "Yes"}, {title: "No"}];
    vscode.window.showInformationMessage(msg,...items).then(item=>{
      if(item) {
        if(item.title === "Yes") {
          this.makeRepo();
        }
      }
    },err=>{
      console.error(err);
    });
  }
  public queryExistingRepoUse() {
    const msg = "The project resides inside a Git repository.\nWould you like to auto-commit changes within the active Doors Smores project folder?";
    const items:vscode.MessageItem[] = [{title: "Yes"}, {title: "No"}];
    vscode.window.showInformationMessage(msg,...items).then(item=>{
      if(item && item.title === "Yes") {
          this.startRepoUse();
      }
    },err=>{
      console.error(err);
    });

  }


  
  private filterIgnoredFiles(filesChanged:string[], filesIgnored?:string[]):string[] {
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
  private makeRepo() {
    this.gitOptions.baseDir = SmoresDataFile.getProjectRoot();
    this.pathSpec = '.';
    simpleGit(this.gitOptions)
    .init()
    .add(`${this.pathSpec}/*`)
    .commit('Initial commit').then(()=>{
      this.open = true;
      console.log("Made new project repo");
      this.updateProjectNodeWithGitUse();
    });
  }
  private startRepoUse():void {
    const projDir = SmoresDataFile.getProjectRoot();
    this.gitOptions.baseDir = projDir;
    if(projDir === undefined) {
      return;
    }
    simpleGit(this.gitOptions).revparse('--show-toplevel').then(gitRoot=>{
      this.gitOptions.baseDir = gitRoot;
      this.pathSpec = path.relative(gitRoot, projDir);
      simpleGit(this.gitOptions).add(`${this.pathSpec}/*`)
      .commit('Initial commit of Doors Smores project').then(()=>{
        this.open = true;
        console.log("Started using existing repo");
        this.updateProjectNodeWithGitUse();
      });
    });
  }
  private async updateProjectNodeWithGitUse():Promise<void> {
    const projNode = getProject();
    if(projNode === undefined) {
      return;
    }
    projNode.data.gitInUse = this.open;
    if(this.open) {
      projNode.data.repoPathspec = this.pathSpec;
      projNode.data.repoRoot = await this.getGitRoot();
    } else {
      projNode.data.repoPathspec = undefined;
      projNode.data.repoRoot = undefined;
    }
    projNode.write();
    await this.commitChanges("Updated git use");
  }
  private async testRepo():Promise<boolean> {
    let repoAsExpected = false;
    if(await this.repoExists()) {
      if(await this.getGitRoot() === this.gitOptions.baseDir) {
        repoAsExpected = true;
      } 
    }    
    return repoAsExpected;
  }
  private async getGitRoot():Promise<string> {
    const gitRoot = await simpleGit(this.gitOptions).revparse('--show-toplevel');
    return gitRoot;
  }
}
