import {
  CONVERT_ERROR_CODES,
  throwConvertError,
} from '../errors/convert.errors';

const UNSAFE_MARKUP =
  /<!DOCTYPE|<!ENTITY|<script|<\/script|javascript:|<foreignObject|<iframe|<embed|<object|<handler\b/i;

const EVENT_HANDLER = /\son[a-z]+\s*=/i;

const EXTERNAL_RESOURCE =
  /\b(?:href|xlink:href|src)\s*=\s*["']\s*(?:https?:|ftp:|\/\/|data:(?!image\/))/i;

const EXTERNAL_USE = /<\s*use\b[^>]*\b(?:href|xlink:href)\s*=\s*["']\s*(?!#)/i;

export function assertSafeSvg(svg: string): void {
  if (
    UNSAFE_MARKUP.test(svg) ||
    EVENT_HANDLER.test(svg) ||
    EXTERNAL_RESOURCE.test(svg) ||
    EXTERNAL_USE.test(svg)
  ) {
    throwConvertError(CONVERT_ERROR_CODES.UNSAFE_SVG);
  }
}
