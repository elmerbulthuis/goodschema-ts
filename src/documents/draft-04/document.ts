import * as schemaIntermediateB from "@jns42/jns42-schema-intermediate-b";
import { DocumentContext } from "../document-context.js";
import { SchemaDocumentBase } from "../schema-document-base.js";
import { Draft04Schema, isDraft04Schema } from "./schema.js";

type Node = Draft04Schema | boolean;

function isNode(value: unknown): value is Node {
  return isDraft04Schema(value) || typeof value === "boolean";
}

export class Document extends SchemaDocumentBase<Node> {
  private readonly nodeNameMap = new Map<string, string>();

  constructor(
    givenUrl: URL,
    antecedentUrl: URL | null,
    documentNode: unknown,
    context: DocumentContext,
  ) {
    super(givenUrl, antecedentUrl, documentNode, context);

    for (const [nodePointer, node] of this.nodes) {
      const nodeId = this.selectNodeId(node);
      if (nodeId != null && nodeId.startsWith("#")) {
        const nodeName = this.nodeHashToPointer(nodeId);
        if (this.nodeNameMap.has(nodeName)) {
          throw new TypeError(`duplicate node name ${nodeName}`);
        }
        this.nodeNameMap.set(nodeName, nodePointer);
      }
    }
  }

  //#region document

  protected isDocumentNode(node: unknown): node is Node {
    return isNode(node);
  }

  public *getNodeUrls(): Iterable<URL> {
    yield* super.getNodeUrls();

    for (const [nodeName] of this.nodeNameMap) {
      yield this.pointerToNodeUrl(nodeName);
    }
  }

  //#endregion

  //#region node

