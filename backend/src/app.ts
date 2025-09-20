/**
 * Express Application Configuration
 * Main app setup with middleware stack, security, and route configuration
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

// Import after env loading
import { env, isDevelopment } from './config/environment';
import { logger, logStream, loggers } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { healthRoutes } from './routes/health';
import cardsRouter from './routes/cards';
import factionsRouter from './routes/factions';

// Create Express application
const app = express();

// Trust proxy if behind reverse proxy (for production)
if (!isDevelopment) {
  app.set('trust proxy', 1);
}

// Security middleware
app.use(helmet({
  // Configure helmet for game application
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", 'ws:', 'wss:'], // Allow WebSocket connections
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  // Allow cross-origin requests for Socket.io
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // In development, allow localhost with any port
    if (isDevelopment && origin.includes('localhost')) {
      return callback(null, true);
    }

    // Check against allowed origins
    const allowedOrigins = [env.FRONTEND_URL];
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true, // Allow cookies and auth headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Compression middleware for better performance
app.use(compression({
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression for all other requests
    return compression.filter(req, res);
  },
}));

// Request logging with Morgan
if (isDevelopment) {
  app.use(morgan('dev', { stream: logStream }));
} else {
  app.use(morgan('combined', { stream: logStream }));
}

// Body parsing middleware
app.use(express.json({
  limit: '10mb', // Increase limit for potential card images
  verify: (req, res, buf) => {
    // Store raw body for webhook verification if needed
    (req as any).rawBody = buf;
  }
}));

app.use(express.urlencoded({
  extended: true,
  limit: '10mb'
}));

// Request ID middleware for tracking
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] ||
                   `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.headers['x-request-id'] = requestId as string;
  res.setHeader('X-Request-ID', requestId);
  next();
});

// Request timeout middleware
app.use((req, res, next) => {
  // Set timeout for all requests (30 seconds)
  res.setTimeout(30000, () => {
    const error = new Error('Request timeout');
    (error as any).statusCode = 408;
    next(error);
  });
  next();
});

// API Routes
app.use('/health', healthRoutes);
app.use('/api/cards', cardsRouter);
app.use('/api/factions', factionsRouter);

// Socket.io server reference will be attached in server.ts
// This allows health routes to access socket server instance

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'TCG Tactique Backend API',
    version: process.env.npm_package_version || '1.0.0',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      healthDetailed: '/health/detailed',
      healthDb: '/health/db',
      healthStats: '/health/stats',
      cards: '/api/cards',
      factions: '/api/factions'
    }
  });
});

// API status endpoint
app.get('/api', (req, res) => {
  res.json({
    api: 'TCG Tactique Backend',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    features: {
      authentication: 'planned',
      realTimeGame: 'planned',
      deckBuilder: 'planned',
      cardGeneration: 'planned'
    }
  });
});

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Log successful app initialization
loggers.http.info('Express application configured successfully', {
  environment: env.NODE_ENV,
  corsOrigin: env.FRONTEND_URL,
  port: env.PORT
});

export { app };