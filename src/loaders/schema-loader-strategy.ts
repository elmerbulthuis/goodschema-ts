import { LoaderStrategyBase } from "./loader-strategy.js";

export interface NodeItem<N> {
	node: N;
	nodeRootUrl: URL;
	nodePointer: string;
}

export abstract class SchemaLoaderStrategyBase<N> extends LoaderStrategyBase<
	N,
	N
> {
	private readonly nodeMap = new Map<string, NodeItem<N>>();

	public makeRootNodeUrl(node: N, nodeRootUrl: URL): URL {
		return this.makeNodeUrl(node, nodeRootUrl, "");
	}

	public abstract makeNodeUrl(
		node: N,
		nodeRootUrl: URL,
		nodePointer: string,
	): URL;

	public initializeRootNode(
		rootNode: N,
		rootNodeUrl: URL,
		retrievalUrl: URL,
		referencingUrl: URL | null,
	) {
		for (const [subPointer, subNode] of this.selectAllSubNodeEntriesAndSelf(
			"",
			rootNode,
		)) {
			this.indexNode(subNode, rootNodeUrl, subPointer);
		}

		super.initializeRootNode(
			rootNode,
			rootNodeUrl,
			retrievalUrl,
			referencingUrl,
		);
	}

	protected indexNode(node: N, nodeRootUrl: URL, nodePointer: string) {
		const nodeUrl = this.makeNodeUrl(node, nodeRootUrl, nodePointer);
		const nodeId = String(nodeUrl);

		const item: NodeItem<N> = {
			node,
			nodeRootUrl,
			nodePointer,
		};
		if (this.nodeMap.has(nodeId)) {
			throw new Error("duplicate nodeId");
		}
		this.nodeMap.set(nodeId, item);
	}

	//#region selectors

	protected abstract selectAllSubNodeEntriesAndSelf(
		nodePointer: string,
		node: N,
	): Iterable<readonly [string, N]>;

	protected selectRootNodeEntries(): Iterable<[URL, N]> {
		return [...this.getRootNodeItems()].map(({ nodeUrl, node }) => [
			nodeUrl,
			node,
		]);
	}

	//#endregion

	//#region node item

	protected getNodeItem(nodeId: string) {
		const item = this.nodeMap.get(nodeId);
		if (item == null) {
			throw new Error("node item not found");
		}
		return item;
	}

	protected getNodeItemEntries() {
		return this.nodeMap.entries();
	}

	//#endregion
}
