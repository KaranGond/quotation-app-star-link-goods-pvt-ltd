import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';
import { companyDetails as defaultCompanyDetails, defaultTerms } from '@/lib/companyDetails';
import { defaultB2BTerms } from '@/data/apolloProducts';

export const runtime = 'nodejs';

const defaultTermsStructure = {
  rooftop: defaultTerms['On-grid'].slice(0, 8),
  b2b: defaultB2BTerms,
};

export async function GET() {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (error) {
      console.warn('Supabase company_settings GET error, falling back to defaults:', error.message);
      return NextResponse.json({ success: true, data: formatCompanyFromDefaults(defaultCompanyDetails), fromDefaults: true });
    }

    if (!data) {
      // Seed default row if empty
      const defaultRow = formatDefaultsToDbRow(defaultCompanyDetails);
      const { data: inserted, error: insertError } = await supabase
        .from('company_settings')
        .insert([defaultRow])
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({ success: true, data: formatCompanyFromDefaults(defaultCompanyDetails), fromDefaults: true });
      }
      return NextResponse.json({ success: true, data: inserted });
    }

    if (!data.default_terms || (Array.isArray(data.default_terms) && data.default_terms.length === 0) || (typeof data.default_terms === 'object' && Object.keys(data.default_terms).length === 0)) {
      data.default_terms = defaultTermsStructure;
    } else if (Array.isArray(data.default_terms) && data.default_terms.length > 0) {
      data.default_terms = {
        rooftop: data.default_terms,
        b2b: defaultB2BTerms,
      };
    } else if (typeof data.default_terms === 'object') {
      data.default_terms = {
        rooftop: Array.isArray(data.default_terms.rooftop) && data.default_terms.rooftop.length > 0 ? data.default_terms.rooftop : defaultTermsStructure.rooftop,
        b2b: Array.isArray(data.default_terms.b2b) && data.default_terms.b2b.length > 0 ? data.default_terms.b2b : defaultTermsStructure.b2b,
      };
    }

    if (!data.bank_accounts || !Array.isArray(data.bank_accounts) || data.bank_accounts.length === 0) {
      data.bank_accounts = [
        {
          id: 'acc_1',
          label: 'Primary Account (' + (data.bank_name || 'HDFC Bank') + ')',
          account_name: data.account_name || 'STAR LINK GOODS PVT. LTD.',
          bank_name: data.bank_name || 'HDFC Bank',
          bank_branch: data.bank_branch || 'Shivpur, Varanasi',
          account_number: data.account_number || '50200123854806',
          ifsc: data.ifsc || 'HDFC0004807',
          upi_id: data.upi_id || 'vyapar.173575988777@hdfcbank',
          qr_code_url: data.qr_code_url || '',
          is_default: true,
        }
      ];
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Company API GET error:', error);
    return NextResponse.json({ success: true, data: formatCompanyFromDefaults(defaultCompanyDetails), fromDefaults: true });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const supabase = getServerSupabase();

    const allowedFields = [
      'name',
      'tagline',
      'quote_prefix',
      'gstin',
      'cin',
      'phone',
      'alternate_phone',
      'email',
      'head_office',
      'registered_office',
      'warehouse',
      'authorized_signatory',
      'bank_name',
      'bank_branch',
      'account_name',
      'account_number',
      'ifsc',
      'upi_id',
      'logo_url',
      'signature_url',
      'stamp_url',
      'qr_code_url',
      'default_terms',
      'bank_accounts',
    ];

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updatePayload[key] = body[key];
      }
    }

    const { data, error } = await supabase
      .from('company_settings')
      .update(updatePayload)
      .eq('id', 'default')
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Company details updated successfully',
      data,
    });
  } catch (error: any) {
    console.error('Company API PUT error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update company details' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return PUT(request);
}

function formatCompanyFromDefaults(c: typeof defaultCompanyDetails) {
  return {
    id: 'default',
    name: c.name,
    tagline: c.tagline,
    quote_prefix: 'SLG',
    gstin: c.gstin || '',
    cin: (c as any).cin || '',
    phone: c.phone || '',
    alternate_phone: c.alternatePhone || '',
    email: c.email || '',
    head_office: c.headOffice || '',
    registered_office: c.registeredOffice || '',
    warehouse: (c as any).warehouse || '',
    authorized_signatory: c.authorizedSignatory || '',
    bank_name: c.bank?.name || '',
    bank_branch: c.bank?.branch || '',
    account_name: c.bank?.accountName || '',
    account_number: c.bank?.accountNumber || '',
    ifsc: c.bank?.ifsc || '',
    upi_id: c.bank?.upiId || '',
    logo_url: c.logo || '',
    signature_url: c.signature || '',
    stamp_url: (c as any).stamp || (c as any).signature || '',
    qr_code_url: (c as any).paymentQr || (c as any).qr_code_url || '',
    bank_accounts: [
      {
        id: 'acc_1',
        label: 'Primary Account (HDFC Bank)',
        account_name: c.bank?.accountName || 'STAR LINK GOODS PVT. LTD.',
        bank_name: c.bank?.name || 'HDFC Bank',
        bank_branch: c.bank?.branch || 'Shivpur, Varanasi',
        account_number: c.bank?.accountNumber || '50200123854806',
        ifsc: c.bank?.ifsc || 'HDFC0004807',
        upi_id: c.bank?.upiId || 'vyapar.173575988777@hdfcbank',
        qr_code_url: (c as any).paymentQr || '',
        is_default: true,
      }
    ],
    default_terms: defaultTermsStructure,
  };
}

function formatDefaultsToDbRow(c: typeof defaultCompanyDetails) {
  return {
    id: 'default',
    name: c.name,
    tagline: c.tagline,
    quote_prefix: 'SLG',
    gstin: c.gstin || '',
    cin: (c as any).cin || '',
    phone: c.phone || '',
    alternate_phone: c.alternatePhone || '',
    email: c.email || '',
    head_office: c.headOffice || '',
    registered_office: c.registeredOffice || '',
    warehouse: (c as any).warehouse || '',
    authorized_signatory: c.authorizedSignatory || '',
    bank_name: c.bank?.name || '',
    bank_branch: c.bank?.branch || '',
    account_name: c.bank?.accountName || '',
    account_number: c.bank?.accountNumber || '',
    ifsc: c.bank?.ifsc || '',
    upi_id: c.bank?.upiId || '',
    logo_url: c.logo || '',
    signature_url: c.signature || '',
    stamp_url: (c as any).stamp || (c as any).signature || '',
    qr_code_url: (c as any).paymentQr || (c as any).qr_code_url || '',
    bank_accounts: [
      {
        id: 'acc_1',
        label: 'Primary Account (HDFC Bank)',
        account_name: c.bank?.accountName || 'STAR LINK GOODS PVT. LTD.',
        bank_name: c.bank?.name || 'HDFC Bank',
        bank_branch: c.bank?.branch || 'Shivpur, Varanasi',
        account_number: c.bank?.accountNumber || '50200123854806',
        ifsc: c.bank?.ifsc || 'HDFC0004807',
        upi_id: c.bank?.upiId || 'vyapar.173575988777@hdfcbank',
        qr_code_url: (c as any).paymentQr || '',
        is_default: true,
      }
    ],
    default_terms: defaultTermsStructure,
  };
}
