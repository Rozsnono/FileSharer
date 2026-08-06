"use client";
import { useState } from 'react';
import { Copy, ArrowRight, ShieldCheck, Clock, Zap, Check, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [mode, setMode] = useState<'SENDER' | 'RECEIVER'>('SENDER');
  const [expiry, setExpiry] = useState(24);
  const [generatedLink, setGeneratedLink] = useState('');
  const [linkId, setLinkId] = useState(''); // Store ID separately for internal navigation
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateLink = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        body: JSON.stringify({ mode, expiryHours: expiry }),
      });
      const data = await res.json();
      setGeneratedLink(`${window.location.origin}/${data.linkId}`);
      setLinkId(data.linkId);
    } catch (err) {
      alert("Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="max-w-4xl w-full grid md:grid-cols-2 bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100">

        {/* Left Branding Panel */}
        <div className="bg-slate-900 p-10 md:p-14 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Abstract decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Zap className="w-6 h-6 fill-white text-white" />
              </div>
              <span className="text-2xl font-black tracking-tighter italic">VAULT</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black leading-[1.1] mb-6">
              The professional way to <span className="text-indigo-400 text-glow">move files.</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-xs">
              Secure, temporary file bridging between you and your remote NAS.
            </p>
          </div>

          <div className="space-y-5 relative z-10">
            <div className="flex items-center gap-4 text-sm font-bold text-slate-300">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
              </div>
              50-Character Secure Hash
            </div>
            <div className="flex items-center gap-4 text-sm font-bold text-slate-300">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                <Clock className="w-4 h-4 text-indigo-400" />
              </div>
              Auto-Destruction Enabled
            </div>
          </div>
        </div>

        {/* Right Interaction Panel */}
        <div className="p-10 md:p-14 flex flex-col justify-center">
          {!generatedLink ? (
            <div className="space-y-8 animate-in fade-in duration-500">
              <header>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Create a Bridge</h2>
                <p className="text-slate-400 font-medium">Configure your temporary transfer link.</p>
              </header>

              {/* Mode Toggle */}
              <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1">
                <button
                  onClick={() => setMode('SENDER')}
                  className={`flex-1 py-4 px-4 rounded-[1.1rem] text-sm font-black transition-all ${mode === 'SENDER' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                  SEND FILES
                </button>
                <button
                  onClick={() => setMode('RECEIVER')}
                  className={`flex-1 py-4 px-4 rounded-[1.1rem] text-sm font-black transition-all ${mode === 'RECEIVER' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                  RECEIVE FILES
                </button>
              </div>

              {/* Expiry Input */}
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="flex justify-between mb-4">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Expiration</label>
                  <span className="text-sm font-bold text-indigo-600">{expiry} Hours</span>
                </div>
                <input
                  type="range" min="1" max="168" value={expiry}
                  onChange={(e) => setExpiry(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-300 uppercase">
                  <span>1 Hour</span>
                  <span>1 Week</span>
                </div>
              </div>

              <button
                onClick={generateLink}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-100 group"
              >
                {loading ? "GENERATING..." : (
                  <>GENERATE SECURE LINK <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-8 animate-in zoom-in-95 duration-500">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-50 text-green-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Link Ready</h2>
                <p className="text-slate-400 font-medium mt-1">Your secure bridge has been created.</p>
              </div>

              <div className="space-y-3">
                {/* Link Display/Copy Box */}
                <div className="group relative">
                  <div className="p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl pr-14">
                    <p className="text-[10px] uppercase font-black text-slate-400 mb-1 tracking-widest">Public URL</p>
                    <p className="text-sm font-mono text-slate-600 break-all leading-relaxed">
                      {generatedLink}
                    </p>
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:bg-indigo-50 hover:border-indigo-100 transition-all active:scale-90"
                  >
                    {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-slate-400" />}
                  </button>
                </div>

                {/* THE NEW "OPEN" BUTTON */}
                <Link
                  href={`/${linkId}`}
                  className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-3 transition-all shadow-xl shadow-slate-200 group"
                >
                  ENTER VAULT <ExternalLink className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </Link>

                <button
                  onClick={() => setGeneratedLink('')}
                  className="w-full py-4 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors"
                >
                  Create another link
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}