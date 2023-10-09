import * as vscode from 'vscode';
import { SmoresEditorProvider } from './interface/smoresEditor';
import { SmoresProjectEditorProvider } from './interface/smoresProjectEditor';

export function activate(context: vscode.ExtensionContext) {
	// Register our custom editor providers
	SmoresEditorProvider.register(context);
	SmoresProjectEditorProvider.register(context);
}
