import { DocumentBase } from "./document-base.js";
import { DocumentContext } from "./document-context.js";

export interface EmbeddedDocument {
	retrievalUrl: URL;
	givenUrl: URL;
	node: unknown;
}

export interface ReferencedDocument {
	retrievalUrl: URL;
	givenUrl: URL;
}

export abstract class SchemaDocumentBase<N = unknown> extends DocumentBase<N> {
	/**
	 * The unique url for this document, possibly derived from the node. This
	 * is not necessarily the location where the document was retrieved from.
	 */
	public readonly documentNodeUrl: URL;
	/**
	 * base pointer, this is usually ""
	 */
	protected readonly documentNodePointer: string;
	/**
	 * All nodes in the document, indexed by pointer
	 */
	protected readonly nodes: Map<string, N>;

	/**
	 * Constructor for creating new documents
	 * @param givenUrl url that is derived from the referencing document
	 * @param antecedentUrl url of referencing, parent, preceding document
	 * @param documentNode the actual document
	 */
	constructor(
		givenUrl: URL,
		public readonly antecedentUrl: URL | null,
		documentNode: unknown,
		protected context: DocumentContext,
	) {
		super(documentNode);

		const maybeDocumentNodeUrl = this.getDocumentNodeUrl();
		const documentNodeUrl = maybeDocumentNodeUrl ?? givenUrl;
		this.documentNodeUrl = documentNodeUrl;
		this.documentNodePointer = this.nodeUrlToPointer(documentNodeUrl);

		this.nodes = new Map(this.getNodePairs());
	}

	/**
	 * get all embedded document nodes
	 */
	public abstract getEmbeddedDocuments(
		retrievalUrl: URL,
	): Iterable<EmbeddedDocument>;
	/**
	 * get all references to other documents
	 */
	public abstract getReferencedDocuments(
		retrievalUrl: URL,
	): Iterable<ReferencedDocument>;

	protected abstract getDocumentNodeUrl(): URL | null;
	protected abstract getNodePairs(): Iterable<readonly [string, N]>;

	protected pointerToNodeUrl(nodePointer: string): URL {
		return new URL(this.pointerToNodeHash(nodePointer), this.documentNodeUrl);
	}
	protected nodeUrlToPointer(nodeUrl: URL): string {
		if (nodeUrl.origin !== this.documentNodeUrl.origin) {
			throw new TypeError("origins should match");
		}
		return this.nodeHashToPointer(nodeUrl.hash);
	}
	protected abstract pointerToNodeHash(nodePointer: string): string;
	protected abstract nodeHashToPointer(nodeHash: string): string;

	/**
	 * All unique node urls that this document contains
	 */
	public *getNodeUrls(): Iterable<URL> {
		for (const [nodePointer] of this.nodes) {
			yield this.pointerToNodeUrl(nodePointer);
		}
	}

	public getNodeByUrl(nodeUrl: URL) {
		const nodePointer = this.nodeUrlToPointer(nodeUrl);
		return this.getNodeByPointer(nodePointer);
	}

	public getNodeByPointer(nodePointer: string) {
		const node = this.nodes.get(nodePointer);
		if (node == null) {
			throw new TypeError(`node not found ${nodePointer}`);
		}
		return node;
	}

	protected *getAntecedentDocuments(): Iterable<SchemaDocumentBase> {
		let currentDocument: SchemaDocumentBase = this;
		while (currentDocument.antecedentUrl != null) {
			const maybeNextDocument = this.context.getDocument(
				currentDocument.antecedentUrl,
			);
			if (!(maybeNextDocument instanceof SchemaDocumentBase)) {
				break;
			}
			currentDocument = maybeNextDocument;
			yield currentDocument;
		}
	}
}
