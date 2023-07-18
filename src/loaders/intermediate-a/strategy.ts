import * as intermediate from "@jns42/jns42-schema-intermediate-a";
import { LoaderStrategyBase } from "../loader-strategy.js";
import { metaSchemaId } from "./meta.js";

export class LoaderStrategy extends LoaderStrategyBase<
	intermediate.SchemaJson,
	intermediate.Node
> {
	protected readonly metaSchemaId = metaSchemaId;

	protected readonly nodeMap = new Map<string, intermediate.Node>();

	public isRootNode(node: unknown): node is intermediate.SchemaJson {
		return intermediate.isSchemaJson(node);
	}

	public async loadDependencies(
		rootNode: intermediate.SchemaJson,
		rootNodeUrl: URL,
		retrievalUrl: URL,
	): Promise<void> {
		//
	}

	public makeRootNodeUrl(
		rootNode: intermediate.SchemaJson,
		nodeRootUrl: URL,
	): URL {
		return nodeRootUrl;
	}

	public getNodeEntries(): Iterable<[string, intermediate.Node]> {
		return this.nodeMap.entries();
	}

	public *indexRootNode(rootNodeUrl: URL): Iterable<URL> {
		const rootNodeId = String(rootNodeUrl);
		const rootItem = this.getRootNodeItem(rootNodeId);

		for (const [nodeId, node] of Object.entries(rootItem.node.nodes)) {
			const nodeUrl = new URL(nodeId);

			if (this.nodeMap.has(nodeId)) {
				throw new Error("duplicate nodeId");
			}
			this.nodeMap.set(nodeId, node);

			yield nodeUrl;
		}
	}
}
