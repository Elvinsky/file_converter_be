import { XMLBuilder, XMLParser, XMLValidator } from 'fast-xml-parser';

import {
  CONVERT_ERROR_CODES,
  throwConvertError,
} from '../errors/convert.errors';

const DOCTYPE = /<!DOCTYPE|<!ENTITY/i;

const DROPPED_ELEMENTS = new Set([
  'script',
  'foreignobject',
  'iframe',
  'embed',
  'object',
  'handler',
  'animate',
  'animatetransform',
  'animatemotion',
  'set',
]);

const PARSER_OPTIONS = {
  allowBooleanAttributes: true,
  attributeNamePrefix: '@_',
  commentPropName: '#comment',
  ignoreAttributes: false,
  ignoreDeclaration: false,
  preserveOrder: true,
  processEntities: false,
  textNodeName: '#text',
  trimValues: false,
};

type OrderedNode = Record<string, unknown>;

export function sanitizeSvg(svg: string): string {
  if (!svg.trim() || DOCTYPE.test(svg)) {
    throwConvertError(CONVERT_ERROR_CODES.UNSAFE_SVG);
  }

  const valid = XMLValidator.validate(svg, { allowBooleanAttributes: true });

  if (valid !== true) {
    throwConvertError(CONVERT_ERROR_CODES.UNSAFE_SVG);
  }

  const parser = new XMLParser(PARSER_OPTIONS);
  let parsed: unknown;

  try {
    parsed = parser.parse(svg);
  } catch {
    throwConvertError(CONVERT_ERROR_CODES.UNSAFE_SVG);
  }

  if (!Array.isArray(parsed)) {
    throwConvertError(CONVERT_ERROR_CODES.UNSAFE_SVG);
  }

  const state = { dropped: false };
  const cleaned = parsed
    .map((node) => cleanNode(node as OrderedNode, state))
    .filter((node): node is OrderedNode => node !== undefined);

  if (!hasSvgRoot(cleaned) || (state.dropped && !hasDrawable(cleaned))) {
    throwConvertError(CONVERT_ERROR_CODES.UNSAFE_SVG);
  }

  let rebuilt = '';

  try {
    rebuilt = new XMLBuilder(PARSER_OPTIONS).build(cleaned);
  } catch {
    throwConvertError(CONVERT_ERROR_CODES.UNSAFE_SVG);
  }

  if (
    typeof rebuilt !== 'string' ||
    !/<svg[\s>]/i.test(rebuilt) ||
    /<script[\s>]/i.test(rebuilt) ||
    /javascript:/i.test(rebuilt)
  ) {
    throwConvertError(CONVERT_ERROR_CODES.UNSAFE_SVG);
  }

  return rebuilt;
}

function cleanNode(
  node: OrderedNode,
  state: { dropped: boolean },
): OrderedNode | undefined {
  const tag = elementTag(node);

  if (!tag) {
    if (typeof node['#text'] === 'string') {
      if (/javascript:/i.test(node['#text'])) {
        state.dropped = true;
        return undefined;
      }

      return node;
    }

    if ('#comment' in node || '#cdata' in node) {
      state.dropped = true;
    }

    return undefined;
  }

  if (DROPPED_ELEMENTS.has(localName(tag))) {
    state.dropped = true;
    return undefined;
  }

  const attrs = cleanAttributes(node[':@'], state);
  const children = Array.isArray(node[tag]) ? node[tag] : [];
  const nextChildren = children
    .map((child) => cleanNode(child as OrderedNode, state))
    .filter((child): child is OrderedNode => child !== undefined);
  const name = localName(tag);

  if ((name === 'image' || name === 'use') && !hasAllowedReference(attrs)) {
    state.dropped = true;
    return undefined;
  }

  const result: OrderedNode = { [tag]: nextChildren };

  if (attrs && Object.keys(attrs).length > 0) {
    result[':@'] = attrs;
  }

  return result;
}

function cleanAttributes(
  raw: unknown,
  state: { dropped: boolean },
): Record<string, unknown> | undefined {
  if (typeof raw !== 'object' || raw === null) {
    return undefined;
  }

  const next: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(raw)) {
    const bare = key.startsWith('@_') ? key.slice(2).toLowerCase() : key;
    const attrName = localName(bare);

    if (/^on[a-z]+$/.test(attrName)) {
      state.dropped = true;
      continue;
    }

    if (isUrlAttribute(bare) && !isAllowedReference(attributeText(value))) {
      state.dropped = true;
      continue;
    }

    next[key] = value;
  }

  return next;
}

function hasAllowedReference(
  attrs: Record<string, unknown> | undefined,
): boolean {
  if (!attrs) {
    return false;
  }

  return Object.entries(attrs).some(([key, value]) => {
    const bare = key.startsWith('@_') ? key.slice(2).toLowerCase() : key;

    return isUrlAttribute(bare) && isAllowedReference(attributeText(value));
  });
}

function attributeText(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return '';
}

function isUrlAttribute(bare: string): boolean {
  return (
    bare === 'href' ||
    bare === 'src' ||
    bare.endsWith(':href') ||
    bare.endsWith(':src')
  );
}

function isAllowedReference(value: string): boolean {
  const reference = value.trim();

  if (reference === '' || reference.startsWith('#')) {
    return true;
  }

  return (
    /^data:image\//i.test(reference) && !/^data:image\/svg/i.test(reference)
  );
}

function elementTag(node: OrderedNode): string | undefined {
  return Object.keys(node).find(
    (key) => key !== ':@' && key !== '#text' && !key.startsWith('#'),
  );
}

function localName(tag: string): string {
  const bare = tag.includes(':') ? tag.slice(tag.lastIndexOf(':') + 1) : tag;

  return bare.toLowerCase();
}

function hasSvgRoot(nodes: OrderedNode[]): boolean {
  return nodes.some((node) => localName(elementTag(node) ?? '') === 'svg');
}

function hasDrawable(nodes: OrderedNode[]): boolean {
  return nodes.some((node) => {
    const tag = elementTag(node);

    if (!tag) {
      return false;
    }

    if (localName(tag) === 'svg') {
      const children = node[tag];

      return Array.isArray(children) && hasDrawable(children as OrderedNode[]);
    }

    return true;
  });
}
