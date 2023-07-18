import { Draft07Schema } from "@jns42/jns42-schema-draft-07";

//#region core

export function selectNodeSchema(node: Draft07Schema) {
	if (typeof node === "object") {
		return node.$schema;
	}
}

export function selectNodeId(node: Draft07Schema) {
	if (typeof node === "object") {
		return node.$id;
	}
}

export function selectNodeRef(node: Draft07Schema) {
	if (typeof node === "object") {
		return node.$ref;
	}
}

export function selectNodeDescription(node: Draft07Schema) {
	if (typeof node === "object") {
		return node.$comment;
	}
}

export function selectNodeTitle(node: Draft07Schema) {
	if (typeof node === "object") {
		return node.title;
	}
}

export function selectNodeExamples(node: Draft07Schema) {
	if (typeof node === "object") {
		return node.examples;
	}
}

//#endregion

//#region schema

export function* selectSubNodeDefinitionsEntries(
	nodePointer: string,
	node: Draft07Schema
) {
	if (typeof node === "object" && node.definitions != null) {
		for (const [key, subNode] of Object.entries(node.definitions)) {
			const subNodePointer = appendJsonPointer(nodePointer, "definitions", key);
			yield [subNodePointer, subNode] as const;
		}
	}
}

export function* selectSubNodePropertyEntries(
	nodePointer: string,
	node: Draft07Schema
) {
	if (typeof node === "object" && node.properties != null) {
		for (const [key, subNode] of Object.entries(node.properties)) {
			const subNodePointer = appendJsonPointer(nodePointer, "properties", key);
			yield [subNodePointer, subNode] as const;
		}
	}
}

export function* selectSubNodeAdditionalPropertiesEntries(
	nodePointer: string,
	node: Draft07Schema
) {
	if (typeof node === "object" && node.additionalProperties != null) {
		const subNode = node.additionalProperties;
		const subNodePointer = appendJsonPointer(
			nodePointer,
			"additionalProperties"
		);
		yield [subNodePointer, subNode] as const;
	}
}

export function* selectSubNodeItemsOneEntries(
	nodePointer: string,
	node: Draft07Schema
) {
	if (
		typeof node === "object" &&
		node.items != null &&
		!Array.isArray(node.items)
	) {
		const subNode = node.items;
		const subNodePointer = appendJsonPointer(nodePointer, "items");
		yield [subNodePointer, subNode] as const;
	}
}

export function* selectSubNodeItemsManyEntries(
	nodePointer: string,
	node: Draft07Schema
) {
	if (
		typeof node === "object" &&
		node.items != null &&
		Array.isArray(node.items)
	) {
		for (const [key, subNode] of Object.entries(node.items)) {
			if (subNode == null) continue;

			const subNodePointer = appendJsonPointer(nodePointer, "items", key);
			yield [subNodePointer, subNode] as const;
		}
	}
}

export function* selectSubNodeAdditionalItemsEntries(
	nodePointer: string,
	node: Draft07Schema
) {
	if (typeof node === "object" && node.additionalItems != null) {
		const subNode = node.additionalItems;
		const subNodePointer = appendJsonPointer(nodePointer, "additionalItems");
		yield [subNodePointer, subNode] as const;
	}
}

export function* selectSubNodeAnyOfEntries(
	nodePointer: string,
	node: Draft07Schema
) {
	if (typeof node === "object" && node.anyOf != null) {
		for (const [key, subNode] of Object.entries(node.anyOf)) {
			const subNodePointer = appendJsonPointer(nodePointer, "anyOf", key);
			yield [subNodePointer, subNode] as const;
		}
	}
}

export function* selectSubNodeOneOfEntries(
	nodePointer: string,
	node: Draft07Schema
) {
	if (typeof node === "object" && node.oneOf != null) {
		for (const [key, subNode] of Object.entries(node.oneOf)) {
			const subNodePointer = appendJsonPointer(nodePointer, "oneOf", key);
			yield [subNodePointer, subNode] as const;
		}
	}
}

export function* selectSubNodeAllOfEntries(
	nodePointer: string,
	node: Draft07Schema
) {
	if (typeof node === "object" && node.allOf != null) {
		for (const [key, subNode] of Object.entries(node.allOf)) {
			const subNodePointer = appendJsonPointer(nodePointer, "allOf", key);
			yield [subNodePointer, subNode] as const;
		}
	}
}

