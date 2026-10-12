export type PutObjectParams = {
  bucket: string;
  key: string;
  body: Buffer;
  contentType?: string;
};

export type ObjectKeyParams = {
  bucket: string;
  key: string;
};

export interface ObjectStorageClient {
  putObject(params: PutObjectParams): Promise<void>;
  getObject(params: ObjectKeyParams): Promise<Buffer>;
  deleteObject(params: ObjectKeyParams): Promise<void>;
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
