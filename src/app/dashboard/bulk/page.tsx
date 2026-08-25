import React from 'react';
import { BulkCsvUploader } from '@/components/bulk-csv-uploader';

export default function BulkCsvPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white tracking-tight">Business Tier Bulk CSV Studio</h1>
        <p className="text-xs text-slate-400">
          Upload CSV files to trigger high-throughput background generation via BullMQ queues and export ZIP vector bundles.
        </p>
      </div>

      <BulkCsvUploader />
    </div>
  );
}
