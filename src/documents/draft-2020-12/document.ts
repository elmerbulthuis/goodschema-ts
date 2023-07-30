import {
	Draft202012Schema,
	isDraft202012Schema,
} from "@jns42/jns42-schema-draft-2020-12";
import * as schemaIntermediateA from "@jns42/jns42-schema-intermediate-a";
import { DocumentContext } from "../document-context.js";
import {
	EmbeddedDocument,
	ReferencedDocument,
	SchemaDocumentBase,
} from "../schema-document-base.js";
import * as selectors from "./selectors.js";

export class Document extends SchemaDocumentBase<Draft202012Schema> {
	private readonly anchorMap = new Map<string, string>();
	private readonly dynamicAnchorMap = new Map<string, string>();

	constructor(
		givenUrl: URL,
		antecedentUrl: URL | null,
		documentNode: unknown,
		context: DocumentContext,
	) {
		super(givenUrl, antecedentUrl, documentNode, context);

		for (const [nodePointer, node] of this.nodes) {
			const nodeAnchor = selectors.selectNodeAnchor(node);
			if (nodeAnchor != null) {
				if (this.anchorMap.has(nodeAnchor)) {
					throw new TypeError(`duplicate anchor ${nodeAnchor}`);
				}
				this.anchorMap.set(nodeAnchor, nodePointer);
			}

			const nodeDynamicAnchor = selectors.selectNodeDynamicAnchor(node);
			if (nodeDynamicAnchor != null) {
				if (this.dynamicAnchorMap.has(nodeDynamicAnchor)) {
					throw new TypeError(`duplicate dynamic anchor ${nodeDynamicAnchor}`);
				}
				this.dynamicAnchorMap.set(nodeDynamicAnchor, nodePointer);
			}
		}
	}

	//#region document

	protected isDocumentNode(node: unknown): node is Draft202012Schema {
		return isDraft202012Schema(node);
	}
	protected getDocumentNodeUrl(): URL | null {
		const nodeId = selectors.selectNodeId(this.documentNode);
		if (nodeId == null) {
			return null;
		}
		const nodeUrl =
			this.antecedentUrl == null
				? new URL(nodeId)
				: new URL(nodeId, this.antecedentUrl);
		return nodeUrl;
	}

	public *getNodeUrls(): Iterable<URL> {
		yield* super.getNodeUrls();

		for (const [anchor] of this.anchorMap) {
			yield this.pointerToNodeUrl(anchor);
		}

		/*
		don't emit dynamic anchors here, they are treated differently
		*/
	}

	//#endregion

	//#region conversion

	protected pointerToNodeHash(nodePointer: string): string {
		return nodePointer === "" ? "" : `#${nodePointer}`;
	}
	protected nodeHashToPointer(nodeHash: string): string {
		if (nodeHash === "") {
			return "";
		}
		if (!nodeHash.startsWith("#")) {
			throw new TypeError("hash should start with #");
		}
		return nodeHash.substring(1);
	}

	//#endregion

	//#region node traversal

	public *getEmbeddedDocuments(retrievalUrl: URL): Iterable<EmbeddedDocument> {
		const queue = new Array<readonly [string, Draft202012Schema]>();
		queue.push(
			...selectors.selectSubNodes(this.documentNodePointer, this.documentNode),
		);

		let pair: readonly [string, Draft202012Schema] | undefined;
		while ((pair = queue.shift()) != null) {
			const [nodePointer, node] = pair;

			const nodeId = selectors.selectNodeId(node);
			if (nodeId == null) {
				queue.push(...selectors.selectSubNodes(nodePointer, node));

				continue;
			}
			yield {
				node,
				retrievalUrl: new URL("", new URL(nodeId, retrievalUrl)),
				givenUrl: new URL("", new URL(nodeId, this.documentNodeUrl)),
			};
		}
	}
	public *getReferencedDocuments(
		retrievalUrl: URL,
	): Iterable<ReferencedDocument> {
		for (const [, node] of this.nodes) {
			const nodeRef = selectors.selectNodeRef(node);
			if (nodeRef == null) {
				continue;
			}

			yield {
				retrievalUrl: new URL("", new URL(nodeRef, retrievalUrl)),
				givenUrl: new URL("", new URL(nodeRef, this.documentNodeUrl)),
			};

			/*
			don't emit dynamic-refs here, they are supposed to be hash-only
			urls, so they don't reference any document
			*/
		}
	}
	protected *getNodePairs(): Iterable<readonly [string, Draft202012Schema]> {
		const queue = new Array<readonly [string, Draft202012Schema]>();
		queue.push(
			...selectors.selectSubNodes(this.documentNodePointer, this.documentNode),
		);

		yield [this.documentNodePointer, this.documentNode];

		let pair: readonly [string, Draft202012Schema] | undefined;
		while ((pair = queue.shift()) != null) {
			const [nodePointer, node] = pair;

			const nodeId = selectors.selectNodeId(node);
			if (nodeId == null) {
				queue.push(...selectors.selectSubNodes(nodePointer, node));

				yield pair;
			}
		}
	}

