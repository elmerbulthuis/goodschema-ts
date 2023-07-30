import * as schemaIntermediateA from "@jns42/jns42-schema-intermediate-a";

export abstract class DocumentBase<N = unknown> {
	public abstract readonly documentNodeUrl: URL;
	protected readonly documentNode: N;

	constructor(documentNode: unknown) {
		if (!this.isDocumentNode(documentNode)) {
			throw new TypeError("invalid documentNode");
		}
		this.documentNode = documentNode;
	}

	public abstract getIntermediateNodeEntries(): Iterable<
		readonly [string, schemaIntermediateA.Node]
	>;

	public abstract getNodeUrls(): Iterable<URL>;

	protected abstract isDocumentNode(node: unknown): node is N;
}
