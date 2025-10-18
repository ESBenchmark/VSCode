import { join, dirname } from "path";
import { existsSync } from "fs";

export function escapeCLI(param: string) {
	param = param.replaceAll('"', '\\"');
	return /[\s|]/.test(param) ? `"${param}"` : param;
}

/**
 * Find the file in the directory, recursing into the parent directory
 *  if it does not exist, until to the root.
 * 
 * @param root Topmost directory that searching can be reached.
 * @param directory Search starting directory.
 * @param path The file name to find.
 * @returns Path of the file, or null if not found.
 */
export function findUp(root: string, directory: string, path: string) {
	if (directory.length < root.length) {
		return null;
	}
	const file = join(directory, path);
	if (existsSync(file)) {
		return file;
	}
	return findUp(root, dirname(directory), path);
}
