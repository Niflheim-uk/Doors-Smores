import * as vscode from 'vscode';
import { SmoresDataFile } from '../model/smoresDataFile';
import { VersionController } from '../versionControl/versionController';

export async function closeProjectWorkspace() {
  SmoresDataFile.clearProjectFilepath();
  VersionController.close();
  vscode.commands.executeCommand('setContext', 'doors-smores.projectOpen', false);
  vscode.commands.executeCommand('doors-smores.Update-Views');
}