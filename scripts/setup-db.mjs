// Best-effort DB setup before dev/build. NEVER fails the run — a missing
// or unreachable DATABASE_URL only logs a warning.
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

// Load .env — this runs as a `predev` hook BEFORE `next dev` loads .env,
// so DATABASE_URL would otherwise be unset and the seed silently skipped.
try {
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
} catch {}

// A FAILURE is not a SKIP. This printed `[setup-db] skipped: <cmd>` for
// both, and returned 0 either way -- so a `prisma db push` that failed
// looked identical to one we chose not to run, the seed line below never
// executed, and the dev server booted against a database with no tables.
// Every preview page then renders unauthenticated and the demo
// credentials fail, with nothing anywhere saying why.
function run(cmd) {
  try { execSync(cmd, { stdio: 'inherit' }); return true; }
  catch (err) {
    console.error('[setup-db] FAILED: ' + cmd);
    console.error('[setup-db]   ' + String(err && err.message ? err.message : err).split('\n')[0]);
    failures.push(cmd);
    return false;
  }
}

// Like run(), but returns what the command PRINTED. An exit code is not
// evidence: the generated seed catches every error and exits 0 on purpose
// (one bad column must not block the rest), so `npx tsx prisma/seed.ts`
// answered 0 while every insert failed P2003 and no demo user existed.
function runCapture(cmd) {
  try {
    const outText = execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    if (outText) process.stdout.write(outText);
    return outText || '';
  } catch (err) {
    const outText = String((err && (err.stdout || '')) || '') + String((err && err.stderr) || '');
    if (outText) process.stdout.write(outText);
    console.error('[setup-db] FAILED: ' + cmd);
    failures.push(cmd);
    return outText;
  }
}

// Prefer the PROJECT's prisma over whatever `prisma` resolves to on PATH.
// An unrelated binary of the same name answers `db push` with
// CLI.UNKNOWN_COMMAND, which this script would have called a skip.
const localBin = (n) => {
  const p = 'node_modules/.bin/' + n + (process.platform === 'win32' ? '.cmd' : '');
  try { return existsSync(p) ? JSON.stringify(p) : 'npx ' + n; } catch { return 'npx ' + n; }
};
const failures = [];

const url = process.env.DATABASE_URL || '';
const realDb = url && !/user:password@localhost/.test(url);

const schemaPath = 'prisma/schema.prisma';
if (!existsSync(schemaPath)) {
  console.warn('[setup-db] prisma/schema.prisma not present yet — skipping prisma generate (it will run on the next dev-server start once the schema is written).');
} else {
  const prisma = localBin('prisma');
  run(`${prisma} generate --schema=${schemaPath}`);
  if (realDb) {
    if (run(`${prisma} db push --schema=${schemaPath} --skip-generate --accept-data-loss`)) {
      const seedOut = runCapture('npx tsx prisma/seed.ts');
      // 'Seeded' must mean a row exists. The seed prints one of two
      // markers; ANY other outcome — including a silent success — is
      // reported as missing rather than assumed to have worked.
      if (/\[seed\] demo-user: ok/.test(seedOut)) {
        console.log('[setup-db] demo-user: ok');
      } else {
        const why = (/\[seed\] demo-user: MISSING — (.*)/.exec(seedOut) || [])[1]
          || 'the seed printed no demo-user result';
        console.error('[setup-db] demo-user: MISSING — ' + why.trim());
        failures.push('demo user');
      }
    }
  } else {
    console.warn('[setup-db] no real DATABASE_URL — skipping db push + seed');
  }
}

if (failures.length) {
  console.error('[setup-db] DEMO-LOGIN-UNAVAILABLE: ' + failures.length +
    ' setup step(s) failed — the database has no schema/seed, so sign-in will fail.');
} else {
  console.log('[setup-db] ok');
}