	//#endregion

	//#region intermediate nodes

	public *getIntermediateNodeEntries(): Iterable<
		readonly [string, schemaIntermediateA.Node]
	> {
		for (const [nodePointer, node] of this.nodes) {
			const nodeUrl = this.pointerToNodeUrl(nodePointer);
			const nodeId = nodeUrl.toString();
			const title = selectors.selectNodeTitle(node) ?? "";
			const description = selectors.selectNodeDescription(node) ?? "";
			const deprecated = selectors.selectNodeDeprecated(node) ?? false;
			const examples = selectors.selectNodeExamples(node) ?? [];

			let superNodeId: string | undefined;

			const nodeRef = selectors.selectNodeRef(node);
			if (nodeRef != null) {
				const resolvedNodeUrl = this.resolveReferenceNodeUrl(nodeRef);
				const resolvedNodeId = resolvedNodeUrl.toString();
				superNodeId = resolvedNodeId;
			}

			const nodeDynamicRef = selectors.selectNodeDynamicRef(node);
			if (nodeDynamicRef != null) {
				const resolvedNodeUrl =
					this.resolveDynamicReferenceNodeUrl(nodeDynamicRef);
				const resolvedNodeId = resolvedNodeUrl.toString();
				superNodeId = resolvedNodeId;
			}

			const types = [...this.getIntermediateNodeTypes(nodePointer, node)];
			const compounds = [
				...this.getIntermediateNodeCompounds(nodePointer, node),
			];

			yield [
				nodeId,
				{
					superNodeId,
					deprecated,
					title,
					description,
					examples,
					types,
					compounds,
				},
			];
		}
	}

	private *getIntermediateNodeTypes(
		nodePointer: string,
		node: Draft202012Schema,
	): Iterable<schemaIntermediateA.TypeUnion> {
		if (node === true) {
			yield {
				type: "any",
			};
		}

		if (node === false) {
			yield {
				type: "never",
			};
		}

		const types = selectors.selectNodeTypes(node);
		if (types != null) {
			for (const type of types) {
				switch (type) {
					case "null":
						yield* this.getIntermediateNodeTypeFromNull();
						break;

					case "boolean":
						yield* this.getIntermediateNodeTypeFromBoolean(node);
						break;

					case "integer":
						yield* this.getIntermediateNodeTypeFromNumber(node, "integer");
						break;

					case "number":
						yield* this.getIntermediateNodeTypeFromNumber(node, "float");
						break;

					case "string":
						yield* this.getIntermediateNodeTypeFromString(node);
						break;

					case "array":
						yield* this.getIntermediateNodeTypeFromArray(nodePointer, node);
						break;

					case "object":
						yield* this.getIntermediateNodeTypeFromObject(nodePointer, node);
						break;
				}
			}
		}
	}

	private *getIntermediateNodeCompounds(
		nodePointer: string,
		node: Draft202012Schema,
	): Iterable<schemaIntermediateA.CompoundUnion> {
		yield* this.getIntermediateNodeCompoundFromAllOf(nodePointer, node);
		yield* this.getIntermediateNodeCompoundFromAnyOf(nodePointer, node);
		yield* this.getIntermediateNodeCompoundFromOneOf(nodePointer, node);
	}

	private *getIntermediateNodeTypeFromNull(): Iterable<schemaIntermediateA.TypeUnion> {
		yield {
			type: "null",
		};
	}

