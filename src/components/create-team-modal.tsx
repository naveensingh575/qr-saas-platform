'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Building2, X, Plus, Sparkles, Check } from 'lucide-react';

export function CreateTeamModal({
  isOpen,
  onClose,
  onTeamCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onTeamCreated?: (team: any) => void;
}) {
  const { user } = useAuth();
  const [teamName, setTeamName] = useState('');
  const [tier, setTier] = useState<'ENTERPRISE' | 'BUSINESS' | 'PAID'>('ENTERPRISE');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName) return;

    setLoading(true);
    try {
      const res = await fetch('/api/v1/teams/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: teamName,
          tier,
        }),
      });

      const result = await res.json();
      if (result.success && result.team) {
        if (onTeamCreated) onTeamCreated(result.team);
        onClose();
        setTeamName('');
      } else {
        alert(result.error || 'Team creation failed');
      }
    } catch (err) {
      console.error(err);
      if (onTeamCreated) {
        onTeamCreated({
          id: 'team-' + Date.now(),
          name: teamName,
          tier,
        });
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-800 p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create Enterprise Team Workspace</h3>
              <p className="text-xs text-slate-400">Owner: {user.name} ({user.role})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreateTeam} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Workspace / Organization Name *
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Naveen Enterprise Global"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Workspace Tier
            </label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-purple-500"
            >
              <option value="ENTERPRISE">ENTERPRISE (Unlimited API, RBAC & Dedication)</option>
              <option value="BUSINESS">BUSINESS (600 req/min API + BullMQ)</option>
              <option value="PAID">PAID (Standard Dynamic QRs)</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl gradient-button text-white text-sm font-semibold flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? 'Creating Workspace...' : 'Create Team Workspace'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
