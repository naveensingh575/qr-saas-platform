export interface UpiPaymentConfig {
  pa: string; // Payee VPA / Virtual Payment Address (e.g. merchant@bank)
  pn: string; // Payee Name (e.g. Acme Corp)
  am?: number | string; // Amount (e.g. 250.00)
  cu?: string; // Currency code, default 'INR'
  tn?: string; // Transaction Note / Remarks
  tr?: string; // Transaction Reference ID
  mc?: string; // Merchant Code
}

export interface UpiSplitOption {
  enabled: boolean;
  totalAmount: number;
  splitMode: 'cap_2000' | 'by_count';
  numberOfSplits?: number;
  maxCapPerQr?: number; // Default 1999 to stay below NPCI ₹2,000 fee threshold
}

export interface UpiSplitResultItem {
  partIndex: number;
  totalParts: number;
  amount: number;
  formattedAmount: string;
  note: string;
  uri: string;
}

// 1 Crore = 10,000,000 INR (10 Million / 1 Crore max cap)
export const MAX_UPI_AMOUNT_CRORE = 10000000;

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
    let numericAmt = typeof params.am === 'number' ? params.am : parseFloat(params.am);
    if (isNaN(numericAmt)) numericAmt = 0;
    // Cap at 1 Crore (10,000,000 INR)
    if (numericAmt > MAX_UPI_AMOUNT_CRORE) {
      numericAmt = MAX_UPI_AMOUNT_CRORE;
    }
    const formattedAmt = numericAmt.toFixed(2);
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
 * Calculates NPCI-compliant UPI URI splits for amounts above ₹2,000
 * Capped at 1 Crore (10,000,000 INR)
 */
export function calculateUpiSplits(
  baseConfig: UpiPaymentConfig,
  splitConfig: UpiSplitOption
): UpiSplitResultItem[] {
  let totalAmount = typeof splitConfig.totalAmount === 'number' ? splitConfig.totalAmount : parseFloat(splitConfig.totalAmount || '0');

  if (!totalAmount || totalAmount <= 0) return [];

  // Enforce 1 Crore Cap
  if (totalAmount > MAX_UPI_AMOUNT_CRORE) {
    totalAmount = MAX_UPI_AMOUNT_CRORE;
  }

  let partsAmounts: number[] = [];
  const { splitMode, numberOfSplits = 2, maxCapPerQr = 1999 } = splitConfig;

  if (splitMode === 'cap_2000') {
    const cap = Math.max(100, maxCapPerQr);
    let remaining = Math.round(totalAmount * 100) / 100;
    while (remaining > 0) {
      if (remaining <= cap) {
        partsAmounts.push(parseFloat(remaining.toFixed(2)));
        remaining = 0;
      } else {
        partsAmounts.push(cap);
        remaining = Math.round((remaining - cap) * 100) / 100;
      }
    }
  } else {
    // Mode: by_count
    const count = Math.max(1, numberOfSplits);
    const equalShare = Math.floor((totalAmount / count) * 100) / 100;
    let remainder = Math.round((totalAmount - equalShare * count) * 100) / 100;

    for (let i = 0; i < count; i++) {
      let amt = equalShare;
      if (i === count - 1) {
        amt = parseFloat((amt + remainder).toFixed(2));
      } else {
        amt = parseFloat(amt.toFixed(2));
      }
      partsAmounts.push(amt);
    }
  }

  const totalParts = partsAmounts.length;
  const baseNote = baseConfig.tn ? baseConfig.tn.trim() : 'Payment';

  return partsAmounts.map((amt, idx) => {
    const note = `${baseNote} (Part ${idx + 1}/${totalParts})`;
    const uri = buildUpiUri({
      ...baseConfig,
      am: amt,
      tn: note,
    });

    return {
      partIndex: idx + 1,
      totalParts,
      amount: amt,
      formattedAmount: amt.toFixed(2),
      note,
      uri,
    };
  });
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