  protected isNodeEmbeddedSchema(node: Node): boolean {
    const nodeId = this.selectNodeId(node);
    if (nodeId == null || nodeId.startsWith("#")) {
      return false;
    }
    return true;
  }
  protected pointerToNodeHash(nodePointer: string): string {
    return `#${nodePointer}`;
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

  //#region intermediate sections

  protected getIntermediateMetadataSection(
    nodePointer: string,
    node: Node,
  ): schemaIntermediateB.MetadataSection {
    const title = this.selectNodeTitle(node) ?? "";
    const description = this.selectNodeDescription(node) ?? "";
    const deprecated = false;
    const examples = [] as any[];

    return {
      deprecated,
      title,
      description,
      examples,
    };
  }
  protected getIntermediateTypesSection(
    nodePointer: string,
    node: Node,
  ): schemaIntermediateB.TypesSection {
    if (node === true) {
      return ["any"];
    }

    if (node === false) {
      return ["never"];
    }

    const types = this.selectNodeTypes(node);
    if (types != null) {
      return types
        .filter((type) => type != null)
        .map((type) => type!)
        .map((type) => this.mapType(type));
    }

    return this.guessTypes(node);
  }

  //#endregion

  //#region intermediate assertions

  protected getIntermediateBooleanAssertion(
    nodePointer: string,
    node: Node,
  ): schemaIntermediateB.BooleanAssertion | undefined {
    const enumValues = this.selectNodeEnum(node);

    let options: Array<boolean> | undefined;

    if (enumValues != null) {
      options = [...enumValues].filter(
        (value) => typeof value === "boolean",
      ) as boolean[];
    }

    return {
      options,
    };
  }
  protected getIntermediateIntegerAssertion(
    nodePointer: string,
    node: Node,
  ): schemaIntermediateB.IntegerAssertion | undefined {
    const enumValues = this.selectNodeEnum(node);

    let options: Array<number> | undefined;

    if (enumValues != null) {
      options = [...enumValues].filter(
        (value) => typeof value === "number" && value,
      ) as number[];
    }

    const minimumInclusive = this.selectValidationMinimumInclusive(node);
    const minimumExclusive = this.selectValidationMinimumExclusive(node);
    const maximumInclusive = this.selectValidationMaximumInclusive(node);
    const maximumExclusive = this.selectValidationMaximumExclusive(node);
    const multipleOf = this.selectValidationMultipleOf(node);

    return {
      options,
      minimumInclusive,
      minimumExclusive,
      maximumInclusive,
      maximumExclusive,
      multipleOf,
    };
  }
  protected getIntermediateNumberAssertion(
    nodePointer: string,
    node: Node,
  ): schemaIntermediateB.NumberAssertion | undefined {
    const enumValues = this.selectNodeEnum(node);

    let options: Array<number> | undefined;

    if (enumValues != null) {
      options = [...enumValues].filter(
        (value) => typeof value === "number",
      ) as number[];
    }

    const minimumInclusive = this.selectValidationMinimumInclusive(node);
    const minimumExclusive = this.selectValidationMinimumExclusive(node);
    const maximumInclusive = this.selectValidationMaximumInclusive(node);
    const maximumExclusive = this.selectValidationMaximumExclusive(node);
    const multipleOf = this.selectValidationMultipleOf(node);

    return {
      options,
      minimumInclusive,
      minimumExclusive,
      maximumInclusive,
      maximumExclusive,
      multipleOf,
    };
  }
  protected getIntermediateStringAssertion(
    nodePointer: string,
    node: Node,
  ): schemaIntermediateB.StringAssertion | undefined {
    const enumValues = this.selectNodeEnum(node);

    let options: Array<string> | undefined;

    if (enumValues != null) {
      options = [...enumValues].filter(
        (value) => typeof value === "string",
      ) as string[];
    }

    const minimumLength = this.selectValidationMinimumLength(node);
    const maximumLength = this.selectValidationMaximumLength(node);
    const valuePattern = this.selectValidationValuePattern(node);
    const valueFormat = this.selectValidationValueFormat(node);

    return {
      options,
      minimumLength,
      maximumLength,
      valuePattern,
      valueFormat,
    };
  }
  protected getIntermediateArrayAssertion(
    nodePointer: string,
    node: Node,
  ): schemaIntermediateB.ArrayAssertion | undefined {
    const minimumItems = this.selectValidationMinimumItems(node);
    const maximumItems = this.selectValidationMaximumItems(node);
    const uniqueItems = this.selectValidationUniqueItems(node) ?? false;

    return {
      maximumItems,
      minimumItems,
      uniqueItems,
    };
  }
  protected getIntermediateMapAssertion(
    nodePointer: string,
    node: Node,
  ): schemaIntermediateB.MapAssertion | undefined {
    const minimumProperties = this.selectValidationMinimumProperties(node);
    const maximumProperties = this.selectValidationMaximumProperties(node);

    const required = this.selectValidationRequired(node) ?? [];

    return {
      minimumProperties,
      maximumProperties,
      required,
    };
  }

  //#endregion

  //#region intermediate applicators

  protected getIntermediateReference(
    nodePointer: string,
    node: Node,
  ): schemaIntermediateB.Reference | undefined {
    const nodeRef = this.selectNodeRef(node);
    if (nodeRef != null) {
      const resolvedNodeUrl = this.resolveReferenceNodeUrl(nodeRef);
      const resolvedNodeId = resolvedNodeUrl.toString();
      return resolvedNodeId;
    }
  }
  protected getIntermediateAllOf(
    nodePointer: string,
    node: Node,
  ): schemaIntermediateB.AllOf | undefined {
    return this.mapEntriesToManyNodeIds(nodePointer, node, [
      ...this.selectSubNodeAllOfEntries(nodePointer, node),
    ]);
  }
  protected getIntermediateAnyOf(
    nodePointer: string,
    node: Node,
  ): schemaIntermediateB.AnyOf | undefined {
    return this.mapEntriesToManyNodeIds(nodePointer, node, [
      ...this.selectSubNodeAnyOfEntries(nodePointer, node),
    ]);
  }
  protected getIntermediateOneOf(
    nodePointer: string,
    node: Node,
  ): schemaIntermediateB.OneOf | undefined {
    return this.mapEntriesToManyNodeIds(nodePointer, node, [
      ...this.selectSubNodeOneOfEntries(nodePointer, node),
    ]);
  }

  protected getIntermediateNot(
    nodePointer: string,
    node: Node,
  ): schemaIntermediateB.Not | undefined {
    return this.mapEntriesToSingleNodeId(nodePointer, node, [
      ...this.selectSubNodeNotEntries(nodePointer, node),
    ]);
  }

  protected getIntermediateIf(
    nodePointer: string,
    node: Node,
  ): schemaIntermediateB.If | undefined {
    // not supported in draft-04
    return;
  }

  protected getIntermediateThen(
    nodePointer: string,
    node: Node,
  ): schemaIntermediateB.Then | undefined {
    // not supported in draft-04
    return;
  }

  protected getIntermediateElse(
    nodePointer: string,
    node: Node,
  ): schemaIntermediateB.Else | undefined {
    // not supported in draft-04
    return;
  }

  protected getIntermediateDependentSchemas(
    nodePointer: string,
    node: Node,
  ): schemaIntermediateB.DependentSchemas | undefined {
    // not supported in draft-04
    return;
  }

  protected getIntermediateTupleItems(
    nodePointer: string,
    node: Node,
  ): schemaIntermediateB.TupleItems | undefined {
    return this.mapEntriesToManyNodeIds(nodePointer, node, [
      ...this.selectSubNodeItemsManyEntries(nodePointer, node),
    ]);
  }

  protected getIntermediateArrayItems(
    nodePointer: string,
    node: Node,
  ): schemaIntermediateB.ArrayItems | undefined {
    return this.mapEntriesToSingleNodeId(nodePointer, node, [
      ...this.selectSubNodeItemsOneEntries(nodePointer, node),
      ...this.selectSubNodeAdditionalItemsEntries(nodePointer, node),
    ]);
  }

  protected getIntermediateContains(
    nodePointer: string,
    node: Node,
  ): schemaIntermediateB.Contains | undefined {
    // not supported in draft-04
    return;
  }

  protected getIntermediateObjectProperties(
    nodePointer: string,
    node: Node,
  ): schemaIntermediateB.ObjectProperties | undefined {
    return this.mapPointerEntriesRecord(nodePointer, node, [
      ...this.selectNodePropertiesPointerEntries(nodePointer, node),
    ]);
  }

  protected getIntermediateMapProperties(
    nodePointer: string,
    node: Node,
  ): schemaIntermediateB.MapProperties | undefined {
    return this.mapEntriesToSingleNodeId(nodePointer, node, [
      ...this.selectSubNodeAdditionalPropertiesEntries(nodePointer, node),
    ]);
  }
  protected getIntermediatePatternProperties(
    nodePointer: string,
    node: Node,
  ): schemaIntermediateB.PatternProperties | undefined {
    return this.mapPointerEntriesRecord(nodePointer, node, [
      ...this.selectNodePatternPropertyPointerEntries(nodePointer, node),
    ]);
  }
  protected getIntermediatePropertyNames(
    nodePointer: string,
    node: Node,
  ): schemaIntermediateB.PropertyNames | undefined {
    return;
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
        resolvedDocument.nodeNameMap.get(resolvedPointer);
      if (anchorResolvedPointer != null) {
        const anchorResolvedUrl = resolvedDocument.pointerToNodeUrl(
          anchorResolvedPointer,
        );
        return anchorResolvedUrl;
      }
    }

    return resolvedNodeUrl;
  }

