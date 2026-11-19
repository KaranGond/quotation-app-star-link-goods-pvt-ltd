/* eslint-disable @typescript-eslint/no-require-imports */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load environment variables from .env
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}

async function run() {
  const { hashPassword } = await import('better-auth/crypto');

  const client = new Client({
    connectionString: process.env.PG_URI,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database...');

    // 1. Remove all sessions, accounts, verifications, and users
    console.log('Clearing existing auth tables...');
    await client.query('DELETE FROM "verification";');
    await client.query('DELETE FROM "session";');
    await client.query('DELETE FROM "account";');
    await client.query('DELETE FROM "user";');
    console.log('Cleared all prior users, sessions, and accounts.');

    // 2. Hash password for karangond221998@gmail.com
    const email = 'karangond221998@gmail.com';
    const rawPass = 'Karan1998';
    const name = 'Karan Gond';
    const role = 'admin';
    const hashedPassword = await hashPassword(rawPass);

    const userId = 'usr_' + Date.now() + crypto.randomBytes(4).toString('hex');
    const accountId = 'acc_' + Date.now() + crypto.randomBytes(4).toString('hex');

    // 3. Insert into "user"
    await client.query(
      `INSERT INTO "user" (id, name, email, "emailVerified", role, banned, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, true, $4, false, NOW(), NOW())`,
      [userId, name, email, role]
    );

    // 4. Insert into "account"
    await client.query(
      `INSERT INTO "account" (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
       VALUES ($1, $2, 'credential', $3, $4, NOW(), NOW())`,
      [accountId, userId, userId, hashedPassword]
    );

    console.log(`\n✅ Successfully created sole Administrator:`);
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${rawPass}`);
    console.log(`   Role:     ${role.toUpperCase()}`);
    console.log(`   User ID:  ${userId}\n`);

    // Verify
    const users = await client.query('SELECT id, name, email, role FROM "user"');
    console.log('Database users count:', users.rows.length);
    console.log('User list:', users.rows);

    await client.end();
  } catch (err) {
    console.error('Error in setup-single-admin:', err);
    process.exit(1);
  }
}

run();
