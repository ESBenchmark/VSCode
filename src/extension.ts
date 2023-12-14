import * as vscode from "vscode";
import { RunBenchmarkCommand, run } from "./command.js";
import CodeLensProvider from "./codelens.js";

const selectors = ["typescript", "javascript", "typescriptreact", "javascriptreact"];

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand(RunBenchmarkCommand.ID, run),
		vscode.languages.registerCodeLensProvider(selectors, new CodeLensProvider()),
	);
}
