/* eslint-disable */
/**
Core schema meta-schema
*/
export type Schema = (({
    id?: SchemaId;
    $schema?: SchemaSchema;
    title?: SchemaTitle;
    description?: SchemaDescription;
    default?: SchemaDefault;
    multipleOf?: SchemaMultipleof;
    maximum?: SchemaMaximum;
    exclusiveMaximum?: SchemaExclusivemaximum;
    minimum?: SchemaMinimum;
    exclusiveMinimum?: SchemaExclusiveminimum;
    maxLength?: SchemaMaxlength;
    minLength?: SchemaMinlength;
    pattern?: SchemaPattern;
    additionalItems?: SchemaAdditionalitems;
    items?: SchemaItems;
    maxItems?: SchemaMaxitems;
    minItems?: SchemaMinitems;
    uniqueItems?: SchemaUniqueitems;
    maxProperties?: SchemaMaxproperties;
    minProperties?: SchemaMinproperties;
    required?: SchemaRequired;
    additionalProperties?: SchemaAdditionalproperties;
    definitions?: SchemaDefinitions;
    properties?: SchemaProperties;
    patternProperties?: SchemaPatternproperties;
    dependencies?: SchemaDependencies;
    enum?: SchemaEnum;
    type?: SchemaType;
    format?: SchemaFormat;
    allOf?: SchemaAllof;
    anyOf?: SchemaAnyof;
    oneOf?: SchemaOneof;
    not?: SchemaNot;
}));
export type SchemaSchemaarray = ((Array<SchemaSchemaarrayItems>));
export type SchemaSchemaarrayItems = (Schema);
export type SchemaPositiveinteger = ((number));
export type SchemaPositiveintegerdefault0 = ((SchemaPositiveintegerdefault00 & SchemaPositiveintegerdefault01));
export type SchemaPositiveintegerdefault00 = (SchemaPositiveinteger);
export type SchemaPositiveintegerdefault01 = unknown;
export type SchemaSimpletypes = (("array" | "boolean" | "integer" | "null" | "number" | "object" | "string"));
export type SchemaStringarray = ((Array<SchemaStringarrayItems>));
export type SchemaStringarrayItems = ((string));
export type SchemaId = ((string));
export type SchemaSchema = ((string));
export type SchemaTitle = ((string));
export type SchemaDescription = ((string));
export type SchemaDefault = unknown;
export type SchemaMultipleof = ((number));
export type SchemaMaximum = ((number));
export type SchemaExclusivemaximum = ((boolean));
export type SchemaMinimum = ((number));
export type SchemaExclusiveminimum = ((boolean));
export type SchemaMaxlength = (SchemaPositiveinteger);
export type SchemaMinlength = (SchemaPositiveintegerdefault0);
export type SchemaPattern = ((string));
export type SchemaAdditionalitems = ((SchemaAdditionalitems0 | SchemaAdditionalitems1));
export type SchemaAdditionalitems0 = ((boolean));
export type SchemaAdditionalitems1 = (Schema);
export type SchemaItems = ((SchemaItems0 | SchemaItems1));
export type SchemaItems0 = (Schema);
export type SchemaItems1 = (SchemaSchemaarray);
export type SchemaMaxitems = (SchemaPositiveinteger);
export type SchemaMinitems = (SchemaPositiveintegerdefault0);
export type SchemaUniqueitems = ((boolean));
export type SchemaMaxproperties = (SchemaPositiveinteger);
export type SchemaMinproperties = (SchemaPositiveintegerdefault0);
export type SchemaRequired = (SchemaStringarray);
export type SchemaAdditionalproperties = ((SchemaAdditionalproperties0 | SchemaAdditionalproperties1));
export type SchemaAdditionalproperties0 = ((boolean));
export type SchemaAdditionalproperties1 = (Schema);
export type SchemaDefinitions = ((Record<string, SchemaDefinitionsAdditionalproperties>));
export type SchemaDefinitionsAdditionalproperties = (Schema);
export type SchemaProperties = ((Record<string, SchemaPropertiesAdditionalproperties>));
export type SchemaPropertiesAdditionalproperties = (Schema);
export type SchemaPatternproperties = ((Record<string, SchemaPatternpropertiesAdditionalproperties>));
export type SchemaPatternpropertiesAdditionalproperties = (Schema);
export type SchemaDependencies = ((Record<string, SchemaDependenciesAdditionalproperties>));
export type SchemaDependenciesAdditionalproperties = ((SchemaDependenciesAdditionalproperties0 | SchemaDependenciesAdditionalproperties1));
export type SchemaDependenciesAdditionalproperties0 = (Schema);
export type SchemaDependenciesAdditionalproperties1 = (SchemaStringarray);
export type SchemaEnum = ((Array<unknown>));
export type SchemaType = ((SchemaType0 | SchemaType1));
export type SchemaType0 = (SchemaSimpletypes);
export type SchemaType1 = ((Array<SchemaType1Items>));
export type SchemaType1Items = (SchemaSimpletypes);
export type SchemaFormat = ((string));
export type SchemaAllof = (SchemaSchemaarray);
export type SchemaAnyof = (SchemaSchemaarray);
export type SchemaOneof = (SchemaSchemaarray);
export type SchemaNot = (Schema);
