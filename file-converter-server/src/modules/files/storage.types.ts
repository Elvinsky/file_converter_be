export type PutObjectParams = {
  bucket: string;
  key: string;
  body: Buffer;
  contentType?: string;
};

export interface ObjectStorageClient {
  putObject(params: PutObjectParams): Promise<void>;
}

export type StoreObjectParams = {
  key: string;
  body: Buffer;
  contentType?: string;
};

export type StoreObjectResult = {
  bucket: string;
  key: string;
};
