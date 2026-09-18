'use client';

import React, { useState, useEffect } from 'react';
import { Zap, Plus, ExternalLink, Edit3, Check, X, ShieldAlert, Sparkles, RefreshCw, Eye, Copy, Trash2, UserPlus, LogIn, Lock } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  getStoredQrItems,
  saveStoredQrItems,
  addStoredQrItem,
  updateStoredQrItem,
  deleteStoredQrItem,
  recordScanEvent,
  QrItemStorage,
} from '@/lib/client-storage';

export function DynamicQrTable() {
  const { user, setShowSignupModal, setShowLoginModal } = useAuth();
  const [qrItems, setQrItems] = useState<QrItemStorage[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDestinationUrl, setNewDestinationUrl] = useState('');
  const [newLogoUrl, setNewLogoUrl] = useState('');

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [updating, setUpdating] = useState(false);

  // Preview Modal
  const [previewQr, setPreviewQr] = useState<QrItemStorage | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Initialize and sync LocalStorage + API items
  const fetchQrItems = async () => {
    setLoading(true);

    // 1. Read LocalStorage items
    let localItems = getStoredQrItems();

    // 2. Check for scan tracking cookie `omni_last_scan`
    try {
      const cookies = document.cookie.split('; ');
      const scanCookie = cookies.find((c) => c.startsWith('omni_last_scan='));
      if (scanCookie) {
        const valueStr = decodeURIComponent(scanCookie.split('=')[1]);
        const parsed = JSON.parse(valueStr);
        if (parsed?.shortCode) {
          localItems = recordScanEvent(parsed.shortCode);
          // Clear cookie
          document.cookie = 'omni_last_scan=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        }
      }
    } catch {}

    setQrItems(localItems);

    // 3. Fetch server API items and merge
    try {
      const res = await fetch('/api/v1/qr');
      const data = await res.json();
      if (data.data && Array.isArray(data.data)) {
        const serverItems: QrItemStorage[] = data.data;
        // Merge strategy: map server items over local items to combine scan counts & additions
        const mergedMap = new Map<string, QrItemStorage>();

        // Put server items first
        serverItems.forEach((s) => mergedMap.set(s.id, s));
        // Merge local custom items
        localItems.forEach((l) => {
          const existing = mergedMap.get(l.id);
          if (existing) {
            mergedMap.set(l.id, {
              ...existing,
              destinationUrl: l.destinationUrl,
              isActive: l.isActive,
              scansCount: Math.max(existing.scansCount, l.scansCount),
            });
          } else {
            mergedMap.set(l.id, l);
          }
        });

        const mergedList = Array.from(mergedMap.values());
        setQrItems(mergedList);
        saveStoredQrItems(mergedList);
      }
    } catch (err) {
      console.warn('Using LocalStorage fallback items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQrItems();
  }, []);

  const handleCreateDynamicQr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDestinationUrl) return;

    setCreating(true);
    try {
      const res = await fetch('/api/v1/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle || 'Dynamic Campaign QR',
          destinationUrl: newDestinationUrl,
          logoUrl: newLogoUrl || undefined,
        }),
      });

      const result = await res.json();
      let createdItem: QrItemStorage;

      if (result.success && result.data) {
        createdItem = result.data;
      } else {
        // Fallback client creation if server API is unreachable
        const shortCode = Math.random().toString(36).substring(2, 8);
        createdItem = {
          id: 'qr-' + Date.now(),
          shortCode,
          title: newTitle || `Dynamic QR (${shortCode})`,
          destinationUrl: newDestinationUrl,
          logoUrl: newLogoUrl || null,
          isActive: true,
          scansCount: 0,
          createdAt: new Date().toISOString(),
        };
      }

      // Persist directly to LocalStorage so it never disappears on page reload!
      const updatedList = addStoredQrItem(createdItem);
      setQrItems(updatedList);
      setPreviewQr(createdItem);
      setShowCreateModal(false);
      setNewTitle('');
      setNewDestinationUrl('');
      setNewLogoUrl('');
    } catch (err) {
      console.error('Creation error:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateDestination = async (id: string) => {
    if (!editUrl) return;
    setUpdating(true);
    try {
      fetch(`/api/v1/qr/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destinationUrl: editUrl }),
      }).catch(() => {});

      // Instantly update LocalStorage
      const updatedList = updateStoredQrItem(id, { destinationUrl: editUrl });
      setQrItems(updatedList);
      setEditingId(null);
    } catch (err) {
      console.error('Update error:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      fetch(`/api/v1/qr/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      }).catch(() => {});

      // Instantly update LocalStorage
      const updatedList = updateStoredQrItem(id, { isActive: !currentStatus });
      setQrItems(updatedList);
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const handleDeleteQr = async (id: string) => {
    if (!confirm('Are you sure you want to delete this dynamic QR code?')) return;

    try {
      fetch(`/api/v1/qr/${id}`, { method: 'DELETE' }).catch(() => {});
      const updatedList = deleteStoredQrItem(id);
      setQrItems(updatedList);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const copyRedirectUrl = (shortCode: string) => {
    const url = `${window.location.origin}/r/${shortCode}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(shortCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Unauthenticated Gate Banner */}
      {!user.isLoggedIn && (
        <div className="p-6 rounded-2xl glass-panel border border-amber-500/30 bg-amber-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Authentication Required for Dynamic QRs</h3>
              <p className="text-xs text-slate-400">
                Sign up or sign in to create your enterprise team workspace and manage private dynamic QRs.
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

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-sky-400" />
            <span>Dynamic QR Manager</span>
          </h2>
          <p className="text-xs text-slate-400">
            Server-generated QR with Level H error correction, center logo overlay, and editable edge redirect.
          </p>
        </div>

        <button
          onClick={() => {
            if (!user.isLoggedIn) {
              setShowSignupModal(true);
            } else {
              setShowCreateModal(true);
            }
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl gradient-button text-white text-sm font-semibold shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>New Dynamic QR</span>
        </button>
      </div>

      {/* QR Codes Table Panel */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
            <span>Loading dynamic QR codes...</span>
          </div>
        ) : qrItems.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No dynamic QR codes found. Create your first one above!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Campaign Title</th>
                  <th className="px-6 py-4">Short Link & Edge Route</th>
                  <th className="px-6 py-4">Editable Destination URL</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Total Scans</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {qrItems.map((item) => {
                  const redirectUrl = `/r/${item.shortCode}`;
                  const isEditing = editingId === item.id;

                  return (
                    <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                      {/* Campaign Title */}
                      <td className="px-6 py-4 font-medium text-white">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400 font-mono font-bold text-xs">
                            {item.shortCode.substring(0, 3).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{item.title}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              Created {new Date(item.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Short Link */}
                      <td className="px-6 py-4 font-mono text-xs text-sky-400">
                        <div className="flex items-center gap-2">
                          <a
                            href={redirectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline flex items-center gap-1 font-semibold"
                          >
                            <span>{redirectUrl}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <button
                            onClick={() => copyRedirectUrl(item.shortCode)}
                            className="p-1 text-slate-400 hover:text-white rounded bg-slate-800"
                            title="Copy redirect URL"
                          >
                            {copiedCode === item.shortCode ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Editable Destination URL */}
                      <td className="px-6 py-4 max-w-xs">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="url"
                              value={editUrl}
                              onChange={(e) => setEditUrl(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-sky-500 text-white text-xs font-mono"
                            />
                            <button
                              onClick={() => handleUpdateDestination(item.id)}
                              disabled={updating}
                              className="p-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group/edit">
                            <span className="truncate text-slate-300 text-xs font-mono block" title={item.destinationUrl}>
                              {item.destinationUrl}
                            </span>
                            <button
                              onClick={() => {
                                setEditingId(item.id);
                                setEditUrl(item.destinationUrl);
                              }}
                              className="p-1 rounded text-slate-500 hover:text-sky-400 opacity-0 group-hover/edit:opacity-100 transition-opacity"
                              title="Edit target destination URL"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Active Status */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleActive(item.id, item.isActive)}
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                            item.isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {item.isActive ? 'Active' : 'Paused'}
                        </button>
                      </td>

                      {/* Scans Count */}
                      <td className="px-6 py-4 text-center font-mono font-bold text-white">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-sky-400">
                          {item.scansCount.toLocaleString()}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setPreviewQr(item)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium inline-flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5 text-sky-400" />
                            <span>Preview</span>
                          </button>
                          <button
                            onClick={() => handleDeleteQr(item.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
                            title="Delete QR"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Dynamic QR Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-sky-400" />
                <span>Create Dynamic QR Code</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDynamicQr} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Campaign Title / Name
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Summer Promo Coupon"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Destination Target URL *
                </label>
                <input
                  type="url"
                  value={newDestinationUrl}
                  onChange={(e) => setNewDestinationUrl(e.target.value)}
                  placeholder="https://yourdomain.com/landing-page"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-mono focus:border-sky-500"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  You can edit this destination anytime later without re-printing the QR.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Center Logo Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={newLogoUrl}
                  onChange={(e) => setNewLogoUrl(e.target.value)}
                  placeholder="https://api.iconify.design/lucide:shopping-bag.svg"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-mono focus:border-sky-500"
                />
                <p className="text-[11px] text-indigo-400 mt-1 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  <span>Automatically rendered with Level H error correction (30% recovery buffer).</span>
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl gradient-button text-white text-sm font-semibold flex items-center gap-2"
                >
                  {creating && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{creating ? 'Generating...' : 'Generate Dynamic QR'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic QR Preview Modal */}
      {previewQr && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-800 p-6 flex flex-col items-center space-y-4">
            <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white truncate">{previewQr.title}</h3>
              <button onClick={() => setPreviewQr(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-white flex items-center justify-center shadow-xl">
              <img
                src={`/api/v1/qr/render?text=${encodeURIComponent(
                  `${window.location.origin}/r/${previewQr.shortCode}`
                )}&logoUrl=${encodeURIComponent(previewQr.logoUrl || '')}`}
                alt="Dynamic QR Code"
                className="w-64 h-64 object-contain"
              />
            </div>

            <div className="w-full bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 space-y-1">
              <div className="text-slate-500">Short Code Edge Route:</div>
              <div className="text-sky-400 font-bold">{`/r/${previewQr.shortCode}`}</div>
              <div className="text-slate-500 pt-1">Current Target Destination:</div>
              <div className="text-emerald-400 truncate">{previewQr.destinationUrl}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
