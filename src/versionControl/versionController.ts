import { SimpleGit, SimpleGitOptions, simpleGit } from 'simple-git';
import { SmoresDataFile } from '../model/smoresDataFile';
import * as fs from 'fs';
import * as path from 'path';

export class VersionController {
  private git:SimpleGit|undefined;
  private open:boolean;

  constructor(){
    this.open = false;
  }
  public ready() {
    return this.open;
  }
  public async commitChanges(msg:string) {
    if(this.git === undefined) {
      return; 
    }
    const status = await this.git.status();
    let filesChanged:string[] = status.not_added;
    filesChanged.push(...status.created);
    filesChanged.push(...status.deleted);
    filesChanged.push(...status.modified);
    const filesToAdd = this.filterIgnoredFiles(filesChanged, status.ignored);
    await this.git.add(filesToAdd).commit(msg);
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
  public close() {
    this.git = undefined;
  }
  public async initialise() {
    const gitDir = SmoresDataFile.getProjectRoot();
    if(gitDir === undefined) {
      return;
    }
    const options: Partial<SimpleGitOptions> = {
      baseDir: gitDir,
      binary: 'git',
      maxConcurrentProcesses: 6,
      trimmed: false,
    };
    
    this.git = simpleGit(options);
    this.git.checkIsRepo()
      .then((isRepo) => {
        if(isRepo){
          this.git!.fetch({},this.onInitialFetch);
        } else {
          this.makeRepo();
        }
      });
  }
  private makeRepo() {
    if(this.git) {
      this.git.init()
      .add('./*')
      .commit('first commit!');
    }
  }
  private onInitialFetch() {
    this.updateRepo(false, "Changes found on project open");
  }
  private updateRepo(expectChange:boolean, msg:string) {
    if(this.git) {
      this.git.status().then(result => {
        if(!result.isClean()) {
          if(!expectChange) {
            console.error("Unexpected project changes found");
          }
          this.commitChanges(msg);
        }
      });
    }
  }
}
