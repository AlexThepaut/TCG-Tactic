import { PrismaClient, AuthProvider } from '@prisma/client';
import { generateUsername } from '../../utils/generateUsername';

const prisma = new PrismaClient();

export interface GoogleProfile {
  id: string;
  displayName: string;
  emails: Array<{ value: string; verified: boolean }>;
  photos: Array<{ value: string }>;
}

export interface AuthResult {
  user: {
    id: number;
    username: string;
    email: string;
    profilePicture?: string | undefined;
    authProvider: AuthProvider;
  };
  isNewUser: boolean;
}

export class AuthService {
  /**
   * Find or create user from Google OAuth profile
   */
  static async findOrCreateGoogleUser(profile: GoogleProfile): Promise<AuthResult> {
    const googleId = profile.id;
    const email = profile.emails[0]?.value;
    const emailVerified = profile.emails[0]?.verified || false;
    const profilePicture = profile.photos[0]?.value;

    if (!email) {
      throw new Error('Email not provided by Google');
    }

    // Check if user exists by googleId
    let user = await prisma.user.findUnique({
      where: { googleId },
      select: {
        id: true,
        username: true,
        email: true,
        profilePicture: true,
        authProvider: true,
        emailVerified: true,
      },
    });

    if (user) {
      // Update profile picture and email verification if changed
      if (user.profilePicture !== profilePicture || user.emailVerified !== emailVerified) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            profilePicture: profilePicture ?? null,
            emailVerified
          },
        });
      }
      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          profilePicture: user.profilePicture ?? undefined,
          authProvider: user.authProvider,
        },
        isNewUser: false
      };
    }

    // Check if user exists by email (account linking)
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        username: true,
        email: true,
        profilePicture: true,
        authProvider: true,
        emailVerified: true,
        passwordHash: true,
      },
    });

    if (existingUser) {
      // Link Google account to existing local account
      if (existingUser.authProvider === 'local' && existingUser.passwordHash) {
        const updatedUser = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            googleId,
            profilePicture: profilePicture ?? existingUser.profilePicture ?? null,
            emailVerified: true,
          },
          select: {
            id: true,
            username: true,
            email: true,
            profilePicture: true,
            authProvider: true,
          },
        });
        return {
          user: {
            id: updatedUser.id,
            username: updatedUser.username,
            email: updatedUser.email,
            profilePicture: updatedUser.profilePicture ?? undefined,
            authProvider: updatedUser.authProvider,
          },
          isNewUser: false
        };
      }
    }

    // Create new user
    const username = await this.generateUniqueUsername(profile.displayName, email);

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        googleId,
        authProvider: AuthProvider.google,
        profilePicture: profilePicture ?? null,
        emailVerified,
        passwordHash: null,
      },
      select: {
        id: true,
        username: true,
        email: true,
        profilePicture: true,
        authProvider: true,
      },
    });

    // Create default user stats
    await prisma.userStats.create({
      data: { userId: newUser.id },
    });

    return {
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        profilePicture: newUser.profilePicture ?? undefined,
        authProvider: newUser.authProvider,
      },
      isNewUser: true
    };
  }

  /**
   * Generate unique username from display name or email
   */
  private static async generateUniqueUsername(displayName: string | undefined, email: string): Promise<string> {
    const baseName = displayName ?? email.split('@')[0] ?? 'user';
    let baseUsername = generateUsername(baseName);
    let username = baseUsername;
    let counter = 1;

    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    return username;
  }

  /**
   * Verify user exists and is active
   */
  static async getUserById(userId: number) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        profilePicture: true,
        authProvider: true,
        emailVerified: true,
      },
    });
  }
}
