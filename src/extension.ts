import * as vscode from "vscode";
import CodeLensProvider from "./codelens.js";

const selectors = ["typescript", "javascript", "typescriptreact", "javascriptreact"];

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.languages.registerCodeLensProvider(selectors, new CodeLensProvider()),
	);
}
