import { createApp } from './app';
import { connectDatabase } from './config/db';
import { ENV } from './config/env';
import { seedDatabase } from './seeds/seed';

const startServer = async () => {
  try {
    await connectDatabase();

    // Auto-seed database if empty (ensures zero setup required for doctors/medicines)
    await seedDatabase(false);

    const app = createApp();
    app.listen(ENV.PORT, () => {
      console.log(`[DocRx Backend] Server running in ${ENV.NODE_ENV} mode on port ${ENV.PORT}`);
      console.log(`[DocRx Backend] Health check: http://localhost:${ENV.PORT}/api/health`);
    });
  } catch (error) {
    console.error('[DocRx Backend] Server startup failed:', error);
    process.exit(1);
  }
};

startServer();
