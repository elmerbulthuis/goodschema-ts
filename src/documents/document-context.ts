import * as schemaIntermediateB from "@jns42/jns42-schema-intermediate-b";
import { discoverSchemaId, loadJSON } from "../utils/index.js";
import { DocumentBase } from "./document-base.js";
import { SchemaDocumentBase } from "./schema-document-base.js";

export interface DocumentInitializer<N = unknown> {
  retrievalUrl: URL;
  givenUrl: URL;
  antecedentUrl: URL | null;
  documentNode: N;
}

export type DocumentFactory<N = unknown> = (
  initializer: DocumentInitializer<N>,
) => DocumentBase<N>;

export class DocumentContext {
  private retrieved = new Set<string>();
  /**
   * document factories by schema identifier
   */
  private factories = new Map<string, DocumentFactory>();
  /**
   * all documents, indexed by document id
   */
  private documents = new Map<string, DocumentBase>();
  /**
   * maps node urls to their documents
   */
  private nodeDocuments = new Map<string, URL>();

  public registerFactory(schema: string, factory: DocumentFactory) {
    /**
     * no check if the factory is already registered here so we can
     * override factories
     */
    this.factories.set(schema, factory);
  }

  public getIntermediateData(): schemaIntermediateB.SchemaJson {
    return {
      $schema:
        "https://schema.JsonSchema42.org/jns42-intermediate-b/schema.json",
      nodes: Object.fromEntries(this.getIntermediateNodeEntries()),
    };
  }

  public *getIntermediateNodeEntries(): Iterable<
    readonly [string, schemaIntermediateB.Node]
  > {
    for (const document of this.documents.values()) {
      yield* document.getIntermediateNodeEntries();
    }
  }

  public getDocument(documentUrl: URL) {
    const documentId = documentUrl.toString();
    const document = this.documents.get(documentId);
    if (document == null) {
      throw new TypeError(`document not found ${documentId}`);
    }
    return document;
  }

  public getDocumentForNode(nodeUrl: URL) {
    const nodeId = nodeUrl.toString();
    const documentUrl = this.nodeDocuments.get(nodeId);
    if (documentUrl == null) {
      throw new TypeError(`document not found for node ${nodeId}`);
    }
    return this.getDocument(documentUrl);
  }

  public async loadFromUrl(
    retrievalUrl: URL,
    givenUrl: URL,
    antecedentUrl: URL | null,
    defaultSchemaId: string,
  ) {
    retrievalUrl = new URL("", retrievalUrl);

    const retrievalId = retrievalUrl.toString();
    if (this.retrieved.has(retrievalId)) {
      return;
    }
    this.retrieved.add(retrievalId);

    const node = await loadJSON(retrievalUrl);
    await this.loadFromNode(
      retrievalUrl,
      givenUrl,
      antecedentUrl,
      node,
      defaultSchemaId,
    );
  }

  public async loadFromNode(
    retrievalUrl: URL,
    givenUrl: URL,
    antecedentUrl: URL | null,
    documentNode: unknown,
    defaultSchemaId: string,
  ) {
    retrievalUrl = new URL("", retrievalUrl);

    const retrievalId = retrievalUrl.toString();
    this.retrieved.add(retrievalId);

    const schemaId = discoverSchemaId(documentNode) ?? defaultSchemaId;
    const factory = this.factories.get(schemaId);
    if (factory == null) {
      throw new TypeError(`no factory found for ${schemaId}`);
    }
    const document = factory({
      retrievalUrl,
      givenUrl,
      antecedentUrl,
      documentNode,
    });
    const documentId = document.documentNodeUrl.toString();
    if (this.documents.has(documentId)) {
      throw new TypeError(`duplicate document ${documentId}`);
    }
    this.documents.set(documentId, document);

    for (const nodeUrl of document.getNodeUrls()) {
      const nodeId = nodeUrl.toString();
      if (this.nodeDocuments.has(nodeId)) {
        throw new TypeError(`duplicate node with id ${nodeId}`);
      }
      this.nodeDocuments.set(nodeId, document.documentNodeUrl);
    }

    if (document instanceof SchemaDocumentBase) {
      await this.loadFromSchemaDocument(retrievalUrl, document, schemaId);
    }
  }

  private async loadFromSchemaDocument(
    retrievalUrl: URL,
    document: SchemaDocumentBase,
    defaultSchemaId: string,
  ) {
    for (const {
      retrievalUrl: referencedRetrievalUrl,
      givenUrl: referencedGivenUrl,
    } of document.getReferencedDocuments(retrievalUrl)) {
      await this.loadFromUrl(
        referencedRetrievalUrl,
        referencedGivenUrl,
        document.documentNodeUrl,
        defaultSchemaId,
      );
    }

    for (const {
      retrievalUrl: embeddedRetrievalUrl,
      givenUrl: embeddedGivenUrl,
      node,
    } of document.getEmbeddedDocuments(retrievalUrl)) {
      await this.loadFromNode(
        embeddedRetrievalUrl,
        embeddedGivenUrl,
        document.documentNodeUrl,
        node,
        defaultSchemaId,
      );
    }
  }
}