	private *getIntermediateNodeTypeFromBoolean(
		node: Draft202012Schema,
	): Iterable<schemaIntermediateA.TypeUnion> {
		const enumValues = selectors.selectNodeEnum(node);
		const constValue = selectors.selectNodeConst(node);

		let options: Array<boolean> | undefined;

		if (constValue != null) {
			options = [constValue];
		} else if (enumValues != null) {
			options = [...enumValues];
		}

		yield {
			type: "boolean",
			options,
		};
	}

	private *getIntermediateNodeTypeFromNumber(
		node: Draft202012Schema,
		numberType: "integer" | "float",
	): Iterable<schemaIntermediateA.TypeUnion> {
		const enumValues = selectors.selectNodeEnum(node);
		const constValue = selectors.selectNodeConst(node);

		let options: Array<number> | undefined;

		if (constValue != null) {
			options = [constValue];
		} else if (enumValues != null) {
			options = [...enumValues];
		}

		const minimumInclusive = selectors.selectValidationMinimumInclusive(node);
		const minimumExclusive = selectors.selectValidationMinimumExclusive(node);
		const maximumInclusive = selectors.selectValidationMaximumInclusive(node);
		const maximumExclusive = selectors.selectValidationMaximumExclusive(node);
		const multipleOf = selectors.selectValidationMultipleOf(node);

		yield {
			type: "number",
			numberType,
			options,
			minimumInclusive,
			minimumExclusive,
			maximumInclusive,
			maximumExclusive,
			multipleOf,
		};
	}

	private *getIntermediateNodeTypeFromString(
		node: Draft202012Schema,
	): Iterable<schemaIntermediateA.TypeUnion> {
		const enumValues = selectors.selectNodeEnum(node);
		const constValue = selectors.selectNodeConst(node);

		let options: Array<string> | undefined;

		if (constValue != null) {
			options = [constValue];
		} else if (enumValues != null) {
			options = [...enumValues];
		}

		const minimumLength = selectors.selectValidationMinimumLength(node);
		const maximumLength = selectors.selectValidationMaximumLength(node);
		const valuePattern = selectors.selectValidationValuePattern(node);

		yield {
			type: "string",
			options,
			minimumLength,
			maximumLength,
			valuePattern,
		};
	}

	private *getIntermediateNodeTypeFromArray(
		nodePointer: string,
		node: Draft202012Schema,
	): Iterable<schemaIntermediateA.TypeUnion> {
		const items = [...selectors.selectSubNodeItemsEntries(nodePointer, node)];
		const prefixItems = [
			...selectors.selectSubNodePrefixItemsEntries(nodePointer, node),
		];
		const minimumItems = selectors.selectValidationMinimumItems(node);
		const maximumItems = selectors.selectValidationMaximumItems(node);
		const uniqueItems = selectors.selectValidationUniqueItems(node) ?? false;

		if (prefixItems.length > 0) {
			const itemTypeNodeIds = prefixItems.map(([itemNodePointer]) => {
				const itemNodeUrl = this.pointerToNodeUrl(itemNodePointer);
				const itemNodeId = String(itemNodeUrl);
				return itemNodeId;
			});

			yield {
				type: "tuple",
				itemTypeNodeIds: itemTypeNodeIds,
			};
		}

		if (items.length > 0) {
			const itemTypeNodeIds = items.map(([itemNodePointer]) => {
				const itemNodeUrl = this.pointerToNodeUrl(itemNodePointer);
				const itemNodeId = String(itemNodeUrl);
				return itemNodeId;
			});

			for (const itemTypeNodeId of itemTypeNodeIds) {
				yield {
					type: "array",
					minimumItems,
					maximumItems,
					uniqueItems,
					itemTypeNodeId,
				};
			}
		}
	}

	private *getIntermediateNodeTypeFromObject(
		nodePointer: string,
		node: Draft202012Schema,
	): Iterable<schemaIntermediateA.TypeUnion> {
		const propertyNames = [
			...selectors.selectNodePropertyNamesEntries(nodePointer, node),
		];
		const additionalProperties = [
			...selectors.selectSubNodeAdditionalPropertiesEntries(nodePointer, node),
		];
		const minimumProperties = selectors.selectValidationMinimumProperties(node);
		const maximumProperties = selectors.selectValidationMaximumProperties(node);

		const requiredProperties = selectors.selectValidationRequired(node) ?? [];

		if (propertyNames.length > 0) {
			const propertyTypeNodeIds = Object.fromEntries(
				propertyNames.map(([propertyNodePointer, propertyName]) => {
					const propertyNodeUrl = this.pointerToNodeUrl(propertyNodePointer);
					const propertyNodeId = String(propertyNodeUrl);
					return [propertyName, propertyNodeId];
				}),
			);

			yield {
				type: "interface",
				requiredProperties,
				propertyTypeNodeIds,
			};
		}

		if (additionalProperties.length > 0) {
			const propertyTypeNodeIds = additionalProperties.map(
				([propertyNodePointer]) => {
					const propertyNodeUrl = this.pointerToNodeUrl(propertyNodePointer);
					const propertyNodeId = String(propertyNodeUrl);
					return propertyNodeId;
				},
			);

			for (const propertyTypeNodeId of propertyTypeNodeIds) {
				yield {
					type: "record",
					minimumProperties,
					maximumProperties,
					requiredProperties,
					propertyTypeNodeId,
				};
			}
		}
	}

