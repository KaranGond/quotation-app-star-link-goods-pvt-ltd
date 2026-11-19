import { promises as fs } from 'fs';
import path from 'path';
import { getServerSupabase } from './supabase';

/**
 * Resolves an image URL (Supabase Storage path/URL, remote HTTPS, or local /public path)
 * into an inlined base64 data URI.
 * Inlining as base64 ensures Chromium / Puppeteer renders the image synchronously and reliably
 * with zero network latency, zero CORS blocking, and zero broken image placeholders in generated PDFs.
 */
export async function resolveImageAsBase64(imageUrl: string | null | undefined, fallbackRelativePath?: string): Promise<string> {
  const url = (imageUrl && imageUrl.trim()) ? imageUrl.trim() : '';

  // 1. If already a data URI, return directly
  if (url.startsWith('data:image/')) {
    return url;
  }

  // 2. Direct Supabase Storage download (bypasses Cloudflare CDN timeouts & DNS latency)
  if (url.includes('/storage/v1/object/public/') || url.includes('/storage/v1/object/sign/')) {
    try {
      const supabase = getServerSupabase();
      const match = url.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/?#]+)\/(.+?)(?:\?|$)/);
      if (match) {
        const bucket = match[1];
        const storagePath = decodeURIComponent(match[2]);
        const { data: blob, error: dlErr } = await supabase.storage.from(bucket).download(storagePath);
        if (!dlErr && blob) {
          const arrayBuffer = await blob.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const ext = path.extname(storagePath).toLowerCase();
          const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.webp' ? 'image/webp' : ext === '.svg' ? 'image/svg+xml' : 'image/png';
          return `data:${mime};base64,${buffer.toString('base64')}`;
        }
      }
    } catch (storageErr) {
      console.warn('[imageResolver] Supabase storage direct download error, falling back to fetch:', storageErr);
    }
  }

  // 3. Remote URL (http:// or https://)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentType = res.headers.get('content-type') || 'image/png';
        return `data:${contentType};base64,${buffer.toString('base64')}`;
      }
    } catch (fetchErr) {
      console.warn('[imageResolver] Remote image fetch error:', fetchErr);
    }
  }

  // 4. Local file path in public/
  const targetPath = url.startsWith('/') ? url.slice(1) : (fallbackRelativePath ? (fallbackRelativePath.startsWith('/') ? fallbackRelativePath.slice(1) : fallbackRelativePath) : '');
  if (targetPath) {
    try {
      const localFile = path.join(process.cwd(), 'public', targetPath);
      const buffer = await fs.readFile(localFile);
      const ext = path.extname(localFile).toLowerCase();
      const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.webp' ? 'image/webp' : ext === '.svg' ? 'image/svg+xml' : 'image/png';
      return `data:${mime};base64,${buffer.toString('base64')}`;
    } catch {
      // Local file not found, try fallback if different
      if (fallbackRelativePath && fallbackRelativePath !== url) {
        try {
          const fallbackClean = fallbackRelativePath.startsWith('/') ? fallbackRelativePath.slice(1) : fallbackRelativePath;
          const fallbackFile = path.join(process.cwd(), 'public', fallbackClean);
          const buffer = await fs.readFile(fallbackFile);
          return `data:image/png;base64,${buffer.toString('base64')}`;
        } catch {
          // ignore
        }
      }
    }
  }

  return '';
}
