import * as intermediate from "@jns42/jns42-schema-intermediate-a";
import assert from "node:assert";
import { LoaderContext } from "./loader-context.js";

export interface RootNodeItem<N> {
	node: N;
	nodeUrl: URL;
	referencingNodeUrl: URL | null;
}

export abstract class LoaderStrategyBase<R, N> {
	protected abstract readonly metaSchemaId: string;

	public abstract getNodeEntries(): Iterable<[string, intermediate.Node]>;
	public abstract isRootNode(node: unknown): node is R;
	public abstract makeRootNodeUrl(rootNode: R, nodeRootUrl: URL): URL;

	private readonly rootNodeMap = new Map<string, RootNodeItem<R>>();

	//#region context

	private maybeContext?: LoaderContext;
	protected get context() {
		assert(this.maybeContext != null);
		return this.maybeContext;
	}
	public registerContext(context: LoaderContext) {
		this.maybeContext = context;
	}

	//#endregion

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
