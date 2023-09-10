import * as vscode from 'vscode';
import { SmoresDataFile } from '../model/smoresDataFile';

export async function closeProjectWorkspace() {
  SmoresDataFile.clearProjectFilepath();
  vscode.commands.executeCommand('setContext', 'doors-smores.projectOpen', false);
}