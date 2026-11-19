import { NextResponse } from 'next/server';
import { dbPool } from '@/lib/auth';
import { hashPassword } from 'better-auth/crypto';
import crypto from 'crypto';

export const runtime = 'nodejs';

// GET: List all users
export async function GET() {
  try {
    const res = await dbPool.query(`
      SELECT id, name, email, role, banned, "createdAt", "updatedAt"
      FROM "user"
      ORDER BY "createdAt" DESC;
    `);

    return NextResponse.json({ success: true, users: res.rows });
  } catch (error: any) {
    console.error('Users API GET error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST: Create a new user with assigned role (Admin provisioned)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role = 'sales' } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = await dbPool.query(`SELECT id FROM "user" WHERE email = $1`, [cleanEmail]);
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { success: false, message: 'A user with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password with Better Auth's password algorithm
    const hashedPassword = await hashPassword(password);
    const userId = 'usr_' + Date.now() + crypto.randomBytes(4).toString('hex');
    const accountId = 'acc_' + Date.now() + crypto.randomBytes(4).toString('hex');
    const validRole = ['admin', 'sales', 'viewer'].includes(role) ? role : 'sales';

    // 1. Insert into "user"
    await dbPool.query(
      `INSERT INTO "user" (id, name, email, "emailVerified", role, banned, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, true, $4, false, NOW(), NOW())`,
      [userId, name.trim(), cleanEmail, validRole]
    );

    // 2. Insert into "account"
    await dbPool.query(
      `INSERT INTO "account" (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
       VALUES ($1, $2, 'credential', $3, $4, NOW(), NOW())`,
      [accountId, userId, userId, hashedPassword]
    );

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: userId,
        name: name.trim(),
        email: cleanEmail,
        role: validRole,
      },
    });
  } catch (error: any) {
    console.error('Users API POST error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}
