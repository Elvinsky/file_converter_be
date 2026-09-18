import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { Repository } from 'typeorm';

import {
  RBAC_ACTIONS,
  RBAC_RESOURCES,
} from '@/modules/rbac/decorators/require-permission.constants';
import { AccessService } from '@/modules/rbac/services/access.service';

import { FileResponseDto } from '../dto/file-response.dto';
import { FileEntity } from '../entities/files.entity';
import { StorageService } from './storage.service';

export type IncomingUpload = {
  filename: string;
  mimetype: string;
  toBuffer: () => Promise<Buffer>;
};

@Injectable()
export class FilesService {
  constructor(
    private readonly storage: StorageService,
    @InjectRepository(FileEntity)
    private readonly filesRepository: Repository<FileEntity>,
    private readonly accessService: AccessService,
  ) {}

  async upload(userId: string, file: IncomingUpload): Promise<FileResponseDto> {
    const originalName = this.sanitizeFileName(file.filename);
    const id = randomUUID();
    const body = await file.toBuffer();
    const contentType = file.mimetype || 'application/octet-stream';
    const storageKey = `uploads/${userId}/${id}/${originalName}`;

    await this.storage.putObject({
      key: storageKey,
      body,
      contentType,
    });

    const saved = await this.filesRepository.save(
      this.filesRepository.create({
        id,
        userId,
        originalName,
        storageKey,
        contentType,
        sizeBytes: body.length,
      }),
    );

    const withUser = await this.filesRepository.findOneOrFail({
      where: { id: saved.id },
      relations: { user: true },
    });

    return this.toResponse(withUser);
  }

  async listFiles(
    actorId: string,
    userId?: string,
  ): Promise<FileResponseDto[]> {
    const ownerId = await this.resolveListOwnerId(actorId, userId);
    const query = this.filesRepository
      .createQueryBuilder('file')
      .leftJoinAndSelect('file.user', 'user')
      .orderBy('file.createdAt', 'DESC');

    if (ownerId) {
      query.andWhere('file.userId = :ownerId', { ownerId });
    }

    const files = await query.getMany();

    return files.map((file) => this.toResponse(file));
  }

  private async resolveListOwnerId(
    actorId: string,
    userId?: string,
  ): Promise<string | undefined> {
    const canListAll = await this.accessService.canAccess({
      userId: actorId,
      permission: RBAC_RESOURCES.FILES_LIST,
      action: RBAC_ACTIONS.READ,
    });

    if (canListAll) {
      return userId;
    }

    if (userId && userId !== actorId) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return actorId;
  }

  private toResponse(file: FileEntity): FileResponseDto {
    return {
      id: file.id,
      originalName: file.originalName,
      contentType: file.contentType,
      sizeBytes: file.sizeBytes,
      createdAt: file.createdAt,
      userId: file.userId,
      publisherEmail: file.user.email,
    };
  }

  private sanitizeFileName(filename: string): string {
    const baseName = path.basename(filename || 'upload.bin');
    const sanitized = baseName.replace(/[^\w.-]+/g, '_').slice(0, 200);

    return sanitized || 'upload.bin';
  }
}
