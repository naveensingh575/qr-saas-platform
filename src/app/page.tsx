import React from 'react';
import Link from 'next/link';
import { QrCode, Zap, FileSpreadsheet, ShieldCheck, ArrowRight, CheckCircle2, Sparkles, Layers, Activity, Lock } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="space-y-20 py-6">
      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-4xl mx-auto pt-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Production Multi-Tenant QR Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
          Next-Gen Enterprise <br />
          <span className="gradient-text">QR SaaS Platform</span>
        </h1>

        <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
          From free client-side UPI payment QR generation to server-rendered dynamic logo overlays with sub-10ms Redis edge redirects and BullMQ bulk CSV queues.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/generator"
            className="px-6 py-3.5 rounded-xl gradient-button text-white font-bold text-sm shadow-xl flex items-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            <span>Try Free Static Builder</span>
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition-all flex items-center gap-2"
          >
            <Zap className="w-4 h-4 text-sky-400" />
            <span>Launch Paid Dynamic Studio</span>
          </Link>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Free Tier */}
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-5 hover:border-emerald-500/40 transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-mono uppercase text-emerald-400 font-bold tracking-wider">Tier 1 • Free</div>
            <h3 className="text-xl font-bold text-white mt-1">Static Client-Side Engine</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Instant client-side SVG rendering (`qr-code-styling`). Unlimited scans for website URLs, text, and standard NPCI UPI payment schemas.
          </p>
          <ul className="space-y-2 text-xs text-slate-300 pt-2">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Standard `upi://pay?pa=...` payment schema</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Custom SVG colors, dot patterns & corners</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>High-res PNG & SVG instant vector export</span>
            </li>
          </ul>
          <Link
            href="/generator"
            className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:underline pt-2"
          >
            <span>Open Free Builder</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Paid Tier */}
        <div className="glass-panel p-8 rounded-3xl border border-sky-500/30 bg-sky-500/5 space-y-5 relative overflow-hidden group shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-mono uppercase text-sky-400 font-bold tracking-wider">Tier 2 • Paid ($/mo)</div>
            <h3 className="text-xl font-bold text-white mt-1">Dynamic Engine & Telemetry</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Server-rendered QR with center logo overlay (Level H error correction). Edge redirect `/r/:code` with sub-10ms Redis cache lookup and async scan telemetry.
          </p>
          <ul className="space-y-2 text-xs text-slate-300 pt-2">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-400" />
              <span>Editable destination URL anytime</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-400" />
              <span>Center logo overlay (Level H 30% buffer)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-400" />
              <span>Sub-10ms Redis edge 302 redirect</span>
            </li>
          </ul>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-bold text-sky-400 hover:underline pt-2"
          >
            <span>Manage Dynamic QRs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Business Tier */}
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-5 hover:border-purple-500/40 transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-mono uppercase text-purple-400 font-bold tracking-wider">Tier 3 • Business</div>
            <h3 className="text-xl font-bold text-white mt-1">Bulk CSV & Team RBAC</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            BullMQ background queue worker for thousands of QR codes. Multi-tenant workspace with Team RBAC roles and sliding-window Redis API rate limits.
          </p>
          <ul className="space-y-2 text-xs text-slate-300 pt-2">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
              <span>BullMQ async bulk CSV queue worker</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
              <span>Team workspace & RBAC (Owner/Admin/Member)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
              <span>`x-api-key` auth with Redis rate limiter</span>
            </li>
          </ul>
          <Link
            href="/dashboard/bulk"
            className="inline-flex items-center gap-2 text-xs font-bold text-purple-400 hover:underline pt-2"
          >
            <span>Launch Bulk CSV Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Tier Matrix Table */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-white">Platform Tier Matrix Comparison</h2>
          <p className="text-xs text-slate-400">Architected for scalable multi-tenant SaaS deployment</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/90 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Capabilities & Features</th>
                <th className="px-6 py-4 text-center text-emerald-400">Free Tier</th>
                <th className="px-6 py-4 text-center text-sky-400">Paid Tier ($/mo)</th>
                <th className="px-6 py-4 text-center text-purple-400">Business Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr>
                <td className="px-6 py-4 font-semibold text-white">QR Generation Engine</td>
                <td className="px-6 py-4 text-center text-xs font-mono">Client-Side SVG</td>
                <td className="px-6 py-4 text-center text-xs font-mono">Server Level H + Logo</td>
                <td className="px-6 py-4 text-center text-xs font-mono">Server Level H + Logo</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-semibold text-white">Editable Target Destination</td>
                <td className="px-6 py-4 text-center text-slate-500">Static (No)</td>
                <td className="px-6 py-4 text-center text-emerald-400 font-bold">Dynamic (Instant)</td>
                <td className="px-6 py-4 text-center text-emerald-400 font-bold">Dynamic (Instant)</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-semibold text-white">UPI Payment Schema (`upi://pay?pa=...`)</td>
                <td className="px-6 py-4 text-center text-emerald-400 font-bold">Full NPCI Spec</td>
                <td className="px-6 py-4 text-center text-emerald-400 font-bold">Full NPCI Spec</td>
                <td className="px-6 py-4 text-center text-emerald-400 font-bold">Full NPCI Spec</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-semibold text-white">Edge Redirect Latency</td>
                <td className="px-6 py-4 text-center text-slate-500">Direct static link</td>
                <td className="px-6 py-4 text-center text-sky-400 font-bold">&lt;10ms Redis Cache</td>
                <td className="px-6 py-4 text-center text-sky-400 font-bold">&lt;10ms Redis Cache</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-semibold text-white">Async Scan Telemetry Analytics</td>
                <td className="px-6 py-4 text-center text-slate-500">—</td>
                <td className="px-6 py-4 text-center text-sky-400 font-bold">Geo, Device, Browser</td>
                <td className="px-6 py-4 text-center text-sky-400 font-bold">Geo, Device, Browser</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-semibold text-white">Bulk CSV Background Processing</td>
                <td className="px-6 py-4 text-center text-slate-500">—</td>
                <td className="px-6 py-4 text-center text-slate-500">—</td>
                <td className="px-6 py-4 text-center text-purple-400 font-bold">BullMQ Queue</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-semibold text-white">API Key Auth & Rate Limiter</td>
                <td className="px-6 py-4 text-center text-slate-500">—</td>
                <td className="px-6 py-4 text-center text-slate-500">60 req/min</td>
                <td className="px-6 py-4 text-center text-purple-400 font-bold">`x-api-key` (600 req/min)</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-semibold text-white">Team Workspace & RBAC</td>
                <td className="px-6 py-4 text-center text-slate-500">Single User</td>
                <td className="px-6 py-4 text-center text-slate-500">Single Team</td>
                <td className="px-6 py-4 text-center text-purple-400 font-bold">Owner, Admin, Member</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
