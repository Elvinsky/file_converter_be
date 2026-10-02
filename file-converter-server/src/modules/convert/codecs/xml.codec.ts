import { XMLBuilder, XMLParser, XMLValidator } from 'fast-xml-parser';

import {
  CONVERT_ERROR_CODES,
  throwConvertError,
} from '../errors/convert.errors';
import { JsonValue, ValueIr } from '../ir/canonical.types';
import { ParseJsonOptions, sanitizeJsonValue } from './json.codec';

const FORBIDDEN_XML = /<!DOCTYPE|<!ENTITY/i;

export type ParseXmlOptions = ParseJsonOptions;

export function parseXml(text: string, options: ParseXmlOptions = {}): ValueIr {
  if (FORBIDDEN_XML.test(text)) {
    throwConvertError(CONVERT_ERROR_CODES.INVALID_SYNTAX);
  }

  const valid = XMLValidator.validate(text, { allowBooleanAttributes: false });

  if (valid !== true) {
    throwConvertError(CONVERT_ERROR_CODES.INVALID_SYNTAX);
  }

  const parser = new XMLParser({
    allowBooleanAttributes: false,
    attributeNamePrefix: '@_',
    ignoreAttributes: false,
    ignoreDeclaration: true,
    ignorePiTags: true,
    maxNestedTags: options.maxDepth ?? 32,
    parseAttributeValue: false,
    parseTagValue: false,
    processEntities: false,
    textNodeName: '#text',
    trimValues: true,
  });

  let parsed: unknown;

  try {
    parsed = parser.parse(text) as unknown;
  } catch {
    throwConvertError(CONVERT_ERROR_CODES.INVALID_SYNTAX);
  }

  if (parsed === undefined || parsed === '') {
    throwConvertError(CONVERT_ERROR_CODES.INVALID_SYNTAX);
  }

  const stats = { keys: 0 };
  const value = sanitizeJsonValue(parsed, 0, options, stats);

  return { kind: 'value', value };
}

export function serializeXml(value: JsonValue): Buffer {
  const builder = new XMLBuilder({
    attributeNamePrefix: '@_',
    format: false,
    ignoreAttributes: false,
    suppressEmptyNode: false,
    textNodeName: '#text',
  });

  try {
    const xml = builder.build(toXmlDocument(value));

    if (typeof xml !== 'string' || xml.length === 0) {
      throwConvertError(CONVERT_ERROR_CODES.INVALID_SYNTAX);
    }

    return Buffer.from(xml, 'utf8');
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'response' in error) {
      throw error;
    }

    throwConvertError(CONVERT_ERROR_CODES.INVALID_SYNTAX);
  }
}

function toXmlDocument(value: JsonValue): { root: unknown } {
  if (Array.isArray(value)) {
    return { root: { item: value.map((item) => prepareXmlNode(item)) } };
  }

  if (value !== null && typeof value === 'object') {
    return { root: prepareXmlNode(value) };
  }

  return { root: value === null ? '' : value };
}

function prepareXmlNode(value: JsonValue): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => prepareXmlNode(item));
  }

  if (value === null || typeof value !== 'object') {
    return value === null ? '' : value;
  }

  const node: Record<string, unknown> = {};

  for (const [key, nested] of Object.entries(value)) {
    node[toXmlName(key)] = prepareXmlNode(nested);
  }

  return node;
}

function toXmlName(key: string): string {
  if (key === '#text' || key.startsWith('@_')) {
    return key;
  }

  const sanitized = key.replace(/[^\w.-]+/g, '_') || '_';

  return /^[A-Za-z_]/.test(sanitized) ? sanitized : `_${sanitized}`;
}
