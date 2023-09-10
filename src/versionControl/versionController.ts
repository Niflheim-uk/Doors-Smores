import { pathspec, SimpleGitOptions, simpleGit } from 'simple-git';
import * as path from 'path';
import * as vscode from 'vscode';
import { DoorsSmores } from '../doorsSmores';
import { SmoresDocument } from '../model/smoresDocument';
import { existsSync } from 'fs';

export type DiffRecord = {
  filepath:string;
  insertions:number;
  deletions:number;
  fileModification:string;
  detail:string;
};


var _open:boolean = false;
var _pathSpec:string = '.';
var _gitOptions: Partial<SimpleGitOptions> = {
  binary: 'git',
  maxConcurrentProcesses: 6,
  trimmed: false,
};
var _commitMessage:string = "";
var _commitTimer:NodeJS.Timeout;
var _tagTag:string = "";
var _tagMessage:string = "";
var _tagTimer:NodeJS.Timeout;
export class VersionController {
  public static isOpen() {
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
  public static getLastTag(document:SmoresDocument, traceReport:boolean) {
    const lastRev = document.getLatestRevision(traceReport);
    var tr = "";
    if(traceReport) {
      tr="TR_";
    }
    return `${tr}${document.data.id}_${document.data.text}_revision_${lastRev.getIssueString()}`;
  }
  public static getLastTagDetail(document:SmoresDocument, traceReport:boolean) {
    const lastRev = document.getLatestRevision(traceReport);
    return lastRev.detail;
  }
  public static async issueDocument(document:SmoresDocument, traceReport:boolean) {
    const issueTag = VersionController.getLastTag(document, traceReport);
    if(!_open) {
      await document.completeDuplication(issueTag);
    } else {
      const detail = VersionController.getLastTagDetail(document, traceReport);
      await VersionController.tagIssue(issueTag, detail);
    }
  }
  public static async getDiffRecords(document:SmoresDocument, traceReport:boolean) {
    const tag = VersionController.getLastTag(document, traceReport);
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
    var numstatResponse;
    var summaryResponse;
    var numstat;
    var summary;
    if(_open) {
      numstatResponse = await simpleGit(_gitOptions).raw('diff', '--exit-code', '--no-renames', '--numstat', `${tag}..HEAD`);
      summaryResponse = await simpleGit(_gitOptions).raw('diff', '--exit-code', '--no-renames', '--compact-summary', '--name-status', `${tag}..HEAD`);
      numstat = numstatResponse.split("\n");
      summary = summaryResponse.split("\n");
    } else {
      const dataRoot = DoorsSmores.getDataDirectory();
      const tagRoot = dataRoot.concat(`_${tag}`);
      const tempRoot = DoorsSmores.getDataTempDirectory();
      numstatResponse = await simpleGit(_gitOptions).raw('diff', '--no-index', '--no-renames', '--exit-code', '--numstat', `${tagRoot}`, `${tempRoot}`);
      summaryResponse = await simpleGit(_gitOptions).raw('diff', '--no-index', '--no-renames', '--exit-code', '--compact-summary', '--name-status', `${tagRoot}`, `${tempRoot}`);
      numstat = numstatResponse.split("\n");
      summary = summaryResponse.split("\n");
      for(let i=0; i<numstat.length; i++) {
        const parts = numstat[i].split("\t");
        if(parts[2]) {
          const matchesMod = parts[2].match('[^}]*}\/(.*)');
          const matchesAddDel = parts[2].match('.*\.smoresData[^\/]*\/(.*)');
          if(matchesMod !== null) {
            numstat[i] = `${parts[0]}\t${parts[1]}\t${matchesMod[1]}`;
          } else if(matchesAddDel !== null) {
            const filepath = matchesAddDel[1].replace(" => dev/null}","").replace("}","");
            numstat[i] = `${parts[0]}\t${parts[1]}\t${filepath}`;
          }
        }
      }
      for(let i=0; i<summary.length; i++) {
        const parts = summary[i].split("\t");
        if(parts.length>1) {
          const matches = parts[parts.length-1].match('.*\.smoresData[^\/]*\/(.*)');
          if(matches !== null) {
            summary[i] = `${parts[0]}\t${matches[1]}`;
          }
        }
      }
    }
    return [numstat, summary];
  }
  private static async getDiffRecordDetail(filepath:string, tag:string, mod:string) {
    var detailResponse;
    if(_open) {
      detailResponse  = await simpleGit(_gitOptions).raw('diff', '--no-renames', '--exit-code', `${tag}..HEAD`, '--', filepath);
    } else {
      const dataDir = DoorsSmores.getDataDirectory();
      var left = path.join(dataDir.concat(`_${tag}`), filepath);
      var right = path.join(DoorsSmores.getDataTempDirectory(), filepath);
      if(!existsSync(left)) {
        left = '/dev/null';
      }
      if(!existsSync(right)) {
        right = '/dev/null';
      }
      detailResponse  = await simpleGit(_gitOptions).raw('diff', '--no-index', '--no-renames', '--exit-code', `${left}`, `${right}`);
    }
    const detailArray = detailResponse.split("\n");
    if(mod === "M") {
      detailResponse = detailArray.slice(4).join("\n");
    } else if (mod === "D" || mod === "A") {
      detailResponse = detailArray.slice(5).join("\n");
    } else {
      detailResponse = detailArray.join("\n");
    }
    return detailResponse.replace(/"/g,"&#34;");
  }
  private static async tagIssue(tag:string, message:string) {
    clearTimeout(_commitTimer);
    await VersionController.actOnCommitChanges();
    _tagTag = tag;
    _tagMessage = message;
    clearTimeout(_tagTimer);
    _tagTimer = setTimeout(VersionController.actOnTagIssue, 500);
    
  }
  private static async actOnTagIssue() {
    await simpleGit(_gitOptions).addAnnotatedTag(_tagTag, _tagMessage);
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
