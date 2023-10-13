import {
  Node,
  SchemaJson,
  isSchemaJson,
} from "@jns42/jns42-schema-intermediate-b";
import { DocumentBase } from "../document-base.js";

export class Document extends DocumentBase<SchemaJson> {
  constructor(
    public readonly documentNodeUrl: URL,
    documentNode: unknown,
  ) {
    super(documentNode);
  }

  protected isDocumentNode(node: unknown): node is SchemaJson {
    return isSchemaJson(node);
  }

  public getIntermediateNodeEntries(): Iterable<readonly [string, Node]> {
    return Object.entries(this.documentNode.nodes);
  }

  public getNodeUrls(): Iterable<URL> {
    return Object.keys(this.documentNode.nodes).map((id) => new URL(id));
  }
}
