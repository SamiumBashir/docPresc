import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import routes from './routes';
import v1Routes from './routes/v1';
import { errorHandler } from './middleware/errorHandler';
import { authenticate, requireRole } from './middleware/auth';
import { ENV } from './config/env';
import { connectDatabase, isDatabaseConnected } from './config/db';
import { testSmtpDiagnostics } from './services/email.service';

export const createApp = () => {
  const app = express();

  // Trust first proxy hop (Vercel, Cloudflare, etc.) to accurately extract client IP in serverless
  app.set('trust proxy', 1);

  // Security Middleware
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows flexible PDF and frontend embedding
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // CORS configuration with strict explicit allowlist
  const allowedOrigins = (ENV.CORS_ORIGIN || '')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin) {
          return callback(null, true);
        }
        const cleanOrigin = origin.replace(/\/+$/, '');
        const isAllowed =
          allowedOrigins.includes(cleanOrigin) ||
          (ENV.NODE_ENV !== 'production' &&
            (cleanOrigin.startsWith('http://localhost:') ||
              cleanOrigin.startsWith('http://127.0.0.1:')));

        if (isAllowed) {
          callback(null, true);
        } else {
          callback(new Error(`Not allowed by CORS: ${origin}`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-Request-ID'],
    })
  );

  // Gzip/Deflate compression for fast JSON transmission
  app.use(compression());

  // Request Parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser(ENV.COOKIE_SECRET));

  // Request Logging
  if (ENV.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Rate Limiting on sensitive auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    validate: { xForwardedForHeader: false },
    message: {
      success: false,
      message: 'Too many requests, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      errors: {},
    },
  });
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  app.use('/api/v1/auth/login', authLimiter);
  app.use('/api/v1/auth/register', authLimiter);

  // Rate Limiting on password recovery endpoints
  const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: ENV.NODE_ENV === 'test' ? 1000 : 30,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
    message: {
      success: false,
      message: 'Too many password recovery requests from this IP. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      errors: {},
    },
  });
  app.use('/api/auth/forgot-password', passwordResetLimiter);
  app.use('/api/auth/verify-reset-otp', passwordResetLimiter);
  app.use('/api/auth/verify-otp', passwordResetLimiter);
  app.use('/api/auth/resend-reset-otp', passwordResetLimiter);
  app.use('/api/auth/resend-otp', passwordResetLimiter);
  app.use('/api/auth/reset-password', passwordResetLimiter);
  app.use('/api/v1/auth/forgot-password', passwordResetLimiter);
  app.use('/api/v1/auth/verify-reset-otp', passwordResetLimiter);
  app.use('/api/v1/auth/verify-otp', passwordResetLimiter);
  app.use('/api/v1/auth/resend-reset-otp', passwordResetLimiter);
  app.use('/api/v1/auth/resend-otp', passwordResetLimiter);
  app.use('/api/v1/auth/reset-password', passwordResetLimiter);

  // Database connection assurance for serverless and traditional invocations
  app.use(async (req, res, next) => {
    // Health check and root route can respond immediately without blocking
    if (req.path === '/' || req.path.startsWith('/api/health')) {
      return next();
    }

    try {
      await connectDatabase();
      next();
    } catch (err: any) {
      console.error('[Database Middleware] Connection error:', err.message);
      res.status(503).json({
        success: false,
        message: 'Database service is temporarily unavailable. Please try again in a few moments.',
        code: 'DATABASE_UNAVAILABLE',
        errors: {},
      });
    }
  });

  // Root & Health check endpoints
  app.get('/', (req, res) => {
    res.json({
      status: 'ok',
      service: 'DocRx Prescription API',
      serverless: Boolean(process.env.VERCEL),
      timestamp: new Date().toISOString(),
    });
  });

  // Helper to verify/warm DB connection for health & readiness probes without exposing secrets
  const checkDatabaseHealth = async (): Promise<{ connected: boolean; errorHint?: string }> => {
    if (isDatabaseConnected()) {
      return { connected: true };
    }
    try {
      await connectDatabase();
      return { connected: isDatabaseConnected() };
    } catch (err: any) {
      const msg = String(err?.message || '');
      let errorHint = 'Connection unavailable';
      if (msg.includes('bad auth') || msg.includes('Authentication failed')) {
        errorHint = 'Authentication failed (verify MONGODB_URI credentials)';
      } else if (msg.includes('ENOTFOUND') || msg.includes('querySrv')) {
        errorHint = 'DNS or host resolution failed (verify MONGODB_URI host)';
      } else if (msg.includes('timed out') || msg.includes('Server selection timed out')) {
        errorHint = 'Connection timed out (verify MongoDB Atlas Network Access allows 0.0.0.0/0)';
      } else if (ENV.NODE_ENV !== 'production' && msg) {
        errorHint = msg;
      }
      return { connected: false, errorHint };
    }
  };

  app.get('/api/health', async (_req, res) => {
    const { connected, errorHint } = await checkDatabaseHealth();
    res.json({
      status: 'ok',
      database: connected ? 'connected' : 'disconnected',
      ...(errorHint && !connected ? { databaseError: errorHint } : {}),
      serverless: Boolean(process.env.VERCEL),
      timestamp: new Date().toISOString(),
    });
  });

  // Liveness Probe (process is responsive)
  app.get('/api/health/liveness', (_req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // Readiness Probe (can accept production traffic; database must be healthy)
  app.get('/api/health/readiness', async (_req, res) => {
    const { connected, errorHint } = await checkDatabaseHealth();
    if (!connected) {
      res.status(503).json({
        status: 'unready',
        database: 'disconnected',
        ...(errorHint ? { databaseError: errorHint } : {}),
        timestamp: new Date().toISOString(),
      });
      return;
    }
    res.json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  });

  // SMTP Email Health Diagnostic Endpoint - Restricted to authenticated Admin users only
  app.get('/api/health/email-diagnostic', authenticate, requireRole(['admin']), async (req, res) => {
    // In production, disable arbitrary 'to' relaying
    const targetEmail = ENV.NODE_ENV === 'production' ? undefined : ((req.query.to as string) || undefined);
    try {
      const diagnostics = await testSmtpDiagnostics(targetEmail);
      // Redact sensitive password/secrets from output
      const sanitized = {
        ...diagnostics,
        config: diagnostics?.config
          ? {
              ...diagnostics.config,
              auth: diagnostics.config.auth
                ? { user: diagnostics.config.auth.user, pass: '***REDACTED***' }
                : undefined,
            }
          : undefined,
      };
      res.json(sanitized);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Documentation redirect
  app.get('/api-docs', (_req, res) => res.redirect('/api/v1/docs'));

  // Versioned API v1 (Modular Monolith)
  app.use('/api/v1', v1Routes);

  // Master API routes mounted at canonical /api (Backward Compatibility)
  app.use('/api', routes);

  // Fallback mount for environments where /api is stripped by an edge rewrite
  app.use('/', routes);

  // 404 handler for undefined routes
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Route '${req.method} ${req.originalUrl}' not found.`,
      code: 'ROUTE_NOT_FOUND',
      errors: {},
    });
  });

  // Central Error Handler
  app.use(errorHandler);

  return app;
};

const defaultApp = createApp();

export const handler = (req: any, res: any) => defaultApp(req, res);
export default defaultApp;

// Support both CommonJS require() and ESM import for Vercel Serverless Function compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Object.assign(defaultApp, {
    createApp,
    handler,
    default: defaultApp,
  });
}
