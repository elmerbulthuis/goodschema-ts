import { Draft06Schema, isDraft06Schema } from "@jns42/jns42-schema-draft-06";
import * as intermediate from "@jns42/jns42-schema-intermediate-a";
import { SchemaLoaderStrategyBase } from "../schema-loader-strategy.js";
import { metaSchemaId } from "./meta.js";
import {
	selectAllSubNodesAndSelf,
	selectNodeDescription,
	selectNodeEnum,
	selectNodeExamples,
	selectNodeId,
	selectNodePropertyNamesEntries,
	selectNodeRef,
	selectNodeTitle,
	selectNodeTypes,
	selectSubNodeAdditionalItemsEntries,
	selectSubNodeAdditionalPropertiesEntries,
	selectSubNodeAllOfEntries,
	selectSubNodeAnyOfEntries,
	selectSubNodeItemsManyEntries,
	selectSubNodeItemsOneEntries,
	selectSubNodeOneOfEntries,
	selectValidationMaximumExclusive,
	selectValidationMaximumInclusive,
	selectValidationMaximumItems,
	selectValidationMaximumLength,
	selectValidationMaximumProperties,
	selectValidationMinimumExclusive,
	selectValidationMinimumInclusive,
	selectValidationMinimumItems,
	selectValidationMinimumLength,
	selectValidationMinimumProperties,
	selectValidationMultipleOf,
	selectValidationRequired,
	selectValidationUniqueItems,
	selectValidationValuePattern,
} from "./selectors.js";

export class LoaderStrategy extends SchemaLoaderStrategyBase<Draft06Schema> {
	//#region super implementation

	protected readonly metaSchemaId = metaSchemaId;

	public isRootNode(node: unknown): node is Draft06Schema {
		return isDraft06Schema(node);
	}

	protected selectNodeUrl(node: Draft06Schema) {
		const nodeId = selectNodeId(node);
		if (nodeId != null) {
			const nodeUrl = new URL(nodeId);
			return nodeUrl;
		}
	}

	public makeNodeUrl(
		node: Draft06Schema,
		nodeRootUrl: URL,
		nodePointer: string,
	): URL {
		let nodeUrl = this.selectNodeUrl(node);
		if (nodeUrl != null) {
			return nodeUrl;
		}

		nodeUrl = new URL(`#${nodePointer}`, nodeRootUrl);
		return nodeUrl;
	}

	protected selectAllSubNodeEntriesAndSelf(
		nodePointer: string,
		node: Draft06Schema,
	): Iterable<readonly [string, Draft06Schema]> {
		return selectAllSubNodesAndSelf(nodePointer, node);
	}

	//#endregion

	//#region strategy implementation

