'use client';

import React, { useState, useEffect, useRef } from 'react';
import { buildUpiUri } from '@/lib/upi-schema';
import { Download, IndianRupee, Link as LinkIcon, Type, Palette, Image as ImageIcon, Sparkles, Check, Copy } from 'lucide-react';

export function StaticQrBuilder() {
  const [activeTab, setActiveTab] = useState<'url' | 'text' | 'upi'>('url');
  
  // Data inputs
  const [urlInput, setUrlInput] = useState('https://github.com');
  const [textInput, setTextInput] = useState('Hello world from OmniQR Free Generator');
  const [upiData, setUpiData] = useState({
    pa: 'merchant@upi',
    pn: 'Acme Coffee Store',
    am: '250.00',
    cu: 'INR',
    tn: 'Order #8942',
  });

  // Style customization state
  const [darkColor, setDarkColor] = useState('#0f172a');
  const [lightColor, setLightColor] = useState('#ffffff');
  const [dotStyle, setDotStyle] = useState<'square' | 'dots' | 'rounded'>('rounded');
  const [logoOption, setLogoOption] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [qrCodeStyling, setQrCodeStyling] = useState<any>(null);

  // Compute final raw QR text content based on active tab
  const qrContent = React.useMemo(() => {
    if (activeTab === 'url') return urlInput || 'https://example.com';
    if (activeTab === 'text') return textInput || 'Static QR Code';
    if (activeTab === 'upi') {
      try {
        return buildUpiUri(upiData);
      } catch {
        return 'upi://pay?pa=merchant@upi&pn=Merchant&am=0.00&cu=INR';
      }
    }
    return 'https://example.com';
  }, [activeTab, urlInput, textInput, upiData]);

  // Dynamically initialize client-side qr-code-styling engine
  useEffect(() => {
    let instance: any = null;
    import('qr-code-styling').then((QRCodeStylingModule) => {
      const QRCodeStyling = QRCodeStylingModule.default;
      instance = new QRCodeStyling({
        width: 320,
        height: 320,
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
      qrCodeStyling.download({
        name: `static-qr-${Date.now()}`,
        extension: ext,
      });
    }
  };

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(qrContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              <p className="text-xs text-slate-400">100% Client-Side Engine • Unlimited Scans • No Expiration</p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
            client-side SVG
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
            <span>UPI Payment</span>
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
            <div className="space-y-4">
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Amount (INR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={upiData.am}
                    onChange={(e) => setUpiData({ ...upiData, am: e.target.value })}
                    placeholder="250.00"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm font-mono focus:border-emerald-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Payment Note / Ref
                  </label>
                  <input
                    type="text"
                    value={upiData.tn}
                    onChange={(e) => setUpiData({ ...upiData, tn: e.target.value })}
                    placeholder="Bill reference or note"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Encoded UPI standard schema string display */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono text-emerald-400">
                <span className="truncate max-w-[80%]">{qrContent}</span>
                <button
                  onClick={handleCopyRaw}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
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
            {/* Dark Color */}
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

            {/* Light Color */}
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

          {/* Module / Dot Style selector */}
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
      <div className="lg:col-span-5 sticky top-24">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-bold text-white">Live QR Vector Preview</h3>
            <p className="text-xs text-slate-400">High-precision SVG vector canvas rendering</p>
          </div>

          {/* QR Container */}
          <div className="p-6 rounded-2xl bg-white shadow-2xl border border-slate-200 flex items-center justify-center min-h-[340px]">
            <div ref={containerRef} className="flex items-center justify-center"></div>
          </div>

          {/* Action Download Buttons */}
          <div className="w-full grid grid-cols-2 gap-3">
            <button
              onClick={() => handleDownload('png')}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-all border border-slate-700"
            >
              <Download className="w-4 h-4 text-sky-400" />
              <span>Download PNG</span>
            </button>
            <button
              onClick={() => handleDownload('svg')}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl gradient-button text-white font-medium text-sm transition-all shadow-lg"
            >
              <Download className="w-4 h-4 text-white" />
              <span>Download SVG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
