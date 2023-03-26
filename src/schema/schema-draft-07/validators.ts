/* eslint-disable */
import * as validation from "../../includes/validation.js";
import * as types from "./types.js";
export function* validateSchema(value: types.Schema, path: string[] = []): Iterable<validation.PathError> {
    if (validation.isValidBooleanType(value)) {
    }
    else if (validation.isValidObjectType(value)) {
        if (value["$id"] !== undefined) {
            yield* validateSchemaId(value["$id"], [...path, "$id"]);
        }
        if (value["$schema"] !== undefined) {
            yield* validateSchemaSchema(value["$schema"], [...path, "$schema"]);
        }
        if (value["$ref"] !== undefined) {
            yield* validateSchemaRef(value["$ref"], [...path, "$ref"]);
        }
        if (value["$comment"] !== undefined) {
            yield* validateSchemaComment(value["$comment"], [...path, "$comment"]);
        }
        if (value["title"] !== undefined) {
            yield* validateSchemaTitle(value["title"], [...path, "title"]);
        }
        if (value["description"] !== undefined) {
            yield* validateSchemaDescription(value["description"], [...path, "description"]);
        }
        if (value["default"] !== undefined) {
            yield* validateSchemaDefault(value["default"], [...path, "default"]);
        }
        if (value["readOnly"] !== undefined) {
            yield* validateSchemaReadonly(value["readOnly"], [...path, "readOnly"]);
        }
        if (value["writeOnly"] !== undefined) {
            yield* validateSchemaWriteonly(value["writeOnly"], [...path, "writeOnly"]);
        }
        if (value["examples"] !== undefined) {
            yield* validateSchemaExamples(value["examples"], [...path, "examples"]);
        }
        if (value["multipleOf"] !== undefined) {
            yield* validateSchemaMultipleof(value["multipleOf"], [...path, "multipleOf"]);
        }
        if (value["maximum"] !== undefined) {
            yield* validateSchemaMaximum(value["maximum"], [...path, "maximum"]);
        }
        if (value["exclusiveMaximum"] !== undefined) {
            yield* validateSchemaExclusivemaximum(value["exclusiveMaximum"], [...path, "exclusiveMaximum"]);
        }
        if (value["minimum"] !== undefined) {
            yield* validateSchemaMinimum(value["minimum"], [...path, "minimum"]);
        }
        if (value["exclusiveMinimum"] !== undefined) {
            yield* validateSchemaExclusiveminimum(value["exclusiveMinimum"], [...path, "exclusiveMinimum"]);
        }
        if (value["maxLength"] !== undefined) {
            yield* validateSchemaMaxlength(value["maxLength"], [...path, "maxLength"]);
        }
        if (value["minLength"] !== undefined) {
            yield* validateSchemaMinlength(value["minLength"], [...path, "minLength"]);
        }
        if (value["pattern"] !== undefined) {
            yield* validateSchemaPattern(value["pattern"], [...path, "pattern"]);
        }
        if (value["additionalItems"] !== undefined) {
            yield* validateSchemaAdditionalitems(value["additionalItems"], [...path, "additionalItems"]);
        }
        if (value["items"] !== undefined) {
            yield* validateSchemaItems(value["items"], [...path, "items"]);
        }
        if (value["maxItems"] !== undefined) {
            yield* validateSchemaMaxitems(value["maxItems"], [...path, "maxItems"]);
        }
        if (value["minItems"] !== undefined) {
            yield* validateSchemaMinitems(value["minItems"], [...path, "minItems"]);
        }
        if (value["uniqueItems"] !== undefined) {
            yield* validateSchemaUniqueitems(value["uniqueItems"], [...path, "uniqueItems"]);
        }
        if (value["contains"] !== undefined) {
            yield* validateSchemaContains(value["contains"], [...path, "contains"]);
        }
        if (value["maxProperties"] !== undefined) {
            yield* validateSchemaMaxproperties(value["maxProperties"], [...path, "maxProperties"]);
        }
        if (value["minProperties"] !== undefined) {
            yield* validateSchemaMinproperties(value["minProperties"], [...path, "minProperties"]);
        }
        if (value["required"] !== undefined) {
            yield* validateSchemaRequired(value["required"], [...path, "required"]);
        }
        if (value["additionalProperties"] !== undefined) {
            yield* validateSchemaAdditionalproperties(value["additionalProperties"], [...path, "additionalProperties"]);
        }
        if (value["definitions"] !== undefined) {
            yield* validateSchemaDefinitions(value["definitions"], [...path, "definitions"]);
        }
        if (value["properties"] !== undefined) {
            yield* validateSchemaProperties(value["properties"], [...path, "properties"]);
        }
        if (value["patternProperties"] !== undefined) {
            yield* validateSchemaPatternproperties(value["patternProperties"], [...path, "patternProperties"]);
        }
        if (value["dependencies"] !== undefined) {
            yield* validateSchemaDependencies(value["dependencies"], [...path, "dependencies"]);
        }
        if (value["propertyNames"] !== undefined) {
            yield* validateSchemaPropertynames(value["propertyNames"], [...path, "propertyNames"]);
        }
        if (value["const"] !== undefined) {
            yield* validateSchemaConst(value["const"], [...path, "const"]);
        }
        if (value["enum"] !== undefined) {
            yield* validateSchemaEnum(value["enum"], [...path, "enum"]);
        }
        if (value["type"] !== undefined) {
            yield* validateSchemaType(value["type"], [...path, "type"]);
        }
        if (value["format"] !== undefined) {
            yield* validateSchemaFormat(value["format"], [...path, "format"]);
        }
        if (value["contentMediaType"] !== undefined) {
            yield* validateSchemaContentmediatype(value["contentMediaType"], [...path, "contentMediaType"]);
        }
        if (value["contentEncoding"] !== undefined) {
            yield* validateSchemaContentencoding(value["contentEncoding"], [...path, "contentEncoding"]);
        }
        if (value["if"] !== undefined) {
            yield* validateSchemaIf(value["if"], [...path, "if"]);
        }
        if (value["then"] !== undefined) {
            yield* validateSchemaThen(value["then"], [...path, "then"]);
        }
        if (value["else"] !== undefined) {
            yield* validateSchemaElse(value["else"], [...path, "else"]);
        }
        if (value["allOf"] !== undefined) {
            yield* validateSchemaAllof(value["allOf"], [...path, "allOf"]);
        }
        if (value["anyOf"] !== undefined) {
            yield* validateSchemaAnyof(value["anyOf"], [...path, "anyOf"]);
        }
        if (value["oneOf"] !== undefined) {
            yield* validateSchemaOneof(value["oneOf"], [...path, "oneOf"]);
        }
        if (value["not"] !== undefined) {
            yield* validateSchemaNot(value["not"], [...path, "not"]);
        }
    }
    else {
        yield { path, error: "type" };
    }
}
export function* validateSchemaSchemaarray(value: types.SchemaSchemaarray, path: string[] = []): Iterable<validation.PathError> {
    if (validation.isValidArrayType(value)) {
        if (!validation.isValidMinItems(value, 1)) {
            yield { path, error: "min-items" };
        }
        yield* validateSchemaSchemaarrayItems(value[0], [...path, "0"]);
    }
    else {
        yield { path, error: "type" };
    }
}
export function* validateSchemaSchemaarrayItems(value: types.SchemaSchemaarrayItems, path: string[] = []): Iterable<validation.PathError> {
}
export function* validateSchemaNonnegativeinteger(value: types.SchemaNonnegativeinteger, path: string[] = []): Iterable<validation.PathError> {
    if (validation.isValidIntegerType(value)) {
        if (!validation.isValidMinimum(value, 0)) {
            yield { path, error: "minimum" };
        }
    }
    else {
        yield { path, error: "type" };
    }
}
export function* validateSchemaNonnegativeintegerdefault0(value: types.SchemaNonnegativeintegerdefault0, path: string[] = []): Iterable<validation.PathError> {
}
export function* validateSchemaNonnegativeintegerdefault00(value: types.SchemaNonnegativeintegerdefault00, path: string[] = []): Iterable<validation.PathError> {
}
export function* validateSchemaNonnegativeintegerdefault01(value: types.SchemaNonnegativeintegerdefault01, path: string[] = []): Iterable<validation.PathError> {
}
export function* validateSchemaSimpletypes(value: types.SchemaSimpletypes, path: string[] = []): Iterable<validation.PathError> {
}
export function* validateSchemaStringarray(value: types.SchemaStringarray, path: string[] = []): Iterable<validation.PathError> {
    if (validation.isValidArrayType(value)) {
        if (!validation.isValidUniqueItems(value, true)) {
            yield { path, error: "unique-items" };
        }
        yield* validateSchemaStringarrayItems(value[0], [...path, "0"]);
    }
    else {
        yield { path, error: "type" };
    }
}
export function* validateSchemaStringarrayItems(value: types.SchemaStringarrayItems, path: string[] = []): Iterable<validation.PathError> {
    if (validation.isValidStringType(value)) {
    }
    else {
        yield { path, error: "type" };
    }
}
export function* validateSchemaId(value: types.SchemaId, path: string[] = []): Iterable<validation.PathError> {
    if (validation.isValidStringType(value)) {
    }
    else {
        yield { path, error: "type" };
    }
}
export function* validateSchemaSchema(value: types.SchemaSchema, path: string[] = []): Iterable<validation.PathError> {
    if (validation.isValidStringType(value)) {
    }
    else {
        yield { path, error: "type" };
    }
}
export function* validateSchemaRef(value: types.SchemaRef, path: string[] = []): Iterable<validation.PathError> {
    if (validation.isValidStringType(value)) {
    }
    else {
        yield { path, error: "type" };
    }
}
export function* validateSchemaComment(value: types.SchemaComment, path: string[] = []): Iterable<validation.PathError> {
    if (validation.isValidStringType(value)) {
    }
    else {
        yield { path, error: "type" };
    }
}
export function* validateSchemaTitle(value: types.SchemaTitle, path: string[] = []): Iterable<validation.PathError> {
    if (validation.isValidStringType(value)) {
    }
    else {
        yield { path, error: "type" };
    }
}
export function* validateSchemaDescription(value: types.SchemaDescription, path: string[] = []): Iterable<validation.PathError> {
    if (validation.isValidStringType(value)) {
    }
    else {
        yield { path, error: "type" };
    }
}
export function* validateSchemaDefault(value: types.SchemaDefault, path: string[] = []): Iterable<validation.PathError> {
}
export function* validateSchemaReadonly(value: types.SchemaReadonly, path: string[] = []): Iterable<validation.PathError> {
    if (validation.isValidBooleanType(value)) {
    }
    else {
        yield { path, error: "type" };
    }
}
export function* validateSchemaWriteonly(value: types.SchemaWriteonly, path: string[] = []): Iterable<validation.PathError> {
    if (validation.isValidBooleanType(value)) {
    }
    else {
        yield { path, error: "type" };
    }
}
export function* validateSchemaExamples(value: types.SchemaExamples, path: string[] = []): Iterable<validation.PathError> {
    if (validation.isValidArrayType(value)) {
        yield* validateSchemaExamplesItems(value[0], [...path, "0"]);
    }
    else {
        yield { path, error: "type" };
    }
}
export function* validateSchemaExamplesItems(value: types.SchemaExamplesItems, path: string[] = []): Iterable<validation.PathError> {
}
export function* validateSchemaMultipleof(value: types.SchemaMultipleof, path: string[] = []): Iterable<validation.PathError> {
    if (validation.isValidNumberType(value)) {
        if (!validation.isValidExclusiveMinimum(value, 0)) {
            yield { path, error: "exclusive-minimum" };
        }
    }
    else {
        yield { path, error: "type" };
    }
}
export function* validateSchemaMaximum(value: types.SchemaMaximum, path: string[] = []): Iterable<validation.PathError> {
    if (validation.isValidNumberType(value)) {
    }
    else {
        yield { path, error: "type" };
    }
}
export function* validateSchemaExclusivemaximum(value: types.SchemaExclusivemaximum, path: string[] = []): Iterable<validation.PathError> {
    if (validation.isValidNumberType(value)) {
    }
    else {
        yield { path, error: "type" };
    }
}
export function* validateSchemaMinimum(value: types.SchemaMinimum, path: string[] = []): Iterable<validation.PathError> {
    if (validation.isValidNumberType(value)) {
    }
    else {
        yield { path, error: "type" };
    }
}
export function* validateSchemaExclusiveminimum(value: types.SchemaExclusiveminimum, path: string[] = []): Iterable<validation.PathError> {
    if (validation.isValidNumberType(value)) {
    }
    else {
        yield { path, error: "type" };
    }
}
export function* validateSchemaMaxlength(value: types.SchemaMaxlength, path: string[] = []): Iterable<validation.PathError> {
}
export function* validateSchemaMinlength(value: types.SchemaMinlength, path: string[] = []): Iterable<validation.PathError> {
}
export function* validateSchemaPattern(value: types.SchemaPattern, path: string[] = []): Iterable<validation.PathError> {
    if (validation.isValidStringType(value)) {
    }
    else {
        yield { path, error: "type" };
    }
}
export function* validateSchemaAdditionalitems(value: types.SchemaAdditionalitems, path: string[] = []): Iterable<validation.PathError> {
}
export function* validateSchemaItems(value: types.SchemaItems, path: string[] = []): Iterable<validation.PathError> {
}
export function* validateSchemaItems0(value: types.SchemaItems0, path: string[] = []): Iterable<validation.PathError> {
}
export function* validateSchemaItems1(value: types.SchemaItems1, path: string[] = []): Iterable<validation.PathError> {
}
export function* validateSchemaMaxitems(value: types.SchemaMaxitems, path: string[] = []): Iterable<validation.PathError> {
}
export function* validateSchemaMinitems(value: types.SchemaMinitems, path: string[] = []): Iterable<validation.PathError> {
}
export function* validateSchemaUniqueitems(value: types.SchemaUniqueitems, path: string[] = []): Iterable<validation.PathError> {
    if (validation.isValidBooleanType(value)) {
    }
    else {
        yield { path, error: "type" };
    }
}
export function* validateSchemaContains(value: types.SchemaContains, path: string[] = []): Iterable<validation.PathError> {
}
export function* validateSchemaMaxproperties(value: types.SchemaMaxproperties, path: string[] = []): Iterable<validation.PathError> {
}
export function* validateSchemaMinproperties(value: types.SchemaMinproperties, path: string[] = []): Iterable<validation.PathError> {
}
export function* validateSchemaRequired(value: types.SchemaRequired, path: string[] = []): Iterable<validation.PathError> {
}
export function* validateSchemaAdditionalproperties(value: types.SchemaAdditionalproperties, path: string[] = []): Iterable<validation.PathError> {
}
export function* validateSchemaDefinitions(value: types.SchemaDefinitions, path: string[] = []): Iterable<validation.PathError> {
    if (validation.isValidObjectType(value)) {
        for (const entry of Object.entries(value)) {
            const [key, value] = entry;
            yield* validateSchemaDefinitionsAdditionalproperties(value, [...path, key]);
        }
    }
    else {
        yield { path, error: "type" };
    }
}
export function* validateSchemaDefinitionsAdditionalproperties(value: types.SchemaDefinitionsAdditionalproperties, path: string[] = []): Iterable<validation.PathError> {
}
export function* validateSchemaProperties(value: types.SchemaProperties, path: string[] = []): Iterable<validation.PathError> {
    if (validation.isValidObjectType(value)) {
        for (const entry of Object.entries(value)) {
            const [key, value] = entry;
            yield* validateSchemaPropertiesAdditionalproperties(value, [...path, key]);
        }
    }
    else {
        yield { path, error: "type" };
    }
}
export function* validateSchemaPropertiesAdditionalproperties(value: types.SchemaPropertiesAdditionalproperties, path: string[] = []): Iterable<validation.PathError> {
}
export function* validateSchemaPatternproperties(value: types.SchemaPatternproperties, path: string[] = []): Iterable<validation.PathError> {
    if (validation.isValidObjectType(value)) {
        for (const entry of Object.entries(value)) {
            const [key, value] = entry;
            yield* validateSchemaPatternpropertiesAdditionalproperties(value, [...path, key]);
        }
    }
    else {
        yield { path, error: "type" };
    }
}
export function* validateSchemaPatternpropertiesAdditionalproperties(value: types.SchemaPatternpropertiesAdditionalproperties, path: string[] = []): Iterable<validation.PathError> {
}
export function* validateSchemaDependencies(value: types.SchemaDependencies, path: string[] = []): Iterable<validation.PathError> {
    if (validation.isValidObjectType(value)) {
        for (const entry of Object.entries(value)) {
            const [key, value] = entry;
            yield* validateSchemaDependenciesAdditionalproperties(value, [...path, key]);
        }
    }
    else {
        yield { path, error: "type" };
    }
}
export function* validateSchemaDependenciesAdditionalproperties(value: types.SchemaDependenciesAdditionalproperties, path: string[] = []): Iterable<validation.PathError> {
}
export function* validateSchemaDependenciesAdditionalproperties0(value: types.SchemaDependenciesAdditionalproperties0, path: string[] = []): Iterable<validation.PathError> {
}
export function* validateSchemaDependenciesAdditionalproperties1(value: types.SchemaDependenciesAdditionalproperties1, path: string[] = []): Iterable<validation.PathError> {
}
export function* validateSchemaPropertynames(value: types.SchemaPropertynames, path: string[] = []): Iterable<validation.PathError> {
}
export function* validateSchemaConst(value: types.SchemaConst, path: string[] = []): Iterable<validation.PathError> {
}
export function* validateSchemaEnum(value: types.SchemaEnum, path: string[] = []): Iterable<validation.PathError> {
    if (validation.isValidArrayType(value)) {
        if (!validation.isValidMinItems(value, 1)) {
            yield { path, error: "min-items" };
        }
        if (!validation.isValidUniqueItems(value, true)) {
            yield { path, error: "unique-items" };
        }
        yield* validateSchemaEnumItems(value[0], [...path, "0"]);
    }
    else {
        yield { path, error: "type" };
    }
}
export function* validateSchemaEnumItems(value: types.SchemaEnumItems, path: string[] = []): Iterable<validation.PathError> {
}
export function* validateSchemaType(value: types.SchemaType, path: string[] = []): Iterable<validation.PathError> {
}
export function* validateSchemaType0(value: types.SchemaType0, path: string[] = []): Iterable<validation.PathError> {
}
export function* validateSchemaType1(value: types.SchemaType1, path: string[] = []): Iterable<validation.PathError> {
    if (validation.isValidArrayType(value)) {
        if (!validation.isValidMinItems(value, 1)) {
            yield { path, error: "min-items" };
        }
        if (!validation.isValidUniqueItems(value, true)) {
            yield { path, error: "unique-items" };
        }
        yield* validateSchemaType1Items(value[0], [...path, "0"]);
    }
    else {
        yield { path, error: "type" };
    }
}
export function* validateSchemaType1Items(value: types.SchemaType1Items, path: string[] = []): Iterable<validation.PathError> {
}
export function* validateSchemaFormat(value: types.SchemaFormat, path: string[] = []): Iterable<validation.PathError> {
    if (validation.isValidStringType(value)) {
    }
    else {
        yield { path, error: "type" };
    }
}
export function* validateSchemaContentmediatype(value: types.SchemaContentmediatype, path: string[] = []): Iterable<validation.PathError> {
    if (validation.isValidStringType(value)) {
    }
    else {
        yield { path, error: "type" };
    }
}
export function* validateSchemaContentencoding(value: types.SchemaContentencoding, path: string[] = []): Iterable<validation.PathError> {
    if (validation.isValidStringType(value)) {
    }
    else {
        yield { path, error: "type" };
    }
}
export function* validateSchemaIf(value: types.SchemaIf, path: string[] = []): Iterable<validation.PathError> {
}
export function* validateSchemaThen(value: types.SchemaThen, path: string[] = []): Iterable<validation.PathError> {
}
export function* validateSchemaElse(value: types.SchemaElse, path: string[] = []): Iterable<validation.PathError> {
}
export function* validateSchemaAllof(value: types.SchemaAllof, path: string[] = []): Iterable<validation.PathError> {
}
export function* validateSchemaAnyof(value: types.SchemaAnyof, path: string[] = []): Iterable<validation.PathError> {
}
export function* validateSchemaOneof(value: types.SchemaOneof, path: string[] = []): Iterable<validation.PathError> {
}
export function* validateSchemaNot(value: types.SchemaNot, path: string[] = []): Iterable<validation.PathError> {
}
