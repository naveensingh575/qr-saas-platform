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

const initialDemoItems: QrRecordItem[] = [];

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
