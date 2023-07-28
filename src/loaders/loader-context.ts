import * as intermediate from "@jns42/jns42-schema-intermediate-a";
import { discoverMetaSchemaId, loadJSON } from "../utils/index.js";
import { LoaderStrategyBase } from "./loader-strategy.js";

interface FetchCommand {
	rootNodeUrl: URL;
	retrievalUrl: URL;
	referencingUrl: URL | null;
	defaultMetaSchemaId: string;
}

export class LoaderContext {
	private readonly fetchCommandQueue = new Array<FetchCommand>();
	private readonly fetchCommandDone = new Set<string>();
	private processFetchCommandQueuePromise: Promise<void> | null = null;

	private readonly retrievalPairs = new Array<readonly [URL, URL]>();

	private strategies: Record<string, LoaderStrategyBase<unknown, unknown>> = {};

	public registerStrategy(
		metaSchemaId: string,
		strategy: LoaderStrategyBase<unknown, unknown>,
	) {
		this.strategies[metaSchemaId] = strategy;
	}

	public getIntermediateData(): intermediate.SchemaJson {
		return {
			$schema:
				"https://schema.JsonSchema42.org/jns42-intermediate-a/schema.json",
			nodes: Object.fromEntries(this.getNodeEntries()),
		};
	}

	public *getNodeEntries(): Iterable<readonly [string, intermediate.Node]> {
		for (const strategy of Object.values(this.strategies)) {
			yield* strategy.getNodeEntries(this.retrievalPairs);
		}
	}

	public async loadFromUrl(
		rootNodeUrl: URL,
		retrievalUrl: URL,
		referencingUrl: URL | null,
		defaultMetaSchemaId: string,
	) {
		this.scheduleLoadFromUrl(
			rootNodeUrl,
			retrievalUrl,
			referencingUrl,
			defaultMetaSchemaId,
		);
		await this.processFetchCommandQueuePromise;
	}

	public scheduleLoadFromUrl(
		rootNodeUrl: URL,
		retrievalUrl: URL,
		referencingUrl: URL | null,
		defaultMetaSchemaId: string,
	) {
		this.fetchCommandQueue.push({
			rootNodeUrl,
			retrievalUrl,
			referencingUrl,
			defaultMetaSchemaId,
		});
		this.kickProcessFetchCommandQueue();
	}

	private kickProcessFetchCommandQueue() {
		if (this.processFetchCommandQueuePromise == null) {
			this.processFetchCommandQueuePromise =
				this.processFetchCommandQueue().finally(
					() => (this.processFetchCommandQueuePromise = null),
				);
		}
	}

	private async processFetchCommandQueue() {
		let command;
		while ((command = this.fetchCommandQueue.shift()) != null) {
			const id = command.retrievalUrl.toString();

			if (this.fetchCommandDone.has(id)) {
				continue;
			}
			try {
				await this.processFetchCommand(command);
			} finally {
				this.fetchCommandDone.add(id);
			}
		}
	}

	private async processFetchCommand(command: FetchCommand) {
		const { retrievalUrl, referencingUrl, defaultMetaSchemaId } = command;
		let { rootNodeUrl } = command;

		const rootNode = await loadJSON(retrievalUrl);

		const metaSchemaId = discoverMetaSchemaId(rootNode) ?? defaultMetaSchemaId;

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

		this.retrievalPairs.push([retrievalUrl, rootNodeUrl]);

		strategy.initializeRootNode(
			rootNode,
			rootNodeUrl,
			retrievalUrl,
			referencingUrl,
		);

		for (const [
			subRetrievalUrl,
			subNodeUrl,
		] of strategy.getDependencyRetrievalPairs(
			rootNode,
			rootNodeUrl,
			retrievalUrl,
		)) {
			this.scheduleLoadFromUrl(
				subNodeUrl,
				subRetrievalUrl,
				rootNodeUrl,
				metaSchemaId,
			);
		}
	}
}
