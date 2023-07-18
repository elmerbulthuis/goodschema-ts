import { Draft04Schema } from "@jns42/jns42-schema-draft-04";

//#region core

export function selectNodeSchema(node: Draft04Schema | boolean) {
	if (typeof node === "object") {
		return node.$schema;
	}
}

export function selectNodeId(node: Draft04Schema | boolean) {
	if (typeof node === "object") {
		return node.id;
	}
}

export function selectNodeRef(node: Draft04Schema | boolean) {
	// $ref is not in the schema
	if (
		typeof node === "object" &&
		"$ref" in node &&
		typeof node.$ref === "string"
	) {
		return node.$ref;
	}
}

export function selectNodeTitle(node: Draft04Schema | boolean) {
	if (typeof node === "object") {
		return node.title;
	}
}

export function selectNodeDescription(node: Draft04Schema | boolean) {
	if (typeof node === "object") {
		return node.description;
	}
}

//#endregion

//#region schema

export function* selectSubNodeDefinitionsEntries(
	nodePointer: string,
	node: Draft04Schema | boolean
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
	node: Draft04Schema | boolean
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
	node: Draft04Schema | boolean
) {
	if (typeof node === "object") {
		if (node.additionalProperties != null) {
			const subNode = node.additionalProperties;
			const subNodePointer = appendJsonPointer(
				nodePointer,
				"additionalProperties"
			);
			yield [subNodePointer, subNode] as const;
		} else {
			const subNodePointer = appendJsonPointer(
				nodePointer,
				"additionalProperties"
			);
			yield [subNodePointer, true] as const;
		}
	}
}

export function* selectSubNodeItemsOneEntries(
	nodePointer: string,
	node: Draft04Schema | boolean
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
	node: Draft04Schema | boolean
) {
	if (
		typeof node === "object" &&
		node.items != null &&
		Array.isArray(node.items)
	) {
		for (const [key, subNode] of Object.entries(node.items)) {
			const subNodePointer = appendJsonPointer(nodePointer, "items", key);
			yield [subNodePointer, subNode] as [string, Draft04Schema];
		}
	}
}

export function* selectSubNodeAdditionalItemsEntries(
	nodePointer: string,
	node: Draft04Schema | boolean
) {
	if (typeof node === "object") {
		if (node.additionalItems != null) {
			const subNode = node.additionalItems;
			const subNodePointer = appendJsonPointer(nodePointer, "additionalItems");
			yield [subNodePointer, subNode] as const;
		} else {
			const subNodePointer = appendJsonPointer(nodePointer, "additionalItems");
			yield [subNodePointer, true] as const;
		}
	}
}

export function* selectSubNodeAnyOfEntries(
	nodePointer: string,
	node: Draft04Schema | boolean
) {
	if (typeof node === "object" && node.anyOf != null) {
		for (const [key, subNode] of Object.entries(node.anyOf)) {
			const subNodePointer = appendJsonPointer(nodePointer, "anyOf", key);
			yield [subNodePointer, subNode] as [string, Draft04Schema];
		}
	}
}

export function* selectSubNodeOneOfEntries(
	nodePointer: string,
	node: Draft04Schema | boolean
) {
	if (typeof node === "object" && node.oneOf != null) {
		for (const [key, subNode] of Object.entries(node.oneOf)) {
			const subNodePointer = appendJsonPointer(nodePointer, "oneOf", key);
			yield [subNodePointer, subNode] as [string, Draft04Schema];
		}
	}
}

export function* selectSubNodeAllOfEntries(
	nodePointer: string,
	node: Draft04Schema | boolean
) {
	if (typeof node === "object" && node.allOf != null) {
		for (const [key, subNode] of Object.entries(node.allOf)) {
			const subNodePointer = appendJsonPointer(nodePointer, "allOf", key);
			yield [subNodePointer, subNode] as [string, Draft04Schema];
		}
	}
}

