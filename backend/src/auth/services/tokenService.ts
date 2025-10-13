import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { env } from '../../config/environment';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export interface TokenPayload {
  userId: number;
  username: string;
  sessionId: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class TokenService {
  /**
   * Generate JWT access token and refresh token pair
   */
  static async generateTokenPair(userId: number, username: string): Promise<TokenPair> {
    const sessionId = uuidv4();

    // Generate access token (short-lived)
    const accessToken = jwt.sign(
      { userId, username, sessionId } as TokenPayload,
      env.JWT_SECRET,
      {
        expiresIn: env.JWT_EXPIRES_IN,
        issuer: 'tcg-tactique',
        audience: 'tcg-tactique-client',
      } as jwt.SignOptions
    );

    // Generate refresh token (long-lived)
    const refreshToken = jwt.sign(
      { userId, sessionId, type: 'refresh' },
      env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
        issuer: 'tcg-tactique',
      } as jwt.SignOptions
    );

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: { userId, token: refreshToken, expiresAt },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 24 * 60 * 60, // 24 hours in seconds
    };
  }

  /**
   * Verify and decode JWT access token
   */
  static verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, env.JWT_SECRET, {
        issuer: 'tcg-tactique',
        audience: 'tcg-tactique-client',
      }) as TokenPayload;
    } catch (error: any) {
      throw new Error(`Invalid access token: ${error.message}`);
    }
  }

  /**
   * Verify refresh token and generate new token pair
   */
  static async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
    try {
      const decoded = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET, {
        issuer: 'tcg-tactique',
      }) as any;

      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!storedToken || storedToken.revokedAt) {
        throw new Error('Refresh token is invalid or revoked');
      }

      if (storedToken.expiresAt < new Date()) {
        throw new Error('Refresh token has expired');
      }

      // Revoke old refresh token
      await prisma.refreshToken.update({
        where: { token: refreshToken },
        data: { revokedAt: new Date() },
      });

      return this.generateTokenPair(storedToken.user.id, storedToken.user.username);
    } catch (error: any) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Revoke refresh token (logout)
   */
  static async revokeRefreshToken(refreshToken: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Revoke all user refresh tokens (logout from all devices)
   */
  static async revokeAllUserTokens(userId: number): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Clean up expired tokens (run periodically)
   */
  static async cleanupExpiredTokens(): Promise<number> {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          {
            revokedAt: {
              lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
            }
          },
        ],
      },
    });

    return result.count;
  }
}
