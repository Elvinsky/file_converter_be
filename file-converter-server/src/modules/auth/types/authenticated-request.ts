import { FastifyRequest } from 'fastify';

import { AuthUserPayload } from '@/modules/jwt/jwt.types';

export type AuthenticatedRequest = FastifyRequest & { user: AuthUserPayload };
