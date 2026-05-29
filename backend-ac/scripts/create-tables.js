const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

function readEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  const env = {};

  if (!fs.existsSync(envPath)) {
    throw new Error('.env file not found');
  }

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, '');

    env[key] = value;
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
    ssl:
      env.DATABASE_SSL === 'true'
        ? {
            rejectUnauthorized: false,
          }
        : undefined,
  });

  const statements = [
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(255) NOT NULL,
      resetToken VARCHAR(255) NULL,
      resetTokenExpiry TIMESTAMP NULL
    )`,
    `CREATE TABLE IF NOT EXISTS schedules (
      id INT AUTO_INCREMENT PRIMARY KEY,
      room_name VARCHAR(255) NOT NULL,
      day VARCHAR(255) NOT NULL,
      start_time VARCHAR(255) NOT NULL,
      end_time VARCHAR(255) NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_name VARCHAR(255) NULL,
      action VARCHAR(255) NOT NULL,
      module VARCHAR(255) NOT NULL,
      subject TEXT NOT NULL,
      old_value LONGTEXT NULL,
      new_value LONGTEXT NULL,
      status VARCHAR(50) DEFAULT 'success',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
  ];

  for (const statement of statements) {
    await connection.query(statement);
  }

  await connection.end();
  console.log('Tables are ready.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