  //#endregion

  //#region helpers

  private mapPointerEntriesRecord(
    nodePointer: string,
    node: Node,
    entries: Array<readonly [string, string]>,
  ): Record<string, string> | undefined {
    if (entries.length > 0) {
      const nodeIds = Object.fromEntries(
        entries.map(([key, nodePointer]) => {
          const nodeUrl = this.pointerToNodeUrl(nodePointer);
          const nodeId = String(nodeUrl);
          return [key, nodeId];
        }),
      );
      return nodeIds;
    }
  }

  private mapEntriesToManyNodeIds(
    nodePointer: string,
    node: Node,
    entries: Array<readonly [string, Node]>,
  ): Array<string> | undefined {
    if (entries.length > 0) {
      const nodeIds = entries.map(([typeNodePointer]) => {
        const nodeUrl = this.pointerToNodeUrl(typeNodePointer);
        const nodeId = String(nodeUrl);
        return nodeId;
      });
      return nodeIds;
    }
  }

  private mapEntriesToSingleNodeId(
    nodePointer: string,
    node: Node,
    entries: Array<readonly [string, Node]>,
  ): string | undefined {
    for (const [nodePointer] of entries) {
      const nodeUrl = this.pointerToNodeUrl(nodePointer);
      const nodeId = String(nodeUrl);
      return nodeId;
    }
  }

