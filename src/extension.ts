import { pathToFileURL } from "node:url";
import * as vscode from "vscode";
import CodeLensProvider from "./codelens.js";

const selectors = ["typescript", "javascript", "typescriptreact", "javascriptreact"];

export async function activate(context: vscode.ExtensionContext) {
	const tsPath = `${vscode.env.appRoot}/extensions/node_modules/typescript/lib/typescript.js`;
	const ts = await import(pathToFileURL(tsPath).toString());

	context.subscriptions.push(
		vscode.languages.registerCodeLensProvider(selectors, new CodeLensProvider(ts.default)),
	);
}
