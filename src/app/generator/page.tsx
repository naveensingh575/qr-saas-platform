import React from 'react';
import { StaticQrBuilder } from '@/components/static-qr-builder';

export default function FreeGeneratorPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white tracking-tight">Free Static QR Studio</h1>
        <p className="text-xs text-slate-400">
          Client-side vector QR code generator for URLs, text messages, and NPCI UPI payments.
        </p>
      </div>

      <StaticQrBuilder />
    </div>
  );
}
