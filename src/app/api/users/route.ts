import { NextResponse } from 'next/server';
import { dbPool, auth } from '@/lib/auth';

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

// POST: Create a new user with assigned role
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

    // Check if user already exists
    const existing = await dbPool.query(`SELECT id FROM "user" WHERE email = $1`, [email.trim().toLowerCase()]);
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { success: false, message: 'A user with this email already exists' },
        { status: 400 }
      );
    }

    // Sign up user via Better Auth
    const signUpRes = await auth.api.signUpEmail({
      body: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password,
      },
    });

    if (!signUpRes?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Set role
    const validRole = ['admin', 'sales', 'viewer'].includes(role) ? role : 'sales';
    await dbPool.query(
      `UPDATE "user" SET role = $1, "updatedAt" = NOW() WHERE id = $2`,
      [validRole, signUpRes.user.id]
    );

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: signUpRes.user.id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
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
