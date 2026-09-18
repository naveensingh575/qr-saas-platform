'use client';

import React, { useState } from 'react';
import { useAuth, PRESET_USERS, UserRole } from '@/lib/auth-context';
import { LogIn, X, Shield, Check, Sparkles, UserCheck } from 'lucide-react';

export function LoginModal() {
  const { user, login, showLoginModal, setShowLoginModal } = useAuth();
  
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customRole, setCustomRole] = useState<UserRole>('ADMIN');

  if (!showLoginModal) return null;

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customEmail) return;

    login({
      name: customName,
      email: customEmail,
      role: customRole,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-800 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Authentication & RBAC Login</h3>
              <p className="text-xs text-slate-400">Sign in to manage Enterprise roles & team workspace</p>
            </div>
          </div>
          <button onClick={() => setShowLoginModal(false)} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Select Preset Profiles */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Quick Sign-In As Preset Profile
          </label>

          <div className="space-y-2">
            {PRESET_USERS.map((preset) => {
              const isSelected = user.email === preset.email && user.isLoggedIn;
              return (
                <div
                  key={preset.id}
                  onClick={() => login(preset)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-sky-500/15 border-sky-500 text-white'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                      {preset.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-white flex items-center gap-1.5">
                        <span>{preset.name}</span>
                        {preset.name === 'Naveen' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                            Enterprise Admin
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">{preset.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                        preset.role === 'OWNER'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                          : preset.role === 'ADMIN'
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {preset.role}
                    </span>
                    {isSelected && <UserCheck className="w-4 h-4 text-emerald-400" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative border-t border-slate-800 pt-4">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-950 px-2 text-[10px] uppercase font-mono text-slate-500">
            OR CUSTOM CREDENTIALS
          </div>
        </div>

        {/* Custom Form Login */}
        <form onSubmit={handleCustomLogin} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g. Naveen"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Work Email *
            </label>
            <input
              type="email"
              value={customEmail}
              onChange={(e) => setCustomEmail(e.target.value)}
              placeholder="naveen@omniqr.online"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Assign Role Level
            </label>
            <select
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value as UserRole)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-sky-500"
            >
              <option value="ADMIN">ADMIN (Can manage team roles & API keys)</option>
              <option value="OWNER">OWNER (Full workspace control & billing)</option>
              <option value="MEMBER">MEMBER (Dynamic QR creation only)</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl gradient-button text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to Workspace</span>
          </button>
        </form>
      </div>
    </div>
  );
}
