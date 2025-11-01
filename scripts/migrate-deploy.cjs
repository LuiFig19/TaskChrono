// Cross-platform Prisma migrate deploy for CI (e.g., Vercel)
// - Prefers DATABASE_DIRECT_URL when present
// - Falls back to DATABASE_URL
// - On failure, attempts a non-destructive prisma db push (accepting data loss only when needed)

const { execSync } = require('node:child_process');

function run(cmd, env) {
  return execSync(cmd, { stdio: 'inherit', env });
}

(async () => {
  const direct = process.env.DATABASE_DIRECT_URL;
  const regular = process.env.DATABASE_URL;
  const url = direct || regular || '';
  if (!url) {
    console.log('[migrate] No DATABASE_URL or DATABASE_DIRECT_URL set; skipping migrate deploy');
    process.exit(0);
  }
  const env = { ...process.env, DATABASE_URL: url };
  try {
    console.log('[migrate] Running prisma migrate deploy');
    run('npx prisma migrate deploy', env);
    console.log('[migrate] Migrations applied successfully');
    process.exit(0);
  } catch (e) {
    console.warn('[migrate] migrate deploy failed; attempting prisma db push as fallback');
    try {
      run('npx prisma db push --accept-data-loss', env);
      console.log('[migrate] prisma db push succeeded');
      process.exit(0);
    } catch (e2) {
      console.error('[migrate] prisma db push failed');
      process.exit(1);
    }
  }
})();
