import * as path from "node:path";
import ts from "typescript";
import * as yargs from "yargs";
import { generatePackage } from "../generators/index.js";
import * as schemaDraft04 from "../loaders/draft-04/index.js";
import * as schemaDraft06 from "../loaders/draft-06/index.js";
import * as schemaDraft07 from "../loaders/draft-07/index.js";
import * as schema201909 from "../loaders/draft-2019-09/index.js";
import * as schema202012 from "../loaders/draft-2020-12/index.js";
import { LoaderContext } from "../loaders/index.js";
import * as schemaIntermediateA from "../loaders/intermediate-a/index.js";
import { Namer } from "../utils/index.js";

export function configurePackageProgram(argv: yargs.Argv) {
	return argv.command(
		"package [instance-schema-url]",
		"create package from instance-schema-url",
		(yargs) =>
			yargs
				.positional("instance-schema-url", {
					description: "url to download schema from",
					type: "string",
				})
				.option("default-meta-schema-url", {
					description: "the default meta schema to use",
					type: "string",
					choices: [
						schema202012.metaSchemaId,
						schema201909.metaSchemaId,
						schemaDraft07.metaSchemaId,
						schemaDraft06.metaSchemaId,
						schemaDraft04.metaSchemaId,
						schemaIntermediateA.metaSchemaId,
					] as const,
					default: schema202012.metaSchemaId,
				})
				.option("package-directory", {
					description: "where to output the package",
					type: "string",
				})
				.option("package-name", {
					description: "name of the package",
					type: "string",
				})
				.option("package-version", {
					description: "version of the package",
					type: "string",
				})
				.option("root-name-part", {
					description: "root name of the schema",
					type: "string",
					default: "schema",
				}),
		(argv) => main(argv as MainOptions),
	);
}

interface MainOptions {
	instanceSchemaUrl: string;
	defaultMetaSchemaUrl: string;
	packageDirectory: string;
	packageName: string;
	packageVersion: string;
	rootNamePart: string;
}

async function main(options: MainOptions) {
	let instanceSchemaUrl: URL;
	if (/^\w+\:\/\//.test(options.instanceSchemaUrl)) {
		instanceSchemaUrl = new URL(options.instanceSchemaUrl);
	} else {
		instanceSchemaUrl = new URL(
			"file://" + path.join(process.cwd(), options.instanceSchemaUrl),
		);
	}

	const defaultMetaSchemaId = options.defaultMetaSchemaUrl;
	const packageDirectoryPath = path.resolve(options.packageDirectory);
	const { packageName, packageVersion, rootNamePart } = options;

	const context = new LoaderContext();
	context.registerStrategy(
		schema202012.metaSchemaId,
		new schema202012.LoaderStrategy(),
	);
	context.registerStrategy(
		schema201909.metaSchemaId,
		new schema201909.LoaderStrategy(),
	);
	context.registerStrategy(
		schemaDraft07.metaSchemaId,
		new schemaDraft07.LoaderStrategy(),
	);
	context.registerStrategy(
		schemaDraft06.metaSchemaId,
		new schemaDraft06.LoaderStrategy(),
	);
	context.registerStrategy(
		schemaDraft04.metaSchemaId,
		new schemaDraft04.LoaderStrategy(),
	);
	context.registerStrategy(
		schemaIntermediateA.metaSchemaId,
		new schemaIntermediateA.LoaderStrategy(),
	);

	await context.loadFromUrl(
		instanceSchemaUrl,
		instanceSchemaUrl,
		null,
		defaultMetaSchemaId,
	);

	const intermediateData = context.getIntermediateData();

	const namer = new Namer(rootNamePart);
	for (const nodeId in intermediateData.nodes) {
		const nodeUrl = new URL(nodeId);
		const path = nodeUrl.pathname + nodeUrl.hash.replace(/^#/g, "");
		namer.registerPath(nodeId, path);
	}

	const namesData = namer.getNames();

	const factory = ts.factory;
	generatePackage(factory, intermediateData, namesData, {
		directoryPath: packageDirectoryPath,
		name: packageName,
		version: packageVersion,
	});
}
