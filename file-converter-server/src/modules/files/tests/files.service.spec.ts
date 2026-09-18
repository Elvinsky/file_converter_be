import { FilesService } from '../services/files.service';
import { StorageService } from '../services/storage.service';

describe('FilesService', () => {
  it('stores the file under a user-scoped test-uploads key', async () => {
    const putObject = jest.fn((params: { key: string }) =>
      Promise.resolve({
        bucket: 'file-converter-dev',
        key: params.key,
      }),
    );
    const storage = { putObject } as unknown as StorageService;
    const service = new FilesService(storage);
    const body = Buffer.from('hello');

    jest.spyOn(Date, 'now').mockReturnValue(1700000000000);

    await expect(
      service.storeTestUpload('user-1', {
        filename: '../../weird name.txt',
        mimetype: 'text/plain',
        toBuffer: () => Promise.resolve(body),
      }),
    ).resolves.toEqual({
      success: true,
      bucket: 'file-converter-dev',
      key: 'test-uploads/user-1/1700000000000-weird_name.txt',
      originalName: 'weird_name.txt',
    });

    expect(putObject).toHaveBeenCalledWith({
      key: 'test-uploads/user-1/1700000000000-weird_name.txt',
      body,
      contentType: 'text/plain',
    });

    jest.restoreAllMocks();
  });
});
