const { execSync } = require('child_process');

// Skip migrations during build if SKIP_MIGRATIONS is set
if (process.env.SKIP_MIGRATIONS === 'true') {
    console.log('\x1b[36m%s\x1b[0m', '⏭️  SKIP_MIGRATIONS is set. Skipping database migrations.');
    process.exit(0);
}

try {
    if (!process.env.DATABASE_URL) {
        console.warn('\x1b[33m%s\x1b[0m', 'DATABASE_URL not found. Skipping migrations.');
        process.exit(0);
    }
    console.log('Running migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
} catch (_error) {
    console.warn('\x1b[33m%s\x1b[0m', 'Migration failed or indicated existing failed state.');
    console.error('\x1b[31m%s\x1b[0m', 'Migration failed. Exiting with error to prevent broken deployment.');
    process.exit(1);
}
