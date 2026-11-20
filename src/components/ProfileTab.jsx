import React from 'react';
import {
  ShieldCheck,
  LogOut,
  CheckCircle2,
  Award,
  Database,
  Sparkles
} from 'lucide-react';
import { getFieldMeta } from '../data/fields.js';
import { getBackendMode } from '../services/api.js';
import { LegaciumLogo } from './LegaciumLogo.jsx';

export function ProfileTab({
  user,
  myContributions,
  onOpenAdmin,
  onLogout
}) {
  const fieldMeta = getFieldMeta(user.specialty_field);
  const backendMode = getBackendMode();

  return (
    <div className="space-y-4 pb-28 md:pb-10">
      <div className="pt-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="md:hidden">
            <LegaciumLogo size="sm" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Identitas Peneliti &amp; Kota Riset
            </p>
            <h1 className="text-[22px] md:text-[26px] font-extrabold text-[#0F242D] leading-tight">
              Profil Kota Lab
            </h1>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full border-[2px] border-[#0F242D] text-xs font-extrabold uppercase ${
            user.role === 'admin' ? 'bg-[#F7C948]' : 'bg-[#9AD1F5]'
          }`}
        >
          Role: {user.role}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-5 space-y-4">
          {/* Kartu Identitas */}
          <div className="neo-card p-4 bg-white space-y-3.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold">{user.name}</h2>
                <p className="text-xs font-bold text-slate-500">{user.email}</p>
                <p className="text-xs font-extrabold text-[#0E6BA8] mt-1">
                  {user.city_name} · Bidang {fieldMeta.label}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 rounded-xl bg-[#F7C948] border-[2px] border-[#0F242D] text-xs font-extrabold">
                  Level {user.city_level}
                </span>
                <p className="text-xs font-extrabold mt-1">{user.research_points} Research Pts</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#EEF8FA] border-[2px] border-[#0F242D] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[#0E6BA8]" />
                <div>
                  <p className="text-[10px] font-extrabold uppercase text-slate-500">
                    Total Blueprint Riset
                  </p>
                  <p className="text-sm font-extrabold">{myContributions.length} Kontribusi Tercatat</p>
                </div>
              </div>
              <span
                className="text-[11px] font-extrabold px-2.5 py-1 rounded-xl border border-[#0F242D]"
                style={{ backgroundColor: fieldMeta.badgeBg }}
              >
                {fieldMeta.label}
              </span>
            </div>

            {/* Tombol Khusus Admin */}
            {user.role === 'admin' && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="w-full neo-btn bg-[#F7C948] py-3 px-4 text-sm flex items-center justify-center gap-2"
              >
                <ShieldCheck size={18} />
                <span>Buka Panel Admin (Gemini, Tokoh &amp; User)</span>
              </button>
            )}
          </div>

          {/* Info Status Backend */}
          <div className="neo-card p-3.5 bg-[#E5F5F1] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold">
              <Database size={16} />
              <span>
                Engine Sistem: <strong>Pure JavaScript (Client-Side &amp; Gemini AI)</strong>
              </span>
            </div>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={onLogout}
            className="w-full neo-btn bg-white py-3 text-sm text-red-700 flex items-center justify-center gap-2"
          >
            <LogOut size={17} />
            <span>Keluar Akun</span>
          </button>
        </div>

        {/* KOLOM KANAN: Koleksi Blueprint & Kontribusi Riset */}
        <div className="lg:col-span-7 neo-card p-4 bg-white space-y-2.5">
          <h3 className="text-sm font-extrabold flex items-center gap-1.5">
            <Award size={16} className="text-[#E55827]" />
            Arsip Blueprint &amp; Kontribusimu ({myContributions.length})
          </h3>
          {myContributions.length === 0 ? (
            <p className="text-xs font-semibold text-slate-500">
              Belum ada blueprint tercatat. Bergabunglah di tab <strong>Quest</strong> atau{' '}
              <strong>Meja Bundar</strong> untuk berkontribusi lintas disiplin!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {myContributions.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-2xl bg-[#EEF8FA] border-[2px] border-[#0F242D] space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-extrabold">{c.discovery_title}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 shrink-0">
                      <CheckCircle2 size={12} /> +{c.points_added} pts
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-600">{c.quest_title}</p>
                  <p className="text-[10px] font-bold text-[#0E6BA8]">
                    Bidang: {getFieldMeta(c.field).label}
                    {c.secondary_field ? ` + ${getFieldMeta(c.secondary_field).label}` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
