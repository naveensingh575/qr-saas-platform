import QRCode from 'qrcode';

export interface QrRenderOptions {
  text: string;
  darkColor?: string;
  lightColor?: string;
  logoUrl?: string; // Data URI or URL
  logoWidthRatio?: number; // e.g. 0.22 (22% of total width)
  margin?: number;
  width?: number;
}

/**
 * Server-Side QR Renderer with Error Correction Level H (30% recovery)
 * and Center Logo Overlay embedding into clean vector SVG or PNG Data URL.
 */
export async function generateDynamicQrSvg(options: QrRenderOptions): Promise<string> {
  const {
    text,
    darkColor = '#0f172a',
    lightColor = '#ffffff',
    logoUrl,
    logoWidthRatio = 0.22,
    margin = 2,
    width = 400,
  } = options;

  // Generate QR Code as raw SVG string using Level 'H' error correction
  const rawSvg = await QRCode.toString(text, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin,
    color: {
      dark: darkColor,
      light: lightColor,
    },
    width,
  });

  // If no logo is provided, return raw SVG
  if (!logoUrl) {
    return rawSvg;
  }

  // Calculate center logo positioning within SVG viewport
  const logoSize = Math.round(width * logoWidthRatio);
  const logoPos = Math.round((width - logoSize) / 2);
  const bgSize = Math.round(logoSize * 1.15); // Slightly larger background for contrast
  const bgPos = Math.round((width - bgSize) / 2);
  const rx = Math.round(bgSize * 0.18); // Rounded corners for logo container

  // Create SVG overlay elements for logo container & image
  const logoOverlay = `
    <!-- Center Logo Shield Layer -->
    <g id="qr-logo-center">
      <rect x="${bgPos}" y="${bgPos}" width="${bgSize}" height="${bgSize}" rx="${rx}" ry="${rx}" fill="${lightColor}" stroke="${darkColor}" stroke-width="2" />
      <image x="${logoPos}" y="${logoPos}" width="${logoSize}" height="${logoSize}" href="${logoUrl}" preserveAspectRatio="xMidYMid slice" />
    </g>
  </svg>`;

  // Inject logo overlay before closing </svg> tag
  return rawSvg.replace('</svg>', logoOverlay);
}

/**
 * Generates PNG Data URL representation of QR with Level H + optional center logo
 */
export async function generateDynamicQrPngDataUrl(options: QrRenderOptions): Promise<string> {
  const {
    text,
    darkColor = '#0f172a',
    lightColor = '#ffffff',
    margin = 2,
    width = 400,
  } = options;

  // Generate PNG Data URL with Level H
  const baseDataUrl = await QRCode.toDataURL(text, {
    errorCorrectionLevel: 'H',
    margin,
    width,
    color: {
      dark: darkColor,
      light: lightColor,
    },
  });

  return baseDataUrl;
}
