import { createApp } from './app';
import { connectDatabase } from './config/db';
import { ENV } from './config/env';
import { seedDatabase } from './seeds/seed';

process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection]', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[Uncaught Exception]', error);
});

const startServer = async () => {
  try {
    const app = createApp();
    const port = Number(process.env.PORT) || Number(ENV.PORT) || 5000;

    // Start primary server immediately so Railway receives instantaneous health check response
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`[DocRx Backend] Server running in ${ENV.NODE_ENV} mode on port ${port}`);
      console.log(`[DocRx Backend] Health check: http://localhost:${port}/api/health`);
    });

    server.on('error', (err: any) => {
      console.error(`[DocRx Backend] Primary server on port ${port} error:`, err);
    });

    // Dual-port listening resilience:
    // If Railway public router targets 8080 while container has PORT=5000 (or vice versa),
    // activate port 8080 fallback so Railway edge never times out with 502 Bad Gateway
    if (port !== 8080) {
      try {
        const altServer = app.listen(8080, '0.0.0.0', () => {
          console.log(`[DocRx Backend] Dual-port fallback active on 8080 for Railway routing`);
        });
        altServer.on('error', (err: any) => {
          if (err.code !== 'EADDRINUSE') {
            console.warn('[DocRx Backend] Alternate port 8080 notice:', err.message);
          }
        });
      } catch (err: any) {
        // Fallback port binding is best-effort
      }
    }

    // Connect database and seed in background without blocking port binding
    connectDatabase()
      .then(async () => {
        try {
          await seedDatabase(false);
        } catch (seedErr) {
          console.error('[DocRx Backend] Auto-seed warning:', seedErr);
        }
      })
      .catch((dbErr) => {
        console.error('[DocRx Backend] Database initial connection error:', dbErr.message);
      });
  } catch (error) {
    console.error('[DocRx Backend] Server startup failed:', error);
    process.exit(1);
  }
};

startServer();
