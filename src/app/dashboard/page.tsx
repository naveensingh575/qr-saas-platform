import React from 'react';
import { DynamicQrTable } from '@/components/dynamic-qr-table';
import { QrAnalyticsChart } from '@/components/qr-analytics-chart';

export default function DynamicDashboardPage() {
  return (
    <div className="space-y-10">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white tracking-tight">Paid Tier Dynamic QR Hub</h1>
        <p className="text-xs text-slate-400">
          Manage dynamic server-generated QRs, edit destination URLs on the fly, and inspect real-time scan telemetry.
        </p>
      </div>

      {/* Dynamic QR Management Table */}
      <DynamicQrTable />

      {/* Scan Telemetry Analytics Section */}
      <div className="pt-6 border-t border-slate-800/80">
        <h2 className="text-lg font-bold text-white mb-2">Scan Telemetry Analytics</h2>
        <p className="text-xs text-slate-400">Asynchronous non-blocking metrics captured during edge redirects.</p>
        <QrAnalyticsChart />
      </div>
    </div>
  );
}
