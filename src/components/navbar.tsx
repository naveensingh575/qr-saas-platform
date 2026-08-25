'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { QrCode, Zap, Layers, Users, FileSpreadsheet, ShieldCheck, Sparkles } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const [currentTier, setCurrentTier] = useState<'FREE' | 'PAID' | 'BUSINESS'>('BUSINESS');

  const navLinks = [
    { href: '/', label: 'Overview', icon: Sparkles },
    { href: '/generator', label: 'Static QR Builder', badge: 'Free', icon: QrCode },
    { href: '/dashboard', label: 'Dynamic QRs', badge: 'Paid', icon: Zap },
    { href: '/dashboard/bulk', label: 'Bulk CSV Queue', badge: 'Business', icon: FileSpreadsheet },
    { href: '/dashboard/teams', label: 'Team & RBAC', badge: 'Business', icon: Users },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-500 p-0.5 shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <QrCode className="w-5 h-5 text-sky-400" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
              OmniQR <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-medium">SaaS</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Multi-Tenant Engine</span>
          </div>
        </Link>

        {/* Navigation items */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4 text-slate-400" />
                <span>{link.label}</span>
                {link.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                      link.badge === 'Free'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : link.badge === 'Paid'
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                    }`}
                  >
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Tier switcher & user indicator */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400 px-2 font-medium">Tier:</span>
            {(['FREE', 'PAID', 'BUSINESS'] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setCurrentTier(tier)}
                className={`px-2.5 py-1 rounded-md transition-colors font-semibold text-[11px] ${
                  currentTier === tier
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              AR
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
