import * as vscode from 'vscode';
import { SmoresEditorProvider } from './interface/smoresEditor';
import { SmoresConverterProvider } from './converter/smoresConverter';

export function activate(context: vscode.ExtensionContext) {
	// Register our custom editor providers
	context.subscriptions.push(SmoresEditorProvider.register(context));
	context.subscriptions.push(SmoresConverterProvider.register());
}
