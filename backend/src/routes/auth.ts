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

// Session management (requires authentication)
router.get('/sessions', authMiddleware, AuthController.getUserSessions);
router.post('/sessions/:id/revoke', authMiddleware, AuthController.revokeSession);

export default router;