  private mapType(type: string) {
    switch (type) {
      case "never":
        return "never";
      case "any":
        return "any";
      case "null":
        return "null";
      case "boolean":
        return "boolean";
      case "integer":
        return "integer";
      case "number":
        return "number";
      case "string":
        return "string";
      case "array":
        return "array";
      case "object":
        return "map";
      default:
        throw new Error("unexpected type");
    }
  }

  private guessTypes(node: Node) {
    const nodeEnums = this.selectNodeEnum(node);
    const types = new Set<schemaIntermediateB.TypesSectionItems>();

    if (nodeEnums != null) {
      for (const nodeEnum in nodeEnums) {
        switch (typeof nodeEnum) {
          case "number":
            types.add("number");
            break;
          case "boolean":
            types.add("boolean");
            break;
          case "string":
            types.add("string");
            break;
          case "bigint":
            types.add("integer");
            break;

          default:
            throw new Error("unexpected enum type");
        }
      }
    }

    if (
      this.selectValidationMinimumInclusive(node) != null ||
      this.selectValidationMinimumExclusive(node) != null ||
      this.selectValidationMaximumInclusive(node) != null ||
      this.selectValidationMaximumExclusive(node) != null ||
      this.selectValidationMultipleOf(node) != null
    ) {
      types.add("number");
    }

    if (
      this.selectValidationMinimumLength(node) != null ||
      this.selectValidationMaximumLength(node) != null ||
      this.selectValidationValuePattern(node) != null ||
      this.selectValidationValueFormat(node) != null
    ) {
      types.add("string");
    }

    if (
      this.selectValidationMinimumItems(node) != null ||
      this.selectValidationMaximumItems(node) != null ||
      this.selectValidationUniqueItems(node) != null
    ) {
      types.add("array");
    }

    if (
      this.selectValidationMinimumItems(node) != null ||
      this.selectValidationMaximumItems(node) != null ||
      this.selectValidationUniqueItems(node) != null
    ) {
      types.add("array");
    }

    if (
      this.selectValidationMinimumProperties(node) != null ||
      this.selectValidationMaximumProperties(node) != null ||
      this.selectValidationRequired(node) != null
    ) {
      types.add("map");
    }

    if (
      [
        ...this.selectSubNodeItemsOneEntries("", node),
        ...this.selectSubNodeItemsManyEntries("", node),
        ...this.selectSubNodeAdditionalItemsEntries("", node),
      ].length > 0
    ) {
      types.add("array");
    }

    if (
      [
        ...this.selectSubNodePropertyEntries("", node),
        ...this.selectSubNodeAdditionalPropertiesEntries("", node),
        ...this.selectSubNodePatternPropertiesEntries("", node),
      ].length > 0
    ) {
      types.add("map");
    }

    return [...types];
  }

  //#endregion

  //#region core selectors

  protected selectNodeSchema(node: Node) {
    if (typeof node === "object") {
      return node.$schema;
    }
  }

  protected selectNodeId(node: Node) {
    if (typeof node === "object") {
      return node.id;
    }
  }

  protected selectNodeRef(node: Node) {
    // $ref is not in the schema
    if (
      typeof node === "object" &&
      "$ref" in node &&
      typeof node.$ref === "string"
    ) {
      return node.$ref;
    }
  }

  protected selectNodeTitle(node: Node) {
    if (typeof node === "object") {
      return node.title;
    }
  }

  protected selectNodeDescription(node: Node) {
    if (typeof node === "object") {
      return node.description;
    }
  }

  //#endregion

  //#region pointers selectors

  protected *selectNodePropertiesPointerEntries(
    nodePointer: string,
    node: Node,
  ) {
    if (typeof node === "object" && node.properties != null) {
      for (const key of Object.keys(node.properties)) {
        const subNodePointer = [nodePointer, "properties", key].join("/");
        yield [key, subNodePointer] as const;
      }
    }
  }

