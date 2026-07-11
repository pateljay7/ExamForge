// Prisma's datasource `provider` must be a literal, not env() — so this rewrites
// it in place from DATABASE_PROVIDER before every prisma CLI call. Runs before
// generate/migrate/push via npm pre-hooks in package.json.
const fs = require('fs');
const path = require('path');

// Load apps/api/.env manually (this script runs before Nest/Prisma would load it).
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath) && !process.env.DATABASE_PROVIDER) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*DATABASE_PROVIDER\s*=\s*"?([a-z]+)"?/i);
    if (m) process.env.DATABASE_PROVIDER = m[1];
  }
}

const SUPPORTED = ['postgresql', 'sqlite'];
const provider = SUPPORTED.includes(process.env.DATABASE_PROVIDER)
  ? process.env.DATABASE_PROVIDER
  : 'postgresql';

const schemaPath = path.join(__dirname, 'schema.prisma');
const schema = fs.readFileSync(schemaPath, 'utf8');
const updated = schema.replace(
  /provider\s*=\s*"(postgresql|sqlite)"/,
  `provider = "${provider}"`,
);

if (updated !== schema) fs.writeFileSync(schemaPath, updated);
console.log(`[prisma] datasource provider set to "${provider}"`);
