import { NextResponse } from 'next/server';
import { dbPool } from '@/lib/auth';

export const runtime = 'nodejs';

// PATCH: Update user role or status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { role, name, banned } = body;

    // Check if target user exists
    const userRes = await dbPool.query(`SELECT id, email, role FROM "user" WHERE id = $1`, [id]);
    if (userRes.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const updates: string[] = ['"updatedAt" = NOW()'];
    const values: any[] = [id];
    let paramIndex = 2;

    if (role !== undefined) {
      const validRole = ['admin', 'sales', 'viewer'].includes(role) ? role : 'sales';
      updates.push(`role = $${paramIndex++}`);
      values.push(validRole);
    }

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name.trim());
    }

    if (banned !== undefined) {
      updates.push(`banned = $${paramIndex++}`);
      values.push(Boolean(banned));
    }

    const query = `
      UPDATE "user"
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING id, name, email, role, banned, "updatedAt";
    `;

    const result = await dbPool.query(query, values);

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: result.rows[0],
    });
  } catch (error: any) {
    console.error('Users API PATCH error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE: Delete user account
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Prevent deleting primary super admin
    const userRes = await dbPool.query(`SELECT email, role FROM "user" WHERE id = $1`, [id]);
    if (userRes.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    if (userRes.rows[0].email === 'karangond221998@gmail.com') {
      return NextResponse.json(
        { success: false, message: 'Primary administrator account (karangond221998@gmail.com) cannot be deleted' },
        { status: 403 }
      );
    }

    // Prevent deleting the sole remaining admin in the system
    if (userRes.rows[0].role === 'admin') {
      const adminCountRes = await dbPool.query(`SELECT COUNT(*) as count FROM "user" WHERE role = 'admin'`);
      if (parseInt(adminCountRes.rows[0]?.count || '0', 10) <= 1) {
        return NextResponse.json(
          { success: false, message: 'Cannot delete the only remaining Administrator in the system' },
          { status: 403 }
        );
      }
    }

    // Cascade delete user and associated sessions/accounts
    await dbPool.query(`DELETE FROM "user" WHERE id = $1`, [id]);

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error: any) {
    console.error('Users API DELETE error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}
