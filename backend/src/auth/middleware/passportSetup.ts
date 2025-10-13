import passport from 'passport';
import { configureGoogleStrategy } from '../strategies/google.strategy';

export function initializePassport() {
  configureGoogleStrategy();
  // Add other strategies here in the future
}
