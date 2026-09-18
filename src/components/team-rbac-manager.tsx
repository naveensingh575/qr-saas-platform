'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, UserRole } from '@/lib/auth-context';
import {
  Users,
  Key,
  Shield,
  UserPlus,
  Copy,
  Check,
  Lock,
  Sparkles,
  Plus,
  AlertCircle,
  ShieldAlert,
  ChevronDown,
  Building2,
  LogIn,
} from 'lucide-react';

interface Member {
  id: string;
  role: UserRole;
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

const DEFAULT_MEMBERS: Member[] = [];
const DEFAULT_API_KEYS: ApiKeyItem[] = [];

const LOCAL_MEMBERS_KEY = 'omni_team_members_v2';
const LOCAL_KEYS_KEY = 'omni_api_keys_v2';
const LOCAL_TIER_KEY = 'omni_workspace_tier_v2';

export function TeamRbacManager() {
  const { user, setShowLoginModal, setShowSignupModal, setShowCreateTeamModal } = useAuth();
  
  const [members, setMembers] = useState<Member[]>(DEFAULT_MEMBERS);
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>(DEFAULT_API_KEYS);
  const [workspaceTier, setWorkspaceTier] = useState<'ENTERPRISE' | 'BUSINESS' | 'PAID' | 'FREE'>('ENTERPRISE');

  // Modals state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('MEMBER');

  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Check user permission
  const canManageTeam = user.isLoggedIn && (user.role === 'ADMIN' || user.role === 'OWNER');

  // Load from LocalStorage & fetch API
  useEffect(() => {
    try {
      const storedMems = localStorage.getItem(LOCAL_MEMBERS_KEY);
      if (storedMems) setMembers(JSON.parse(storedMems));
      else localStorage.setItem(LOCAL_MEMBERS_KEY, JSON.stringify(DEFAULT_MEMBERS));

      const storedKeys = localStorage.getItem(LOCAL_KEYS_KEY);
      if (storedKeys) setApiKeys(JSON.parse(storedKeys));
      else localStorage.setItem(LOCAL_KEYS_KEY, JSON.stringify(DEFAULT_API_KEYS));

      const storedTier = localStorage.getItem(LOCAL_TIER_KEY);
      if (storedTier) setWorkspaceTier(storedTier as any);
    } catch {}

    fetch('/api/v1/teams')
      .then((res) => res.json())
      .then((res) => {
        if (res.data?.members) {
          // Sync server members with local state
        }
      })
      .catch(() => {});
  }, []);

  const handleRoleChange = (memberId: string, newRole: UserRole) => {
    if (!canManageTeam) {
      alert('Permission denied. Only ADMIN or OWNER can assign member roles.');
      return;
    }

    const updated = members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m));
    setMembers(updated);
    localStorage.setItem(LOCAL_MEMBERS_KEY, JSON.stringify(updated));

