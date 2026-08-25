export interface UpiPaymentConfig {
  pa: string; // Payee VPA / Virtual Payment Address (e.g. merchant@bank)
  pn: string; // Payee Name (e.g. Acme Corp)
  am?: number | string; // Amount (e.g. 250.00)
  cu?: string; // Currency code, default 'INR'
  tn?: string; // Transaction Note / Remarks
  tr?: string; // Transaction Reference ID
  mc?: string; // Merchant Code
}

/**
 * Builds standard NPCI compliant UPI Payment URI string
 * Format: upi://pay?pa=address@bank&pn=PayeeName&am=100.00&cu=INR&tn=Note
 */
export function buildUpiUri(params: UpiPaymentConfig): string {
  if (!params.pa) {
    throw new Error('UPI VPA address (pa) is required.');
  }

  const queryParams = new URLSearchParams();
  queryParams.append('pa', params.pa.trim());
  queryParams.append('pn', (params.pn || 'Payee').trim());
  
  if (params.am !== undefined && params.am !== '') {
    const formattedAmt = typeof params.am === 'number' ? params.am.toFixed(2) : parseFloat(params.am).toFixed(2);
    queryParams.append('am', formattedAmt);
  }
  
  queryParams.append('cu', params.cu || 'INR');

  if (params.tn) {
    queryParams.append('tn', params.tn.trim());
  }

  if (params.tr) {
    queryParams.append('tr', params.tr.trim());
  }

  if (params.mc) {
    queryParams.append('mc', params.mc.trim());
  }

  return `upi://pay?${queryParams.toString()}`;
}

/**
 * Parses existing UPI URI into typed parameters
 */
export function parseUpiUri(uri: string): Partial<UpiPaymentConfig> | null {
  try {
    if (!uri.startsWith('upi://pay?')) return null;
    const queryString = uri.replace('upi://pay?', '');
    const params = new URLSearchParams(queryString);
    return {
      pa: params.get('pa') || '',
      pn: params.get('pn') || '',
      am: params.get('am') || undefined,
      cu: params.get('cu') || 'INR',
      tn: params.get('tn') || undefined,
      tr: params.get('tr') || undefined,
      mc: params.get('mc') || undefined,
    };
  } catch {
    return null;
  }
}
