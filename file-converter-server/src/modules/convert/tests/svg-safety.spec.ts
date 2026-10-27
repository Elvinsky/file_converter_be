import { CONVERT_ERROR_CODES } from '../errors/convert.errors';
import { sanitizeSvg } from '../images/svg-safety';

const SVG_OPEN =
  '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8">';

function expectUnsafe(svg: string): void {
  try {
    sanitizeSvg(svg);
    throw new Error('expected UNSAFE_SVG');
  } catch (error) {
    expect(error).toMatchObject({
      response: { code: CONVERT_ERROR_CODES.UNSAFE_SVG },
    });
  }
}

describe('sanitizeSvg', () => {
  it('keeps a benign shape', () => {
    const cleaned = sanitizeSvg(
      `${SVG_OPEN}<rect width="8" height="8" fill="red"/></svg>`,
    );

    expect(cleaned).toContain('<rect');
    expect(cleaned).not.toMatch(/<script/i);
  });

  it('removes a literal script and keeps the rest of the drawing', () => {
    const cleaned = sanitizeSvg(
      `${SVG_OPEN}<script>alert(1)</script><rect width="8" height="8"/></svg>`,
    );

    expect(cleaned).toContain('<rect');
    expect(cleaned).not.toMatch(/<script/i);
    expect(cleaned).not.toContain('alert(1)');
  });

  it('removes a namespaced script', () => {
    const cleaned = sanitizeSvg(
      '<svg xmlns:svg="http://www.w3.org/2000/svg" width="8" height="8"><svg:script>alert(1)</svg:script><rect width="8" height="8"/></svg>',
    );

    expect(cleaned).not.toMatch(/script/i);
    expect(cleaned).toContain('<rect');
  });

  it('removes event handlers', () => {
    const cleaned = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" onload="alert(1)"><rect width="8" height="8"/></svg>',
    );

    expect(cleaned).not.toMatch(/\sonload\s*=/i);
    expect(cleaned).toContain('<rect');
  });

  it('removes foreignObject content', () => {
    const cleaned = sanitizeSvg(
      `${SVG_OPEN}<foreignObject><script>alert(1)</script></foreignObject><rect width="8" height="8"/></svg>`,
    );

    expect(cleaned).not.toMatch(/foreignObject/i);
    expect(cleaned).not.toMatch(/<script/i);
    expect(cleaned).toContain('<rect');
  });

  it('removes javascript hrefs', () => {
    const cleaned = sanitizeSvg(
      `${SVG_OPEN}<a href="javascript:alert(1)"><rect width="8" height="8"/></a></svg>`,
    );

    expect(cleaned).not.toMatch(/javascript:/i);
    expect(cleaned).toContain('<rect');
  });

  it('rejects a document whose only payload is a script', () => {
    expectUnsafe(`${SVG_OPEN}<script>alert(1)</script></svg>`);
  });

  it('rejects an embedded svg data url', () => {
    expectUnsafe(
      `${SVG_OPEN}<image href="data:image/svg+xml;base64,PHN2Zy8+"/></svg>`,
    );
  });

  it('rejects malformed markup', () => {
    expectUnsafe('<svg><rect></svg>');
  });
});
