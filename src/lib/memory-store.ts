export interface QrRecordItem {
  id: string;
  teamId: string;
  shortCode: string;
  title: string;
  type: string;
  destinationUrl: string;
  logoUrl?: string | null;
  isActive: boolean;
  scansCount: number;
  createdAt: string;
  updatedAt: string;
}

const initialDemoItems: QrRecordItem[] = [
  {
    id: 'qr-demo-1',
    teamId: 'team-demo',
    shortCode: 'paid-demo',
    title: 'E-Commerce Summer Campaign',
    type: 'DYNAMIC',
    destinationUrl: 'https://store.example.com/summer-sale',
    logoUrl: 'https://api.iconify.design/lucide:shopping-bag.svg',
    isActive: true,
    scansCount: 1420,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'qr-demo-2',
    teamId: 'team-demo',
    shortCode: 'app-dl',
    title: 'Mobile App Download Link',
    type: 'DYNAMIC',
    destinationUrl: 'https://example.com/download-app',
    logoUrl: null,
    isActive: true,
    scansCount: 890,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

const globalForStore = globalThis as unknown as {
  memoryQrStore: QrRecordItem[] | undefined;
};

export const memoryQrStore: QrRecordItem[] =
  globalForStore.memoryQrStore ?? [...initialDemoItems];

if (process.env.NODE_ENV !== 'production') {
  globalForStore.memoryQrStore = memoryQrStore;
}

export function addMemoryQr(item: QrRecordItem) {
  memoryQrStore.unshift(item);
}

export function updateMemoryQr(id: string, updates: Partial<QrRecordItem>): QrRecordItem | null {
  const index = memoryQrStore.findIndex((i) => i.id === id);
  if (index !== -1) {
    memoryQrStore[index] = {
      ...memoryQrStore[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return memoryQrStore[index];
  }
  return null;
}

export function deleteMemoryQr(id: string): boolean {
  const index = memoryQrStore.findIndex((i) => i.id === id);
  if (index !== -1) {
    memoryQrStore.splice(index, 1);
    return true;
  }
  return false;
}
