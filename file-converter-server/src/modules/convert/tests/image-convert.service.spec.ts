import { ConfigService } from '@/core/config/config.service';
import { TransformationHistoryService } from '@/modules/transformations/services/transformation-history.service';
import sharp from 'sharp';

import { CONVERT_ERROR_CODES } from '../errors/convert.errors';
import { ImageConvertService } from '../services/image-convert.service';

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

function imageConfig(
  overrides: Partial<Record<string, number>> = {},
): ConfigService {
  const values: Record<string, number> = {
    CONVERT_TIMEOUT_MS: 30000,
    CONVERT_MAX_UPLOAD_PNG_BYTES: 10485760,
    CONVERT_MAX_UPLOAD_JPEG_BYTES: 10485760,
    CONVERT_MAX_UPLOAD_SVG_BYTES: 10485760,
    CONVERT_IMAGE_MAX_WIDTH: 8192,
    CONVERT_IMAGE_MAX_HEIGHT: 8192,
    CONVERT_IMAGE_MAX_PIXELS: 16777216,
    CONVERT_IMAGE_QUALITY_DEFAULT: 80,
    ...overrides,
  };

  return { get: (key: string) => values[key] } as ConfigService;
}

function part(
  body: Buffer,
  filename: string,
  mimetype: string,
  fields: Record<string, { value: string }>,
) {
  return {
    filename,
    mimetype,
    toBuffer: () => Promise.resolve(body),
    fields,
  };
}

