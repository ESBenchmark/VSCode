import { dirname } from "path";
import * as vscode from "vscode";
import { escapeCLI, escapeRegExp, findUp } from "./utils.js";

const BIN = "node_modules/esbench/lib/host/cli.js";

const TITLE_RUN = "ESBench - run";

export class RunBenchmarkCommand implements vscode.Command {

	static ID = "esbench.run";

	readonly title = "$(run) Run";
	readonly command = RunBenchmarkCommand.ID;
	readonly arguments: [string, string];

	constructor(filename: string, pattern: string) {
		this.arguments = [filename, pattern];
	}
}

export class DebugBenchmarkCommand implements vscode.Command {

	static ID = "esbench.debug";

	readonly title = "$(debug) Debug";
	readonly command = DebugBenchmarkCommand.ID;
	readonly arguments: [string, string];

	constructor(filename: string, pattern: string) {
		this.arguments = [filename, pattern];
	}
}

function alertError(message: string) {
	vscode.window.showErrorMessage(message);
}

function getWorkspaceRoot(file: string) {
	const { workspaceFolders } = vscode.workspace;
	if (!workspaceFolders) {
		return;
	}
	return workspaceFolders.find(ws => file.startsWith(ws.uri.fsPath));
}

function getRunConfig(file: string, pattern: string) {
	const directory = dirname(file);
	const workspace = getWorkspaceRoot(file);

	if (!workspace) {
		return alertError("Can't deduce workspace to which the suite belong to");
	}

	const root = workspace.uri.fsPath;
	const packageJson = findUp(root, directory, "package.json");
	if (!packageJson) {
		return alertError("Can't find package.json");
	}

	const workingDir = dirname(packageJson);
	const cli = findUp(root, workingDir, BIN);
	if (!cli) {
		return alertError("Can't find ESBench package");
	}

	const cliArgs = [cli, "--file", file];
	if (pattern) {
		cliArgs.push("--name", `^${escapeRegExp(pattern)}$`);
	}

	return { workspace, workingDir, cliArgs };
}

let terminal: vscode.Terminal | undefined;

export function start(file: string, pattern: string) {
	const config = getRunConfig(file, pattern);

	if (!config) {
		return;
	}

	const args: string[] = ["node"];
	for (const raw of config.cliArgs) {
		args.push(escapeCLI(raw));
	}

	// Close previous terminals ensures signalton running.
	terminal?.dispose();

	terminal = vscode.window.createTerminal({
		name: TITLE_RUN,
		cwd: config.workingDir,
	});
	terminal.show();
	terminal.sendText(args.join(" "), true);
}

export function startDebug(file: string, pattern: string) {
	const config = getRunConfig(file, pattern);

	if (!config) {
		return;
	}

	// https://github.com/microsoft/vscode-js-debug/blob/main/src/configuration.ts
	const debugConfig: vscode.DebugConfiguration = {
		name: 'Debug Benchmarks',
		type: 'pwa-node',
		request: 'launch',
		runtimeArgs: config.cliArgs,
		cwd: config.workingDir,
		autoAttachChildProcesses: true,
		skipFiles: ['<node_internals>/**'],
		console: "integratedTerminal",
		internalConsoleOptions: 'neverOpen',
	}

	return vscode.debug.startDebugging(undefined, debugConfig);
}

