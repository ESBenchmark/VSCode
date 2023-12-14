import * as vscode from "vscode";
import { RunBenchmarkCommand, runBenchmark } from "./command.js";
import CodeLensProvider from "./codelens.js";

const selectors = ["typescript", "javascript", "typescriptreact", "javascriptreact"];

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand(RunBenchmarkCommand.ID, runBenchmark),
		vscode.languages.registerCodeLensProvider(selectors, new CodeLensProvider()),
	);
}
