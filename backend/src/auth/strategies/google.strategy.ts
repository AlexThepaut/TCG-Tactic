import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { env } from '../../config/environment';
import { AuthService, GoogleProfile } from '../services/authService';

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

          console.log('Google OAuth authentication successful', {
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
          console.error('Google OAuth authentication failed', {
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
