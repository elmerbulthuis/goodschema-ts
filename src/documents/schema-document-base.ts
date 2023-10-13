import * as schemaIntermediateB from "@jns42/jns42-schema-intermediate-b";
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

  protected abstract isNodeEmbeddedSchema(node: N): boolean;

  /**
   * get all embedded document nodes
   */
  public *getEmbeddedDocuments(retrievalUrl: URL): Iterable<EmbeddedDocument> {
    const queue = new Array<readonly [string, N]>();
    queue.push(
      ...this.selectSubNodes(this.documentNodePointer, this.documentNode),
    );

    let pair: readonly [string, N] | undefined;
    while ((pair = queue.shift()) != null) {
      const [nodePointer, node] = pair;

      const nodeId = this.selectNodeId(node);
      if (nodeId == null || !this.isNodeEmbeddedSchema(node)) {
        queue.push(...this.selectSubNodes(nodePointer, node));

        continue;
      }
      yield {
        node,
        retrievalUrl: new URL("", new URL(nodeId, retrievalUrl)),
        givenUrl: new URL("", new URL(nodeId, this.documentNodeUrl)),
      };
    }
  }
  /**
   * get all references to other documents
   */
  public *getReferencedDocuments(
    retrievalUrl: URL,
  ): Iterable<ReferencedDocument> {
    for (const [, node] of this.nodes) {
      const nodeRef = this.selectNodeRef(node);
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

  protected *getNodePairs(): Iterable<readonly [string, N]> {
    const queue = new Array<readonly [string, N]>();
    queue.push(
      ...this.selectSubNodes(this.documentNodePointer, this.documentNode),
    );

    yield [this.documentNodePointer, this.documentNode];

    let pair: readonly [string, N] | undefined;
    while ((pair = queue.shift()) != null) {
      const [nodePointer, node] = pair;

      const nodeId = this.selectNodeId(node);
      if (nodeId == null || nodeId.startsWith("#")) {
        queue.push(...this.selectSubNodes(nodePointer, node));

        yield pair;
      }
    }
  }

  protected getDocumentNodeUrl(): URL | null {
    const nodeId = this.selectNodeId(this.documentNode);
    if (nodeId == null) {
      return null;
    }
    const nodeUrl =
      this.antecedentUrl == null
        ? new URL(nodeId)
        : new URL(nodeId, this.antecedentUrl);
    return nodeUrl;
  }

  public pointerToNodeUrl(nodePointer: string): URL {
    return new URL(this.pointerToNodeHash(nodePointer), this.documentNodeUrl);
  }
  public nodeUrlToPointer(nodeUrl: URL): string {
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

  public *getIntermediateNodeEntries(): Iterable<
    readonly [string, schemaIntermediateB.Node]
  > {
    for (const [nodePointer, node] of this.nodes) {
      const nodeUrl = this.pointerToNodeUrl(nodePointer);
      const nodeId = nodeUrl.toString();

      const metadata = this.getIntermediateMetadataSection(nodePointer, node);
      const types = this.getIntermediateTypesSection(nodePointer, node);
      const assertions = this.getIntermediateAssertionsSection(
        nodePointer,
        node,
      );
      const applicators = this.getIntermediateApplicatorsSection(
        nodePointer,
        node,
      );

      yield [
        nodeId,
        {
          metadata,
          types,
          assertions,
          applicators,
        },
      ];
    }
  }
  protected abstract getIntermediateMetadataSection(
    nodePointer: string,
    node: N,
  ): schemaIntermediateB.MetadataSection;
  protected abstract getIntermediateTypesSection(
    nodePointer: string,
    node: N,
  ): schemaIntermediateB.TypesSection;
  protected getIntermediateAssertionsSection(
    nodePointer: string,
    node: N,
  ): schemaIntermediateB.AssertionsSection {
    const booleanAssertions = this.getIntermediateBooleanAssertion(
      nodePointer,
      node,
    );
    const integerAssertions = this.getIntermediateIntegerAssertion(
      nodePointer,
      node,
    );
    const numberAssertions = this.getIntermediateNumberAssertion(
      nodePointer,
      node,
    );
    const stringAssertions = this.getIntermediateStringAssertion(
      nodePointer,
      node,
    );
    const arrayAssertions = this.getIntermediateArrayAssertion(
      nodePointer,
      node,
    );
    const mapAssertions = this.getIntermediateMapAssertion(nodePointer, node);

    return {
      boolean: booleanAssertions,
      integer: integerAssertions,
      number: numberAssertions,
      string: stringAssertions,
      array: arrayAssertions,
      map: mapAssertions,
    };
  }
  protected getIntermediateApplicatorsSection(
    nodePointer: string,
    node: N,
  ): schemaIntermediateB.ApplicatorsSection {
    const reference = this.getIntermediateReference(nodePointer, node);
    const allOf = this.getIntermediateAllOf(nodePointer, node);
    const anyOf = this.getIntermediateAnyOf(nodePointer, node);
    const oneOf = this.getIntermediateOneOf(nodePointer, node);

    const not = this.getIntermediateNot(nodePointer, node);
    const $if = this.getIntermediateIf(nodePointer, node);
    const then = this.getIntermediateThen(nodePointer, node);
    const $else = this.getIntermediateElse(nodePointer, node);

    const dependentSchemas = this.getIntermediateDependentSchemas(
      nodePointer,
      node,
    );

    const tupleItems = this.getIntermediateTupleItems(nodePointer, node);
    const arrayItems = this.getIntermediateArrayItems(nodePointer, node);
    const contains = this.getIntermediateContains(nodePointer, node);

    const objectProperties = this.getIntermediateObjectProperties(
      nodePointer,
      node,
    );
    const mapProperties = this.getIntermediateMapProperties(nodePointer, node);
    const patternProperties = this.getIntermediatePatternProperties(
      nodePointer,
      node,
    );
    const propertyNames = this.getIntermediatePropertyNames(nodePointer, node);

    return {
      reference,
      allOf,
      anyOf,
      oneOf,
      not,
      if: $if,
      then,
      else: $else,
      dependentSchemas,
      tupleItems,
      arrayItems,
      contains,
      objectProperties,
      mapProperties,
      patternProperties,
      propertyNames,
    };
  }

  //#region intermediate assertions

  protected abstract getIntermediateBooleanAssertion(
    nodePointer: string,
    node: N,
  ): schemaIntermediateB.BooleanAssertion | undefined;
  protected abstract getIntermediateIntegerAssertion(
    nodePointer: string,
    node: N,
  ): schemaIntermediateB.IntegerAssertion | undefined;
  protected abstract getIntermediateNumberAssertion(
    nodePointer: string,
    node: N,
  ): schemaIntermediateB.NumberAssertion | undefined;
  protected abstract getIntermediateStringAssertion(
    nodePointer: string,
    node: N,
  ): schemaIntermediateB.StringAssertion | undefined;
  protected abstract getIntermediateArrayAssertion(
    nodePointer: string,
    node: N,
  ): schemaIntermediateB.ArrayAssertion | undefined;
  protected abstract getIntermediateMapAssertion(
    nodePointer: string,
    node: N,
  ): schemaIntermediateB.MapAssertion | undefined;

  //#endregion

  //#region intermediate applicators

  protected abstract getIntermediateReference(
    nodePointer: string,
    node: N,
  ): schemaIntermediateB.Reference | undefined;
  protected abstract getIntermediateAllOf(
    nodePointer: string,
    node: N,
  ): schemaIntermediateB.AllOf | undefined;
  protected abstract getIntermediateAnyOf(
    nodePointer: string,
    node: N,
  ): schemaIntermediateB.AnyOf | undefined;
  protected abstract getIntermediateOneOf(
    nodePointer: string,
    node: N,
  ): schemaIntermediateB.OneOf | undefined;

  protected abstract getIntermediateNot(
    nodePointer: string,
    node: N,
  ): schemaIntermediateB.Not | undefined;
  protected abstract getIntermediateIf(
    nodePointer: string,
    node: N,
  ): schemaIntermediateB.If | undefined;
  protected abstract getIntermediateThen(
    nodePointer: string,
    node: N,
  ): schemaIntermediateB.Then | undefined;
  protected abstract getIntermediateElse(
    nodePointer: string,
    node: N,
  ): schemaIntermediateB.Else | undefined;

  protected abstract getIntermediateDependentSchemas(
    nodePointer: string,
    node: N,
  ): schemaIntermediateB.DependentSchemas | undefined;

  protected abstract getIntermediateTupleItems(
    nodePointer: string,
    node: N,
  ): schemaIntermediateB.TupleItems | undefined;
  protected abstract getIntermediateArrayItems(
    nodePointer: string,
    node: N,
  ): schemaIntermediateB.ArrayItems | undefined;
  protected abstract getIntermediateContains(
    nodePointer: string,
    node: N,
  ): schemaIntermediateB.Contains | undefined;

  protected abstract getIntermediateObjectProperties(
    nodePointer: string,
    node: N,
  ): schemaIntermediateB.ObjectProperties | undefined;
  protected abstract getIntermediateMapProperties(
    nodePointer: string,
    node: N,
  ): schemaIntermediateB.MapProperties | undefined;
  protected abstract getIntermediatePatternProperties(
    nodePointer: string,
    node: N,
  ): schemaIntermediateB.PatternProperties | undefined;
  protected abstract getIntermediatePropertyNames(
    nodePointer: string,
    node: N,
  ): schemaIntermediateB.PropertyNames | undefined;

  //#endregion

  //#region selectors

  protected abstract selectNodeSchema(node: N): string | undefined;
  protected abstract selectNodeId(node: N): string | undefined;
  protected abstract selectNodeRef(node: N): string | undefined;

  protected abstract selectSubNodes(
    nodePointer: string,
    node: N,
  ): Iterable<readonly [string, N]>;

  //#endregion
}
