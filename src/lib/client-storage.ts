'use client';

export interface QrItemStorage {
  id: string;
  shortCode: string;
  title: string;
  destinationUrl: string;
  logoUrl?: string | null;
  isActive: boolean;
  scansCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ScanLog {
  id: string;
  qrCodeId: string;
  shortCode: string;
  scannedAt: string;
  device: string;
  os: string;
  browser: string;
  country: string;
}

const STORAGE_KEY_QRS = 'omni_qr_codes_v1';
const STORAGE_KEY_SCANS = 'omni_qr_scan_logs_v1';

const defaultDemoQrs: QrItemStorage[] = [
  {
    id: 'qr-demo-1',
    shortCode: 'paid-demo',
    title: 'E-Commerce Summer Campaign',
    destinationUrl: 'https://store.example.com/summer-sale',
    logoUrl: 'https://api.iconify.design/lucide:shopping-bag.svg',
    isActive: true,
    scansCount: 1420,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'qr-demo-2',
    shortCode: 'app-dl',
    title: 'Mobile App Download Link',
    destinationUrl: 'https://example.com/download-app',
    logoUrl: null,
    isActive: true,
    scansCount: 890,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

/**
 * Retrieves QR items from LocalStorage with fallback to demo items
 */
export function getStoredQrItems(): QrItemStorage[] {
  if (typeof window === 'undefined') return defaultDemoQrs;

  try {
    const raw = localStorage.getItem(STORAGE_KEY_QRS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_QRS, JSON.stringify(defaultDemoQrs));
      return defaultDemoQrs;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : defaultDemoQrs;
  } catch {
    return defaultDemoQrs;
  }
}

/**
 * Saves entire QR items list to LocalStorage
 */
export function saveStoredQrItems(items: QrItemStorage[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_QRS, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

/**
 * Adds a new QR item to LocalStorage
 */
export function addStoredQrItem(item: QrItemStorage): QrItemStorage[] {
  const current = getStoredQrItems();
  // Avoid duplicates
  const filtered = current.filter((i) => i.id !== item.id && i.shortCode !== item.shortCode);
  const updated = [item, ...filtered];
  saveStoredQrItems(updated);
  return updated;
}

/**
 * Updates destination URL or active status for a QR item in LocalStorage
 */
export function updateStoredQrItem(id: string, updates: Partial<QrItemStorage>): QrItemStorage[] {
  const current = getStoredQrItems();
  const updated = current.map((item) =>
    item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
  );
  saveStoredQrItems(updated);
  return updated;
}

/**
 * Deletes a QR item from LocalStorage
 */
export function deleteStoredQrItem(id: string): QrItemStorage[] {
  const current = getStoredQrItems();
  const updated = current.filter((item) => item.id !== id);
  saveStoredQrItems(updated);
  return updated;
}

/**
 * Records a scan event for a shortCode in LocalStorage
 */
export function recordScanEvent(shortCode: string, device?: string, os?: string, browser?: string): QrItemStorage[] {
  const current = getStoredQrItems();
  let updatedItem: QrItemStorage | null = null;

  const updated = current.map((item) => {
    if (item.shortCode === shortCode) {
      const count = item.scansCount + 1;
      updatedItem = { ...item, scansCount: count };
      return updatedItem;
    }
    return item;
  });

  if (updatedItem) {
    saveStoredQrItems(updated);

    // Append to scan logs
    try {
      const rawLogs = localStorage.getItem(STORAGE_KEY_SCANS);
      const logs: ScanLog[] = rawLogs ? JSON.parse(rawLogs) : [];
      const newLog: ScanLog = {
        id: 'scan-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
        qrCodeId: (updatedItem as QrItemStorage).id,
        shortCode,
        scannedAt: new Date().toISOString(),
        device: device || (typeof window !== 'undefined' && /mobile/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop'),
        os: os || 'macOS/iOS',
        browser: browser || 'Chrome',
        country: 'US',
      };
      logs.unshift(newLog);
      localStorage.setItem(STORAGE_KEY_SCANS, JSON.stringify(logs.slice(0, 200)));
    } catch {}
  }

  return updated;
}

/**
 * Returns scan logs stored in LocalStorage
 */
export function getStoredScanLogs(): ScanLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SCANS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
