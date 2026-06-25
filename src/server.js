import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { ensureSeeded } from './utils/seed.js';

async function bootstrap() {
  // Start listening FIRST so the platform (Railway/Render/etc.) always gets a
  // healthy response and never returns a 502 — even if the database is slow or
  // misconfigured. DB connection + seeding happen in the background below.
  const app = createApp();
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`\n  IAETDS API ready → http://localhost:${env.port}`);
    console.log(`  Environment: ${env.nodeEnv}\n`);
  });

  try {
    await connectDB();
    // Seeding is best-effort: a seed failure must never take down the API.
    try {
      await ensureSeeded();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[seed] Skipped — seeding failed:', err.message);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      `[db] Database connection failed — API is running but DB-backed routes will error until MONGODB_URI is valid. Reason: ${err.message}`,
    );
  }
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[server] Failed to start:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  // eslint-disable-next-line no-console
  console.error('[server] Unhandled rejection:', reason);
});
