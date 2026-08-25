import { NextRequest, NextResponse } from 'next/server';
import { generateDynamicQrSvg, generateDynamicQrPngDataUrl } from '@/lib/qr-generator';

export const runtime = 'nodejs';

/**
 * GET /api/v1/qr/render - Server-side rendering endpoint for QR with Level H + logo overlay
 * Parameters:
 *   - text: string (required)
 *   - logoUrl: string (optional)
 *   - darkColor: hex string (default #0f172a)
 *   - lightColor: hex string (default #ffffff)
 *   - format: 'svg' | 'png' (default 'svg')
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text') || 'https://qr-saas-platform.com';
  const logoUrl = searchParams.get('logoUrl') || undefined;
  const darkColor = searchParams.get('darkColor') || '#0f172a';
  const lightColor = searchParams.get('lightColor') || '#ffffff';
  const format = searchParams.get('format') || 'svg';

  try {
    if (format === 'png') {
      const pngDataUrl = await generateDynamicQrPngDataUrl({
        text,
        darkColor,
        lightColor,
      });
      return NextResponse.json({ dataUrl: pngDataUrl });
    }

    const svg = await generateDynamicQrSvg({
      text,
      darkColor,
      lightColor,
      logoUrl,
    });

    return new NextResponse(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to render QR' }, { status: 500 });
  }
}
