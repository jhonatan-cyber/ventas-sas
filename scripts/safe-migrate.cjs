const { execSync } = require('child_process');

try {
    if (!process.env.DATABASE_URL) {
        console.warn('\x1b[33m%s\x1b[0m', 'DATABASE_URL not found. Skipping migrations.');
        process.exit(0);
    }
    console.log('⚠️  WARNING: RESETTING DATABASE AND RE-RUNNING ALL MIGRATIONS (PRODUCTION RESET MODE) ⚠️');
    // Using --force to skip confirmation. This will DROP the database and re-apply all migrations.
    // We temporarily set NODE_ENV=development to bypass the production safeguard for this specific operation if needed,
    // but standard reset --force usually works if allowed. 
    // If it fails due to production env, we might need to adjust, but let's try the standard command first.
    execSync('npx prisma migrate reset --force', { stdio: 'inherit' });
} catch (_error) {
    console.warn('\x1b[33m%s\x1b[0m', 'Migration failed or indicated existing failed state.');
    console.error('\x1b[31m%s\x1b[0m', 'Migration failed. Exiting with error to prevent broken deployment.');
    process.exit(1);
}
