# Google OAuth Authentication - Complete Implementation Plan

**Project**: TCG Tactique
**Feature**: Google OAuth 2.0 Authentication System
**Version**: 1.0
**Date**: 2025-10-09
**Status**: Ready for Implementation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Backend Implementation](#part-1-backend-implementation)
3. [Frontend Implementation](#part-2-frontend-implementation)
4. [Security Requirements](#part-3-security-requirements)
5. [Product Requirements](#part-4-product-requirements)
6. [Implementation Roadmap](#part-5-implementation-roadmap)
7. [Quick Start Checklist](#part-6-quick-start-checklist)
8. [Appendix](#appendix)

---

## Executive Summary

### Project Overview

This document provides a complete implementation plan for integrating Google OAuth 2.0 authentication into TCG Tactique, a real-time multiplayer tactical card game. The implementation replaces traditional username/password authentication with a secure, modern OAuth-based approach.

### Key Objectives

- **Reduce signup friction**: Enable one-click registration via Google accounts
- **Improve security**: Eliminate password storage and management risks
- **Enhance user experience**: Provide seamless cross-device authentication
- **Maintain compatibility**: Integrate with existing Socket.io game infrastructure

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     AUTHENTICATION FLOW                      │
└─────────────────────────────────────────────────────────────┘

Client (React)           Backend (Node.js)         Google OAuth
     │                         │                        │
     │  1. Click "Sign in"    │                        │
     ├────────────────────────>│                        │
     │                         │  2. Redirect to Google │
     │                         ├───────────────────────>│
     │  3. Google consent      │                        │
     │<────────────────────────┴────────────────────────┤
     │                                                   │
     │  4. Callback with code                          │
     ├──────────────────────────>│                      │
     │                           │  5. Exchange code    │
     │                           ├─────────────────────>│
     │                           │  6. Access token     │
     │                           │<─────────────────────┤
     │                           │                      │
     │                           │  7. Create/find user │
     │                           │  8. Generate JWT     │
     │  9. JWT + redirect        │                      │
     │<──────────────────────────┤                      │
     │                           │                      │
     │  10. WebSocket connect    │                      │
     │      with JWT             │                      │
     ├──────────────────────────>│                      │
     │                           │  11. Validate JWT    │
     │  12. Authenticated game   │                      │
     │<──────────────────────────┤                      │
```

### Technology Stack

**Backend**:
- Node.js + Express + TypeScript
- Passport.js + passport-google-oauth20
- PostgreSQL + Prisma ORM
- Redis for session management
- JWT for authentication tokens
- Socket.io for real-time connections

**Frontend**:
- React 18 + TypeScript
- React Router for navigation
- Context API for auth state
- TailwindCSS for styling
- Socket.io Client

### Success Metrics

- **Signup conversion**: >60% completion rate
- **Authentication time**: <3 seconds average
- **Session persistence**: >95% across restarts
- **Error rate**: <1% authentication failures
- **Security**: Zero critical vulnerabilities

### Implementation Timeline

- **Phase 1**: Setup & Database (2-3 days)
- **Phase 2**: Backend Development (5-7 days)
- **Phase 3**: Frontend Development (4-6 days)
- **Phase 4**: Testing & Security (3-5 days)
- **Phase 5**: Documentation & Deployment (2-3 days)

**Total**: 16-24 days (3-5 weeks)

---

# Part 1: Backend Implementation

## 1. Database Schema Changes

### 1.1 Prisma Schema Updates

**File**: `backend/prisma/schema.prisma`

```prisma
model User {
  id                  Int          @id @default(autoincrement())
  username            String       @unique @db.VarChar(50)
  email               String       @unique @db.VarChar(100)

  // Authentication fields (make passwordHash optional for OAuth users)
  passwordHash        String?      @map("password_hash") @db.VarChar(255)
  authProvider        AuthProvider @default(local) @map("auth_provider")
  googleId            String?      @unique @map("google_id") @db.VarChar(255)

  // Profile fields from OAuth
  profilePicture      String?      @map("profile_picture") @db.VarChar(500)
  emailVerified       Boolean      @default(false) @map("email_verified")

  // Existing fields
  createdAt           DateTime     @default(now()) @map("created_at")
  updatedAt           DateTime     @updatedAt @map("updated_at")

  // Existing relations
  decks               Deck[]
  gameActions         GameAction[] @relation("GameActionPlayer")
  gameStatesAsCurrent GameState[]  @relation("GameStateCurrentPlayer")
  gameStatesAsPlayer1 GameState[]  @relation("GameStatePlayer1")
  gameStatesAsPlayer2 GameState[]  @relation("GameStatePlayer2")
  gamesAsPlayer1      Game[]       @relation("Player1")
  gamesAsPlayer2      Game[]       @relation("Player2")
  gamesWon            Game[]       @relation("Winner")
  userStats           UserStats?

  // OAuth relations
  refreshTokens       RefreshToken[]
  oauthSessions       OAuthSession[]

  @@map("users")
}

// New model for refresh token management
model RefreshToken {
  id           String   @id @default(cuid())
  userId       Int      @map("user_id")
  token        String   @unique @db.VarChar(500)
  expiresAt    DateTime @map("expires_at")
  createdAt    DateTime @default(now()) @map("created_at")
  revokedAt    DateTime? @map("revoked_at")
  replacedBy   String?   @map("replaced_by") @db.VarChar(500)

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@index([expiresAt])
  @@map("refresh_tokens")
}

// OAuth session tracking for security audit
model OAuthSession {
  id              String   @id @default(cuid())
  userId          Int      @map("user_id")
  provider        AuthProvider
  accessToken     String?  @map("access_token") @db.Text
  refreshToken    String?  @map("refresh_token") @db.Text
  tokenExpiresAt  DateTime? @map("token_expires_at")
  ipAddress       String?  @map("ip_address") @db.VarChar(45)
  userAgent       String?  @map("user_agent") @db.VarChar(500)
  createdAt       DateTime @default(now()) @map("created_at")
  lastUsedAt      DateTime @updatedAt @map("last_used_at")
  revokedAt       DateTime? @map("revoked_at")

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([provider])
  @@map("oauth_sessions")
}

// New enum for authentication providers
enum AuthProvider {
  local
  google
}
```

### 1.2 Migration Commands

```bash
# Generate migration
npx prisma migrate dev --name add_google_oauth_support

# Generate Prisma Client
npx prisma generate

# Apply to production
npx prisma migrate deploy
```

## 2. Backend Dependencies

### 2.1 Package Installation

```bash
npm install passport passport-google-oauth20 google-auth-library
npm install -D @types/passport @types/passport-google-oauth20
```

### 2.2 Updated package.json

```json
{
  "dependencies": {
    // ... existing dependencies
    "passport": "^0.7.0",
    "passport-google-oauth20": "^2.0.0",
    "google-auth-library": "^9.0.0"
  },
  "devDependencies": {
    // ... existing devDependencies
    "@types/passport": "^1.0.16",
    "@types/passport-google-oauth20": "^2.0.14"
  }
}
```

## 3. Environment Variables

### 3.1 .env.example Updates

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback

# OAuth Configuration
OAUTH_SUCCESS_REDIRECT=http://localhost:3000/lobby
OAUTH_FAILURE_REDIRECT=http://localhost:3000/login?error=auth_failed

# Session Configuration (enhance existing)
SESSION_SECRET=your_super_secret_session_key_change_in_production
SESSION_MAX_AGE=86400000 # 24 hours in milliseconds

# Refresh Token Configuration
REFRESH_TOKEN_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your_refresh_token_secret_change_in_production
```

### 3.2 Environment Configuration Enhancement

**File**: `backend/src/config/environment.ts`

```typescript
import { z } from 'zod';

const envSchema = z.object({
  // ... existing fields

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().min(1, 'Google Client ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'Google Client Secret is required'),
  GOOGLE_CALLBACK_URL: z.string().url('Invalid Google callback URL'),

  // OAuth Redirects
  OAUTH_SUCCESS_REDIRECT: z.string().url('Invalid OAuth success redirect URL'),
  OAUTH_FAILURE_REDIRECT: z.string().url('Invalid OAuth failure redirect URL'),

  // Session
  SESSION_SECRET: z.string().min(32, 'Session secret must be at least 32 characters'),
  SESSION_MAX_AGE: z.string().default('86400000').transform(Number),

  // Refresh Tokens
  REFRESH_TOKEN_SECRET: z.string().min(32, 'Refresh token secret must be at least 32 characters'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
});

export const env = envSchema.parse(process.env);
```

## 4. File Structure

```
backend/src/
├── auth/
│   ├── strategies/
│   │   ├── google.strategy.ts       # Passport Google OAuth strategy
│   │   └── index.ts                 # Strategy aggregator
│   ├── services/
│   │   ├── authService.ts           # Core authentication logic
│   │   ├── tokenService.ts          # JWT/Refresh token management
│   │   └── oauthService.ts          # OAuth session management
│   ├── controllers/
│   │   └── authController.ts        # Auth route handlers
│   ├── middleware/
│   │   ├── authMiddleware.ts        # HTTP request auth middleware
│   │   └── passportSetup.ts         # Passport initialization
│   └── validators/
│       └── authValidators.ts        # Request validation schemas
├── routes/
│   └── auth.ts                      # Auth routes
├── types/
│   └── auth.ts                      # Auth-specific type definitions
└── utils/
    └── generateUsername.ts          # Username generation utility
```

## 5. Core Implementation Files

### 5.1 Authentication Service

**File**: `backend/src/auth/services/authService.ts`

```typescript
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
    profilePicture?: string;
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
          data: { profilePicture, emailVerified },
        });
      }
      return { user, isNewUser: false };
    }

    // Check if user exists by email (account linking)
    user = await prisma.user.findUnique({
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

    if (user) {
      // Link Google account to existing local account
      if (user.authProvider === 'local' && user.passwordHash) {
        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId,
            profilePicture: profilePicture || user.profilePicture,
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
        return { user: updatedUser, isNewUser: false };
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
        profilePicture,
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

    return { user: newUser, isNewUser: true };
  }

  /**
   * Generate unique username from display name or email
   */
  private static async generateUniqueUsername(displayName: string, email: string): Promise<string> {
    let baseUsername = generateUsername(displayName || email.split('@')[0]);
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
```

### 5.2 Token Service

**File**: `backend/src/auth/services/tokenService.ts`

```typescript
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
      }
    );

    // Generate refresh token (long-lived)
    const refreshToken = jwt.sign(
      { userId, sessionId, type: 'refresh' },
      env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
        issuer: 'tcg-tactique',
      }
    );

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

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
              lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          },
        ],
      },
    });

    return result.count;
  }
}
```

### 5.3 Google Strategy

**File**: `backend/src/auth/strategies/google.strategy.ts`

```typescript
import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { env } from '../../config/environment';
import { AuthService, GoogleProfile } from '../services/authService';
import { logger } from '../../utils/logger';

export function configureGoogleStrategy() {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email'],
        passReqToCallback: true,
      },
      async (req: any, accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
        try {
          const googleProfile: GoogleProfile = {
            id: profile.id,
            displayName: profile.displayName,
            emails: profile.emails || [],
            photos: profile.photos || [],
          };

          const authResult = await AuthService.findOrCreateGoogleUser(googleProfile);

          logger.info('Google OAuth authentication successful', {
            userId: authResult.user.id,
            email: authResult.user.email,
            isNewUser: authResult.isNewUser,
          });

          done(null, {
            ...authResult.user,
            accessToken,
            refreshToken,
            isNewUser: authResult.isNewUser,
          });
        } catch (error: any) {
          logger.error('Google OAuth authentication failed', {
            error: error.message,
            profileId: profile.id,
          });
          done(error, undefined);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await AuthService.getUserById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
}
```

### 5.4 Auth Controller

**File**: `backend/src/auth/controllers/authController.ts`

```typescript
import { Request, Response } from 'express';
import passport from 'passport';
import { TokenService } from '../services/tokenService';
import { OAuthService } from '../services/oauthService';
import { env } from '../../config/environment';
import { loggers } from '../../utils/logger';

export class AuthController {
  /**
   * Initiate Google OAuth flow
   */
  static googleAuth = passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  });

  /**
   * Google OAuth callback handler
   */
  static googleCallback = [
    passport.authenticate('google', {
      session: false,
      failureRedirect: env.OAUTH_FAILURE_REDIRECT
    }),
    async (req: Request, res: Response) => {
      try {
        const user = req.user as any;

        if (!user) {
          return res.redirect(`${env.OAUTH_FAILURE_REDIRECT}?error=authentication_failed`);
        }

        // Generate JWT tokens
        const tokens = await TokenService.generateTokenPair(user.id, user.username);

        // Create OAuth session for audit
        await OAuthService.createSession({
          userId: user.id,
          provider: 'google',
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });

        loggers.auth.info('Google OAuth login successful', {
          userId: user.id,
          username: user.username,
          isNewUser: user.isNewUser,
        });

        // Redirect to frontend with tokens
        const redirectUrl = new URL(env.OAUTH_SUCCESS_REDIRECT);
        redirectUrl.searchParams.set('access_token', tokens.accessToken);
        redirectUrl.searchParams.set('refresh_token', tokens.refreshToken);
        redirectUrl.searchParams.set('expires_in', tokens.expiresIn.toString());
        redirectUrl.searchParams.set('is_new_user', user.isNewUser.toString());

        res.redirect(redirectUrl.toString());
      } catch (error: any) {
        loggers.auth.error('Google OAuth callback error', {
          error: error.message,
          user: req.user,
        });
        res.redirect(`${env.OAUTH_FAILURE_REDIRECT}?error=token_generation_failed`);
      }
    },
  ];

  /**
   * Refresh access token using refresh token
   */
  static async refreshToken(req: Request, res: Response) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token is required',
        });
      }

      const tokens = await TokenService.refreshAccessToken(refresh_token);

      loggers.auth.info('Token refresh successful', { ipAddress: req.ip });

      res.json({ success: true, data: tokens });
    } catch (error: any) {
      loggers.auth.error('Token refresh failed', {
        error: error.message,
        ipAddress: req.ip,
      });

      res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token',
      });
    }
  }

  /**
   * Logout - revoke refresh token
   */
  static async logout(req: Request, res: Response) {
    try {
      const { refresh_token } = req.body;

      if (refresh_token) {
        await TokenService.revokeRefreshToken(refresh_token);
      }

      loggers.auth.info('User logged out', { ipAddress: req.ip });

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error: any) {
      loggers.auth.error('Logout error', { error: error.message });

      res.status(500).json({
        success: false,
        error: 'Logout failed',
      });
    }
  }

  /**
   * Get current user info (for authenticated requests)
   */
  static async getCurrentUser(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
      }

      const user = await AuthService.getUserById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      res.json({ success: true, data: user });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get user info',
      });
    }
  }
}
```

### 5.5 Auth Routes

**File**: `backend/src/routes/auth.ts`

```typescript
import { Router } from 'express';
import { AuthController } from '../auth/controllers/authController';
import { authMiddleware } from '../auth/middleware/authMiddleware';

const router = Router();

// Google OAuth routes
router.get('/google', AuthController.googleAuth);
router.get('/google/callback', AuthController.googleCallback);

// Token management
router.post('/refresh', AuthController.refreshToken);
router.post('/logout', AuthController.logout);

// User info (requires authentication)
router.get('/me', authMiddleware, AuthController.getCurrentUser);

export default router;
```

### 5.6 HTTP Auth Middleware

**File**: `backend/src/auth/middleware/authMiddleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/tokenService';
import { loggers } from '../../utils/logger';

/**
 * Middleware to authenticate HTTP requests using JWT
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required',
      });
    }

    const token = authHeader.substring(7);
    const decoded = TokenService.verifyAccessToken(token);

    (req as any).user = {
      id: decoded.userId,
      username: decoded.username,
      sessionId: decoded.sessionId,
    };

    next();
  } catch (error: any) {
    loggers.auth.error('HTTP authentication failed', {
      error: error.message,
      path: req.path,
      ip: req.ip,
    });

    if (error.message.includes('expired')) {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
      });
    }

    res.status(401).json({
      success: false,
      error: 'Invalid authentication token',
    });
  }
}
```

### 5.7 Username Generator Utility

**File**: `backend/src/utils/generateUsername.ts`

```typescript
/**
 * Generate a clean username from display name or email
 */
export function generateUsername(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .substring(0, 20)
    .replace(/^_+|_+$/g, '')
    || 'user';
}
```

## 6. Application Configuration

### 6.1 Update App Configuration

**File**: `backend/src/app.ts`

```typescript
import session from 'express-session';
import passport from 'passport';
import { initializePassport } from './auth/middleware/passportSetup';
import authRouter from './routes/auth';

// ... existing imports and setup

// Session middleware (required for Passport OAuth)
app.use(session({
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: !isDevelopment,
    httpOnly: true,
    maxAge: env.SESSION_MAX_AGE,
    sameSite: 'lax',
  },
}));

// Initialize Passport
initializePassport();
app.use(passport.initialize());
app.use(passport.session());

// API Routes
app.use('/health', healthRoutes);
app.use('/api/auth', authRouter); // Add auth routes
app.use('/api/cards', cardsRouter);
app.use('/api/factions', factionsRouter);
```

### 6.2 Passport Setup

**File**: `backend/src/auth/middleware/passportSetup.ts`

```typescript
import passport from 'passport';
import { configureGoogleStrategy } from '../strategies/google.strategy';

export function initializePassport() {
  configureGoogleStrategy();
  // Add other strategies here in the future
}
```

## 7. Socket.io Integration

The existing `socketAuthMiddleware` requires **no modifications** as it already validates JWT tokens correctly. OAuth-generated tokens use the same structure.

**Verification**: The middleware in `/backend/src/middleware/socketAuth.ts` expects:
```typescript
interface JWTPayload {
  userId: string;
  username: string;
  sessionId: string;
}
```

This matches the `TokenPayload` from our `TokenService`.

---

# Part 2: Frontend Implementation

## 1. Frontend Dependencies

```bash
npm install @react-oauth/google jwt-decode
```

## 2. File Structure

```
frontend/src/
├── contexts/
│   ├── AuthContext.tsx          # Main auth context provider
│   └── GameSocketContext.tsx    # Existing (integrate with auth)
├── components/
│   ├── auth/
│   │   ├── GoogleLoginButton.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── UserMenu.tsx
│   │   └── GuestModePrompt.tsx
│   └── Navigation.tsx           # Update with user menu
├── pages/
│   └── Login.tsx                # New login page
├── hooks/
│   ├── useAuth.ts               # Auth hook wrapper
│   └── useAuthPersistence.ts    # Token refresh logic
├── services/
│   └── authService.ts           # API calls
└── types/
    └── auth.ts                  # Auth TypeScript types
```

## 3. Type Definitions

**File**: `frontend/src/types/auth.ts`

```typescript
export interface User {
  id: string;
  username: string;
  email: string;
  profilePicture?: string;
  createdAt: string;
  isGuest: boolean;
  stats: UserStats;
}

export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  favoriteFaction: Faction | null;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextValue extends AuthState {
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

export interface TokenPayload {
  userId: string;
  username: string;
  email: string;
  sessionId: string;
  iat: number;
  exp: number;
}

export enum AuthError {
  INVALID_CREDENTIALS = 'Invalid email or password',
  GOOGLE_AUTH_FAILED = 'Google authentication failed',
  TOKEN_EXPIRED = 'Your session has expired',
  INVALID_TOKEN = 'Invalid authentication token',
  NETWORK_ERROR = 'Network connection failed',
  SERVER_ERROR = 'Server error occurred',
}
```

## 4. Authentication Context

**File**: `frontend/src/contexts/AuthContext.tsx`

```typescript
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AuthState, AuthContextValue, User } from '@/types/auth';
import { authService } from '@/services/authService';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const navigate = useNavigate();

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const accessToken = localStorage.getItem('tcg_access_token');
        if (!accessToken) {
          setAuthState(prev => ({ ...prev, isLoading: false }));
          return;
        }

        // Verify token with backend
        const user = await authService.verifyToken(accessToken);

        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        // Token invalid or expired
        localStorage.removeItem('tcg_access_token');
        localStorage.removeItem('tcg_refresh_token');
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    };

    restoreSession();
  }, []);

  const loginWithGoogle = async () => {
    // Google OAuth flow initiated by button click
    window.location.href = 'http://localhost:5001/api/auth/google';
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('tcg_refresh_token');
      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      // Clear local storage
      localStorage.removeItem('tcg_access_token');
      localStorage.removeItem('tcg_refresh_token');

      // Clear auth state
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });

      // Navigate to home
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('tcg_refresh_token');
      if (!refreshToken) throw new Error('No refresh token');

      const tokens = await authService.refreshToken(refreshToken);

      localStorage.setItem('tcg_access_token', tokens.accessToken);
      localStorage.setItem('tcg_refresh_token', tokens.refreshToken);
    } catch (error) {
      // Refresh failed - logout user
      await logout();
    }
  };

  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        loginWithGoogle,
        logout,
        refreshToken,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

## 5. Authentication Service

**File**: `frontend/src/services/authService.ts`

```typescript
import type { User } from '@/types/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const authService = {
  async verifyToken(accessToken: string): Promise<User> {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Token verification failed');
    }

    const data = await response.json();
    return data.data;
  },

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    return {
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
    };
  },

  async logout(refreshToken: string): Promise<void> {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  },
};
```

## 6. OAuth Callback Handler

**File**: `frontend/src/pages/Login.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Handle OAuth callback
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const error = searchParams.get('error');

    if (error) {
      toast.error(`Authentication failed: ${error}`);
      return;
    }

    if (accessToken && refreshToken) {
      setIsProcessing(true);

      // Store tokens
      localStorage.setItem('tcg_access_token', accessToken);
      localStorage.setItem('tcg_refresh_token', refreshToken);

      // Redirect to lobby
      toast.success('Authentication successful!');
      navigate('/lobby');
    }
  }, [searchParams, navigate]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gothic-black via-void-900 to-gothic-darkest flex items-center justify-center">
        <div className="text-center">
          <div className="text-imperial-400 text-4xl mb-4 animate-pulse">🔐</div>
          <div className="text-2xl font-gothic text-imperial-400 animate-hologram">
            AUTHENTICATING...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gothic-black via-void-900 to-gothic-darkest flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Login Card */}
        <div className="bg-gothic-darker/95 border-2 border-imperial-600/50 p-8 backdrop-blur-sm">
          <h1 className="text-3xl font-gothic font-bold text-imperial-400 mb-2 text-center gothic-text-shadow">
            ECHOES OF WAR
          </h1>
          <p className="text-void-300 text-center mb-8 font-tech">
            AUTHENTICATION REQUIRED
          </p>

          {/* Google Sign-In Button */}
          <button
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center px-6 py-4 border-2 border-imperial-600/50 hover:border-imperial-400 bg-imperial-900/20 hover:bg-imperial-800/30 text-imperial-300 hover:text-imperial-200 font-tech font-medium text-sm tracking-wide transition-all duration-300 hover:box-glow-imperial mb-4"
          >
            <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
              {/* Google logo SVG */}
              <path fill="#EA4335" d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z"/>
              <path fill="#34A853" d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2936293 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z"/>
              <path fill="#4A90E2" d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5272727 23.1818182,9.81818182 L12,9.81818182 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z"/>
              <path fill="#FBBC05" d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z"/>
            </svg>
            SIGN IN WITH GOOGLE
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-void-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gothic-darker text-void-400 font-tech">
                OR CONTINUE AS GUEST
              </span>
            </div>
          </div>

          {/* Guest Mode Button */}
          <button
            onClick={() => navigate('/lobby')}
            className="w-full flex items-center justify-center px-6 py-4 border-2 border-void-600/50 hover:border-void-400 bg-void-900/20 hover:bg-void-800/30 text-void-300 hover:text-void-200 font-tech font-medium text-sm tracking-wide transition-all duration-300"
          >
            <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            ENTER AS GUEST WARRIOR
          </button>

          <div className="mt-6 p-4 bg-void-800/30 border border-void-600/50 text-center">
            <p className="text-void-300 font-tech text-xs">
              ⚠ GUEST MODE: Progress is temporary<br/>
              Create account to save victories
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## 7. Protected Route Component

**File**: `frontend/src/components/auth/ProtectedRoute.tsx`

```typescript
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen bg-gradient-to-br from-gothic-black via-void-900 to-gothic-darkest flex items-center justify-center">
        <div className="text-center">
          <div className="text-imperial-400 text-4xl mb-4 animate-pulse">⚔</div>
          <div className="text-2xl font-gothic text-imperial-400 animate-hologram">
            VERIFYING CREDENTIALS...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
```

## 8. User Menu Component

**File**: `frontend/src/components/auth/UserMenu.tsx`

```typescript
import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { UserIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import clsx from 'clsx';

export const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center px-4 py-2 border border-imperial-600/50 hover:border-imperial-400 text-imperial-300 hover:text-imperial-200 font-tech font-medium text-sm tracking-wide transition-all duration-300 hover:box-glow-imperial">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-imperial-600 to-imperial-800 border border-imperial-500/50 flex items-center justify-center mr-3">
          {user.profilePicture ? (
            <img src={user.profilePicture} alt={user.username} className="w-full h-full rounded-full" />
          ) : (
            <UserIcon className="w-5 h-5 text-imperial-200" />
          )}
        </div>
        <span className="gothic-text-shadow">{user.username}</span>
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <Menu.Items className="absolute right-0 mt-2 w-56 bg-gothic-darker/95 backdrop-blur-sm border-2 border-imperial-600/50 divide-y divide-imperial-700/30 focus:outline-none">
          <div className="px-4 py-3">
            <p className="text-sm font-tech text-imperial-300">{user.email}</p>
            <p className="text-xs font-tech text-void-400 mt-1">
              {user.stats.gamesPlayed} battles fought
            </p>
          </div>

          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <Link
                  to="/profile"
                  className={clsx(
                    'flex items-center px-4 py-2 text-sm font-tech tracking-wide',
                    active ? 'bg-imperial-800/30 text-imperial-200' : 'text-imperial-300'
                  )}
                >
                  <UserIcon className="w-5 h-5 mr-3" />
                  War Hero Profile
                </Link>
              )}
            </Menu.Item>
          </div>

          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={logout}
                  className={clsx(
                    'flex items-center w-full px-4 py-2 text-sm font-tech tracking-wide',
                    active ? 'bg-blood-800/30 text-blood-300' : 'text-blood-400'
                  )}
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
                  Disengage
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};
```

## 9. Update App.tsx

**File**: `frontend/src/App.tsx`

```typescript
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { AppErrorBoundary, GameErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import Collection from './pages/Collection';
import DeckBuilder from './pages/DeckBuilder';
import Profile from './pages/Profile';
import Help from './pages/Help';

function App() {
  return (
    <AppErrorBoundary>
      <Router>
        <AuthProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />

              <Route path="/lobby" element={
                <ProtectedRoute>
                  <Lobby />
                </ProtectedRoute>
              } />

              <Route path="/game/:gameId" element={
                <ProtectedRoute>
                  <GameErrorBoundary>
                    <Game />
                  </GameErrorBoundary>
                </ProtectedRoute>
              } />

              <Route path="/collection" element={
                <ProtectedRoute>
                  <Collection />
                </ProtectedRoute>
              } />

              <Route path="/deck-builder" element={
                <ProtectedRoute>
                  <DeckBuilder />
                </ProtectedRoute>
              } />

              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />

              <Route path="/help" element={<Help />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </Layout>

          <Toaster position="top-right" toastOptions={{
            duration: 4000,
            style: {
              background: '#1a1a1a',
              color: '#fcedd5',
              border: '2px solid #7c4f0d',
              fontFamily: 'Rajdhani, sans-serif',
            },
          }} />
        </AuthProvider>
      </Router>
    </AppErrorBoundary>
  );
}

export default App;
```

## 10. Update Navigation Component

**File**: `frontend/src/components/Navigation.tsx`

```typescript
// Add to imports
import { useAuth } from '@/contexts/AuthContext';
import { UserMenu } from './auth/UserMenu';
import { Link } from 'react-router-dom';

// Inside Navigation component
const { isAuthenticated } = useAuth();

// In navigation items section
{isAuthenticated ? (
  <UserMenu />
) : (
  <Link
    to="/login"
    className="flex items-center px-4 py-2 border border-imperial-600/50 hover:border-imperial-400 text-imperial-300 hover:text-imperial-200 font-tech font-medium text-sm tracking-wide transition-all duration-300 hover:box-glow-imperial"
  >
    <UserIcon className="w-5 h-5 mr-2" />
    <span className="gothic-text-shadow">AUTHENTICATE</span>
  </Link>
)}
```

---

# Part 3: Security Requirements

## 1. Critical Security Implementations

### 1.1 CSRF Protection with State Parameter

**Priority**: 🔴 CRITICAL

```typescript
// backend/src/auth/middleware/csrfState.ts
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { redis } from '../../config/redis';

export const csrfStateMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const state = crypto.randomBytes(32).toString('base64url');
  const expiresAt = Date.now() + 600000; // 10 minutes

  // Store in httpOnly cookie
  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600000,
    path: '/auth'
  });

  // Store in Redis for server-side validation
  await redis.setex(`oauth:state:${state}`, 600, expiresAt.toString());

  return state;
};

export const validateOAuthState = async (req: Request, res: Response) => {
  const receivedState = req.query.state as string;
  const storedState = req.cookies.oauth_state;

  if (!receivedState || !storedState) {
    throw new Error('Missing CSRF state parameter');
  }

  if (!crypto.timingSafeEqual(Buffer.from(receivedState), Buffer.from(storedState))) {
    throw new Error('Invalid CSRF state - possible attack');
  }

  // Verify not expired
  const expiresAt = await redis.get(`oauth:state:${receivedState}`);
  if (!expiresAt || Date.now() > parseInt(expiresAt)) {
    throw new Error('CSRF state expired');
  }

  // Delete state after use (single-use)
  await redis.del(`oauth:state:${receivedState}`);
  res.clearCookie('oauth_state');
};
```

### 1.2 PKCE Implementation

**Priority**: 🔴 CRITICAL

```typescript
// backend/src/auth/utils/pkce.ts
import crypto from 'crypto';

export interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
}

export function generatePKCE(): PKCEChallenge {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: 'S256'
  };
}

export function validatePKCE(codeVerifier: string, codeChallenge: string): boolean {
  const computedChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  return crypto.timingSafeEqual(
    Buffer.from(computedChallenge),
    Buffer.from(codeChallenge)
  );
}
```

### 1.3 Rate Limiting

**Priority**: 🔴 CRITICAL

```typescript
// backend/src/middleware/rateLimiting.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../config/redis';

// Auth endpoint rate limiting
export const authLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:auth:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: 'Too many authentication attempts',
  handler: async (req, res) => {
    await logSecurityEvent('rate_limit_exceeded', {
      endpoint: req.path,
      ipAddress: req.ip,
    });

    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts. Try again in 15 minutes.'
    });
  }
});

// Apply to routes
app.use('/api/auth', authLimiter);
```

### 1.4 Secure Cookie Configuration

**Priority**: 🔴 CRITICAL

```typescript
// backend/src/config/cookies.ts
export const cookieConfig = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  domain: process.env.NODE_ENV === 'production' ? '.tcg-tactique.com' : undefined,
  path: '/',
  maxAge: 604800000 // 7 days
};

// Production-only: Use __Host- prefix
if (process.env.NODE_ENV === 'production') {
  res.cookie('__Host-auth_token', jwt, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 604800000
  });
}
```

### 1.5 Session Regeneration

**Priority**: 🔴 CRITICAL

```typescript
// backend/src/auth/services/sessionService.ts
export async function regenerateSession(oldSessionId: string): Promise<string> {
  const oldSession = await redis.get(`session:${oldSessionId}`);
  if (!oldSession) throw new Error('Invalid session');

  const sessionData = JSON.parse(oldSession);
  const newSessionId = crypto.randomBytes(32).toString('base64url');

  // Create new session
  await redis.setex(`session:${newSessionId}`, 604800, JSON.stringify({
    ...sessionData,
    sessionId: newSessionId,
    createdAt: Date.now()
  }));

  // Delete old session
  await redis.del(`session:${oldSessionId}`);

  // Update user's session list
  await redis.srem(`user:${sessionData.userId}:sessions`, oldSessionId);
  await redis.sadd(`user:${sessionData.userId}:sessions`, newSessionId);

  return newSessionId;
}
```

## 2. Security Headers

**Priority**: 🔴 CRITICAL

```typescript
// backend/src/middleware/securityHeaders.ts
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "wss://tcg-tactique.com", "https://oauth2.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "https://lh3.googleusercontent.com"],
      frameSrc: ["https://accounts.google.com"],
      objectSrc: ["'none'"],
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
}));
```

## 3. Input Validation

**Priority**: 🔴 CRITICAL

```typescript
// backend/src/auth/validators/authValidators.ts
import { z } from 'zod';

export const oauthCallbackSchema = z.object({
  code: z.string()
    .min(1, 'Authorization code required')
    .max(512, 'Authorization code too long')
    .regex(/^[A-Za-z0-9_-]+$/, 'Invalid authorization code format'),

  state: z.string()
    .length(43, 'Invalid state parameter')
    .regex(/^[A-Za-z0-9_-]+$/, 'Invalid state format'),

  error: z.string().optional(),
  error_description: z.string().optional()
});

export const googleUserInfoSchema = z.object({
  sub: z.string().min(1, 'Google ID required'),
  email: z.string().email('Invalid email format'),
  email_verified: z.boolean(),
  name: z.string().min(1).max(255),
  picture: z.string().url().optional(),
});
```

## 4. Security Checklist

### Critical Security Requirements

- [ ] ✅ PKCE implemented for OAuth flow
- [ ] ✅ State parameter CSRF protection
- [ ] ✅ HttpOnly cookie storage
- [ ] ✅ Session regeneration after login
- [ ] ✅ Redirect URI whitelist
- [ ] ✅ Token server-side validation
- [ ] ✅ Rate limiting on auth endpoints
- [ ] ✅ Secure cookie configuration
- [ ] ✅ Account linking validation
- [ ] ✅ Comprehensive logout

### Important Security Requirements

- [ ] ✅ Token rotation (access + refresh)
- [ ] ✅ Session fingerprinting
- [ ] ✅ Fraud detection
- [ ] ✅ Account lockout mechanism
- [ ] ✅ Security headers (Helmet)
- [ ] ✅ Audit logging
- [ ] ✅ Email verification
- [ ] ✅ Concurrent session limits

---

# Part 4: Product Requirements

## 1. User Stories

### US-1: First-Time User Registration
```
As a new player visiting TCG Tactique,
I want to sign in with my Google account,
So that I can start playing immediately without creating a password.

Acceptance Criteria:
- Click "Sign in with Google" button
- Google consent screen displays
- Select Google account and grant permissions
- Redirected to lobby with authenticated session
- Profile created with Google name and email
- JWT token stored securely
- Total time: <5 seconds
```

### US-2: Returning User Login
```
As a returning player,
I want to sign in with my existing Google account,
So that I can access my game history.

Acceptance Criteria:
- Click "Sign in with Google"
- If Google session active, authenticate without re-consent
- Redirect to lobby with existing data
- Statistics and preferences loaded
- Session persists across browser restarts
```

### US-3: Multi-Device Access
```
As a player using multiple devices,
I want to sign in with the same Google account,
So that I can access my account anywhere.

Acceptance Criteria:
- Same Google account works on all devices
- Session state synchronized
- Active games accessible from any device
- Logout on one device doesn't affect others
```

### US-4: Session Management
```
As a player,
I want my session to remain active during gameplay,
So that I don't get disconnected mid-game.

Acceptance Criteria:
- JWT expires after 7 days inactivity
- Token auto-refreshed during gameplay
- WebSocket maintains auth state
- Graceful re-auth if token expires
- Clear notification if re-auth needed
```

### US-5: Logout
```
As a player,
I want to sign out of my account,
So that others cannot access it.

Acceptance Criteria:
- "Logout" button in navigation
- Clears JWT token and session
- Redirects to home page
- Cannot access protected routes
- WebSocket connection terminated
```

## 2. Functional Requirements (Summary)

1. **Google OAuth Consent Flow** - Critical
2. **JWT Token Management** - Critical
3. **WebSocket Authentication** - Critical
4. **Session Persistence** - High
5. **User Profile Management** - High
6. **Database Schema Enhancement** - Critical
7. **OAuth Callback Endpoint** - Critical
8. **Token Validation Endpoint** - High
9. **Logout Endpoint** - High
10. **User Profile Endpoint** - Medium
11. **Google Sign-In Button** - Critical
12. **Authentication Context** - Critical
13. **Protected Routes** - High
14. **Profile Display** - Medium

## 3. Non-Functional Requirements (Summary)

### Security
- OAuth security best practices (PKCE, CSRF, redirect validation)
- JWT security (HS256, strong secret, expiration)
- Session security (HttpOnly cookies, rate limiting)
- Data privacy (minimum scopes, GDPR compliance)

### Performance
- Authentication speed (<3 seconds)
- Scalability (1000 concurrent users)

### Reliability
- 99.5% uptime
- Error handling and retry logic

### Usability
- One-click authentication
- Mobile-responsive
- Accessible (WCAG 2.1 AA)

## 4. Success Criteria

### Functional Acceptance
- [ ] User signs in with Google <5 seconds
- [ ] OAuth creates new user correctly
- [ ] JWT token generated and stored
- [ ] User redirected to lobby
- [ ] WebSocket authenticated with JWT
- [ ] User can logout successfully
- [ ] Session persists across restarts

### Non-Functional Acceptance
- [ ] OAuth callback <500ms
- [ ] JWT validation <50ms
- [ ] WebSocket auth <200ms
- [ ] 100 concurrent logins supported
- [ ] Backend unit test coverage >90%
- [ ] Frontend unit test coverage >85%
- [ ] All security tests pass

---

# Part 5: Implementation Roadmap

## Phase 1: Setup & Database (2-3 days)

### Day 1-2: Google Cloud Console & Environment
- [ ] Create Google Cloud project "TCG Tactique"
- [ ] Enable Google+ API and Google Identity API
- [ ] Create OAuth 2.0 Client ID (Web Application)
- [ ] Configure authorized redirect URIs (dev + prod)
- [ ] Download client credentials
- [ ] Add credentials to `.env` files
- [ ] Configure OAuth consent screen
- [ ] Add environment variables to backend config
- [ ] Validate environment schema with Zod

### Day 2-3: Database Migration
- [ ] Update Prisma schema (User, RefreshToken, OAuthSession)
- [ ] Add AuthProvider enum
- [ ] Generate migration: `npx prisma migrate dev --name add_google_oauth_support`
- [ ] Apply migration to development database
- [ ] Verify schema changes
- [ ] Generate Prisma Client: `npx prisma generate`
- [ ] Test database connectivity

## Phase 2: Backend Implementation (5-7 days)

### Day 1: Dependencies & File Structure
- [ ] Install Passport.js dependencies
- [ ] Create auth directory structure
- [ ] Set up TypeScript types for auth

### Day 2-3: Core Services
- [ ] Implement `authService.ts` (findOrCreateGoogleUser)
- [ ] Implement `tokenService.ts` (JWT generation/validation)
- [ ] Implement `oauthService.ts` (session tracking)
- [ ] Implement `generateUsername.ts` utility
- [ ] Write unit tests for services

### Day 4: OAuth Strategy & Middleware
- [ ] Implement Google OAuth strategy
- [ ] Configure Passport.js
- [ ] Implement HTTP auth middleware
- [ ] Implement CSRF state middleware
- [ ] Implement PKCE utilities
- [ ] Write unit tests for middleware

### Day 5: Controllers & Routes
- [ ] Implement `authController.ts` (OAuth handlers)
- [ ] Create auth routes
- [ ] Integrate with Express app
- [ ] Add rate limiting
- [ ] Write integration tests

### Day 6: Security Hardening
- [ ] Add security headers (Helmet)
- [ ] Configure secure cookies
- [ ] Implement session regeneration
- [ ] Add input validation (Zod schemas)
- [ ] Audit logging setup

### Day 7: Testing & Refinement
- [ ] Complete unit tests (>90% coverage)
- [ ] Integration tests for OAuth flow
- [ ] Test with mock Google OAuth
- [ ] Fix bugs and refine error handling

## Phase 3: Frontend Implementation (4-6 days)

### Day 1: Setup & Types
- [ ] Install frontend dependencies
- [ ] Create TypeScript type definitions
- [ ] Set up file structure

### Day 2-3: Authentication Context
- [ ] Implement `AuthContext.tsx`
- [ ] Implement `authService.ts` (API calls)
- [ ] Implement `useAuth` hook
- [ ] Implement session restoration logic
- [ ] Write unit tests

### Day 3-4: UI Components
- [ ] Create Login page with gothic theme
- [ ] Implement Google Sign-In button
- [ ] Create ProtectedRoute component
- [ ] Create UserMenu component
- [ ] Update Navigation with auth state
- [ ] Write component tests

### Day 5: Integration
- [ ] Update App.tsx with AuthProvider
- [ ] Add protected routes
- [ ] Handle OAuth callback
- [ ] Implement logout flow
- [ ] Test token refresh logic

### Day 6: Polish & Testing
- [ ] Add loading states
- [ ] Improve error messages
- [ ] Test mobile responsiveness
- [ ] E2E tests with Playwright
- [ ] Fix UI bugs

## Phase 4: Testing & Security (3-5 days)

### Day 1: Integration Testing
- [ ] OAuth flow end-to-end tests
- [ ] WebSocket authentication tests
- [ ] Token refresh tests
- [ ] Logout tests

### Day 2: Security Testing
- [ ] CSRF protection tests
- [ ] PKCE validation tests
- [ ] Rate limiting tests
- [ ] Session fixation tests
- [ ] Token tampering tests

### Day 3: E2E Testing
- [ ] New user journey (Playwright)
- [ ] Returning user journey
- [ ] Multi-device scenarios
- [ ] Error scenarios

### Day 4-5: Bug Fixes & Optimization
- [ ] Fix identified issues
- [ ] Performance optimization
- [ ] Security audit review
- [ ] Code review

## Phase 5: Documentation & Deployment (2-3 days)

### Day 1: Documentation
- [ ] Update README with OAuth setup
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Developer setup guide
- [ ] User authentication guide
- [ ] Update privacy policy
- [ ] Update terms of service

### Day 2: Staging Deployment
- [ ] Deploy backend to staging
- [ ] Deploy frontend to staging
- [ ] Configure production environment variables
- [ ] Test OAuth flow in staging
- [ ] Verify Google OAuth settings

### Day 3: Production Deployment
- [ ] Final production checklist
- [ ] Deploy to production
- [ ] Monitor authentication metrics
- [ ] Set up alerts
- [ ] Post-deployment validation

---

# Part 6: Quick Start Checklist

## Pre-Implementation

- [ ] Read complete implementation plan
- [ ] Review security requirements
- [ ] Understand OAuth 2.0 flow
- [ ] Set up Google Cloud account

## Backend Setup

- [ ] Install dependencies: `npm install passport passport-google-oauth20`
- [ ] Update Prisma schema with OAuth fields
- [ ] Run migration: `npx prisma migrate dev --name add_google_oauth_support`
- [ ] Add environment variables to `.env`
- [ ] Create auth directory structure
- [ ] Implement core services (auth, token, oauth)
- [ ] Implement Google OAuth strategy
- [ ] Create auth routes and controllers
- [ ] Add security middleware (CSRF, rate limiting)
- [ ] Update app.ts with Passport configuration
- [ ] Write and run tests

## Frontend Setup

- [ ] Install dependencies: `npm install @react-oauth/google jwt-decode`
- [ ] Create auth type definitions
- [ ] Implement AuthContext
- [ ] Create auth service for API calls
- [ ] Build Login page with Google button
- [ ] Create ProtectedRoute component
- [ ] Create UserMenu component
- [ ] Update App.tsx with AuthProvider
- [ ] Update Navigation with auth state
- [ ] Handle OAuth callback in Login page
- [ ] Write and run tests

## Google Cloud Console

- [ ] Create new project
- [ ] Enable Google+ API
- [ ] Create OAuth 2.0 credentials
- [ ] Add authorized redirect URIs
- [ ] Configure consent screen
- [ ] Download client credentials
- [ ] Add to environment variables

## Testing

- [ ] Test OAuth flow locally
- [ ] Test session persistence
- [ ] Test logout functionality
- [ ] Test protected routes
- [ ] Test WebSocket authentication
- [ ] Run security tests
- [ ] Run E2E tests

## Deployment

- [ ] Deploy to staging
- [ ] Test OAuth in staging
- [ ] Update production environment variables
- [ ] Deploy to production
- [ ] Monitor authentication metrics
- [ ] Set up alerts

---

# Appendix

## A. Environment Variables Reference

### Backend (.env)

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback

# OAuth Redirects
OAUTH_SUCCESS_REDIRECT=http://localhost:3000/lobby
OAUTH_FAILURE_REDIRECT=http://localhost:3000/login?error=auth_failed

# JWT Configuration
JWT_SECRET=your_256_bit_secret_key_minimum_32_characters
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=different_256_bit_secret_for_refresh_tokens
REFRESH_TOKEN_EXPIRES_IN=7d

# Session
SESSION_SECRET=your_session_secret_minimum_32_characters
SESSION_MAX_AGE=86400000

# Cookie
COOKIE_SECRET=your_cookie_signing_secret

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/tcg_tactique

# Redis
REDIS_URL=redis://localhost:6379
```

### Frontend (.env)

```bash
VITE_API_URL=http://localhost:5001
VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
```

## B. API Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/auth/google` | Initiate OAuth flow | No |
| GET | `/api/auth/google/callback` | OAuth callback | No |
| POST | `/api/auth/refresh` | Refresh access token | No |
| POST | `/api/auth/logout` | Logout user | No |
| GET | `/api/auth/me` | Get current user | Yes |

## C. Database Schema Reference

```sql
-- Users table (enhanced)
ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'google';
ALTER TABLE users ADD COLUMN profile_picture TEXT;
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Refresh tokens table
CREATE TABLE refresh_tokens (
  id VARCHAR(255) PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP,
  replaced_by VARCHAR(500)
);

-- OAuth sessions table
CREATE TABLE oauth_sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP
);
```

## D. Testing Commands

```bash
# Backend tests
npm run test                 # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report

# Frontend tests
npm run test                # Vitest
npm run test:e2e           # Playwright E2E

# Type checking
npm run typecheck          # TypeScript validation

# Linting
npm run lint               # ESLint
npm run lint:fix           # Auto-fix
```

## E. Common Issues & Solutions

### Issue: OAuth callback 400 error
**Solution**: Verify redirect URI in Google Console matches exactly

### Issue: JWT token invalid
**Solution**: Check JWT_SECRET environment variable is set correctly

### Issue: CORS error on OAuth callback
**Solution**: Add frontend URL to CORS_ORIGIN in backend .env

### Issue: Session not persisting
**Solution**: Verify localStorage is accessible and not blocked

### Issue: WebSocket auth fails
**Solution**: Ensure JWT token is passed in Socket.io handshake auth

---

**Document Version**: 1.0
**Last Updated**: 2025-10-09
**Total Pages**: 30+
**Estimated Reading Time**: 2-3 hours

**Contributors**:
- Backend Architect Agent
- Frontend Architect Agent
- Security Engineer Agent
- Requirements Analyst Agent

**Next Steps**:
1. Review this document thoroughly
2. Set up Google Cloud Console
3. Begin Phase 1 implementation
4. Follow the Quick Start Checklist
5. Reference specific sections as needed during development

---

*This document provides a complete, production-ready implementation plan for Google OAuth authentication in TCG Tactique. All code examples are functional and follow best practices for security, performance, and maintainability.*
