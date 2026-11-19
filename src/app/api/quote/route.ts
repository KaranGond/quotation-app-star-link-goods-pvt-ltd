import { NextResponse } from 'next/server';
// Use dynamic imports to support serverless-compatible Chromium in production
import { sendWhatsAppMessage } from '../../../lib/whatsapp';
import { generateQuoteHtml } from '../../../lib/quoteTemplate';
import { defaultComponents } from '../../../data/components';
import { GST_RATE } from '../../../data/priceList';
import { resolveImageAsBase64 } from '@/lib/imageResolver';
import { getServerSupabase } from '@/lib/supabase';

export const runtime = 'nodejs';

// Supabase client will be created lazily inside handlers after env validation

export async function POST(request: Request) {
  try {
    const quoteData = await request.json();

    if (!quoteData?.customerInfo?.name) {
      return NextResponse.json({ message: 'Customer name is required.' }, { status: 400 });
    }
    if (!quoteData?.skipWhatsApp && !quoteData?.customerInfo?.phone) {
      return NextResponse.json({ message: 'Customer phone is required for WhatsApp.' }, { status: 400 });
    }
    if (!quoteData?.selectedProduct) {
      return NextResponse.json({ message: 'Selected product is required.' }, { status: 400 });
    }

    // Env validation
    const missingEnv: string[] = [];
    if (!process.env.SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) missingEnv.push('SUPABASE_URL');
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_KEY) missingEnv.push('SUPABASE_SERVICE_ROLE_KEY');
    if (!process.env.SUPABASE_BUCKET) missingEnv.push('SUPABASE_BUCKET');
    if (missingEnv.length) {
      return NextResponse.json({ message: `Missing environment variables: ${missingEnv.join(', ')}` }, { status: 500 });
    }

    // Server-side pricing recompute for integrity
    const calc = quoteData?.calculations || {};
    const n = (v: any) => (typeof v === 'number' && isFinite(v) ? v : 0);
    const basePrice = n(calc.basePrice);
    const marginPrice = n(calc.marginPrice);
    const wirePrice = n(calc.wirePrice);
    const heightPrice = n(calc.heightPrice);
    const outOfVnsPrice = n(calc.outOfVnsPrice);
    const subtotal = basePrice + marginPrice + wirePrice + heightPrice + outOfVnsPrice;
    const gstAmount = +(subtotal * (typeof quoteData?.taxRate === 'number' ? quoteData.taxRate : GST_RATE)).toFixed(2);
    const total = +(subtotal + gstAmount).toFixed(2);
    const discount = Math.max(0, n(calc.discount));
    const grandTotal = Math.max(0, +(total - discount).toFixed(2));

    // 1. Resolve company details (from request payload or DB)
    let company = quoteData.companyDetails;
    if (!company) {
      try {
        const supabase = getServerSupabase();
        const { data: dbCompany } = await supabase
          .from('company_settings')
          .select('*')
          .eq('id', 'default')
          .maybeSingle();
        if (dbCompany) {
          company = {
            name: dbCompany.name,
            tagline: dbCompany.tagline,
            phone: dbCompany.phone,
            alternatePhone: dbCompany.alternate_phone,
            email: dbCompany.email,
            headOffice: dbCompany.head_office,
            registeredOffice: dbCompany.registered_office,
            warehouse: dbCompany.warehouse,
            gstin: dbCompany.gstin,
            cin: dbCompany.cin,
            authorizedSignatory: dbCompany.authorized_signatory,
            bank: {
              name: dbCompany.bank_name,
              branch: dbCompany.bank_branch,
              accountName: dbCompany.account_name,
              accountNumber: dbCompany.account_number,
              ifsc: dbCompany.ifsc,
              upiId: dbCompany.upi_id,
            },
            logo_url: dbCompany.logo_url,
            signature_url: dbCompany.signature_url,
            stamp_url: dbCompany.stamp_url,
            qr_code_url: dbCompany.qr_code_url,
          };
        }
      } catch (dbErr) {
        console.warn('Failed to load company from DB for PDF, using defaults:', dbErr);
      }
    }

    // Resolve brand assets into base64 for reliable Puppeteer rendering
    const defaultSupabaseLogo = 'https://eugejgacxgxwfiwxzqck.supabase.co/storage/v1/object/public/company-assets/assets/default-logo.png';
    const defaultSupabaseSig = 'https://eugejgacxgxwfiwxzqck.supabase.co/storage/v1/object/public/company-assets/assets/default-signature.png';
    const defaultSupabaseQr = 'https://eugejgacxgxwfiwxzqck.supabase.co/storage/v1/object/public/company-assets/assets/default-payment-qr.png';

    const rawLogo = company?.logo_url || company?.logo || defaultSupabaseLogo;
    const rawSig = company?.signature_url || company?.signature || defaultSupabaseSig;
    const rawStamp = company?.stamp_url || company?.stamp || defaultSupabaseSig;
    const rawQr = company?.qr_code_url || defaultSupabaseQr;

    const [logoUrl, signatureUrl, stampUrl, qrCodeUrl] = await Promise.all([
      resolveImageAsBase64(rawLogo),
      resolveImageAsBase64(rawSig),
      resolveImageAsBase64(rawStamp),
      resolveImageAsBase64(rawQr),
    ]);

    const upiLink = `upi://pay?pa=${company?.bank?.upiId || company?.upi_id || 'vyapar.173575988777@hdfcbank'}&pn=${encodeURIComponent(company?.name || 'Arpit Solar Shop')}&am=${grandTotal}&cu=INR`;

    const htmlContent = generateQuoteHtml({
      ...quoteData,
      companyDetails: company,
      components: quoteData.components || defaultComponents,
      logoUrl,
      signatureUrl,
      stampUrl,
      panelWarranty: quoteData.selectedProduct?.panelWarranty || "25 Years",
      inverterWarranty: quoteData.selectedProduct?.inverterWarranty || "5 Years",
      showInverterWarranty: quoteData.selectedProduct?.showInverterWarranty !== undefined
        ? quoteData.selectedProduct.showInverterWarranty
        : (quoteData.showInverterWarranty !== undefined ? quoteData.showInverterWarranty : true),
      showRatePerWatt: quoteData.selectedProduct?.showRatePerWatt !== undefined
        ? quoteData.selectedProduct.showRatePerWatt
        : (quoteData.showRatePerWatt !== undefined ? quoteData.showRatePerWatt : true),
      batteryWarranty: quoteData.selectedProduct?.batteryWarranty || "5 Years",
      panelItems: quoteData.selectedProduct?.panelItems || quoteData.panelItems || [],
      discount: quoteData.calculations?.discount || quoteData.discount || discount,
      // Pass frontend calculations directly, with fallback to computed values
      calculations: {
        ...quoteData.calculations,
        originalBasePrice: quoteData.calculations?.originalBasePrice,
        basePrice: quoteData.calculations?.subtotal || quoteData.calculations?.basePrice || subtotal,
        extraCosts: quoteData.calculations?.extraCosts || 0,
        gstAmount: quoteData.calculations?.gstAmount || gstAmount,
        total: quoteData.calculations?.total || total,
        discount: quoteData.calculations?.discount || quoteData.discount || discount,
        grandTotal: quoteData.calculations?.grandTotal || quoteData.calculations?.payableAmount || grandTotal,
        centralSubsidy: quoteData.calculations?.centralSubsidy ?? 0,
        stateSubsidy: quoteData.calculations?.stateSubsidy ?? 0,
        effectiveCost: quoteData.calculations?.effectiveCost || 0
      },
      qrCodeUrl,
      upiLink,
    });

    // Launch Chromium appropriately for the environment
    let browser: any;
    if (process.env.NODE_ENV === 'production') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const chromium = require('@sparticuz/chromium-min');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const puppeteerCore = require('puppeteer-core');

      // Use Docker's system Chromium if provided via PUPPETEER_EXECUTABLE_PATH, else fetch/extract Chromium pack
      const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH ||
        await chromium.executablePath('https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar');

      browser = await puppeteerCore.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath,
        headless: chromium.headless,
      });
    } else {
      const { default: puppeteer } = await import('puppeteer');
      const customPath = process.env.PUPPETEER_EXECUTABLE_PATH;
      const launchOptions: any = {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      };

      if (customPath) {
        launchOptions.executablePath = customPath;
      } else if (process.platform === 'darwin') {
        const fs = await import('fs');
        const defaultMacPath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
        if (fs.existsSync(defaultMacPath)) {
          launchOptions.executablePath = defaultMacPath;
        }
      }

      browser = await puppeteer.launch(launchOptions);
    }
    let pdfBuffer: Buffer | Uint8Array;
    try {
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      await page.emulateMediaType('screen');
      pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
      });
    } finally {
      try { await browser.close(); } catch { }
    }

    const safeCustomerName = (quoteData.customerInfo.name || 'Customer').replace(/[^a-zA-Z0-9_-]/g, '-');
    const fileName = `quotation-${safeCustomerName}-${Date.now()}.pdf`;
    const bucketName = process.env.SUPABASE_BUCKET || 'quotes';

    // Create Supabase server client
    const supabase = getServerSupabase();

    const { error: uploadError } = await supabase.storage.from(bucketName).upload(fileName, pdfBuffer, { contentType: 'application/pdf', upsert: false });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);

    // Wait for Supabase storage propagation before generating URLs
    await new Promise(r => setTimeout(r, 2000));

    // Always use a signed URL for WhatsApp delivery.
    // Public URLs can have CDN propagation delays causing DoubleTick to fail
    // when it tries to download the PDF asynchronously.
    let pdfUrlForWhatsApp = urlData.publicUrl;
    try {
      const { data: signed, error: signError } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(fileName, 24 * 60 * 60); // 24 hours validity
      if (signed?.signedUrl && !signError) {
        pdfUrlForWhatsApp = signed.signedUrl;
        console.log('Using signed URL for WhatsApp delivery');
      } else {
        console.warn('Signed URL failed, falling back to public URL:', signError?.message);
      }
    } catch (signErr) {
      console.warn('Signed URL generation error, using public URL:', signErr);
    }

    // Verify the URL is accessible before sending to WhatsApp
    try {
      const verifyRes = await fetch(pdfUrlForWhatsApp, { method: 'HEAD' });
      if (!verifyRes.ok) {
        console.warn(`PDF URL verification failed (${verifyRes.status}), retrying...`);
        await new Promise(r => setTimeout(r, 3000));
        const retryRes = await fetch(pdfUrlForWhatsApp, { method: 'HEAD' });
        if (!retryRes.ok) {
          console.error(`PDF URL still not accessible after retry: ${retryRes.status}`);
        }
      }
    } catch (verifyErr) {
      console.warn('PDF URL verification error (may still work):', verifyErr);
    }

    if (!quoteData.skipWhatsApp) {
      await sendWhatsAppMessage(quoteData.customerInfo.phone, pdfUrlForWhatsApp);
    }

    return NextResponse.json({ message: 'Quotation sent successfully!', url: urlData.publicUrl, totals: { subtotal, gstAmount, total, discount, grandTotal } });

  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json({ message: (error as any).message || 'Server error occurred.' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_BUCKET || 'quotes';

    const missingRequired: string[] = [];
    if (!supabaseUrl) missingRequired.push('SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)');
    if (!supabaseKey) missingRequired.push('SUPABASE_SERVICE_ROLE_KEY');

    const optionalIntegrations = {
      supabaseBucket: bucket,
      doubleTickApiKeyConfigured: !!process.env.DOUBLETICK_API_KEY,
      doubleTickSenderPhoneConfigured: !!process.env.DOUBLETICK_SENDER_PHONE,
      smtpConfigured: !!(process.env.SMTP_HOST && process.env.SMTP_USER),
      customPuppeteerPath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
    };

    const ok = missingRequired.length === 0;
    return NextResponse.json({ ok, missingRequired, optionalIntegrations });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, message: (e as Error)?.message || 'Health check failed' }, { status: 500 });
  }
}