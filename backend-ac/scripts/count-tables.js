const fs = require('fs');
const mysql = require('mysql2/promise');

function readEnv() {
  const env = {};

  for (const line of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    env[trimmed.slice(0, separatorIndex).trim()] = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
  }

  return env;
}

async function main() {
  const env = readEnv();
  const connection = await mysql.createConnection({
    host: env.DATABASE_HOST,
    port: Number(env.DATABASE_PORT),
    user: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    database: env.DATABASE_NAME,
    ssl: { rejectUnauthorized: false },
  });

  for (const table of ['users', 'schedules', 'audit_logs']) {
    const [rows] = await connection.query(
      `SELECT COUNT(*) AS total FROM ${table}`,
    );

    console.log(`${table}: ${rows[0].total}`);
  }

  await connection.end();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