export function* selectSubNodes(
	nodePointer: string,
	node: Draft07Schema
): Iterable<readonly [string, Draft07Schema]> {
	yield* selectSubNodeDefinitionsEntries(nodePointer, node);
	yield* selectSubNodePropertyEntries(nodePointer, node);
	yield* selectSubNodeAdditionalPropertiesEntries(nodePointer, node);
	yield* selectSubNodeItemsOneEntries(nodePointer, node);
	yield* selectSubNodeItemsManyEntries(nodePointer, node);
	yield* selectSubNodeAdditionalItemsEntries(nodePointer, node);
	yield* selectSubNodeAllOfEntries(nodePointer, node);
	yield* selectSubNodeAnyOfEntries(nodePointer, node);
	yield* selectSubNodeOneOfEntries(nodePointer, node);
}

export function* selectAllSubNodes(
	nodePointer: string,
	node: Draft07Schema
): Iterable<readonly [string, Draft07Schema]> {
	const subNodes = [...selectSubNodes(nodePointer, node)];
	yield* subNodes;
	for (const [subPointer, subNode] of subNodes) {
		yield* selectAllSubNodes(subPointer, subNode);
	}
}

export function* selectAllSubNodesAndSelf(
	nodePointer: string,
	node: Draft07Schema
): Iterable<readonly [string, Draft07Schema]> {
	yield [nodePointer, node] as const;
	yield* selectAllSubNodes(nodePointer, node);
}

//#endregion

//#region type

export function selectNodeTypes(node: Draft07Schema) {
	if (typeof node === "object" && node.type != null) {
		if (Array.isArray(node.type)) {
			return node.type;
		} else {
			return [node.type];
		}
	}
}

export function* selectNodeRequiredProperties(node: Draft07Schema) {
	if (typeof node === "object" && node.required != null) {
		yield* node.required as string[];
	}
}

export function* selectNodePropertyNamesEntries(
	nodePointer: string,
	node: Draft07Schema
) {
	if (typeof node === "object" && node.properties != null) {
		for (const propertyName of Object.keys(node.properties)) {
			const subNodePointer = appendJsonPointer(
				nodePointer,
				"properties",
				propertyName
			);
			yield [subNodePointer, propertyName] as const;
		}
	}
}

export function selectNodeEnum(node: Draft07Schema) {
	if (typeof node === "object") {
		return node.enum;
	}
}

//#endregion

//#region validation

export function selectValidationMaximumProperties(node: Draft07Schema) {
	if (typeof node === "object") {
		return node.maxProperties;
	}
}

export function selectValidationMinimumProperties(node: Draft07Schema) {
	if (typeof node === "object") {
		return node.minProperties;
	}
}

export function selectValidationRequired(node: Draft07Schema) {
	if (typeof node === "object") {
		return node.required;
	}
}

export function selectValidationMinimumItems(node: Draft07Schema) {
	if (typeof node === "object") {
		return node.minItems;
	}
}

export function selectValidationMaximumItems(node: Draft07Schema) {
	if (typeof node === "object") {
		return node.maxItems;
	}
}

export function selectValidationUniqueItems(node: Draft07Schema) {
	if (typeof node === "object") {
		return node.uniqueItems;
	}
}

export function selectValidationMinimumLength(node: Draft07Schema) {
	if (typeof node === "object") {
		return node.minLength;
	}
}

export function selectValidationMaximumLength(node: Draft07Schema) {
	if (typeof node === "object") {
		return node.maxLength;
	}
}

export function selectValidationValuePattern(node: Draft07Schema) {
	if (typeof node === "object") {
		return node.pattern;
	}
}

export function selectValidationMinimumInclusive(node: Draft07Schema) {
	if (typeof node === "object") {
		return node.minimum;
	}
}

export function selectValidationMinimumExclusive(node: Draft07Schema) {
	if (typeof node === "object") {
		return node.exclusiveMinimum;
	}
}

export function selectValidationMaximumInclusive(node: Draft07Schema) {
	if (typeof node === "object") {
		return node.maximum;
	}
}

export function selectValidationMaximumExclusive(node: Draft07Schema) {
	if (typeof node === "object") {
		return node.exclusiveMaximum;
	}
}

export function selectValidationMultipleOf(node: Draft07Schema) {
	if (typeof node === "object") {
		return node.multipleOf;
	}
}

export function selectValidationEnum(node: Draft07Schema) {
	if (typeof node === "object") {
		return node.enum;
	}
}

//#endregion

//#region helpers

function appendJsonPointer(basePointer: string, ...subPointerParts: string[]) {
	return (
		basePointer + subPointerParts.map((part) => "/" + encodeURI(part)).join("")
	);
}

//#endregion
