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
    await connectDatabase();

    // Auto-seed database if empty (ensures zero setup required for doctors/medicines)
    await seedDatabase(false);

    const app = createApp();
    const port = Number(process.env.PORT) || Number(ENV.PORT) || 5000;
    app.listen(port, '0.0.0.0', () => {
      console.log(`[DocRx Backend] Server running in ${ENV.NODE_ENV} mode on port ${port}`);
      console.log(`[DocRx Backend] Health check: http://localhost:${port}/api/health`);
    });
  } catch (error) {
    console.error('[DocRx Backend] Server startup failed:', error);
    process.exit(1);
  }
};

startServer();
