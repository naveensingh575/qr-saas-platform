'use client';

import React, { useState } from 'react';
import Papa from 'papaparse';
import JSZip from 'jszip';
import { generateDynamicQrSvg } from '@/lib/qr-generator';
import { FileSpreadsheet, Upload, Download, CheckCircle, RefreshCw, AlertCircle, FileCheck, Play } from 'lucide-react';

interface CsvRow {
  destinationUrl: string;
  title?: string;
  type?: string;
}

export function BulkCsvUploader() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<CsvRow[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [jobResult, setJobResult] = useState<any | null>(null);
  const [generatedResults, setGeneratedResults] = useState<Array<{ shortCode: string; destinationUrl: string; svgContent: string }> | null>(null);
  const [downloadingZip, setDownloadingZip] = useState(false);

  const sampleCsvText = `destinationUrl,title,type
https://example.com/promo-1,Summer Promo 1,DYNAMIC
https://example.com/promo-2,Summer Promo 2,DYNAMIC
https://example.com/promo-3,Summer Promo 3,DYNAMIC
https://example.com/app-store,Mobile Download,DYNAMIC`;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validRows = results.data.filter((row) => row.destinationUrl);
        setParsedRows(validRows);
      },
    });
  };

  const loadSampleCsv = () => {
    Papa.parse<CsvRow>(sampleCsvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validRows = results.data.filter((row) => row.destinationUrl);
        setParsedRows(validRows);
        setCsvFile(new File([sampleCsvText], 'sample_bulk_qrs.csv', { type: 'text/csv' }));
      },
    });
  };

  const handleDispatchJob = async () => {
    if (parsedRows.length === 0) return;

    setProcessing(true);
    setProgress(20);

    try {
      // 1. Dispatch to BullMQ API route
      const res = await fetch('/api/v1/qr/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'sk_live_business_demo_token',
        },
        body: JSON.stringify({
          items: parsedRows,
        }),
      });

      const data = await res.json();
      setProgress(60);

      // 2. Generate local SVG preview batch for client download ZIP
      const batchResults = [];
      for (let i = 0; i < parsedRows.length; i++) {
        const row = parsedRows[i];
        const shortCode = Math.random().toString(36).substring(2, 8);
        const svgContent = await generateDynamicQrSvg({ text: row.destinationUrl });
        batchResults.push({
          shortCode,
          destinationUrl: row.destinationUrl,
          svgContent,
        });
      }

      setProgress(100);
      setJobResult(data);
      setGeneratedResults(batchResults);
    } catch (err) {
      console.error('Bulk job error:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadZip = async () => {
    if (!generatedResults) return;

    setDownloadingZip(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('omni_qr_batch_export');

      generatedResults.forEach((item, index) => {
        folder?.file(`qr_${index + 1}_${item.shortCode}.svg`, item.svgContent);
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `omni_qr_batch_${Date.now()}.zip`;
      link.click();
    } catch (err) {
      console.error('Zip generation error:', err);
    } finally {
      setDownloadingZip(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl glass-panel border border-purple-500/20 bg-purple-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-purple-300">Business Tier Bulk CSV Engine</h2>
            <p className="text-xs text-slate-400">
              Process up to 10,000 QR codes asynchronously using BullMQ worker queues.
            </p>
          </div>
        </div>

        <button
          onClick={loadSampleCsv}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700"
        >
          Load Sample CSV
        </button>
      </div>

      {/* Main CSV Dropzone & Processing Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Upload & Table Preview */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">1. Upload CSV Batch File</h3>

          {/* Dropzone */}
          <div className="border-2 border-dashed border-slate-700 hover:border-purple-500 rounded-2xl p-8 text-center transition-colors bg-slate-950/50 flex flex-col items-center justify-center space-y-3">
            <Upload className="w-8 h-8 text-slate-400" />
            <div>
              <label className="cursor-pointer text-sm font-semibold text-sky-400 hover:underline">
                <span>Click to browse CSV file</span>
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              </label>
              <p className="text-xs text-slate-500 mt-1">Columns required: destinationUrl, title, type</p>
            </div>

            {csvFile && (
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                <FileCheck className="w-4 h-4" />
                <span>{csvFile.name} ({parsedRows.length} valid rows)</span>
              </div>
            )}
          </div>

          {/* Parsed Rows Preview */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>CSV File Data Preview ({parsedRows.length} Items)</span>
              </div>

              <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs font-mono text-slate-300">
                  <thead className="bg-slate-900 sticky top-0 text-[11px] text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-2">#</th>
                      <th className="px-4 py-2">Title</th>
                      <th className="px-4 py-2">Destination URL</th>
                      <th className="px-4 py-2">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        <td className="px-4 py-2 text-slate-500">{idx + 1}</td>
                        <td className="px-4 py-2 text-white font-medium">{row.title || 'Dynamic QR'}</td>
                        <td className="px-4 py-2 text-sky-400 truncate max-w-xs">{row.destinationUrl}</td>
                        <td className="px-4 py-2 text-purple-400">{row.type || 'DYNAMIC'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={handleDispatchJob}
                disabled={processing}
                className="w-full py-3 rounded-xl gradient-button text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg"
              >
                {processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                <span>{processing ? 'Processing Background Task...' : `Process ${parsedRows.length} Items via BullMQ`}</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Status & Download ZIP Bundle */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">2. Queue Monitor & Export</h3>

          {processing && (
            <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mx-auto" />
              <div className="text-sm font-bold text-white">BullMQ Worker Processing Job...</div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div style={{ width: `${progress}%` }} className="bg-sky-500 h-full rounded-full transition-all duration-500" />
              </div>
            </div>
          )}

          {jobResult && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span>Batch Queue Execution Complete</span>
                </div>
                <div className="text-xs font-mono space-y-1 pl-7">
                  <div>Job ID: {jobResult.jobId}</div>
                  <div>Status: {jobResult.status}</div>
                  <div>Total Items Processed: {generatedResults?.length}</div>
                </div>
              </div>

              <button
                onClick={handleDownloadZip}
                disabled={downloadingZip}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                {downloadingZip ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>Download SVG Bundle (.ZIP)</span>
              </button>
            </div>
          )}

          {!processing && !jobResult && (
            <div className="p-8 text-center text-slate-500 text-xs border border-slate-800 rounded-xl space-y-2">
              <AlertCircle className="w-6 h-6 text-slate-600 mx-auto" />
              <span>Upload a CSV file and dispatch job to view real-time execution stats.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
