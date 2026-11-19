import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';
import { integratedProductSchema } from '../../../lib/schemas/integratedProduct';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = integratedProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, errors: parsed.error.format() }, { status: 400 });
    }

    const row = { ...parsed.data } as Record<string, any>;
    const supabase = getServerSupabase();

    const { data, error } = await supabase.from('integrated_products').insert([row]).select();
    if (error) throw error;

    return NextResponse.json({ success: true, data: data?.[0] ?? null });
  } catch (err: unknown) {
    console.error('Save integrated product error:', err);
    return NextResponse.json({ success: false, message: (err as Error)?.message ?? 'Failed to save product' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('integrated_products')
      .select('*')
      .order('id', { ascending: false })
      .limit(100);
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    console.error('Fetch integrated products error:', err);
    return NextResponse.json({ success: false, message: (err as Error)?.message ?? 'Failed to fetch products' }, { status: 500 });
  }
}
