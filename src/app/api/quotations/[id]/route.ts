import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';
import { auth } from '@/lib/auth';
import { gstConfig, calculateSavings } from '@/lib/companyDetails';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

// GET - Get single quotation with ownership check
export async function GET(request: Request, context: RouteContext) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user) {
            return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
        }

        const { id } = await context.params;
        const supabase = getServerSupabase();

        const { data, error } = await supabase
            .from('quotations')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!data) {
            return NextResponse.json({ success: false, message: 'Quotation not found' }, { status: 404 });
        }

        // Ownership enforcement: Admin can view any quote; others can only view their own
        const isAdmin = session.user.role === 'admin' || session.user.email === 'karangond221998@gmail.com';
        const isOwner = data.user_id === session.user.id || data.user_email === session.user.email;
        if (!isAdmin && !isOwner) {
            return NextResponse.json(
                { success: false, message: 'Access denied: You can only view quotations created by your account' },
                { status: 403 }
            );
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json({ success: false, message: (error as any).message }, { status: 500 });
    }
}

// PUT - Update quotation with ownership check
export async function PUT(request: Request, context: RouteContext) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user) {
            return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
        }

        const { id } = await context.params;
        const supabase = getServerSupabase();

        // Check existing record ownership
        const { data: existing, error: fetchError } = await supabase
            .from('quotations')
            .select('user_id, user_email')
            .eq('id', id)
            .single();

        if (fetchError || !existing) {
            return NextResponse.json({ success: false, message: 'Quotation not found' }, { status: 404 });
        }

        const isAdmin = session.user.role === 'admin' || session.user.email === 'karangond221998@gmail.com';
        const isOwner = existing.user_id === session.user.id || existing.user_email === session.user.email;
        if (!isAdmin && !isOwner) {
            return NextResponse.json(
                { success: false, message: 'Access denied: You can only edit quotations created by your account' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const {
            customer_name,
            customer_phone,
            customer_address,
            customer_email,
            system_type_id,
            capacity_kw,
            phase,
            brand,
            base_price,
            gst_rate,
            central_subsidy,
            state_subsidy,
            terms,
            components,
            salesperson,
            status,
            pdf_url,
            form_data,
            bank_account,
        } = body;

        // Recalculate GST and totals
        const effectiveGstRate = gst_rate || gstConfig.compositeRate;
        const baseAmount = base_price || 0;
        const gst_amount = +(baseAmount * (effectiveGstRate / 100)).toFixed(2);
        const total_amount = +(baseAmount + gst_amount).toFixed(2);

        // Calculate savings data
        const savings = calculateSavings(
            capacity_kw || 0,
            total_amount,
            central_subsidy,
            state_subsidy
        );

        // Build update object
        const updateData: any = {
            customer_name,
            customer_phone,
            customer_address,
            customer_email,
            system_type_id,
            capacity_kw,
            phase,
            brand,
            base_price: baseAmount,
            gst_rate: effectiveGstRate,
            gst_amount,
            total_amount,
            central_subsidy,
            state_subsidy,
            terms,
            components,
            savings_data: savings,
            salesperson: salesperson || session.user.name || session.user.email,
            status,
        };

        if (pdf_url !== undefined) {
            updateData.pdf_url = pdf_url;
        }

        if (form_data !== undefined) {
            updateData.form_data = form_data;
        }

        if (bank_account !== undefined) {
            updateData.bank_account = bank_account;
        }

        const { data, error } = await supabase
            .from('quotations')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json({ success: false, message: (error as any).message }, { status: 500 });
    }
}

// DELETE - Delete quotation with ownership check
export async function DELETE(request: Request, context: RouteContext) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user) {
            return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
        }

        const { id } = await context.params;
        const supabase = getServerSupabase();

        // Check existing record ownership
        const { data: existing, error: fetchError } = await supabase
            .from('quotations')
            .select('user_id, user_email')
            .eq('id', id)
            .single();

        if (fetchError || !existing) {
            return NextResponse.json({ success: false, message: 'Quotation not found' }, { status: 404 });
        }

        const isAdmin = session.user.role === 'admin' || session.user.email === 'karangond221998@gmail.com';
        const isOwner = existing.user_id === session.user.id || existing.user_email === session.user.email;
        if (!isAdmin && !isOwner) {
            return NextResponse.json(
                { success: false, message: 'Access denied: You can only delete quotations created by your account' },
                { status: 403 }
            );
        }

        const { error } = await supabase
            .from('quotations')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, message: (error as any).message }, { status: 500 });
    }
}
