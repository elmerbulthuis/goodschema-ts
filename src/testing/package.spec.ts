import camelcase from "camelcase";
import cp from "child_process";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import ts from "typescript";
import { generatePackage } from "../generators/index.js";
import * as schemaDraft04 from "../strategies/draft-04/index.js";
import * as schemaDraft06 from "../strategies/draft-06/index.js";
import * as schemaDraft07 from "../strategies/draft-07/index.js";
import * as schema201909 from "../strategies/draft-2019-09/index.js";
import * as schema202012 from "../strategies/draft-2020-12/index.js";
import { GeneratorContext } from "../strategies/index.js";
import * as schemaIntermediateA from "../strategies/intermediate-a/index.js";
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
		packageName
	);
	const schemaPath = path.join(
		projectRoot,
		"fixtures",
		"testing",
		"schema",
		schemaName,
		`${packageName}.json`
	);
	const schemaUrl = new URL(`file://${schemaPath}`);

	if (!fs.existsSync(schemaPath)) {
		return;
	}

	await test("generate package", async () => {
		const context = new GeneratorContext();
		context.registerStrategy(
			schema202012.metaSchemaId,
			new schema202012.GeneratorStrategy()
		);
		context.registerStrategy(
			schema201909.metaSchemaId,
			new schema201909.GeneratorStrategy()
		);
		context.registerStrategy(
			schemaDraft07.metaSchemaId,
			new schemaDraft07.GeneratorStrategy()
		);
		context.registerStrategy(
			schemaDraft06.metaSchemaId,
			new schemaDraft06.GeneratorStrategy()
		);
		context.registerStrategy(
			schemaDraft04.metaSchemaId,
			new schemaDraft04.GeneratorStrategy()
		);
		context.registerStrategy(
			schemaIntermediateA.metaSchemaId,
			new schemaIntermediateA.GeneratorStrategy()
		);

		await context.loadFromUrl(
			schemaUrl,
			schemaUrl,
			null,
			schema202012.metaSchemaId
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
		packageName
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
						"utf-8"
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
		packageName
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
						"utf-8"
					);
					const instance = JSON.parse(data);
					assert.equal(packageMain[`is${rootTypeName}`](instance), false);
				});
			}
		});
	}
}
