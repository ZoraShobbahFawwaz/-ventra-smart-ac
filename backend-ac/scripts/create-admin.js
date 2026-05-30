const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
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
  const name = process.argv[2] || 'Admin Ventra';
  const email = process.argv[3] || 'admin@ventra.com';
  const password = process.argv[4] || `Admin-${crypto.randomBytes(4).toString('hex')}`;
  const hashedPassword = await bcrypt.hash(password, 10);

  const connection = await mysql.createConnection({
    host: env.DATABASE_HOST,
    port: Number(env.DATABASE_PORT),
    user: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    database: env.DATABASE_NAME,
    ssl: { rejectUnauthorized: false },
  });

  await connection.query(
    `INSERT INTO users (name, email, password, role)
     VALUES (?, ?, ?, 'Admin')
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       password = VALUES(password),
       role = 'Admin'`,
    [name, email, hashedPassword],
  );

  await connection.end();

  console.log('Admin account is ready.');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
