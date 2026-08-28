import { Request } from 'express';
import { Role } from '@prisma/client';

export interface TokenPayload {
  userId: string;
  username: string;
  role: Role;
}

export interface AuthRequest extends Request {
  user?: TokenPayload;
}
