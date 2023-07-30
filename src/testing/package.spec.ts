import camelcase from "camelcase";
import cp from "child_process";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import ts from "typescript";
import * as schemaDraft04 from "../documents/draft-04/index.js";
import * as schemaDraft06 from "../documents/draft-06/index.js";
import * as schemaDraft07 from "../documents/draft-07/index.js";
import * as schema201909 from "../documents/draft-2019-09/index.js";
import * as schema202012 from "../documents/draft-2020-12/index.js";
import { DocumentContext } from "../documents/index.js";
import * as schemaIntermediateA from "../documents/intermediate-a/index.js";
import { generatePackage } from "../generators/index.js";
import { Namer, projectRoot } from "../utils/index.js";

const packageNames = [
	"string-or-boolean",
	"simple-object",
	"array-with-ref",
	"all-of-object",
	"any-of-object",
	"one-of-object",
];

const schemaNames = [
	"jns42-intermediate-a",
	"draft-2020-12",
	"draft-2019-09",
	"draft-07",
	"draft-06",
	"draft-04",
];

await test("testing package", async () => {
	for (const schemaName of schemaNames) {
		await test(schemaName, async () => {
			for (const packageName of packageNames) {
				await test(packageName, async () => {
					await runTest(schemaName, packageName);
				});
			}
		});
	}
});

async function runTest(schemaName: string, packageName: string) {
	const packageDirectoryPath = path.join(
		projectRoot,
		".package",
		"testing",
		schemaName,
		packageName,
	);
	const schemaPath = path.join(
		projectRoot,
		"fixtures",
		"testing",
		"schema",
		schemaName,
		`${packageName}.json`,
	);
	const schemaUrl = new URL(`file://${schemaPath}`);

	if (!fs.existsSync(schemaPath)) {
		return;
	}

	await test("generate package", async () => {
		const context = new DocumentContext();
		context.registerFactory(
			schema202012.metaSchemaId,
			({ givenUrl, antecedentUrl, documentNode: rootNode }) =>
				new schema202012.Document(givenUrl, antecedentUrl, rootNode, context),
		);
		context.registerFactory(
			schema201909.metaSchemaId,
			({ givenUrl, antecedentUrl, documentNode: rootNode }) =>
				new schema201909.Document(givenUrl, antecedentUrl, rootNode, context),
		);
		context.registerFactory(
			schemaDraft07.metaSchemaId,
			({ givenUrl, antecedentUrl, documentNode: rootNode }) =>
				new schemaDraft07.Document(givenUrl, antecedentUrl, rootNode, context),
		);
		context.registerFactory(
			schemaDraft06.metaSchemaId,
			({ givenUrl, antecedentUrl, documentNode: rootNode }) =>
				new schemaDraft06.Document(givenUrl, antecedentUrl, rootNode, context),
		);
		context.registerFactory(
			schemaDraft04.metaSchemaId,
			({ givenUrl, antecedentUrl, documentNode: rootNode }) =>
				new schemaDraft04.Document(givenUrl, antecedentUrl, rootNode, context),
		);
		context.registerFactory(
			schemaIntermediateA.metaSchemaId,
			({ givenUrl, documentNode: rootNode }) =>
				new schemaIntermediateA.Document(givenUrl, rootNode),
		);

		await context.loadFromUrl(
			schemaUrl,
			schemaUrl,
			null,
			schema202012.metaSchemaId,
		);

		const intermediateData = context.getIntermediateData();

		const namer = new Namer("schema");
		for (const nodeId in intermediateData.nodes) {
			const nodeUrl = new URL(nodeId);
			const path = nodeUrl.pathname + nodeUrl.hash.replace(/^#/g, "");
			namer.registerPath(nodeId, path);
		}

		const names = namer.getNames();

		const factory = ts.factory;
		generatePackage(factory, intermediateData, names, {
			directoryPath: packageDirectoryPath,
			name: packageName,
			version: "v0.0.0",
		});
	});

	await test("install package", () => {
		cp.execSync("npm install", {
			cwd: packageDirectoryPath,
			env: process.env,
		});
	});

	await test("test package", () => {
		cp.execSync("test package", {
			cwd: packageDirectoryPath,
			env: process.env,
		});
	});

	const rootTypeName = camelcase(`${packageName}.json`, { pascalCase: true });

	const validDirectory = path.join(
		projectRoot,
		"fixtures",
		"testing",
		"valid",
		packageName,
	);
	if (fs.existsSync(validDirectory)) {
		await test("valid", async () => {
			const validFiles = fs
				.readdirSync(validDirectory)
				.filter((file) => /\.json$/.test(file));

			for (const validFile of validFiles) {
				await test(validFile, async () => {
					const packageMain = await import(
						path.join(packageDirectoryPath, "main.js")
					);

					const data = fs.readFileSync(
						path.join(validDirectory, validFile),
						"utf-8",
					);
					const instance = JSON.parse(data);
					assert.equal(packageMain[`is${rootTypeName}`](instance), true);
				});
			}
		});
	}

	const invalidDirectory = path.join(
		projectRoot,
		"fixtures",
		"testing",
		"invalid",
		packageName,
	);
	if (fs.existsSync(invalidDirectory)) {
		await test("invalid", async () => {
			const invalidFiles = fs
				.readdirSync(invalidDirectory)
				.filter((file) => /\.json$/.test(file));

			for (const invalidFile of invalidFiles) {
				await test(invalidFile, async () => {
					const packageMain = await import(
						path.join(packageDirectoryPath, "main.js")
					);

					const data = fs.readFileSync(
						path.join(invalidDirectory, invalidFile),
						"utf-8",
					);
					const instance = JSON.parse(data);
					assert.equal(packageMain[`is${rootTypeName}`](instance), false);
				});
			}
		});
	}
}
