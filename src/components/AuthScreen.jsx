import React, { useState } from 'react';
import {
  ArrowRight,
  Users,
  Sparkles,
  GitBranch,
  BookmarkCheck,
  Mail,
  Copy,
  Check,
  AlertTriangle
} from 'lucide-react';
import { api, setStoredToken } from '../services/api.js';
import { SceneryBg } from './SceneryBg.jsx';
import { LegaciumLogo } from './LegaciumLogo.jsx';

export function AuthScreen({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const DEMO_EMAIL = 'kurniawan.angang2005@gmail.com';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.login(email, password);
      setStoredToken(res.token);
      onSuccess(res.user);
    } catch (err) {
      const rawMsg = err?.message || err?.error || err;
      let displayMsg = 'Gagal masuk.';
      if (typeof rawMsg === 'string' && rawMsg !== '[object Object]') {
        displayMsg = rawMsg;
      } else if (typeof rawMsg === 'object' && rawMsg !== null) {
        displayMsg = rawMsg.message || rawMsg.error || JSON.stringify(rawMsg);
      }
      setError(displayMsg);
    } finally {
      setLoading(false);
    }
  }

  function handleCopyEmail() {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(DEMO_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  }

  const highlights = [
    {
      icon: Users,
      title: 'Meja Bundar Lintas Era (2–4 Tokoh 3D)',
      desc: 'Pertemukan hingga 4 tokoh dunia berbeda bidang untuk diskusi berantai & sintesis.'
    },
    {
      icon: Sparkles,
      title: 'Kolaborasi Wajib Lintas Disiplin STEAM',
      desc: 'World Quest global menuntut sinergi Fisika, Kimia, Biologi, Arsitektur, Matematika & Dirgantara.'
    },
    {
      icon: GitBranch,
      title: 'Pohon Sejarah Kolektif (Tech Tree)',
      desc: 'Setiap kontribusi peneliti ikut membuka era baru & tercatat permanen bersama komunitas.'
    },
    {
      icon: BookmarkCheck,
      title: 'Memori Kolaborasi Berkelanjutan',
      desc: 'Catatan riset dan temuanmu tersimpan rapi di database sehingga tokoh 3D mengingat progresmu lintas sesi.'
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 relative">
      <SceneryBg />
      <div className="w-full max-w-[420px] lg:max-w-[960px] grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
        {/* Panel Showcase Desktop (tersembunyi di mobile kecil agar ringkas) */}
        <div className="hidden lg:block lg:col-span-6 space-y-5">
          <LegaciumLogo size="lg" showWordmark subtitle="ERA 01 · SEASON GENESIS" />
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-[#0F242D] leading-tight">
              Bangun Kota Riset Bersama Gema Memori 3D Tokoh Dunia
            </h1>
            <p className="text-sm font-semibold text-slate-600 leading-relaxed">
              Platform kolaborasi riset STEAM interaktif berbasis Google Gemini AI dengan karakter
              3D tokoh sejarah dan Pohon Sejarah kolektif.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {highlights.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="neo-card p-3.5 bg-white/95 space-y-1.5">
                  <div className="w-9 h-9 rounded-xl bg-[#F7C948] border-[2px] border-[#0F242D] flex items-center justify-center">
                    <Icon size={18} />
                  </div>
                  <p className="text-xs font-extrabold">{item.title}</p>
                  <p className="text-[11px] font-semibold text-slate-600 leading-snug">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Kartu Login Utama */}
        <div className="lg:col-span-6 w-full max-w-[440px] mx-auto">
          <div className="mb-5 lg:hidden">
            <LegaciumLogo size="md" showWordmark subtitle="ERA 01 · SEASON GENESIS" />
          </div>

          <div className="neo-card p-5 md:p-6">
            <div className="mb-4">
              <h2 className="text-lg font-extrabold text-[#0F242D]">Masuk ke Kota Lab</h2>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Gunakan akun yang telah didaftarkan oleh Admin.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wide mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@legacium.app"
                  className="neo-input"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wide mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="neo-input"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border-[2px] border-red-500 text-red-700 text-xs font-bold">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full neo-btn-dark justify-center py-3 text-sm mt-2 disabled:opacity-60"
              >
                <span>{loading ? 'Memproses...' : 'Masuk ke Kota Lab'}</span>
                <ArrowRight size={17} />
              </button>
            </form>

            <div className="mt-4 p-3 rounded-2xl bg-[#FFFBEB] border-[2px] border-[#0F242D] flex items-start gap-2.5">
              <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600" />
              <div className="text-[11px] leading-snug text-[#0F242D]">
                <p className="font-extrabold uppercase tracking-wide text-amber-900 text-[10px]">
                  Pemberitahuan Kecerdasan Buatan (AI)
                </p>
                <p className="font-semibold text-slate-700 mt-0.5">
                  Percakapan dan sintesis di platform ini dilakukan dengan menggunakan AI, sehingga terdapat kemungkinan melakukan kesalahan. Harap <strong>verifikasi kembali hasilnya</strong>. Terima kasih.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t-2 border-dashed border-slate-200">
              <div className="p-3.5 rounded-2xl bg-[#FEF3C7] border-[2px] border-[#0F242D] space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#F7C948] border-[2px] border-[#0F242D] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Mail size={16} className="text-[#0F242D]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                      Akses Akun Demo
                    </p>
                    <p className="text-xs font-bold text-[#0F242D] leading-snug mt-0.5">
                      Untuk demo minta akun ke{' '}
                      <a
                        href={`mailto:${DEMO_EMAIL}?subject=Permintaan%20Akun%20Demo%20Legacium`}
                        className="font-extrabold text-[#0E6BA8] underline hover:text-[#094770] break-all"
                      >
                        {DEMO_EMAIL}
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <a
                    href={`mailto:${DEMO_EMAIL}?subject=Permintaan%20Akun%20Demo%20Legacium`}
                    className="flex-1 neo-btn bg-white py-1.5 px-3 text-xs font-bold text-center justify-center flex items-center gap-1.5 hover:bg-slate-50 transition-colors"
                  >
                    <Mail size={13} />
                    <span>Kirim Email</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="neo-btn bg-white py-1.5 px-3 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50 transition-colors"
                    title="Salin alamat email demo"
                  >
                    {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    <span>{copied ? 'Tersalin!' : 'Salin Email'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