  protected *selectNodePatternPropertyPointerEntries(
    nodePointer: string,
    node: Node,
  ) {
    if (typeof node === "object" && node.patternProperties != null) {
      for (const key of Object.keys(node.patternProperties)) {
        const subNodePointer = [nodePointer, "patternProperties", key].join(
          "/",
        );
        yield [key, subNodePointer] as const;
      }
    }
  }

  //#endregion

  //#region schema selectors

  protected *selectSubNodeDefinitionsEntries(nodePointer: string, node: Node) {
    if (typeof node === "object" && node.definitions != null) {
      for (const [key, subNode] of Object.entries(node.definitions)) {
        const subNodePointer = [nodePointer, "definitions", key].join("/");
        yield [subNodePointer, subNode] as const;
      }
    }
  }

  protected *selectSubNodePropertyEntries(nodePointer: string, node: Node) {
    if (typeof node === "object" && node.properties != null) {
      for (const [key, subNode] of Object.entries(node.properties)) {
        const subNodePointer = [nodePointer, "properties", key].join("/");
        yield [subNodePointer, subNode] as const;
      }
    }
  }

  protected *selectSubNodeAdditionalPropertiesEntries(
    nodePointer: string,
    node: Node,
  ) {
    if (typeof node === "object") {
      if (node.additionalProperties != null) {
        const subNode = node.additionalProperties;
        const subNodePointer = [nodePointer, "additionalProperties"].join("/");
        yield [subNodePointer, subNode] as const;
      }
    }
  }

  protected *selectSubNodeItemsOneEntries(nodePointer: string, node: Node) {
    if (
      typeof node === "object" &&
      node.items != null &&
      !Array.isArray(node.items)
    ) {
      const subNode = node.items;
      const subNodePointer = [nodePointer, "items"].join("/");
      yield [subNodePointer, subNode] as const;
    }
  }

  protected *selectSubNodeItemsManyEntries(nodePointer: string, node: Node) {
    if (
      typeof node === "object" &&
      node.items != null &&
      Array.isArray(node.items)
    ) {
      for (const [key, subNode] of Object.entries(node.items)) {
        const subNodePointer = [nodePointer, "items", key].join("/");
        yield [subNodePointer, subNode] as [string, Node];
      }
    }
  }

  protected *selectSubNodeAdditionalItemsEntries(
    nodePointer: string,
    node: Node,
  ) {
    if (typeof node === "object") {
      if (node.additionalItems != null) {
        const subNode = node.additionalItems;
        const subNodePointer = [nodePointer, "additionalItems"].join("/");
        yield [subNodePointer, subNode] as const;
      }
    }
  }

  protected *selectSubNodePatternPropertiesEntries(
    nodePointer: string,
    node: Node,
  ) {
    if (typeof node === "object" && node.patternProperties != null) {
      for (const [key, subNode] of Object.entries(node.patternProperties)) {
        const subNodePointer = [nodePointer, "patternProperties", key].join(
          "/",
        );
        yield [subNodePointer, subNode] as const;
      }
    }
  }

  protected *selectSubNodeAnyOfEntries(nodePointer: string, node: Node) {
    if (typeof node === "object" && node.anyOf != null) {
      for (const [key, subNode] of Object.entries(node.anyOf)) {
        const subNodePointer = [nodePointer, "anyOf", key].join("/");
        yield [subNodePointer, subNode] as [string, Node];
      }
    }
  }

  protected *selectSubNodeOneOfEntries(nodePointer: string, node: Node) {
    if (typeof node === "object" && node.oneOf != null) {
      for (const [key, subNode] of Object.entries(node.oneOf)) {
        const subNodePointer = [nodePointer, "oneOf", key].join("/");
        yield [subNodePointer, subNode] as [string, Node];
      }
    }
  }

  protected *selectSubNodeAllOfEntries(nodePointer: string, node: Node) {
    if (typeof node === "object" && node.allOf != null) {
      for (const [key, subNode] of Object.entries(node.allOf)) {
        const subNodePointer = [nodePointer, "allOf", key].join("/");
        yield [subNodePointer, subNode] as [string, Node];
      }
    }
  }

  protected *selectSubNodeNotEntries(nodePointer: string, node: Node) {
    if (typeof node === "object" && node.not != null) {
      const subNode = node.not;
      const subNodePointer = [nodePointer, "not"].join("/");
      yield [subNodePointer, subNode] as const;
    }
  }

