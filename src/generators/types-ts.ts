import ts from "typescript";
import { choose } from "../main.js";
import { CodeGeneratorBase } from "./code-generator-base.js";

export class TypesTsCodeGenerator extends CodeGeneratorBase {
  public *getStatements() {
    for (const nodeId in this.nodes) {
      yield this.generateTypeDeclarationStatement(nodeId);
    }
  }

  protected generateTypeDeclarationStatement(nodeId: string) {
    const node = this.nodes[nodeId];

    const typeDefinition = this.generateTypeDefinition(nodeId);

    const typeName = this.getTypeName(nodeId);
    const declaration = this.factory.createTypeAliasDeclaration(
      [this.factory.createToken(ts.SyntaxKind.ExportKeyword)],
      typeName,
      undefined,
      typeDefinition,
    );

    const comments = [
      node.metadata.title ?? "",
      node.metadata.description ?? "",
      node.metadata.deprecated ? "@deprecated" : "",
    ]
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => line + "\n")
      .join("");

    if (comments.length > 0) {
      ts.addSyntheticLeadingComment(
        declaration,
        ts.SyntaxKind.MultiLineCommentTrivia,
        "*\n" + comments,
        true,
      );
    }

    return declaration;
  }

  protected generateTypeDefinition(nodeId: string): ts.TypeNode {
    const { factory: f } = this;

    const typeElements = [...this.generateTypeDefinitionElements(nodeId)];
    const compoundElements = [
      ...this.generateCompoundDefinitionElements(nodeId),
    ];

    let typeDefinitionNode: ts.TypeNode | undefined;
    if (compoundElements.length > 0) {
      const typeNode = f.createParenthesizedType(
        f.createIntersectionTypeNode(compoundElements),
      );
      typeDefinitionNode =
        typeDefinitionNode == null
          ? typeNode
          : f.createParenthesizedType(
              f.createIntersectionTypeNode([typeDefinitionNode, typeNode]),
            );
    }
    if (typeElements.length > 0) {
      const typeNode = f.createParenthesizedType(
        f.createUnionTypeNode(typeElements),
      );
      typeDefinitionNode =
        typeDefinitionNode == null
          ? typeNode
          : f.createParenthesizedType(
              f.createIntersectionTypeNode([typeDefinitionNode, typeNode]),
            );
    }

    if (typeDefinitionNode == null) {
      typeDefinitionNode = f.createKeywordTypeNode(
        ts.SyntaxKind.UnknownKeyword,
      );
    }

    return typeDefinitionNode;
  }

  protected *generateTypeDefinitionElements(
    nodeId: string,
  ): Iterable<ts.TypeNode> {
    const node = this.nodes[nodeId];
    for (const type of node.types) {
      switch (type) {
        case "never":
          yield this.generateNeverTypeDefinition(nodeId);
          break;

        case "any":
          yield this.generateAnyTypeDefinition(nodeId);
          break;

        case "null":
          yield this.generateNullTypeDefinition(nodeId);
          break;

        case "boolean":
          yield this.generateBooleanTypeDefinition(nodeId);
          break;

        case "integer":
          yield this.generateIntegerTypeDefinition(nodeId);
          break;

        case "number":
          yield this.generateNumberTypeDefinition(nodeId);
          break;

        case "string":
          yield this.generateStringTypeDefinition(nodeId);
          break;

        case "array":
          yield this.generateArrayTypeDefinition(nodeId);
          break;

        case "map":
          yield this.generateMapTypeDefinition(nodeId);
          break;

        default:
          throw new Error("type not supported");
      }
    }
  }

  protected *generateCompoundDefinitionElements(
    nodeId: string,
  ): Iterable<ts.TypeNode> {
    let node = this.nodes[nodeId];

    if (node.applicators.reference != null) {
      yield this.generateReferenceCompoundDefinition(
        node.applicators.reference,
      );
    }
    if (node.applicators.oneOf != null) {
      yield this.generateOneOfCompoundDefinition(node.applicators.oneOf);
    }
    if (node.applicators.anyOf != null) {
      yield this.generateAnyOfCompoundDefinition(node.applicators.anyOf);
    }
    if (node.applicators.allOf != null) {
      yield this.generateAllOfCompoundDefinition(node.applicators.allOf);
    }
    if (node.applicators.if != null) {
      yield this.generateIfCompoundDefinition(
        node.applicators.if,
        node.applicators.then,
        node.applicators.else,
      );
    }
    if (node.applicators.not != null) {
      yield this.generateNotCompoundDefinition(node.applicators.not);
    }
  }

  protected generateNeverTypeDefinition(nodeId: string): ts.TypeNode {
    return this.factory.createKeywordTypeNode(ts.SyntaxKind.NeverKeyword);
  }
  protected generateAnyTypeDefinition(nodeId: string): ts.TypeNode {
    return this.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
  }
  protected generateNullTypeDefinition(nodeId: string): ts.TypeNode {
    return this.factory.createLiteralTypeNode(this.factory.createNull());
  }
  protected generateBooleanTypeDefinition(nodeId: string): ts.TypeNode {
    let node = this.nodes[nodeId];
    let options = node.assertions.boolean?.options;

    if (options == null) {
      return this.factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword);
    }

    return this.factory.createUnionTypeNode(
      options.map((option) =>
        this.factory.createLiteralTypeNode(
          option ? this.factory.createTrue() : this.factory.createFalse(),
        ),
      ),
    );
  }
  protected generateIntegerTypeDefinition(nodeId: string): ts.TypeNode {
    let node = this.nodes[nodeId];
    let options = node.assertions.integer?.options;

    if (options == null) {
      return this.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
    }

    return this.factory.createUnionTypeNode(
      options.map((option) =>
        this.factory.createLiteralTypeNode(
          this.factory.createNumericLiteral(option),
        ),
      ),
    );
  }
  protected generateNumberTypeDefinition(nodeId: string): ts.TypeNode {
    let node = this.nodes[nodeId];
    let options = node.assertions.number?.options;

    if (options == null) {
      return this.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
    }

    return this.factory.createUnionTypeNode(
      options.map((option) =>
        this.factory.createLiteralTypeNode(
          this.factory.createNumericLiteral(option),
        ),
      ),
    );
  }
  protected generateStringTypeDefinition(nodeId: string): ts.TypeNode {
    let node = this.nodes[nodeId];
    let options = node.assertions.string?.options;

    if (options == null) {
      return this.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);
    }

    return this.factory.createUnionTypeNode(
      options.map((option) =>
        this.factory.createLiteralTypeNode(
          this.factory.createStringLiteral(option),
        ),
      ),
    );
  }
  protected generateArrayTypeDefinition(nodeId: string): ts.TypeNode {
    let node = this.nodes[nodeId];
    let tupleItems = node.applicators.tupleItems;
    let arrayItems = node.applicators.arrayItems;

    if (arrayItems != null) {
      const elements = [...(tupleItems || []), arrayItems]
        .filter((nodeId) => nodeId != null)
        .map((nodeId) => nodeId as string)
        .map((nodeId) => this.generateTypeReference(nodeId));

      return this.factory.createArrayTypeNode(
        this.factory.createUnionTypeNode(elements),
      );
    }

    if (tupleItems != null) {
      const elements = tupleItems.map((nodeId) =>
        this.generateTypeReference(nodeId),
      );
      return this.factory.createTupleTypeNode(elements);
    }

    {
      const element = this.factory.createKeywordTypeNode(
        ts.SyntaxKind.UnknownKeyword,
      );
      return this.factory.createArrayTypeNode(element);
    }
  }
  protected generateMapTypeDefinition(nodeId: string): ts.TypeNode {
    let node = this.nodes[nodeId];
    let objectProperties = node.applicators.objectProperties;
    let patternProperties = node.applicators.patternProperties;
    let mapProperties = node.applicators.mapProperties;
    let propertyNames = node.applicators.propertyNames;
    let required = new Set(node.assertions.map?.required);

    const propertyNameElement =
      propertyNames == null
        ? this.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
        : this.generateTypeReference(propertyNames);

    const unionElements = new Array<ts.TypeNode>();

    if (mapProperties != null) {
      const typeElement = this.generateTypeReference(mapProperties);

      unionElements.push(
        this.factory.createTypeReferenceNode(
          this.factory.createIdentifier("Record"),
          [propertyNameElement, typeElement],
        ),
      );
    }

    if (patternProperties != null) {
      for (const patternProperty of Object.values(patternProperties)) {
        const typeElement = this.generateTypeReference(patternProperty);

        unionElements.push(
          this.factory.createTypeReferenceNode(
            this.factory.createIdentifier("Record"),
            [propertyNameElement, typeElement],
          ),
        );
      }
    }

    if (objectProperties != null) {
      const members = Object.entries(objectProperties).map(([name, nodeId]) =>
        this.factory.createPropertySignature(
          undefined,
          this.factory.createIdentifier(name),
          required.has(name)
            ? undefined
            : this.factory.createToken(ts.SyntaxKind.QuestionToken),
          this.generateTypeReference(nodeId),
        ),
      );
      unionElements.push(this.factory.createTypeLiteralNode(members));
    }

    if (unionElements.length === 0) {
      const element = this.factory.createKeywordTypeNode(
        ts.SyntaxKind.UnknownKeyword,
      );
      return this.factory.createTypeReferenceNode(
        this.factory.createIdentifier("Record"),
        [propertyNameElement, element],
      );
    }

    if (unionElements.length == 1) {
      return unionElements[0];
    }

    {
      return this.factory.createUnionTypeNode(unionElements);
    }
  }

  protected generateOneOfCompoundDefinition(oneOf: string[]) {
    const types = oneOf.map((nodeId) => this.generateTypeReference(nodeId));
    return this.factory.createUnionTypeNode(types);
  }
  protected generateAnyOfCompoundDefinition(anyOf: string[]) {
    const unionTypes = new Array<ts.TypeNode>();
    for (let count = 0; count < anyOf.length; count++) {
      for (const intersectionTypes of choose(anyOf, count + 1)) {
        unionTypes.push(
          this.factory.createIntersectionTypeNode(
            intersectionTypes.map((nodeId) =>
              this.generateTypeReference(nodeId),
            ),
          ),
        );
      }
    }
    return this.factory.createUnionTypeNode(unionTypes);
  }
  protected generateAllOfCompoundDefinition(allOf: string[]) {
    const types = allOf.map((nodeId) => this.generateTypeReference(nodeId));
    return this.factory.createIntersectionTypeNode(types);
  }
  protected generateReferenceCompoundDefinition(reference: string) {
    return this.generateTypeReference(reference);
  }
  protected generateIfCompoundDefinition(
    $if: string,
    then?: string,
    $else?: string,
  ) {
    const ifElement = this.generateTypeReference($if);

    let elements = new Array<ts.TypeNode>();
    if (then != null) {
      elements.push(
        this.factory.createIntersectionTypeNode([
          ifElement,
          this.generateTypeReference(then),
        ]),
      );
    } else {
      elements.push(ifElement);
    }

    if ($else != null) {
      elements.push(this.generateTypeReference($else));
    }

    return this.factory.createUnionTypeNode(elements);
  }
  protected generateNotCompoundDefinition(not: string) {
    return this.generateTypeReference(not);
  }
}