describe('ImageConvertService', () => {
  const service = new ImageConvertService(imageConfig());

  it('lists only the supported image directions', () => {
    expect(service.listFormats()).toEqual([
      { source: 'png', target: ['jpeg'] },
      { source: 'jpeg', target: ['png'] },
      { source: 'svg', target: ['png', 'jpeg'] },
    ]);
  });

  it('reads targetFormat that is only available after the file is consumed', async () => {
    const fields: Record<string, { value: string }> = {};
    const result = await service.convert({
      filename: 'pixel.png',
      mimetype: 'image/png',
      fields,
      toBuffer: () => {
        fields.targetFormat = { value: 'jpeg' };
        return Promise.resolve(TINY_PNG);
      },
    });

    expect(result.fileName).toBe('converted.jpeg');
  });

  it('accepts jpg as a JPEG target', async () => {
    const result = await service.convert(
      part(TINY_PNG, 'pixel.png', 'image/png', {
        targetFormat: { value: 'jpg' },
      }),
    );

    expect(result.contentType).toBe('image/jpeg');
    expect(result.fileName).toBe('converted.jpeg');
  });

  it('converts PNG to JPEG', async () => {
    const result = await service.convert(
      part(TINY_PNG, 'pixel.png', 'image/png', {
        targetFormat: { value: 'jpeg' },
        quality: { value: '70' },
      }),
    );
    const meta = await sharp(result.body).metadata();

    expect(result.fileName).toBe('converted.jpeg');
    expect(result.contentType).toBe('image/jpeg');
    expect(meta.format).toBe('jpeg');
  });

  it('converts JPEG to PNG', async () => {
    const jpeg = await sharp(TINY_PNG).jpeg().toBuffer();
    const result = await service.convert(
      part(jpeg, 'pixel.jpg', 'image/jpeg', {
        targetFormat: { value: 'png' },
      }),
    );
    const meta = await sharp(result.body).metadata();

    expect(result.fileName).toBe('converted.png');
    expect(meta.format).toBe('png');
  });

  it('rasterizes SVG onto the requested background', async () => {
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="4"><rect width="8" height="4" fill="red"/></svg>',
    );
    const result = await service.convert(
      part(svg, 'box.svg', 'image/svg+xml', {
        targetFormat: { value: 'png' },
        background: { value: '#000000' },
      }),
    );
    const meta = await sharp(result.body).metadata();

    expect(meta.format).toBe('png');
    expect(meta.width).toBe(8);
    expect(meta.height).toBe(4);
  });

  it('flattens PNG transparency when writing JPEG', async () => {
    const transparent = await sharp({
      create: {
        width: 2,
        height: 2,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .png()
      .toBuffer();
    const result = await service.convert(
      part(transparent, 'clear.png', 'image/png', {
        targetFormat: { value: 'jpeg' },
      }),
    );
    const meta = await sharp(result.body).metadata();

    expect(meta.format).toBe('jpeg');
    expect(meta.hasAlpha).not.toBe(true);
  });

  it('rejects PNG to SVG', async () => {
    await expect(
      service.convert(
        part(TINY_PNG, 'pixel.png', 'image/png', {
          targetFormat: { value: 'svg' },
        }),
      ),
    ).rejects.toMatchObject({
      response: { code: CONVERT_ERROR_CODES.PAIR_NOT_ALLOWED },
    });
  });

  it('rejects an SVG that contains a script', async () => {
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><script>alert(1)</script></svg>',
    );

    await expect(
      service.convert(
        part(svg, 'bad.svg', 'image/svg+xml', {
          targetFormat: { value: 'png' },
        }),
      ),
    ).rejects.toMatchObject({
      response: { code: CONVERT_ERROR_CODES.UNSAFE_SVG },
    });
  });

  it('rejects an SVG that references an external image', async () => {
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><image href="https://example.com/a.png"/></svg>',
    );

    await expect(
      service.convert(
        part(svg, 'bad.svg', 'image/svg+xml', {
          targetFormat: { value: 'jpeg' },
        }),
      ),
    ).rejects.toMatchObject({
      response: { code: CONVERT_ERROR_CODES.UNSAFE_SVG },
    });
  });

  it('rejects quality outside 1-100', async () => {
    await expect(
      service.convert(
        part(TINY_PNG, 'pixel.png', 'image/png', {
          targetFormat: { value: 'jpeg' },
          options: { value: '{"quality":0}' },
        }),
      ),
    ).rejects.toMatchObject({
      response: { code: CONVERT_ERROR_CODES.INVALID_OPTIONS },
    });
  });

  it('rejects SVG output larger than the configured maximum', async () => {
    const limited = new ImageConvertService(
      imageConfig({ CONVERT_IMAGE_MAX_WIDTH: 4, CONVERT_IMAGE_MAX_HEIGHT: 4 }),
    );
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"></svg>',
    );

    await expect(
      limited.convert(
        part(svg, 'box.svg', 'image/svg+xml', {
          targetFormat: { value: 'png' },
        }),
      ),
    ).rejects.toMatchObject({
      response: { code: CONVERT_ERROR_CODES.LIMIT_IMAGE_DIMENSION },
    });
  });

  it('rejects an image that expands past the pixel limit', async () => {
    const limited = new ImageConvertService(
      imageConfig({ CONVERT_IMAGE_MAX_PIXELS: 1 }),
    );
    const png = await sharp({
      create: {
        width: 2,
        height: 2,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .png()
      .toBuffer();

    await expect(
      limited.convert(
        part(png, 'wide.png', 'image/png', {
          targetFormat: { value: 'jpeg' },
        }),
      ),
    ).rejects.toMatchObject({
      response: { code: CONVERT_ERROR_CODES.LIMIT_IMAGE_PIXELS },
    });
  });

  it('records image history without blocking the returned file', async () => {
    const record = jest.fn().mockResolvedValue(undefined);
    const recording = new ImageConvertService(imageConfig(), undefined, {
      record,
    } as unknown as TransformationHistoryService);

    const result = await recording.convert(
      part(TINY_PNG, 'pixel.png', 'image/png', {
        targetFormat: { value: 'jpeg' },
        save: { value: 'false' },
      }),
      { userId: '11111111-1111-1111-1111-111111111111' },
    );

    expect(result.fileName).toBe('converted.jpeg');
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'image',
        sourceFormat: 'png',
        targetFormat: 'jpeg',
        status: 'success',
        save: false,
      }),
    );
  });
});
