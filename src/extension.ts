import * as vscode from "vscode";
import { DebugBenchmarkCommand, RunBenchmarkCommand, startDebug, start } from "./command.js";
import CodeLensProvider from "./codelens.js";

const selectors = ["typescript", "javascript", "typescriptreact", "javascriptreact"];

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.languages.registerCodeLensProvider(selectors, new CodeLensProvider()),
		vscode.commands.registerCommand(RunBenchmarkCommand.ID, start),
		vscode.commands.registerCommand(DebugBenchmarkCommand.ID, startDebug),
	);
}
