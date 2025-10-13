import { Request, Response } from 'express';
import passport from 'passport';
import { TokenService } from '../services/tokenService';
import { OAuthService } from '../services/oauthService';
import { env } from '../../config/environment';
import { AuthService } from '../services/authService';

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
          accessToken: user.accessToken ?? null,
          refreshToken: user.refreshToken ?? null,
          ipAddress: req.ip ?? null,
          userAgent: req.headers['user-agent'] ?? null,
        });

        console.log('Google OAuth login successful', {
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

        console.log('Redirecting to:', redirectUrl.toString().substring(0, 100) + '...');

        res.redirect(redirectUrl.toString());
      } catch (error: any) {
        console.error('Google OAuth callback error', {
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
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        res.status(400).json({
          success: false,
          error: 'Refresh token is required',
        });
        return;
      }

      const tokens = await TokenService.refreshAccessToken(refresh_token);

      console.log('Token refresh successful', { ipAddress: req.ip });

      res.json({ success: true, data: tokens });
    } catch (error: any) {
      console.error('Token refresh failed', {
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

      console.log('User logged out', { ipAddress: req.ip });

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error: any) {
      console.error('Logout error', { error: error.message });

      res.status(500).json({
        success: false,
        error: 'Logout failed',
      });
    }
  }

  /**
   * Get current user info (for authenticated requests)
   */
  static async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
        return;
      }

      const user = await AuthService.getUserById(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      res.json({ success: true, data: user });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get user info',
      });
    }
  }

  /**
   * Get all active sessions for authenticated user
   */
  static async getUserSessions(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
        return;
      }

      const sessions = await OAuthService.getUserActiveSessions(userId);

      console.log('Retrieved user sessions', {
        userId,
        sessionCount: sessions.length,
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        data: sessions,
      });
    } catch (error: any) {
      console.error('Failed to get user sessions', {
        error: error.message,
        userId: (req as any).user?.id,
        ipAddress: req.ip,
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve sessions',
      });
    }
  }

  /**
   * Revoke a specific session for authenticated user
   */
  static async revokeSession(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const sessionId = req.params.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
        return;
      }

      if (!sessionId) {
        res.status(400).json({
          success: false,
          error: 'Session ID is required',
        });
        return;
      }

      // Get all user sessions to verify ownership
      const userSessions = await OAuthService.getUserActiveSessions(userId);
      const sessionExists = userSessions.some((s) => s.id === sessionId);

      if (!sessionExists) {
        res.status(404).json({
          success: false,
          error: 'Session not found or does not belong to user',
        });
        return;
      }

      await OAuthService.revokeSession(sessionId);

      console.log('Session revoked successfully', {
        userId,
        sessionId,
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        message: 'Session revoked successfully',
      });
    } catch (error: any) {
      console.error('Failed to revoke session', {
        error: error.message,
        userId: (req as any).user?.id,
        sessionId: req.params.id,
        ipAddress: req.ip,
      });

      res.status(500).json({
        success: false,
        error: 'Failed to revoke session',
      });
    }
  }
}
