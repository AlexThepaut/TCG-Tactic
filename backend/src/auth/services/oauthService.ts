import { PrismaClient, AuthProvider } from '@prisma/client';

const prisma = new PrismaClient();

export interface OAuthSessionData {
  userId: number;
  provider: AuthProvider;
  accessToken?: string | null;
  refreshToken?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class OAuthService {
  /**
   * Create OAuth session for audit tracking
   */
  static async createSession(data: OAuthSessionData) {
    return prisma.oAuthSession.create({
      data: {
        userId: data.userId,
        provider: data.provider,
        accessToken: data.accessToken ?? null,
        refreshToken: data.refreshToken ?? null,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
      },
    });
  }

  /**
   * Update session last used timestamp
   */
  static async updateSessionActivity(sessionId: string) {
    return prisma.oAuthSession.update({
      where: { id: sessionId },
      data: { lastUsedAt: new Date() },
    });
  }

  /**
   * Revoke OAuth session
   */
  static async revokeSession(sessionId: string) {
    return prisma.oAuthSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Revoke all user OAuth sessions
   */
  static async revokeAllUserSessions(userId: number) {
    return prisma.oAuthSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Get active sessions for user
   */
  static async getUserActiveSessions(userId: number) {
    return prisma.oAuthSession.findMany({
      where: {
        userId,
        revokedAt: null,
      },
      select: {
        id: true,
        provider: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        lastUsedAt: true,
      },
      orderBy: { lastUsedAt: 'desc' },
    });
  }

  /**
   * Clean up old revoked sessions
   */
  static async cleanupOldSessions() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    return prisma.oAuthSession.deleteMany({
      where: {
        revokedAt: { lt: thirtyDaysAgo },
      },
    });
  }
}
