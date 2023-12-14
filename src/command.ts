import { platform } from "process";
import { dirname, join } from "path";
import { existsSync } from "fs";
import * as vscode from "vscode";

const binName = join("node_modules", ".bin", platform === "win32" ? "esbench.CMD" : "esbench");

export class RunBenchmarkCommand implements vscode.Command {

	static ID = "esbench.run";

	readonly title = "$(run) Run Benchmark";
	readonly command = RunBenchmarkCommand.ID;
	readonly arguments: [string, string];

	constructor(filename: string, pattern: string) {
		this.arguments = [filename, pattern];
	}
}

function findUp(root: string, directory: string, path: string): string | null {
	if (directory.length < root.length) {
		return null;
	}
	const file = join(directory, path);
	if (existsSync(file)) {
		return file;
	}
	return findUp(root, dirname(directory), path);
}

function getWorkspaceRoot(file: string) {
	const { workspaceFolders } = vscode.workspace;
	if (!workspaceFolders) {
		return;
	}
	for (const ws of workspaceFolders) {
		if (file.startsWith(ws.uri.fsPath)) {
			return ws.uri.fsPath;
		}
	}
}

const reSymbols = "\\.?*+^$[](){}|";

function escapeRegexp(pattern: string) {
	const characters = [];
	for (const c of pattern) {
		if (reSymbols.includes(c)) {
			characters.push("\\");
		}
		characters.push(c);
	}
	return characters.join("");
}

function escapeCli(param: string) {
	param = param.replaceAll('"', '\\"');
	return /[\s|]/.test(param) ? `"${param}"` : param;
}

export function run(filename: string, pattern: string) {
	const directory = dirname(filename);
	const root = getWorkspaceRoot(filename);

	if (!root) {
		return console.error("Can't deduce workspace to which the suite belong to");
	}

	const packageJson = findUp(root, directory, "package.json");
	if (!packageJson) {
		return console.error("Can't find package.json");
	}

	const workingDir = dirname(packageJson);
	const binary = findUp(root, workingDir, binName);
	if (!binary) {
		return console.error("Can't find ESBench binary file");
	}

	const args = [binary, "--file", filename];
	if (pattern) {
		args.push("--name", `^${escapeRegexp(pattern)}$`);
	}

	const terminal = vscode.window.createTerminal({
		name: "ESBench - run",
		cwd: workingDir,
	});
	terminal.show();
	terminal.sendText(args.map(escapeCli).join(" "), true);
}
