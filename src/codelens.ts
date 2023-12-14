import type * as TypeScript from "typescript";
import type { Node, ImportDeclaration, ExportAssignment, NamedImports } from "typescript";
import { env, CodeLensProvider, TextDocument, CancellationToken, Range, CodeLens } from "vscode";
import { RunBenchmarkCommand } from "./command.js";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ts: typeof TypeScript = require(`${env.appRoot}/extensions/node_modules/typescript/lib/typescript.js`);

const CLIENT_MOD = "@esbench/core/client";

export default class ESBenchCodeLensProvider implements CodeLensProvider {

	provideCodeLenses(document: TextDocument, token: CancellationToken) {
		const sourceFile = ts.createSourceFile(
			document.fileName,
			document.getText(),
			ts.ScriptTarget.Latest,
		);

		let hasImportDefineSuite = false;
		const runNodes: Node[] = [];

		if (token.isCancellationRequested) {
			return;
		}
		sourceFile.forEachChild(visitor);

		return runNodes.map(node => {
			const start = document.positionAt(node.getStart(sourceFile));
			const end = document.positionAt(node.getEnd());
			const command = new RunBenchmarkCommand(document.fileName, "");
			return new CodeLens(new Range(start, end), command);
		});

		function checkImport(node: ImportDeclaration) {
			if (hasImportDefineSuite) {
				return;
			}
			const { moduleSpecifier, importClause } = node;
			if (!importClause?.namedBindings) {
				return;
			}
			if (!ts.isStringLiteral(moduleSpecifier)) {
				return;
			}
			if (moduleSpecifier.text !== CLIENT_MOD) {
				return;
			}
			const { elements } = importClause.namedBindings as NamedImports;
			hasImportDefineSuite = elements.some(i => i.name.text === "defineSuite");
		}

		function checkExport({ expression }: ExportAssignment) {
			if (!ts.isCallExpression(expression)) {
				return;
			}
			const id = expression.expression;
			if (!ts.isIdentifier(id) || id.text !== "defineSuite") {
				return;
			}
			runNodes.push(expression);
			expression.arguments[0]?.forEachChild(visitBenchCase);
		}

		function visitBenchCase(node: Node) {
			if (ts.isCallExpression(node)) {
				const { expression, arguments: args } = node;
				const [name] = args;
				if ((expression as any).name.text === "bench") {
					if (ts.isStringLiteral(name)) {
						runNodes.push(node);
					}
				}
			}
			ts.forEachChild(node, visitBenchCase);
		}

		function visitor(node: Node) {
			if (ts.isImportDeclaration(node)) {
				return checkImport(node);
			}
			if (ts.isExportAssignment(node)) {
				return checkExport(node);
			}
		}
	}
}
