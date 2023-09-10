import * as vscode from 'vscode';
import * as path from 'path';
import { SmoresDataFile } from '../model/smoresDataFile';

export async function openProjectWorkspace() {
  const uri = await vscode.window.showOpenDialog({
    canSelectMany:false,
    /* eslint-disable  @typescript-eslint/naming-convention */
    filters:{'Smores Project':['smores-project']},
    openLabel:"Select Smores Project File"
  });
  if(uri && path.basename(uri[0].fsPath).match(".smores-project")) {
    SmoresDataFile.setProjectFilepath(uri[0].fsPath);
    vscode.commands.executeCommand('setContext', 'doors-smores.projectOpen', true);
  }
}