	private *getIntermediateNodeCompoundFromAllOf(
		nodePointer: string,
		node: Draft202012Schema,
	): Iterable<schemaIntermediateA.CompoundUnion> {
		const allOf = [...selectors.selectSubNodeAllOfEntries(nodePointer, node)];
		if (allOf.length > 0) {
			const typeNodeIds = allOf.map(([typeNodePointer]) => {
				const typeNodeUrl = this.pointerToNodeUrl(typeNodePointer);
				const typeNodeId = String(typeNodeUrl);
				return typeNodeId;
			});

			yield {
				type: "all-of",
				typeNodeIds,
			};
		}
	}

	private *getIntermediateNodeCompoundFromAnyOf(
		nodePointer: string,
		node: Draft202012Schema,
	): Iterable<schemaIntermediateA.CompoundUnion> {
		const allOf = [...selectors.selectSubNodeAnyOfEntries(nodePointer, node)];
		if (allOf.length > 0) {
			const typeNodeIds = allOf.map(([typeNodePointer]) => {
				const typeNodeUrl = this.pointerToNodeUrl(typeNodePointer);
				const typeNodeId = String(typeNodeUrl);
				return typeNodeId;
			});

			yield {
				type: "any-of",
				typeNodeIds,
			};
		}
	}

	private *getIntermediateNodeCompoundFromOneOf(
		nodePointer: string,
		node: Draft202012Schema,
	): Iterable<schemaIntermediateA.CompoundUnion> {
		const allOf = [...selectors.selectSubNodeOneOfEntries(nodePointer, node)];
		if (allOf.length > 0) {
			const typeNodeIds = allOf.map(([typeNodePointer]) => {
				const typeNodeUrl = this.pointerToNodeUrl(typeNodePointer);
				const typeNodeId = String(typeNodeUrl);
				return typeNodeId;
			});

			yield {
				type: "one-of",
				typeNodeIds,
			};
		}
	}

	//#endregion

	//#region reference

	private resolveReferenceNodeUrl(nodeRef: string): URL {
		const resolvedNodeUrl = new URL(nodeRef, this.documentNodeUrl);

		const resolvedDocument = this.context.getDocumentForNode(resolvedNodeUrl);
		if (resolvedDocument instanceof Document) {
			const resolvedPointer =
				resolvedDocument.nodeUrlToPointer(resolvedNodeUrl);
			const anchorResolvedPointer =
				resolvedDocument.anchorMap.get(resolvedPointer);
			if (anchorResolvedPointer != null) {
				const anchorResolvedUrl = resolvedDocument.pointerToNodeUrl(
					anchorResolvedPointer,
				);
				return anchorResolvedUrl;
			}
		}

		return resolvedNodeUrl;
	}

	private resolveDynamicReferenceNodeUrl(nodeDynamicRef: string): URL {
		const documents = [this, ...this.getAntecedentDocuments()];
		documents.reverse();

		for (const document of documents) {
			if (!(document instanceof Document)) {
				continue;
			}

			const resolvedPointer = this.nodeHashToPointer(nodeDynamicRef);
			const dynamicAnchorResolvedPointer =
				document.dynamicAnchorMap.get(resolvedPointer);

			if (dynamicAnchorResolvedPointer != null) {
				const dynamicAnchorResolvedUrl = document.pointerToNodeUrl(
					dynamicAnchorResolvedPointer,
				);
				return dynamicAnchorResolvedUrl;
			}
		}

		throw new TypeError("dynamic anchor not found");
	}

	//#endregion
}
