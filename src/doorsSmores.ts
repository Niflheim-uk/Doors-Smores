import * as vscode from 'vscode';
import { SmoresEditorProvider } from './interface/smoresEditor';

export function activate(context: vscode.ExtensionContext) {
	// Register our custom editor providers
	context.subscriptions.push(SmoresEditorProvider.register(context));
}