export function* selectSubNodes(
	nodePointer: string,
	node: Draft04Schema | boolean
): Iterable<readonly [string, Draft04Schema | boolean]> {
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
	node: Draft04Schema
): Iterable<readonly [string, Draft04Schema | boolean]> {
	const subNodes = [...selectSubNodes(nodePointer, node)];
	yield* subNodes;
	for (const [subPointer, subNode] of subNodes) {
		if (typeof subNode === "boolean") {
			continue;
		}
		yield* selectAllSubNodes(subPointer, subNode);
	}
}

export function* selectAllSubNodesAndSelf(
	nodePointer: string,
	node: Draft04Schema
): Iterable<readonly [string, Draft04Schema | boolean]> {
	yield [nodePointer, node] as const;
	yield* selectAllSubNodes(nodePointer, node);
}

//#endregion

//#region type

export function selectNodeTypes(node: Draft04Schema | boolean) {
	if (typeof node === "object" && node.type != null) {
		if (Array.isArray(node.type)) {
			return node.type;
		} else {
			return [node.type];
		}
	}
}

export function* selectNodePropertyNamesEntries(
	nodePointer: string,
	node: Draft04Schema | boolean
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

export function selectNodeEnum(node: Draft04Schema | boolean) {
	if (typeof node === "object") {
		return node.enum;
	}
}

//#endregion

//#region validation

export function selectValidationMaximumProperties(
	node: Draft04Schema | boolean
) {
	if (typeof node === "object") {
		return node.maxProperties;
	}
}

export function selectValidationMinimumProperties(
	node: Draft04Schema | boolean
) {
	if (typeof node === "object") {
		return node.minProperties;
	}
}

export function selectValidationRequired(node: Draft04Schema | boolean) {
	if (typeof node === "object") {
		return node.required as string[];
	}
}

export function selectValidationMinimumItems(node: Draft04Schema | boolean) {
	if (typeof node === "object") {
		return node.minItems;
	}
}

export function selectValidationMaximumItems(node: Draft04Schema | boolean) {
	if (typeof node === "object") {
		return node.maxItems;
	}
}

export function selectValidationUniqueItems(node: Draft04Schema | boolean) {
	if (typeof node === "object") {
		return node.uniqueItems;
	}
}

export function selectValidationMinimumLength(node: Draft04Schema | boolean) {
	if (typeof node === "object") {
		return node.minLength;
	}
}

export function selectValidationMaximumLength(node: Draft04Schema | boolean) {
	if (typeof node === "object") {
		return node.maxLength;
	}
}

export function selectValidationValuePattern(node: Draft04Schema | boolean) {
	if (typeof node === "object") {
		return node.pattern;
	}
}

export function selectValidationMinimumInclusive(
	node: Draft04Schema | boolean
) {
	if (typeof node === "object") {
		if (node.exclusiveMinimum ?? false) {
			return;
		} else {
			return node.minimum;
		}
	}
}

export function selectValidationMinimumExclusive(
	node: Draft04Schema | boolean
) {
	if (typeof node === "object") {
		if (node.exclusiveMinimum ?? false) {
			return node.minimum;
		} else {
			return;
		}
	}
}

export function selectValidationMaximumInclusive(
	node: Draft04Schema | boolean
) {
	if (typeof node === "object") {
		if (node.exclusiveMaximum ?? false) {
			return;
		} else {
			return node.maximum;
		}
	}
}

export function selectValidationMaximumExclusive(
	node: Draft04Schema | boolean
) {
	if (typeof node === "object") {
		if (node.exclusiveMaximum ?? false) {
			return node.maximum;
		} else {
			return;
		}
	}
}

export function selectValidationMultipleOf(node: Draft04Schema | boolean) {
	if (typeof node === "object") {
		return node.multipleOf;
	}
}

export function selectValidationEnum(node: Draft04Schema | boolean) {
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
