import * as vscode from 'vscode';
import {DoorsSmores} from './doorsSmores';

export var doorsSmores:DoorsSmores;
export function activate(context: vscode.ExtensionContext) {
  vscode.commands.executeCommand('setContext', 'doors-smores.projectOpen', false);
  doorsSmores = new DoorsSmores(context);
}
export function deactivate() {}