	public *getNodeEntries(
		retrievalPairs: Array<[URL, URL]>,
	): Iterable<[string, intermediate.Node]> {
		for (const [nodeId, { node }] of this.getNodeItemEntries()) {
			const title = selectNodeTitle(node) ?? "";
			const description = selectNodeDescription(node) ?? "";
			const deprecated = false;
			const examples = selectNodeExamples(node) ?? [];

			let superNodeId: string | undefined;

			const nodeRef = selectNodeRef(node);

			if (nodeRef != null) {
				const resolvedNodeId = this.resolveReferenceNodeId(
					retrievalPairs,
					nodeId,
					nodeRef,
				);

				superNodeId = resolvedNodeId;
			}

			const types = [...this.selectNodeTypes(nodeId)];
			const compounds = [...this.selectNodeCompounds(nodeId)];

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

	public *getDependencyRetrievalPairs(
		rootNode: Draft06Schema,
		rootNodeUrl: URL,
		retrievalUrl: URL,
	): Iterable<readonly [URL, URL]> {
		for (const [pointer, node] of selectAllSubNodesAndSelf("", rootNode)) {
			const nodeRef = selectNodeRef(node);
			if (nodeRef == null) {
				continue;
			}

			const refNodeUrl = new URL(nodeRef, rootNodeUrl);
			const refRetrievalUrl = new URL(nodeRef, retrievalUrl);
			refRetrievalUrl.hash = "";

			yield [refRetrievalUrl, refNodeUrl] as const;
		}
	}

	private *selectNodeTypes(nodeId: string): Iterable<intermediate.TypeUnion> {
		const nodeItem = this.getNodeItem(nodeId);

		if (nodeItem.node === true) {
			yield {
				type: "any",
			};
		}

		if (nodeItem.node === false) {
			yield {
				type: "never",
			};
		}

		const types = selectNodeTypes(nodeItem.node);
		if (types != null) {
			for (const type of types) {
				switch (type) {
					case "null":
						yield* this.makeNodeTypeFromNull();
						break;

					case "boolean":
						yield* this.makeNodeTypeFromBoolean(nodeItem.node);
						break;

					case "integer":
						yield* this.makeNodeTypeFromNumber(nodeItem.node, "integer");
						break;

					case "number":
						yield* this.makeNodeTypeFromNumber(nodeItem.node, "float");
						break;

					case "string":
						yield* this.makeNodeTypeFromString(nodeItem.node);
						break;

					case "array":
						yield* this.makeNodeTypeFromArray(
							nodeItem.node,
							nodeItem.nodeRootUrl,
							nodeItem.nodePointer,
						);
						break;

					case "object":
						yield* this.makeNodeTypeFromObject(
							nodeItem.node,
							nodeItem.nodeRootUrl,
							nodeItem.nodePointer,
						);
						break;
				}
			}
		}
	}

	private *selectNodeCompounds(
		nodeId: string,
	): Iterable<intermediate.CompoundUnion> {
		const nodeItem = this.getNodeItem(nodeId);

		yield* this.makeNodeCompoundFromAllOf(
			nodeItem.node,
			nodeItem.nodeRootUrl,
			nodeItem.nodePointer,
		);
		yield* this.makeNodeCompoundFromAnyOf(
			nodeItem.node,
			nodeItem.nodeRootUrl,
			nodeItem.nodePointer,
		);
		yield* this.makeNodeCompoundFromOneOf(
			nodeItem.node,
			nodeItem.nodeRootUrl,
			nodeItem.nodePointer,
		);
	}

	private *makeNodeTypeFromNull(): Iterable<intermediate.TypeUnion> {
		yield {
			type: "null",
		};
	}

	private *makeNodeTypeFromBoolean(
		node: Draft06Schema,
	): Iterable<intermediate.TypeUnion> {
		const enumValues = selectNodeEnum(node) as unknown[];

		let options: Array<boolean> | undefined;

		if (enumValues != null) {
			options = [...enumValues] as boolean[];
		}

		yield {
			type: "boolean",
			options,
		};
	}

	private *makeNodeTypeFromNumber(
		node: Draft06Schema,
		numberType: "integer" | "float",
	): Iterable<intermediate.TypeUnion> {
		const enumValues = selectNodeEnum(node) as unknown[];

		let options: Array<number> | undefined;

		if (enumValues != null) {
			options = [...enumValues] as number[];
		}

		const minimumInclusive = selectValidationMinimumInclusive(node);
		const minimumExclusive = selectValidationMinimumExclusive(node);
		const maximumInclusive = selectValidationMaximumInclusive(node);
		const maximumExclusive = selectValidationMaximumExclusive(node);
		const multipleOf = selectValidationMultipleOf(node);

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

	private *makeNodeTypeFromString(
		node: Draft06Schema,
	): Iterable<intermediate.TypeUnion> {
		const enumValues = selectNodeEnum(node) as unknown[];

		let options: Array<string> | undefined;

		if (enumValues != null) {
			options = [...enumValues] as string[];
		}

		const minimumLength = selectValidationMinimumLength(node);
		const maximumLength = selectValidationMaximumLength(node);
		const valuePattern = selectValidationValuePattern(node);

		yield {
			type: "string",
			options,
			minimumLength,
			maximumLength,
			valuePattern,
		};
	}

	private *makeNodeTypeFromArray(
		node: Draft06Schema,
		nodeRootUrl: URL,
		nodePointer: string,
	): Iterable<intermediate.TypeUnion> {
		const itemsOne = [...selectSubNodeItemsOneEntries(nodePointer, node)];
		const itemsMany = [...selectSubNodeItemsManyEntries(nodePointer, node)];
		const additionalItems = [
			...selectSubNodeAdditionalItemsEntries(nodePointer, node),
		];
		const minimumItems = selectValidationMinimumItems(node);
		const maximumItems = selectValidationMaximumItems(node);
		const uniqueItems = selectValidationUniqueItems(node) ?? false;

		if (itemsMany.length > 0) {
			const itemTypeNodeIds = itemsMany.map(([itemNodePointer]) => {
				const itemNodeUrl = new URL(`#${itemNodePointer}`, nodeRootUrl);
				const itemNodeId = String(itemNodeUrl);
				return itemNodeId;
			});

			yield {
				type: "tuple",
				itemTypeNodeIds: itemTypeNodeIds,
			};
		} else if (itemsOne.length > 0) {
			const itemTypeNodeIds = itemsOne.map(([itemNodePointer]) => {
				const itemNodeUrl = new URL(`#${itemNodePointer}`, nodeRootUrl);
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
		} else if (additionalItems.length > 0) {
			const itemTypeNodeIds = additionalItems.map(([itemNodePointer]) => {
				const itemNodeUrl = new URL(`#${itemNodePointer}`, nodeRootUrl);
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

	private *makeNodeTypeFromObject(
		node: Draft06Schema,
		nodeRootUrl: URL,
		nodePointer: string,
	): Iterable<intermediate.TypeUnion> {
		const propertyNames = [
			...selectNodePropertyNamesEntries(nodePointer, node),
		];
		const additionalProperties = [
			...selectSubNodeAdditionalPropertiesEntries(nodePointer, node),
		];
		const minimumProperties = selectValidationMinimumProperties(node);
		const maximumProperties = selectValidationMaximumProperties(node);

		const requiredProperties = selectValidationRequired(node) ?? [];

		if (propertyNames.length > 0) {
			const propertyTypeNodeIds = Object.fromEntries(
				propertyNames.map(([propertyNodePointer, propertyName]) => {
					const propertyNodeUrl = new URL(
						`#${propertyNodePointer}`,
						nodeRootUrl,
					);
					const propertyNodeId = String(propertyNodeUrl);
					return [propertyName, propertyNodeId];
				}),
			);

			yield {
				type: "interface",
				requiredProperties,
				propertyTypeNodeIds,
			};
		} else if (additionalProperties.length > 0) {
			const propertyTypeNodeIds = additionalProperties.map(
				([propertyNodePointer]) => {
					const propertyNodeUrl = new URL(
						`#${propertyNodePointer}`,
						nodeRootUrl,
					);
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

	private *makeNodeCompoundFromAllOf(
		node: Draft06Schema,
		nodeRootUrl: URL,
		nodePointer: string,
	): Iterable<intermediate.CompoundUnion> {
		const allOf = [...selectSubNodeAllOfEntries(nodePointer, node)];
		if (allOf.length > 0) {
			const typeNodeIds = allOf.map(([typeNodePointer]) => {
				const typeNodeUrl = new URL(`#${typeNodePointer}`, nodeRootUrl);
				const typeNodeId = String(typeNodeUrl);
				return typeNodeId;
			});

			yield {
				type: "all-of",
				typeNodeIds,
			};
		}
	}

	private *makeNodeCompoundFromAnyOf(
		node: Draft06Schema,
		nodeRootUrl: URL,
		nodePointer: string,
	): Iterable<intermediate.CompoundUnion> {
		const allOf = [...selectSubNodeAnyOfEntries(nodePointer, node)];
		if (allOf.length > 0) {
			const typeNodeIds = allOf.map(([typeNodePointer]) => {
				const typeNodeUrl = new URL(`#${typeNodePointer}`, nodeRootUrl);
				const typeNodeId = String(typeNodeUrl);
				return typeNodeId;
			});

			yield {
				type: "any-of",
				typeNodeIds,
			};
		}
	}

	private *makeNodeCompoundFromOneOf(
		node: Draft06Schema,
		nodeRootUrl: URL,
		nodePointer: string,
	): Iterable<intermediate.CompoundUnion> {
		const allOf = [...selectSubNodeOneOfEntries(nodePointer, node)];
		if (allOf.length > 0) {
			const typeNodeIds = allOf.map(([typeNodePointer]) => {
				const typeNodeUrl = new URL(`#${typeNodePointer}`, nodeRootUrl);
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

	//#region references

	private resolveReferenceNodeId(
		retrievalPairs: Array<[URL, URL]>,
		nodeId: string,
		nodeRef: string,
	) {
		const rootNodeRetrievalMap = new Map(
			retrievalPairs.map(([retrievalUrl, rootNodeUrl]) => [
				rootNodeUrl.toString(),
				retrievalUrl,
			]),
		);
		const retrievalRootNodeMap = new Map(
			retrievalPairs.map(([retrievalUrl, rootNodeUrl]) => [
				retrievalUrl.toString(),
				rootNodeUrl,
			]),
		);

		const nodeItem = this.getNodeItem(nodeId);

		const nodeRootId = String(nodeItem.nodeRootUrl);
		const nodeRetrievalUrl = rootNodeRetrievalMap.get(nodeRootId);

		const nodeRefRetrievalUrl = new URL(nodeRef, nodeRetrievalUrl);
		let hash = nodeRefRetrievalUrl.hash;
		if (hash.length === 0) {
			hash = "#";
		}
		nodeRefRetrievalUrl.hash = "";
		const nodeRefRetrievalId = String(nodeRefRetrievalUrl);
		const nodeRefRootUrl = retrievalRootNodeMap.get(nodeRefRetrievalId);

		const resolvedNodeUrl = new URL(hash, nodeRefRootUrl);
		const resolvedNodeId = String(resolvedNodeUrl);

		return resolvedNodeId;
	}

	//#endregion
}
