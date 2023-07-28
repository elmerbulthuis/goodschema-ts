import * as intermediate from "@jns42/jns42-schema-intermediate-a";

export interface RootNodeItem<N> {
	node: N;
	nodeUrl: URL;
	referencingNodeUrl: URL | null;
}

export abstract class LoaderStrategyBase<R, N> {
	protected abstract readonly metaSchemaId: string;

	public abstract getNodeEntries(
		retrievalPairs: Array<readonly [URL, URL]>,
	): Iterable<readonly [string, intermediate.Node]>;
	public abstract isRootNode(node: unknown): node is R;
	public abstract makeRootNodeUrl(rootNode: R, nodeRootUrl: URL): URL;
	public abstract getDependencyRetrievalPairs(
		rootNode: N,
		rootNodeUrl: URL,
		retrievalUrl: URL,
	): Iterable<readonly [URL, URL]>;

	private readonly rootNodeMap = new Map<string, RootNodeItem<R>>();

	public initializeRootNode(
		rootNode: R,
		rootNodeUrl: URL,
		retrievalUrl: URL,
		referencingUrl: URL | null,
	) {
		const nodeId = String(rootNodeUrl);

		if (this.rootNodeMap.has(nodeId)) {
			throw new Error("rootNode already present");
		}

		const item = {
			node: rootNode,
			nodeUrl: rootNodeUrl,
			referencingNodeUrl: referencingUrl,
		};

		this.rootNodeMap.set(nodeId, item);
	}

	protected getRootNodeItem(nodeId: string) {
		const item = this.rootNodeMap.get(nodeId);
		if (item == null) {
			throw new Error("root node item not found");
		}
		return item;
	}

	protected getRootNodeItems() {
		return this.rootNodeMap.values();
	}
}
