'use client';

import React, { useState, useEffect } from 'react';
import { Users, Key, Shield, UserPlus, Copy, Check, Lock, Sparkles, Plus, AlertCircle } from 'lucide-react';

interface Member {
  id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  user: { name: string; email: string };
  createdAt: string;
}

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt?: string;
}

export function TeamRbacManager() {
  const [members, setMembers] = useState<Member[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [activeRole, setActiveRole] = useState<'OWNER' | 'ADMIN' | 'MEMBER'>('OWNER');
  
  // Modals state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    fetch('/api/v1/teams')
      .then((res) => res.json())
      .then((res) => {
        if (res.data) {
          setMembers(res.data.members || []);
          setApiKeys(res.data.apiKeys || []);
        }
      })
      .catch((err) => console.error('Team fetch error:', err));
  }, []);

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    try {
      const res = await fetch('/api/v1/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'INVITE_MEMBER',
          email: inviteEmail,
          role: inviteRole,
          userRole: activeRole,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setMembers((prev) => [...prev, result.member]);
        setShowInviteModal(false);
        setInviteEmail('');
      } else {
        alert(result.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/v1/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_API_KEY',
          keyName: keyName || 'Production API Token',
          userRole: activeRole,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setGeneratedKey(result.apiKey);
        setApiKeys((prev) => [
          ...prev,
          {
            id: 'key-' + Date.now(),
            name: result.name,
            keyPrefix: result.keyPrefix,
            createdAt: new Date().toISOString(),
          },
        ]);
      } else {
        alert(result.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyKeyToClipboard = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Active Role Simulation Switcher Banner */}
      <div className="p-4 rounded-xl glass-panel border border-purple-500/20 bg-purple-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-purple-300">Team Workspace & RBAC Permissions</h3>
            <p className="text-xs text-slate-400">Role-Based Access Control enforcing Owner, Admin, and Member rights.</p>
          </div>
        </div>

        {/* Role Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-lg border border-slate-800 text-xs">
          <span className="text-slate-400 px-2 font-medium">Test Role Context:</span>
          {(['OWNER', 'ADMIN', 'MEMBER'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setActiveRole(r)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                activeRole === r ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Team Members Directory */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              <span>Workspace Team Members</span>
            </h3>
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700"
            >
              <UserPlus className="w-3.5 h-3.5 text-sky-400" />
              <span>Invite Member</span>
            </button>
          </div>

          {/* Members Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-[11px] uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">User Details</th>
                  <th className="px-4 py-3 text-center">Role</th>
                  <th className="px-4 py-3 text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-900/40">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{m.user.name}</div>
                      <div className="text-slate-400 text-[11px]">{m.user.email}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          m.role === 'OWNER'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                            : m.role === 'ADMIN'
                            ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {m.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400 font-mono text-[11px]">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: API Key Auth & Rate Limit Manager */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-purple-400" />
              <span>API Key Authentication</span>
            </h3>
            <button
              onClick={() => setShowKeyModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg gradient-button text-white text-xs font-semibold shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Key</span>
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Header format:</span>
              <span className="font-mono text-purple-400 font-bold">x-api-key: sk_live_...</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Rate Limiter limit:</span>
              <span className="font-mono text-emerald-400 font-bold">600 req/min (Business)</span>
            </div>
          </div>

          {/* Active Keys List */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Workspace Keys</div>
            {apiKeys.map((k) => (
              <div key={k.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">{k.name}</div>
                  <div className="text-[11px] font-mono text-slate-400">{k.keyPrefix}</div>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-800 p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Invite Team Member</h3>
            <form onSubmit={handleInviteMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@acme.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Assign Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                >
                  <option value="ADMIN">ADMIN (Can manage keys & members)</option>
                  <option value="MEMBER">MEMBER (Can create & edit QRs)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl gradient-button text-white text-sm font-semibold">
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-800 p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Generate API Key</h3>

            {generatedKey ? (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Copy your API secret token now. It will not be shown again!</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono text-emerald-400">
                  <span className="truncate max-w-[80%]">{generatedKey}</span>
                  <button onClick={copyKeyToClipboard} className="p-1.5 rounded bg-slate-800 text-slate-200">
                    {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={() => {
                    setShowKeyModal(false);
                    setGeneratedKey(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-800 text-white text-sm font-semibold"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateApiKey} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Key Description / Name</label>
                  <input
                    type="text"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="e.g. CI/CD Pipeline Key"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                    required
                  />
                </div>
                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowKeyModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 rounded-xl gradient-button text-white text-sm font-semibold">
                    Generate Secret Key
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
