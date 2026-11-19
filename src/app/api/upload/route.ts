import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getServerSupabase } from '@/lib/supabase';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = ((formData.get('type') as string) || 'asset').toLowerCase(); // 'logo', 'signature', 'stamp', 'qr'
    const autoUpdateDb = formData.get('auto_update_db') !== 'false';

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, message: 'File too large. Maximum size is 5 MB.' }, { status: 400 });
    }

    if (file.type && !ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { success: false, message: 'Invalid file format. Only PNG, JPEG, WEBP, and SVG images are allowed.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const rawExt = file.name.split('.').pop()?.toLowerCase() || 'png';
    const ext = ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(rawExt) ? rawExt : 'png';
    const cleanType = ['logo', 'signature', 'stamp', 'stamp_signature', 'qr'].includes(type) ? type : 'asset';

    const baseFileName = `${cleanType}-${Date.now()}.${ext}`;
    const storageFilePath = `assets/${baseFileName}`;
    const bucketName = process.env.SUPABASE_ASSETS_BUCKET || 'company-assets';

    // 1. Mandatory sync directly into the Supabase storage bucket
    const supabase = getServerSupabase();
    let uploadRes = await supabase.storage
      .from(bucketName)
      .upload(storageFilePath, buffer, {
        contentType: file.type || `image/${ext === 'svg' ? 'svg+xml' : ext}`,
        upsert: true,
      });

    // Fallback to secondary bucket if primary is missing
    if (uploadRes.error && bucketName !== 'quotes') {
      console.warn(`Upload to ${bucketName} failed (${uploadRes.error.message}), trying 'quotes' bucket...`);
      uploadRes = await supabase.storage
        .from('quotes')
        .upload(storageFilePath, buffer, {
          contentType: file.type || `image/${ext === 'svg' ? 'svg+xml' : ext}`,
          upsert: true,
        });
    }

    if (uploadRes.error) {
      console.error('Supabase storage upload error:', uploadRes.error);
      throw new Error(`Supabase Storage upload failed: ${uploadRes.error.message}`);
    }

    const activeBucket = uploadRes.error ? bucketName : (uploadRes.data?.fullPath?.split('/')[0] || bucketName);
    const { data: { publicUrl } } = supabase.storage
      .from(activeBucket)
      .getPublicUrl(storageFilePath);

    if (!publicUrl) {
      throw new Error('Failed to retrieve Supabase public URL for uploaded asset.');
    }

    // 2. Also keep local copy in public/uploads for instant offline/standalone backup
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      await fs.mkdir(uploadsDir, { recursive: true });
      await fs.writeFile(path.join(uploadsDir, baseFileName), buffer);
    } catch (fsErr) {
      console.warn('Local backup write warning (Supabase upload succeeded):', fsErr);
    }

    // 3. Update company_settings table in Supabase PostgreSQL with the Supabase bucket URL
    let updatedColumn: string | null = null;
    if (autoUpdateDb) {
      const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() };
      if (cleanType === 'logo') {
        updatePayload.logo_url = publicUrl;
        updatedColumn = 'logo_url';
      } else if (cleanType === 'stamp_signature' || cleanType === 'stamp' || cleanType === 'signature') {
        updatePayload.stamp_url = publicUrl;
        updatePayload.signature_url = publicUrl;
        updatedColumn = 'stamp_url';
      } else if (cleanType === 'qr') {
        updatePayload.qr_code_url = publicUrl;
        updatedColumn = 'qr_code_url';
      }

      if (updatedColumn) {
        const { error: dbError } = await supabase
          .from('company_settings')
          .update(updatePayload)
          .eq('id', 'default');

        if (dbError) {
          console.error('Failed to sync company_settings in Supabase:', dbError);
          throw new Error(`Database sync error: ${dbError.message}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: baseFileName,
      type: cleanType,
      bucket: activeBucket,
      updatedColumn,
      message: `${cleanType.toUpperCase()} successfully uploaded and synced with Supabase storage!`,
    });
  } catch (error: any) {
    console.error('API Upload error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'File upload failed' },
      { status: 500 }
    );
  }
}