    // Send API update
    fetch('/api/v1/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'UPDATE_MEMBER_ROLE',
        memberId,
        newRole,
        userRole: user.role,
      }),
    }).catch(() => {});
  };

  const handleWorkspaceTierChange = (tier: 'ENTERPRISE' | 'BUSINESS' | 'PAID' | 'FREE') => {
    if (!canManageTeam) {
      alert('Permission denied. Only ADMIN or OWNER can upgrade Enterprise tiers.');
      return;
    }
    setWorkspaceTier(tier);
    localStorage.setItem(LOCAL_TIER_KEY, tier);
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    if (!canManageTeam) {
      alert('Permission denied. Requires ADMIN or OWNER rights.');
      return;
    }

    const newMember: Member = {
      id: 'mem-' + Date.now(),
      role: inviteRole,
      user: {
        name: inviteName || inviteEmail.split('@')[0],
        email: inviteEmail,
      },
      createdAt: new Date().toISOString(),
    };

    const updated = [...members, newMember];
    setMembers(updated);
    localStorage.setItem(LOCAL_MEMBERS_KEY, JSON.stringify(updated));
    setShowInviteModal(false);
    setInviteEmail('');
    setInviteName('');

    fetch('/api/v1/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'INVITE_MEMBER',
        email: inviteEmail,
        name: inviteName,
        role: inviteRole,
        userRole: user.role,
      }),
    }).catch(() => {});
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canManageTeam) {
      alert('Permission denied. Requires ADMIN or OWNER rights.');
      return;
    }

    const rawKey = `sk_live_${Math.random().toString(36).substring(2, 14)}${Math.random().toString(36).substring(2, 14)}`;
    const keyPrefix = rawKey.substring(0, 12) + '...';

    const newKey: ApiKeyItem = {
      id: 'key-' + Date.now(),
      name: keyName || 'Enterprise API Key',
      keyPrefix,
      createdAt: new Date().toISOString(),
    };

    const updated = [newKey, ...apiKeys];
    setApiKeys(updated);
    localStorage.setItem(LOCAL_KEYS_KEY, JSON.stringify(updated));
    setGeneratedKey(rawKey);
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
      {/* Unauthenticated Gate Banner */}
      {!user.isLoggedIn && (
        <div className="p-6 rounded-2xl glass-panel border border-amber-500/30 bg-amber-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Authentication Required for Team & RBAC Workspace</h3>
              <p className="text-xs text-slate-400">
                Sign up or sign in to provision your team workspace, manage team members, and generate secret API keys.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              onClick={() => setShowSignupModal(true)}
              className="px-4 py-2 rounded-xl gradient-button text-white text-xs font-semibold shadow-md flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>
        </div>
      )}

      {/* Active User Session Banner */}
      {user.isLoggedIn && (
        <div className="p-5 rounded-2xl glass-panel border border-sky-500/30 bg-sky-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {user.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{user.name}</h3>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                    user.role === 'OWNER'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      : user.role === 'ADMIN'
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {user.role} ROLE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{user.email} • Authenticated Workspace User</p>
            </div>
          </div>

          <button
            onClick={() => setShowLoginModal(true)}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-400 text-xs font-semibold border border-sky-500/30 flex items-center gap-2"
          >
            <Shield className="w-4 h-4" />
            <span>Switch User Profile / Sign In</span>
          </button>
        </div>
      )}

      {/* Enterprise Tier & Workspace Control */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Enterprise Workspace Tier</h3>
            <p className="text-xs text-slate-400">Current Plan: {workspaceTier} (Unlimited Teams & Dedicated Redis Queues)</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(['ENTERPRISE', 'BUSINESS', 'PAID', 'FREE'] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleWorkspaceTierChange(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                workspaceTier === t
                  ? 'bg-purple-600 text-white border-purple-500 shadow'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
          <button
            onClick={() => setShowCreateTeamModal(true)}
            className="px-3.5 py-1.5 rounded-lg gradient-button text-white text-xs font-bold flex items-center gap-1.5 shadow-md ml-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Enterprise Team</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Team Members Directory with Role Editing Dropdown */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-400" />
                <span>Team Members & Role Assignment</span>
              </h3>
              <p className="text-xs text-slate-400">Select any role dropdown below to assign Admin/Owner rights.</p>
            </div>
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
                  <th className="px-4 py-3">Member Details</th>
                  <th className="px-4 py-3 text-center">Assign Role</th>
                  <th className="px-4 py-3 text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-900/40">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <span>{m.user.name}</span>
                        {m.user.name === 'Naveen' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                            Admin Lead
                          </span>
                        )}
                      </div>
                      <div className="text-slate-400 text-[11px]">{m.user.email}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {canManageTeam ? (
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.id, e.target.value as UserRole)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border bg-slate-950 focus:outline-none cursor-pointer ${
                            m.role === 'OWNER'
                              ? 'text-purple-400 border-purple-500/40'
                              : m.role === 'ADMIN'
                              ? 'text-sky-400 border-sky-500/40'
                              : 'text-slate-400 border-slate-700'
                          }`}
                        >
                          <option value="ADMIN">ADMIN (Full API & Team Access)</option>
                          <option value="OWNER">OWNER (Full Control & Billing)</option>
                          <option value="MEMBER">MEMBER (Standard Access)</option>
                        </select>
                      ) : (
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
                      )}
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
              <span className="font-mono text-emerald-400 font-bold">600 req/min ({workspaceTier})</span>
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
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Naveen"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Email Address *</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="naveen@omniqr.online"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Assign Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                >
                  <option value="ADMIN">ADMIN (Can manage keys & member roles)</option>
                  <option value="OWNER">OWNER (Full Workspace Control)</option>
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
