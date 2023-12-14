import type * as ts from "typescript";
import { CodeLensProvider, TextDocument, CancellationToken, Range, CodeLens } from "vscode";

const CLIENT_MOD = "@esbench/core/client";

export default class ESBenchCodeLensProvider implements CodeLensProvider {

	private readonly typescript: typeof ts;

	constructor(typescript: typeof ts) {
		this.typescript = typescript;
	}

	provideCodeLenses(document: TextDocument, token: CancellationToken) {
		const { typescript } = this;
		
		const sourceFile = typescript.createSourceFile(
			document.fileName,
			document.getText(),
			typescript.ScriptTarget.Latest,
		);

		let hasImportDefineSuite = false;

		if (token.isCancellationRequested) {
			return;
		}
		typescript.forEachChild(sourceFile, visitor);

		return [];

		function checkImport(node: ts.ImportDeclaration) {
			if (hasImportDefineSuite) {
				return;
			}
			const { moduleSpecifier, importClause } = node;
			if (!importClause?.namedBindings) {
				return;
			}
			if ((moduleSpecifier as any).text !== CLIENT_MOD) {
				return;
			}
			const { elements } = importClause.namedBindings as ts.NamedImports;
			hasImportDefineSuite = elements.some(i => i.name.text === "defineSuite");
		}

		function checkExport({ expression }: ts.ExportAssignment) {
			if (!typescript.isCallExpression(expression)) {
				return;
			}
			if ((expression.expression as any).text !== "defineSuite") {
				return;
			}
			// run suite
			const [suite] = expression.arguments;
			if (suite) {
				typescript.forEachChild(suite, visitBenchCase);
			}
		}

		function visitBenchCase(node: ts.Node) {
			if (typescript.isCallExpression(node)) {
				const { expression, arguments: args } = node as ts.CallExpression;
				if ((expression as any).name.text === "bench") {
					if (args[0]?.kind === typescript.SyntaxKind.StringLiteral) {
						const name = (args[0] as ts.StringLiteral).text;
						// run case
					}
				}
			}
			typescript.forEachChild(node, visitBenchCase);
		}

		function visitor(node: ts.Node) {
			switch (node.kind) {
				case typescript.SyntaxKind.NamedImports:
					return checkImport(node as any);
				case typescript.SyntaxKind.ExportAssignment:
					return checkExport(node as any);
			}
		}
	}
}
