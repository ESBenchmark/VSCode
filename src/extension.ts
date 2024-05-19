import * as vscode from "vscode";
import { DebugBenchmarkCommand, RunBenchmarkCommand, debug, run } from "./command.js";
import CodeLensProvider from "./codelens.js";

const selectors = ["typescript", "javascript", "typescriptreact", "javascriptreact"];

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand(RunBenchmarkCommand.ID, run),
		vscode.commands.registerCommand(DebugBenchmarkCommand.ID, debug),
		vscode.languages.registerCodeLensProvider(selectors, new CodeLensProvider()),
	);
}
