import { platform } from "process";
import { dirname, join } from "path";
import * as vscode from "vscode";
import { escapeRegExp, escapeCLI, findUp } from "./utils";

const BIN = join("node_modules", ".bin", platform === "win32" ? "esbench.CMD" : "esbench");

const TITLE_RUN = "ESBench - run";

export class RunBenchmarkCommand implements vscode.Command {

	static ID = "esbench.run";

	readonly title = "$(run) Run Benchmark";
	readonly command = RunBenchmarkCommand.ID;
	readonly arguments: [string, string];

	constructor(filename: string, pattern: string) {
		this.arguments = [filename, pattern];
	}
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

let terminal: vscode.Terminal | undefined;

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
	const binary = findUp(root, workingDir, BIN);
	if (!binary) {
		return console.error("Can't find ESBench binary file");
	}

	const args = [binary, "--file", filename];
	if (pattern) {
		args.push("--name", `^${escapeRegExp(pattern)}$`);
	}

	// Close previous terminals ensures signalton running.
	terminal?.dispose();

	terminal = vscode.window.createTerminal({
		name: TITLE_RUN,
		cwd: workingDir,
	});
	terminal.show();
	terminal.sendText(args.map(escapeCLI).join(" "), true);
}
