/**
 * Environment Configuration with Zod Validation
 * Type-safe environment variable parsing and validation
 */
import { z } from 'zod';

const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5001').transform(Number),

  // Database
  DATABASE_URL: z.string().url('Invalid database URL format'),

  // Redis (for future session management)
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379').transform(Number),
  REDIS_PASSWORD: z.string().optional(),

  // JWT (for future authentication)
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),

  // CORS and Frontend
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  // API Keys (optional for development)
  OPENAI_API_KEY: z.string().optional(),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Security
  BCRYPT_ROUNDS: z.string().default('12').transform(Number),

  // Rate Limiting (for future implementation)
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),
});

// Parse and validate environment variables
function validateEnvironment() {
  try {
    const env = envSchema.parse(process.env);
    return env;
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach((err: any) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      console.error('\n💡 Check your .env file and ensure all required variables are set.');
      process.exit(1);
    }
    throw error;
  }
}

export const env = validateEnvironment();
export type Environment = z.infer<typeof envSchema>;

// Export individual environment checks for convenience
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Validate critical production settings
if (isProduction) {
  if (env.JWT_SECRET.length < 64) {
    console.warn('⚠️  Warning: JWT secret should be at least 64 characters in production');
  }

  if (!env.DATABASE_URL.includes('ssl=true') && !env.DATABASE_URL.includes('localhost')) {
    console.warn('⚠️  Warning: Consider enabling SSL for production database connections');
  }
}