import type TypeScript from "typescript";
import type { Node, ImportDeclaration, ExportAssignment, NamedImports } from "typescript";
import { env, CodeLensProvider, TextDocument, CancellationToken, Range, CodeLens } from "vscode";
import { RunBenchmarkCommand } from "./command.js";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ts: typeof TypeScript = require(`${env.appRoot}/extensions/node_modules/typescript/lib/typescript.js`);

const CLIENT_MOD = "@esbench/core/client";

export class BenchmarkVisitor {

	matches: Array<[Node, string]> = [];

	isSuiteFile = false;

	constructor() {
		this.visit = this.visit.bind(this);
		this.visitBenchCase = this.visitBenchCase.bind(this);
	}

	/**
	 * find benchmarks in top-level nodes.
	 *
	 * @example
	 * sourceFile.forEachChild(visitor.visit);
	 */
	visit(node: Node) {
		if (ts.isImportDeclaration(node)) {
			return this.checkImport(node);
		}
		if (ts.isExportAssignment(node)) {
			return this.visitExport(node);
		}
	}

	/**
	 * Check the file has <code>import { defineSuite } from "@esbench/core/client"</code>
	 */
	private checkImport(node: ImportDeclaration) {
		if (this.isSuiteFile) {
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
		this.isSuiteFile = elements.some(i => i.name.text === "defineSuite");
	}

	private visitExport({ expression }: ExportAssignment) {
		if (!ts.isCallExpression(expression)) {
			return;
		}
		const id = expression.expression;
		if (!ts.isIdentifier(id) || id.text !== "defineSuite") {
			return;
		}
		this.matches.push([expression, ""]);
		expression.arguments[0]?.forEachChild(this.visitBenchCase);
	}

	private visitBenchCase(node: Node) {
		if (ts.isCallExpression(node)) {
			const { expression, arguments: args } = node;
			const [name] = args;
			if (
				ts.isPropertyAccessExpression(expression) &&
				expression.name.text === "bench" &&
				ts.isStringLiteral(name)
			) {
				this.matches.push([node, name.text]);
			}
		}
		node.forEachChild(this.visitBenchCase);
	}
}

export default class ESBenchCodeLensProvider implements CodeLensProvider {

	provideCodeLenses(document: TextDocument, token: CancellationToken) {
		const sourceFile = ts.createSourceFile(
			document.fileName,
			document.getText(),
			ts.ScriptTarget.Latest,
		);

		if (token.isCancellationRequested) {
			return;
		}
		const visitor = new BenchmarkVisitor();
		sourceFile.forEachChild(visitor.visit);

		if (!visitor.isSuiteFile) {
			return;
		}
		return visitor.matches.map(([node, name]) => {
			const start = document.positionAt(node.getStart(sourceFile));
			const end = document.positionAt(node.getEnd());
			const command = new RunBenchmarkCommand(document.fileName, name);
			return new CodeLens(new Range(start, end), command);
		});
	}
}