  protected *selectSubNodes(
    nodePointer: string,
    node: Node,
  ): Iterable<readonly [string, Node]> {
    yield* this.selectSubNodeDefinitionsEntries(nodePointer, node);
    yield* this.selectSubNodePropertyEntries(nodePointer, node);
    yield* this.selectSubNodeAdditionalPropertiesEntries(nodePointer, node);
    yield* this.selectSubNodePatternPropertiesEntries(nodePointer, node);
    yield* this.selectSubNodeItemsOneEntries(nodePointer, node);
    yield* this.selectSubNodeItemsManyEntries(nodePointer, node);
    yield* this.selectSubNodeAdditionalItemsEntries(nodePointer, node);
    yield* this.selectSubNodeAllOfEntries(nodePointer, node);
    yield* this.selectSubNodeAnyOfEntries(nodePointer, node);
    yield* this.selectSubNodeOneOfEntries(nodePointer, node);
    yield* this.selectSubNodeNotEntries(nodePointer, node);
  }

  //#endregion

  //#region type selectors

  protected selectNodeTypes(node: Node) {
    if (typeof node === "object" && node.type != null) {
      if (Array.isArray(node.type)) {
        return node.type;
      } else {
        return [node.type];
      }
    }
  }

  protected *selectNodePropertyNamesEntries(nodePointer: string, node: Node) {
    if (typeof node === "object" && node.properties != null) {
      for (const propertyName of Object.keys(node.properties)) {
        const subNodePointer = [nodePointer, "properties", propertyName].join(
          "/",
        );
        yield [subNodePointer, propertyName] as const;
      }
    }
  }

  protected selectNodeEnum(node: Node) {
    if (typeof node === "object") {
      return node.enum;
    }
  }

  //#endregion

  //#region validation selectors

  protected selectValidationMaximumProperties(node: Node) {
    if (typeof node === "object") {
      return node.maxProperties;
    }
  }

  protected selectValidationMinimumProperties(node: Node) {
    if (typeof node === "object") {
      return node.minProperties;
    }
  }

  protected selectValidationRequired(node: Node) {
    if (typeof node === "object") {
      return node.required as string[];
    }
  }

  protected selectValidationMinimumItems(node: Node) {
    if (typeof node === "object") {
      return node.minItems;
    }
  }

  protected selectValidationMaximumItems(node: Node) {
    if (typeof node === "object") {
      return node.maxItems;
    }
  }

  protected selectValidationUniqueItems(node: Node) {
    if (typeof node === "object") {
      return node.uniqueItems;
    }
  }

  protected selectValidationMinimumLength(node: Node) {
    if (typeof node === "object") {
      return node.minLength;
    }
  }

  protected selectValidationMaximumLength(node: Node) {
    if (typeof node === "object") {
      return node.maxLength;
    }
  }

  protected selectValidationValuePattern(node: Node) {
    if (typeof node === "object") {
      return node.pattern;
    }
  }

  protected selectValidationValueFormat(node: Node) {
    if (typeof node === "object") {
      return node.format;
    }
  }

  protected selectValidationMinimumInclusive(node: Node) {
    if (typeof node === "object") {
      if (node.exclusiveMinimum ?? false) {
        return;
      } else {
        return node.minimum;
      }
    }
  }

  protected selectValidationMinimumExclusive(node: Node) {
    if (typeof node === "object") {
      if (node.exclusiveMinimum ?? false) {
        return node.minimum;
      } else {
        return;
      }
    }
  }

  protected selectValidationMaximumInclusive(node: Node) {
    if (typeof node === "object") {
      if (node.exclusiveMaximum ?? false) {
        return;
      } else {
        return node.maximum;
      }
    }
  }

  protected selectValidationMaximumExclusive(node: Node) {
    if (typeof node === "object") {
      if (node.exclusiveMaximum ?? false) {
        return node.maximum;
      } else {
        return;
      }
    }
  }

  protected selectValidationMultipleOf(node: Node) {
    if (typeof node === "object") {
      return node.multipleOf;
    }
  }

  protected selectValidationEnum(node: Node) {
    if (typeof node === "object") {
      return node.enum;
    }
  }

  //#endregion
}
