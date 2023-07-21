import * as intermediate from "@jns42/jns42-schema-intermediate-a";
import * as fs from "fs";
import { LoaderStrategyBase } from "./loader-strategy.js";

export class LoaderContext {
	private readonly rootNodeMetaMap = new Map<string, string>();
	private readonly retrievalRootNodeMap = new Map<string, URL>();
	private readonly rootNodeRetrievalMap = new Map<string, URL>();

	private strategies: Record<string, LoaderStrategyBase<unknown, unknown>> = {};

	public registerStrategy(
		metaSchemaId: string,
		strategy: LoaderStrategyBase<unknown, unknown>,
	) {
		strategy.registerContext(this);
		this.strategies[metaSchemaId] = strategy;
	}

	public getIntermediateData(): intermediate.SchemaJson {
		return {
			$schema:
				"https://schema.JsonSchema42.org/jns42-intermediate-a/schema.json",
			nodes: Object.fromEntries(this.getNodeEntries()),
		};
	}

	public *getNodeEntries(): Iterable<[string, intermediate.Node]> {
		for (const strategy of Object.values(this.strategies)) {
			yield* strategy.getNodeEntries();
		}
	}

	public async loadFromUrl(
		rootNodeUrl: URL,
		retrievalUrl: URL,
		referencingUrl: URL | null,
		defaultMetaSchemaId: string,
	) {
		const retrievalId = String(retrievalUrl);

		if (this.retrievalRootNodeMap.has(retrievalId)) {
			return;
		}

		const rootNode = await this.fetchJsonFromUrl(retrievalUrl);

		const metaSchemaId =
			this.discoverMetaSchemaId(rootNode) ?? defaultMetaSchemaId;

		const strategy = this.strategies[metaSchemaId];

		/*
		is the node valid according to schema
		*/
		if (!strategy.isRootNode(rootNode)) {
			throw new TypeError("invalid schema");
		}

		/*
		there might be an $id on the root node, that would make the node url
		different than the url we used to retrieve it
		*/
		rootNodeUrl = strategy.makeRootNodeUrl(rootNode, retrievalUrl);

		const rootNodeId = String(rootNodeUrl);

		this.retrievalRootNodeMap.set(retrievalId, rootNodeUrl);
		this.rootNodeRetrievalMap.set(rootNodeId, retrievalUrl);
		this.rootNodeMetaMap.set(rootNodeId, metaSchemaId);

		await strategy.loadDependencies(rootNode, rootNodeUrl, retrievalUrl);

		await this.loadRootNode(
			rootNode,
			rootNodeUrl,
			referencingUrl,
			defaultMetaSchemaId,
		);
	}

	public getNodeRetrievalUrl(nodeRootId: string) {
		return this.rootNodeRetrievalMap.get(nodeRootId);
	}

	public getNodeRootUrl(nodeRetrievalId: string) {
		return this.retrievalRootNodeMap.get(nodeRetrievalId);
	}

	private async loadRootNode(
		rootNode: unknown,
		rootNodeUrl: URL,
		referencingNodeUrl: URL | null,
		defaultMetaSchemaId: string,
	) {
		const metaSchemaId =
			this.discoverMetaSchemaId(rootNode) ?? defaultMetaSchemaId;

		const strategy = this.strategies[metaSchemaId];

		await strategy.loadRootNode(rootNode, rootNodeUrl, referencingNodeUrl);

		strategy.indexRootNode(rootNodeUrl);
	}

	private async fetchJsonFromUrl(url: URL): Promise<unknown> {
		switch (url.protocol) {
			case "http:":
			case "http2:": {
				const result = await fetch(url);
				const schemaRootNode = await result.json();

				return schemaRootNode;
			}

			case "file:": {
				const content = fs.readFileSync(url.pathname, "utf-8");

				const schemaRootNode = JSON.parse(content);

				return schemaRootNode;
			}
		}
	}

	private discoverMetaSchemaId(node: unknown) {
		if (node == null) {
			return null;
		}

		if (typeof node !== "object") {
			return null;
		}

		if (!("$schema" in node)) {
			return null;
		}

		if (typeof node.$schema !== "string") {
			return null;
		}

		return node.$schema;
	}
}
