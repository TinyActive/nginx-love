import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';

export interface TokenPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  } as any);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as any);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.accessSecret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
};

export const generateTempToken = (userId: string): string => {
  return jwt.sign({ userId, type: 'temp' }, config.jwt.accessSecret, {
    expiresIn: '15m', // Temporary token valid for 15 minutes
  } as any);
};

export const verifyTempToken = (token: string): { userId: string; type: string } => {
  const payload = jwt.verify(token, config.jwt.accessSecret) as any;
  if (payload.type !== 'temp') {
    throw new Error('Invalid token type');
  }
  return payload;
};
