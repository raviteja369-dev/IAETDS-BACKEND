import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { ensureSeeded } from './utils/seed.js';

async function bootstrap() {
  await connectDB();
  // Seeding is best-effort: a seed failure must never prevent the API from
  // starting (otherwise the whole service 502s on a non-critical error).
  try {
    await ensureSeeded();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[seed] Skipped — seeding failed:', err.message);
  }
  const app = createApp();
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`\n  IAETDS API ready → http://localhost:${env.port}`);
    console.log(`  Environment: ${env.nodeEnv}\n`);
  });
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
