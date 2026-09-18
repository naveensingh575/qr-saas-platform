'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { buildUpiUri, calculateUpiSplits, UpiSplitResultItem } from '@/lib/upi-schema';
import JSZip from 'jszip';
import {
  Download,
  IndianRupee,
  Link as LinkIcon,
  Type,
  Palette,
  Sparkles,
  Check,
  Copy,
  Layers,
  ShieldAlert,
  Sliders,
  Scissors,
  PackageCheck,
  RefreshCw,
} from 'lucide-react';

export function StaticQrBuilder() {
  const [activeTab, setActiveTab] = useState<'url' | 'text' | 'upi'>('url');

  // Basic inputs
  const [urlInput, setUrlInput] = useState('https://github.com');
  const [textInput, setTextInput] = useState('Hello world from OmniQR Free Generator');
  
  // UPI inputs
  const [upiData, setUpiData] = useState({
    pa: 'merchant@upi',
    pn: 'Acme Coffee Store',
    am: '5000.00',
    cu: 'INR',
    tn: 'Bill #8942',
  });

  // UPI Splitter Config
  const [enableSplit, setEnableSplit] = useState(true);
  const [splitMode, setSplitMode] = useState<'cap_2000' | 'by_count'>('cap_2000');
  const [maxCap, setMaxCap] = useState(1999);
  const [splitCount, setSplitCount] = useState(3);
  const [activeSplitIndex, setActiveSplitIndex] = useState(0);

  // Style customization state
  const [darkColor, setDarkColor] = useState('#0f172a');
  const [lightColor, setLightColor] = useState('#ffffff');
  const [dotStyle, setDotStyle] = useState<'square' | 'dots' | 'rounded'>('rounded');
  const [logoOption, setLogoOption] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [downloadingZip, setDownloadingZip] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [qrCodeStyling, setQrCodeStyling] = useState<any>(null);

  // Calculate UPI splits if active tab is upi and enableSplit is true
  const upiSplits: UpiSplitResultItem[] = useMemo(() => {
    if (activeTab !== 'upi' || !enableSplit) return [];
    return calculateUpiSplits(
      { pa: upiData.pa, pn: upiData.pn, tn: upiData.tn, cu: 'INR' },
      {
        enabled: true,
        totalAmount: parseFloat(upiData.am) || 0,
        splitMode,
        maxCapPerQr: maxCap,
        numberOfSplits: splitCount,
      }
    );
  }, [activeTab, enableSplit, upiData, splitMode, maxCap, splitCount]);

  // Compute final raw QR text content based on active tab and split selection
  const qrContent = useMemo(() => {
    if (activeTab === 'url') return urlInput || 'https://example.com';
    if (activeTab === 'text') return textInput || 'Static QR Code';
    if (activeTab === 'upi') {
      if (enableSplit && upiSplits.length > 0) {
        const safeIdx = Math.min(activeSplitIndex, upiSplits.length - 1);
        return upiSplits[safeIdx]?.uri || 'upi://pay?pa=merchant@upi';
      }
      try {
        return buildUpiUri(upiData);
      } catch {
        return 'upi://pay?pa=merchant@upi&pn=Merchant&am=0.00&cu=INR';
      }
    }
    return 'https://example.com';
  }, [activeTab, urlInput, textInput, upiData, enableSplit, upiSplits, activeSplitIndex]);

  // Dynamically initialize client-side qr-code-styling engine
  useEffect(() => {
    let instance: any = null;
    import('qr-code-styling').then((QRCodeStylingModule) => {
      const QRCodeStyling = QRCodeStylingModule.default;
      instance = new QRCodeStyling({
        width: 300,
        height: 300,
        type: 'svg',
        data: qrContent,
        image: logoOption || undefined,
        dotsOptions: {
          color: darkColor,
          type: dotStyle as any,
        },
        backgroundOptions: {
          color: lightColor,
        },
        imageOptions: {
          crossOrigin: 'anonymous',
          margin: 6,
          imageSize: 0.25,
        },
      });

      setQrCodeStyling(instance);

      if (containerRef.current) {
        containerRef.current.innerHTML = '';
        instance.append(containerRef.current);
      }
    });
  }, []);

  // Update QR instance when options change
  useEffect(() => {
    if (qrCodeStyling) {
      qrCodeStyling.update({
        data: qrContent,
        image: logoOption || undefined,
        dotsOptions: {
          color: darkColor,
          type: dotStyle as any,
        },
        backgroundOptions: {
          color: lightColor,
        },
      });
    }
  }, [qrContent, darkColor, lightColor, dotStyle, logoOption, qrCodeStyling]);

  const handleDownload = (ext: 'png' | 'svg') => {
    if (qrCodeStyling) {
      const suffix = activeTab === 'upi' && enableSplit && upiSplits[activeSplitIndex]
        ? `-part${activeSplitIndex + 1}-of-${upiSplits.length}`
        : '';
      qrCodeStyling.download({
        name: `upi-qr-${Date.now()}${suffix}`,
        extension: ext,
      });
    }
  };

  const handleDownloadAllSplitsZip = async () => {
    if (upiSplits.length === 0) return;
    setDownloadingZip(true);
    try {
      const QRCodeStylingModule = await import('qr-code-styling');
      const QRCodeStyling = QRCodeStylingModule.default;
      const zip = new JSZip();
      const folder = zip.folder(`upi_splits_${Date.now()}`);

      for (let i = 0; i < upiSplits.length; i++) {
        const item = upiSplits[i];
        const tempStyling = new QRCodeStyling({
          width: 400,
          height: 400,
          type: 'svg',
          data: item.uri,
          dotsOptions: { color: darkColor, type: dotStyle as any },
          backgroundOptions: { color: lightColor },
        });

        const rawBuffer = await tempStyling.getRawData('svg');
        if (rawBuffer) {
          let svgText = '';
          if (typeof (rawBuffer as any).text === 'function') {
            svgText = await (rawBuffer as Blob).text();
          } else {
            svgText = (rawBuffer as any).toString();
          }
          folder?.file(`qr_part_${item.partIndex}_of_${item.totalParts}_INR_${item.formattedAmount}.svg`, svgText);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `upi_splits_total_INR_${upiData.am}_${Date.now()}.zip`;
      link.click();
    } catch (err) {
      console.error('ZIP generation error:', err);
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleCopyUri = (uri: string, index: number) => {
    navigator.clipboard.writeText(uri);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Configuration Panel */}
      <div className="lg:col-span-7 space-y-6">
        {/* Tier Notice */}
        <div className="p-4 rounded-xl glass-panel border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-emerald-300">Free Tier Static QR Studio</h3>
              <p className="text-xs text-slate-400">NPCI Compliant UPI Generator • Unlimited Scans • No Expiration</p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
            NPCI Spec Ready
          </span>
        </div>

        {/* Tab Selection */}
        <div className="glass-panel p-1.5 rounded-xl flex items-center gap-1 border border-slate-800">
          <button
            onClick={() => setActiveTab('url')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'url' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>Website URL</span>
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'text' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>Plain Text</span>
          </button>
          <button
            onClick={() => setActiveTab('upi')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'upi' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <IndianRupee className="w-4 h-4" />
            <span>UPI Payment & Splitter</span>
          </button>
        </div>

        {/* Input Form Fields */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          {activeTab === 'url' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Destination Website URL
              </label>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://yourwebsite.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm font-mono"
              />
            </div>
          )}

          {activeTab === 'text' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Text / Message Content
              </label>
              <textarea
                rows={4}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Enter text or credentials..."
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm"
              />
            </div>
          )}

          {activeTab === 'upi' && (
            <div className="space-y-5">
              {/* Basic VPA Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Payee VPA Address *
                  </label>
                  <input
                    type="text"
                    value={upiData.pa}
                    onChange={(e) => setUpiData({ ...upiData, pa: e.target.value })}
                    placeholder="merchant@upi"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm font-mono focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Payee Name *
                  </label>
                  <input
                    type="text"
                    value={upiData.pn}
                    onChange={(e) => setUpiData({ ...upiData, pn: e.target.value })}
                    placeholder="Store / Person Name"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Smart Amount Splitter Toggle */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-emerald-400" />
                    <div>
                      <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                        UPI Smart Amount Splitter
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Bypass NPCI interchange charges on amounts above ₹2,000 by splitting into sub-₹2,000 QRs.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableSplit}
                      onChange={(e) => setEnableSplit(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {enableSplit ? (
                  <div className="space-y-4 pt-2 border-t border-slate-800">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                          Total Amount to Collect (INR) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          max="10000000"
                          value={upiData.am}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (isNaN(val) || val < 0.01) {
                              setUpiData({ ...upiData, am: '0.01' });
                            } else if (val > 10000000) {
                              setUpiData({ ...upiData, am: '10000000' });
                            } else {
                              setUpiData({ ...upiData, am: e.target.value });
                            }
                          }}
                          placeholder="5000.00"
                          className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-emerald-400 font-mono font-bold text-sm focus:border-emerald-500"
                        />
                        <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-between font-mono">
                          <span>Range: ₹0.01 to ₹1,00,00,000 (1 Crore)</span>
                          {parseFloat(upiData.am) < 0.01 && (
                            <span className="text-rose-400 font-bold px-1.5 py-0.2 rounded bg-rose-500/10 border border-rose-500/20">
                              Min ₹0.01 Required
                            </span>
                          )}
                          {parseFloat(upiData.am) >= 10000000 && (
                            <span className="text-amber-400 font-bold px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20">
                              Capped at 1 Crore
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                          Base Reference / Note
                        </label>
                        <input
                          type="text"
                          value={upiData.tn}
                          onChange={(e) => setUpiData({ ...upiData, tn: e.target.value })}
                          placeholder="Bill #8942"
                          className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Split Strategy Choice */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Split Strategy</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setSplitMode('cap_2000')}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            splitMode === 'cap_2000'
                              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <div className="text-xs font-bold flex items-center justify-between">
                            <span>Auto-Cap ≤ ₹1,999 / QR</span>
                            <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                          </div>
                          <div className="text-[11px] opacity-80 mt-1">
                            Calculates minimum zero-fee QRs under the ₹2,000 threshold.
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSplitMode('by_count')}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            splitMode === 'by_count'
                              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <div className="text-xs font-bold flex items-center justify-between">
                            <span>Divide into N QRs</span>
                            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                          </div>
                          <div className="text-[11px] opacity-80 mt-1">
                            Splits amount equally into your specified number of QRs.
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Mode Config Parameters */}
                    {splitMode === 'cap_2000' && (
                      <div className="flex items-center gap-3">
                        <label className="text-xs text-slate-400 whitespace-nowrap">Max Amount Cap Per QR:</label>
                        <input
                          type="number"
                          value={maxCap}
                          onChange={(e) => setMaxCap(parseFloat(e.target.value) || 1999)}
                          className="w-28 px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-xs font-mono text-emerald-400 font-bold"
                        />
                        <span className="text-[11px] text-slate-500">(NPCI interchange threshold: ₹2,000)</span>
                      </div>
                    )}

                    {splitMode === 'by_count' && (
                      <div className="flex items-center gap-3">
                        <label className="text-xs text-slate-400 whitespace-nowrap">Number of Split QRs to Generate:</label>
                        <input
                          type="number"
                          min="2"
                          max="10"
                          value={splitCount}
                          onChange={(e) => setSplitCount(parseInt(e.target.value) || 2)}
                          className="w-24 px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-xs font-mono text-emerald-400 font-bold"
                        />
                      </div>
                    )}

                    {/* Split Items List Preview */}
                    {upiSplits.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                          <span>
                            Generated {upiSplits.length} Zero-Fee Split QRs (Total ₹{parseFloat(upiData.am || '0').toLocaleString('en-IN')})
                          </span>
                          <span className="text-[11px] font-mono text-emerald-400">NPCI Compliant</span>
                        </div>

                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {upiSplits.map((item, idx) => (
                            <div
                              key={idx}
                              onClick={() => setActiveSplitIndex(idx)}
                              className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                                activeSplitIndex === idx
                                  ? 'bg-emerald-500/20 border-emerald-500 text-white'
                                  : 'bg-slate-950 border-slate-800/80 text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center justify-center font-mono">
                                  {item.partIndex}
                                </span>
                                <div>
                                  <div className="font-bold text-emerald-400 font-mono">₹{item.formattedAmount}</div>
                                  <div className="text-[10px] text-slate-400">{item.note}</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {activeSplitIndex === idx && (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500 text-white font-bold">
                                    Previewing
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyUri(item.uri, idx);
                                  }}
                                  className="p-1 rounded bg-slate-900 text-slate-400 hover:text-white"
                                  title="Copy UPI URI"
                                >
                                  {copiedIndex === idx ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        Amount (INR)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max="10000000"
                        value={upiData.am}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (isNaN(val) || val < 0.01) {
                            setUpiData({ ...upiData, am: '0.01' });
                          } else if (val > 10000000) {
                            setUpiData({ ...upiData, am: '10000000' });
                          } else {
                            setUpiData({ ...upiData, am: e.target.value });
                          }
                        }}
                        placeholder="250.00"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm font-mono focus:border-emerald-500"
                      />
                      <p className="text-[10px] text-slate-400 mt-1 font-mono flex items-center justify-between">
                        <span>Range: ₹0.01 to ₹1,00,00,000 (1 Crore)</span>
                        {parseFloat(upiData.am) < 0.01 && (
                          <span className="text-rose-400 font-bold px-1 py-0.2 rounded bg-rose-500/10 border border-rose-500/20">
                            Min ₹0.01
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        Payment Note / Ref
                      </label>
                      <input
                        type="text"
                        value={upiData.tn}
                        onChange={(e) => setUpiData({ ...upiData, tn: e.target.value })}
                        placeholder="Bill reference or note"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Visual Customizer Panel */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <Palette className="w-4 h-4 text-sky-400" />
            <span>Design & Color Customization</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Foreground Color</label>
              <div className="flex items-center gap-3 bg-slate-900 p-2 rounded-lg border border-slate-800">
                <input
                  type="color"
                  value={darkColor}
                  onChange={(e) => setDarkColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                />
                <span className="font-mono text-sm text-slate-200">{darkColor}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Background Color</label>
              <div className="flex items-center gap-3 bg-slate-900 p-2 rounded-lg border border-slate-800">
                <input
                  type="color"
                  value={lightColor}
                  onChange={(e) => setLightColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                />
                <span className="font-mono text-sm text-slate-200">{lightColor}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">QR Module Pattern</label>
            <div className="grid grid-cols-3 gap-2">
              {(['rounded', 'dots', 'square'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => setDotStyle(style)}
                  className={`py-2 rounded-lg text-xs font-medium capitalize border transition-all ${
                    dotStyle === style
                      ? 'bg-sky-500/20 border-sky-500 text-sky-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Preview & Export Panel */}
      <div className="lg:col-span-5 sticky top-24 space-y-4">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-5">
          <div className="text-center">
            <h3 className="text-lg font-bold text-white">Live QR Vector Preview</h3>
            <p className="text-xs text-slate-400">High-precision SVG vector canvas rendering</p>
          </div>

          {/* Split Parts Selector Header */}
          {activeTab === 'upi' && enableSplit && upiSplits.length > 0 && (
            <div className="w-full bg-slate-900/90 p-2 rounded-xl border border-emerald-500/30 text-center space-y-2">
              <div className="text-xs font-semibold text-emerald-300">
                Showing QR {activeSplitIndex + 1} of {upiSplits.length}: ₹{upiSplits[activeSplitIndex]?.formattedAmount}
              </div>
              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                {upiSplits.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSplitIndex(idx)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                      activeSplitIndex === idx
                        ? 'bg-emerald-500 text-white shadow'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Part {idx + 1} (₹{item.formattedAmount})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* QR Canvas Container */}
          <div className="p-6 rounded-2xl bg-white shadow-2xl border border-slate-200 flex items-center justify-center min-h-[320px]">
            <div ref={containerRef} className="flex items-center justify-center"></div>
          </div>

          {/* Action Download Buttons */}
          <div className="w-full space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleDownload('png')}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-all border border-slate-700"
              >
                <Download className="w-4 h-4 text-sky-400" />
                <span>PNG {activeTab === 'upi' && enableSplit ? `(Part ${activeSplitIndex + 1})` : ''}</span>
              </button>
              <button
                onClick={() => handleDownload('svg')}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl gradient-button text-white font-medium text-sm transition-all shadow-lg"
              >
                <Download className="w-4 h-4 text-white" />
                <span>SVG {activeTab === 'upi' && enableSplit ? `(Part ${activeSplitIndex + 1})` : ''}</span>
              </button>
            </div>

            {/* Batch ZIP Export for Split QRs */}
            {activeTab === 'upi' && enableSplit && upiSplits.length > 1 && (
              <button
                onClick={handleDownloadAllSplitsZip}
                disabled={downloadingZip}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl border border-emerald-400/30 transition-all"
              >
                {downloadingZip ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <PackageCheck className="w-4 h-4 text-emerald-200" />
                )}
                <span>Download All {upiSplits.length} Split QRs (.ZIP)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
