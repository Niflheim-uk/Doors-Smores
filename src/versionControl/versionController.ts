import { pathspec, SimpleGitOptions, simpleGit, TagResult, TaskOptions } from 'simple-git';
import * as path from 'path';
import * as vscode from 'vscode';
import { DoorsSmores } from '../doorsSmores';
import { SmoresDocument } from '../model/smoresDocument';
import { existsSync, readFileSync, writeFileSync } from 'fs';

export type DiffRecord = {
  filepath:string;
  insertions:number;
  deletions:number;
  fileModification:string;
  detail:string;
};


export class VersionController {
  private static pathSpec:string = '.';
  private static tagTag:string = "";
  private static tagMessage:string = "";
  private static commitMessage:string = "";
  private static tagTimer:NodeJS.Timeout;
  private static commitTimer:NodeJS.Timeout;
  private static syncTimer:NodeJS.Timeout;
  private static open:boolean = false;
  private static gitOptions: Partial<SimpleGitOptions> = {
    binary: 'git',
    maxConcurrentProcesses: 6,
    trimmed: false,
  };
  private static readonly firstTag:string = "start";
  private static readonly firstTagMessage:string = "DO NOT REMOVE: Used for diff";
  private static readonly syncPeriod:number = (1000 * 60 * 5);
  public static isOpen() {
    return VersionController.open;
  }
  public static close() {
    VersionController.open = false;
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
  public static async syncWithRemote() {
    clearTimeout(VersionController.syncTimer);
    const branchName = await simpleGit(VersionController.gitOptions).revparse(['--abbrev-ref', 'HEAD']);
    const remotes = await simpleGit(VersionController.gitOptions).getRemotes(true);
    if(remotes.length > 0) {
      const remoteName = remotes[0].name;
      await simpleGit(VersionController.gitOptions)
      .pull(remoteName)
      .raw('push', '--set-upstream', remoteName, branchName)
      .pushTags(remoteName);

    }
    VersionController.syncTimer = setTimeout(VersionController.syncWithRemote, VersionController.syncPeriod);
  }

  public static async commitChanges(msg:string) {
    VersionController.commitMessage = VersionController.commitMessage.concat(msg, '\n');
    clearTimeout(VersionController.commitTimer);
    VersionController.commitTimer = setTimeout(VersionController.actOnCommitChanges, 1000);
    console.log(msg);
  }
  private static async actOnCommitChanges() {
    const project = DoorsSmores.getActiveProject();
    if(project) {
      project.exportAll();
    }
    if(!VersionController.open || VersionController.commitMessage === "") {
      return; 
    }
    await simpleGit(VersionController.gitOptions).status([pathspec(VersionController.pathSpec)]).then(async result=>{
      let filesChanged:string[] = result.not_added;
      filesChanged.push(...result.created);
      filesChanged.push(...result.deleted);
      filesChanged.push(...result.modified);
      const filesToAdd = VersionController.filterIgnoredFiles(filesChanged, result.ignored);
      await simpleGit(VersionController.gitOptions).add(filesToAdd).commit(VersionController.commitMessage);
      VersionController.commitMessage = "";
      VersionController.syncWithRemote();
    });
  }

  public static async initialise() {
    VersionController.open = false;
    const projectNode = DoorsSmores.getActiveProject();
    if(projectNode === undefined || !projectNode.data.gitInUse) {
      vscode.window.showErrorMessage("Repo not in use");
      return;
    }
    VersionController.gitOptions.baseDir = projectNode.data.repoRoot;
    if(VersionController.gitOptions.baseDir && projectNode.data.repoPathspec) {
      VersionController.pathSpec = projectNode.data.repoPathspec;
      if(!await VersionController.testRepo()) {
        vscode.window.showErrorMessage(`Git repository not found.\nExpected root: ${VersionController.gitOptions.baseDir}`);
      } else {
        console.log("Opened pre-existing repo");
        VersionController.open = true;
        VersionController.syncWithRemote();
      }
    }
  }

  public static async startRepoUse() {
    if(await VersionController.repoExists()) {
      const msg = "The project resides inside a Git repository.\nWould you like to use the inherited Git repository,\nor create a separate Git repository for this\nproject?\nNote, if a separate repository is created, a\n.gitIgnore file will be created to hide the\nnested repository from the existing repository.";
      const items:vscode.MessageItem[] = [{title: "Inherited"}, {title: "New nested"}];
      vscode.window.showInformationMessage(msg, ...items).then(item=>{
        if(item && item.title === "Inherited") {
          VersionController.initExistingRepo();
        } else {
          VersionController.initNewRepo(true);
        }
      },err=>{
        console.error(err);
      });
    } else {
      VersionController.initNewRepo(false);
    }  
  }
  public static async getUserName() {
    return simpleGit(VersionController.gitOptions).raw('config', 'user.name').catch(err=>{return "Unknown";});
  }
  public static async getLastTag(document:SmoresDocument, traceReport:boolean, verify:boolean=false) {
    const lastRev = document.getLatestRevision(traceReport);
    var tr = "";
    if(traceReport) {
      tr="TR_";
    }
    const docName = document.data.text.split("\n")[0].replace(/\s/g,'_');
    const tag = `${tr}${document.data.id}_${docName}_revision_${lastRev.getIssueString()}`;
    if(VersionController.open && verify) {
      const tags:TagResult = await simpleGit(VersionController.gitOptions).tags();
      for (let i = 0; i < tags.all.length; i++) {
        const testTag = tags.all[i];
        if(testTag === tag) {
          return tag;
        }        
      }
      return VersionController.getStartTag();
    }
    return tag;
  }
  public static getLastTagDetail(document:SmoresDocument, traceReport:boolean) {
    const lastRev = document.getLatestRevision(traceReport);
    return lastRev.detail;
  }
  public static async issueDocument(document:SmoresDocument, traceReport:boolean) {
    const issueTag = await VersionController.getLastTag(document, traceReport, false);
    const detail = VersionController.getLastTagDetail(document, traceReport);
    await VersionController.tagIssue(issueTag, detail);
  }
  public static async getDiffRecords(document:SmoresDocument, traceReport:boolean) {
    const tag = await VersionController.getLastTag(document, traceReport, true);
    const [numstat, summary] = await VersionController.getIssueChanges(tag);
    var records:DiffRecord[] = [];
    if(Array.isArray(numstat) && Array.isArray(summary)) {
      for(let i=0; i<numstat.length; i++) {
        const parts = numstat[i].split("\t");
        const filepath = parts[2];
        if(filepath) {
          const mod = VersionController.getModificationState(summary, filepath);
          const record:DiffRecord= {
            filepath,
            insertions:Number(parts[0]),
            deletions:Number(parts[1]),
            fileModification:mod,
            detail:await VersionController.getDiffRecordDetail(filepath, tag, mod)
          };
          records.push(record);
        }
      }
    }
    return records;
  }


  private static getStartTag() {
    const projectName = path.basename(DoorsSmores.getProjectDirectory());
    return`${VersionController.firstTag}_${projectName.replace(/\s/g,"_")}`;
  }
  private static async makeFirstCommit(createdNewRepo:boolean) {
    const startTag = VersionController.getStartTag();
    await simpleGit(VersionController.gitOptions).add(`${VersionController.pathSpec}/*`)
    .commit('Initial commit')
    .addAnnotatedTag(startTag,VersionController.firstTagMessage).then(()=>{
      VersionController.open = true;
      if(createdNewRepo) {
        console.log("Made new project repo");
      } else {
        console.log("Started using existing repo");
      }
      VersionController.updateProjectNodeWithGitUse();
    });
  }
  private static addProjectFolderToGitIgnore() {
    if(VersionController.gitOptions.baseDir === undefined) {
      vscode.window.showErrorMessage("baseDir of git options is undefined");
      return;
    }
    const gitIgnore = path.join(VersionController.gitOptions.baseDir, "..", ".gitignore");
    var ignoreString:string = "";
    if(existsSync(gitIgnore)) {
      ignoreString = readFileSync(gitIgnore, "utf-8");
      ignoreString = ignoreString.concat("\n");
    }
    ignoreString = ignoreString.concat(`${path.basename(VersionController.gitOptions.baseDir)}`);
    writeFileSync(gitIgnore, ignoreString, {encoding:"utf-8"});
  }
  private static async initNewRepo(nested:boolean=false) {
    VersionController.gitOptions.baseDir = DoorsSmores.getProjectDirectory();
    VersionController.pathSpec = '.';
    await simpleGit(VersionController.gitOptions)
    .init().then(async()=> {
      await VersionController.makeFirstCommit(true);
    });
    if(nested) {
      VersionController.addProjectFolderToGitIgnore();
    }
  }
  private static async initExistingRepo(nested:boolean=false) {
    const projDir = DoorsSmores.getProjectDirectory();
    VersionController.gitOptions.baseDir = projDir;
    if(projDir === undefined) {
      return;
    }
    simpleGit(VersionController.gitOptions).revparse('--show-toplevel').then(async gitRoot=>{
      VersionController.gitOptions.baseDir = gitRoot;
      VersionController.pathSpec = path.relative(gitRoot, projDir);
      await VersionController.makeFirstCommit(false);
    });
  }
  private static getModificationState(summaryResponse:string[], filepath:string) {
    for(let i=0; i<summaryResponse.length; i++) {
      const entry = summaryResponse[i];
      const escaped = filepath.replace(/[.*+?^${}()|[\]\/\\]/g, '\\$&'); 
      if(entry.match(escaped)) {
        return entry.split("\t")[0];
      }
    }
    return 'Error';
  }
  private static async getIssueChanges(tag:string) {
    const numstatResponse = await simpleGit(VersionController.gitOptions).raw('diff', '--exit-code', '--no-renames', '--numstat', `${tag}..HEAD`);
    const summaryResponse = await simpleGit(VersionController.gitOptions).raw('diff', '--exit-code', '--no-renames', '--compact-summary', '--name-status', `${tag}..HEAD`);
    const numstat = numstatResponse.split("\n");
    const summary = summaryResponse.split("\n");
    return [numstat, summary];
  }
  private static async getDiffRecordDetail(filepath:string, tag:string, mod:string) {
    var detailResponse;
    detailResponse  = await simpleGit(VersionController.gitOptions).raw('diff', '--no-renames', '--exit-code', `${tag}..HEAD`, '--', filepath);
    const detailArray = VersionController.detailResponseCleanSplit(detailResponse);
    if(mod === "M") {
      detailResponse = detailArray.slice(4).join("\n");
    } else if (mod === "D" || mod === "A") {
      detailResponse = detailArray.slice(5).join("\n");
    } else {
      detailResponse = detailArray.join("\n");
    }
    return detailResponse.replace(/"/g,"&#34;");
  }
  private static detailResponseCleanSplit(response:string):string[] {
    const failedSplitPattern = "^(@@[^@]*@@)(.+)";
    var splitResponse = response.split("\n");
    for(let i=0; i<splitResponse.length; i++) {
      const matches = splitResponse[i].match(failedSplitPattern);
      if(matches !== null) {
        splitResponse.splice(i, 1, matches[1], matches[2]);
      }
    }
    return splitResponse;
  }
  private static async tagIssue(tag:string, message:string) {
    clearTimeout(VersionController.commitTimer);
    await VersionController.actOnCommitChanges();
    VersionController.tagTag = tag;
    VersionController.tagMessage = message;
    clearTimeout(VersionController.tagTimer);
    VersionController.tagTimer = setTimeout(VersionController.actOnTagIssue, 500);
    
  }
  private static async actOnTagIssue() {
    await simpleGit(VersionController.gitOptions).addAnnotatedTag(VersionController.tagTag, VersionController.tagMessage).then(
      val=>{console.log(val);},
      err=>{console.error(err);}
    );
    await VersionController.syncWithRemote();
  }
  private static async updateProjectNodeWithGitUse():Promise<void> {
    const projNode = DoorsSmores.getActiveProject();
    if(projNode === undefined) {
      return;
    }
    projNode.data.gitInUse = VersionController.open;
    if(VersionController.open) {
      projNode.data.repoPathspec = VersionController.pathSpec;
      projNode.data.repoRoot = await VersionController.getGitRoot();
    } else {
      projNode.data.repoPathspec = undefined;
      projNode.data.repoRoot = undefined;
    }
    projNode.write();
    await VersionController.commitChanges("Updated git use");
  }
  private static filterIgnoredFiles(filesChanged:string[], filesIgnored?:string[]):string[] {
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
  private static async testRepo():Promise<boolean> {
    let repoAsExpected = false;
    if(await VersionController.repoExists()) {
      if(await VersionController.getGitRoot() === VersionController.gitOptions.baseDir) {
        repoAsExpected = true;
      } 
    }    
    return repoAsExpected;
  }
  private static async getGitRoot():Promise<string> {
    const gitRoot = await simpleGit(VersionController.gitOptions).revparse('--show-toplevel');
    return gitRoot;
  }
}
  
