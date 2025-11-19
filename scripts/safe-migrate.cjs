const { execSync } = require('child_process');

try {
    console.log('Running migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
} catch (_error) {
    console.warn('\x1b[33m%s\x1b[0m', 'Migration failed or indicated existing failed state.');
    console.warn('\x1b[33m%s\x1b[0m', 'Proceeding as requested by user (ignoring migration error).');
    console.warn('If you need to fix the migration state, run: npx prisma migrate resolve --applied <migration_name>');
    // Exit with 0 to allow the process to continue
    process.exit(0);
}
