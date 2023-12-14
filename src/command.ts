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

function findUp(directory: string, path: string): string | null {
	if (directory.length < 5) {
		return null;
	}
	const file = join(directory, path);
	if (existsSync(file)) {
		return file;
	}
	return findUp(dirname(directory), path);
}

export function run(filename: string, pattern: string) {
	const directory = dirname(filename);
	
	const packageJson = findUp(directory, "package.json");
	if (!packageJson) {
		return console.error("Can't find package.json");
	}

	const workingDir = dirname(packageJson);
	const binary = findUp(workingDir, binName);
	if (!binary) {
		return console.error("Can't find ESBench bin file");
	}

	const args = [binary, "--file", filename];
	if (pattern) {
		args.push("--name", `^${pattern}$`);
	}

	const terminal = vscode.window.createTerminal({
		name: "ESBench",
		cwd: workingDir,
	});
	terminal.sendText(args.join(" "), true);
	terminal.show();
}
