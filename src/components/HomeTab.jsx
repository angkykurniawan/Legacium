import React, { useState } from 'react';
import {
  Search,
  MapPin,
  Bell,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  FlaskConical,
  Cpu,
  Users,
  Map
} from 'lucide-react';
import { RESEARCH_FIELDS, getFieldMeta } from '../data/fields.js';
import { FieldIcon } from './FieldIcon.jsx';
import { LegaciumLogo } from './LegaciumLogo.jsx';

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 18) return 'Selamat sore';
  return 'Selamat malam';
}

export function HomeTab({
  user,
  meta,
  fields = RESEARCH_FIELDS,
  mentors,
  quests,
  onSelectField,
  onSelectMentor,
  onOpenQuest,
  onOpenRoundtable,
  onOpenWorld,
  onOpenAdmin
}) {
  const [search, setSearch] = useState('');
  const [questIdx, setQuestIdx] = useState(0);

  const activeQuests = quests.length > 0 ? quests : [];
  const featuredQuest = activeQuests[questIdx] || activeQuests[0] || null;

  const filteredMentors = search.trim()
    ? mentors.filter(
        (m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.field.toLowerCase().includes(search.toLowerCase()) ||
          (m.specialty || '').toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <div className="space-y-5 pb-28 md:pb-10">
      {/* Header Atas (Identik dengan referensi UI + Logo Resmi Legacium) */}
      <header className="flex items-start justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <div className="md:hidden">
            <LegaciumLogo size="md" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              {meta.season || 'ERA 01 · SEASON GENESIS'}
            </p>
            <h1 className="text-[22px] md:text-[26px] font-extrabold text-[#0F242D] leading-tight">
              {getTimeGreeting()}, {user.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {user.role === 'admin' && (
            <button
              type="button"
              onClick={onOpenAdmin}
              title="Panel Admin"
              className="h-11 px-3 rounded-full bg-[#F7C948] border-[2.5px] border-[#0F242D] shadow-neo-sm flex items-center gap-1 text-xs font-extrabold active:translate-y-[1px]"
            >
              <ShieldCheck size={16} />
              <span>Admin</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onOpenQuest(featuredQuest)}
            title="Status World Quest"
            className="w-11 h-11 rounded-full bg-white border-[2.5px] border-[#0F242D] shadow-neo-sm flex items-center justify-center relative active:translate-y-[1px]"
          >
            <Bell size={19} strokeWidth={2.3} />
            <span className="w-2.5 h-2.5 rounded-full bg-[#E55827] border border-[#0F242D] absolute top-2 right-2.5" />
          </button>
        </div>
      </header>

      {/* Banner Cepat Masuk Dunia 3D Open World */}
      {onOpenWorld && (
        <button
          type="button"
          onClick={onOpenWorld}
          className="w-full text-left neo-card bg-[#66D7C5] p-3.5 md:p-4 flex items-center justify-between gap-3 active:translate-y-[2px] transition"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-white border-[2.5px] border-[#0F242D] flex items-center justify-center shrink-0">
              <Map size={21} strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#0F242D]/75">
                Mode Eksplorasi Bebas · WASD / Joystick
              </p>
              <p className="text-sm md:text-base font-extrabold text-[#0F242D] leading-tight">
                Masuk Kota Riset 3D (Open World)
              </p>
            </div>
          </div>
          <span className="neo-btn-dark text-xs py-2 px-3.5 shrink-0">
            <span>Jalan 3D</span>
            <ArrowRight size={14} />
          </span>
        </button>
      )}

      {/* Search & Server Bar */}
      <div className="neo-card rounded-[20px] p-2 flex items-center gap-2.5 bg-white">
        <div className="w-10 h-10 rounded-xl bg-[#F7C948] border-[2px] border-[#0F242D] flex items-center justify-center shrink-0">
          <Search size={19} strokeWidth={2.5} />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari tokoh atau riset hari ini?"
          className="flex-1 bg-transparent text-sm font-semibold text-[#0F242D] placeholder:text-slate-400 focus:outline-none min-w-0"
        />
        <div className="flex items-center gap-1 pr-2 text-xs font-extrabold text-[#0F242D] shrink-0">
          <MapPin size={14} strokeWidth={2.5} />
          <span>{meta.server_location || 'Kota Lab #01'}</span>
        </div>
      </div>

      {/* Hasil Pencarian Cepat Tokoh */}
      {search.trim() !== '' && (
        <div className="neo-card p-3.5 space-y-2 bg-white">
          <p className="text-xs font-extrabold uppercase text-slate-500">
            Hasil Pencarian Tokoh ({filteredMentors.length})
          </p>
          {filteredMentors.length === 0 ? (
            <p className="text-xs font-semibold text-slate-500">
              Tidak ditemukan tokoh dengan kata kunci &ldquo;{search}&rdquo;.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredMentors.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onSelectMentor(m)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border-[2px] border-[#0F242D] bg-[#EEF8FA] hover:bg-[#F7C948]/30 text-left"
                >
                  <div>
                    <p className="text-sm font-extrabold">{m.name}</p>
                    <p className="text-xs font-semibold text-slate-600">
                      {getFieldMeta(m.field).label} · {m.specialty}
                    </p>
                  </div>
                  <ArrowRight size={16} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Grid Responsif 2 Kolom di Desktop (Mobile tetap 1 kolom identik referensi) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* KOLOM KIRI: Bidang Riset 3x2 + Meja Bundar Lintas Era */}
        <div className="lg:col-span-7 space-y-6">
          <section className="md:neo-card md:p-5 md:bg-white/85">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[19px] font-extrabold text-[#0F242D]">Bidang Riset</h2>
              <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-white border-[2px] border-[#0F242D]">
                {mentors.length} Gema Tokoh 3D
              </span>
            </div>

            <div className="grid grid-cols-3 gap-y-5 gap-x-3">
              {fields.map((field) => (
                <button
                  key={field.id}
                  type="button"
                  onClick={() => onSelectField(field.id)}
                  className="flex flex-col items-center group"
                >
                  <div
                    className="w-[78px] h-[78px] md:w-[86px] md:h-[86px] neo-tile flex items-center justify-center group-hover:-translate-y-0.5 transition-transform"
                    style={{ backgroundColor: field.bgColor }}
                  >
                    <FieldIcon
                      field={field.id}
                      iconName={field.iconName}
                      size={34}
                      color={field.iconColor}
                      strokeWidth={2.3}
                    />
                  </div>
                  <span className="mt-2 text-[13px] font-extrabold text-[#0F242D] tracking-tight text-center">
                    {field.label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Fitur Ciri Khas: Meja Bundar Lintas Era (2–4 Tokoh 3D) */}
          <section>
            <button
              type="button"
              onClick={onOpenRoundtable}
              className="w-full text-left neo-card bg-[#F7C948] p-4 md:p-5 flex items-center justify-between gap-3 active:translate-y-[2px] transition"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-white border-[2.5px] border-[#0F242D] flex items-center justify-center shrink-0">
                  <Users size={22} strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white border border-[#0F242D]">
                    Ciri Khas Legacium · 2–4 Tokoh 3D
                  </span>
                  <h3 className="text-[16px] font-extrabold text-[#0F242D] mt-1 leading-tight">
                    Meja Bundar Lintas Era
                  </h3>
                  <p className="text-xs font-semibold text-[#183846] mt-0.5">
                    Pilih 2 hingga 4 tokoh berbeda bidang (mis. Marie Curie × B.J. Habibie ×
                    Einstein) untuk sintesis STEAM!
                  </p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#0F242D] text-white flex items-center justify-center shrink-0">
                <ArrowRight size={17} />
              </div>
            </button>
          </section>
        </div>

        {/* KOLOM KANAN: World Quest Aktif + Status Kota + Pintasan Tokoh */}
        <div className="lg:col-span-5 space-y-5">
          {featuredQuest && (
            <section>
              <div className="neo-card bg-[#A8D8F5] p-5 relative overflow-hidden">
                <div className="pointer-events-none absolute -right-3 -bottom-4 opacity-15">
                  <FlaskConical size={110} strokeWidth={2} />
                </div>

                <div className="flex items-start gap-3.5 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-white border-[2.5px] border-[#0F242D] flex items-center justify-center shrink-0">
                    <Sparkles size={22} strokeWidth={2.3} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/90 border border-[#0F242D] mb-1">
                      World Quest · {featuredQuest.season_code}
                    </span>
                    <h3 className="text-[18px] font-extrabold text-[#0F242D] leading-snug">
                      {featuredQuest.title}
                    </h3>
                    <p className="text-[13px] font-semibold text-[#183846] mt-1 leading-relaxed">
                      {featuredQuest.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {Object.entries(featuredQuest.required_fields || {}).map(([fKey, target]) => {
                        const val = featuredQuest.progress?.[fKey] || 0;
                        const pct = Math.min(100, Math.round((val / target) * 100));
                        return (
                          <span
                            key={fKey}
                            className="text-[11px] font-extrabold px-2 py-0.5 rounded-lg bg-white/90 border-[1.5px] border-[#0F242D]"
                          >
                            {getFieldMeta(fKey).label} {pct}%
                          </span>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenQuest(featuredQuest)}
                      className="neo-btn-dark mt-4 text-sm"
                    >
                      <span>Gabung Riset</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {activeQuests.length > 1 && (
                <div className="flex items-center justify-center gap-2 mt-3.5">
                  {activeQuests.map((q, i) => (
                    <button
                      key={q.id}
                      type="button"
                      aria-label={`Pilih World Quest ${q.title}`}
                      onClick={() => setQuestIdx(i)}
                      className={`h-2.5 rounded-full transition-all border-[1.8px] border-[#0F242D] ${
                        i === questIdx ? 'w-7 bg-[#0F242D]' : 'w-2.5 bg-transparent'
                      }`}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Status Kota Riset & AI */}
          <section className="grid grid-cols-2 gap-3">
            <div className="neo-card p-3.5 bg-white">
              <p className="text-[11px] font-extrabold uppercase text-slate-500">Kota Risetmu</p>
              <p className="text-sm font-extrabold mt-0.5 truncate">{user.city_name}</p>
              <div className="mt-2 flex items-center justify-between text-xs font-bold">
                <span className="px-2 py-0.5 rounded-lg bg-[#F7C948] border-[1.5px] border-[#0F242D]">
                  Lv. {user.city_level}
                </span>
                <span>{user.research_points} RP</span>
              </div>
            </div>

            <div className="neo-card p-3.5 bg-[#E5F5F1]">
              <p className="text-[11px] font-extrabold uppercase text-slate-500">Model Gemini AI</p>
              <p className="text-sm font-extrabold mt-0.5 truncate">
                {meta.ai_configured ? meta.active_model : 'AI Belum Aktif'}
              </p>
              <div className="mt-2 flex items-center gap-1 text-[11px] font-extrabold text-[#0E6BA8]">
                <Cpu size={13} />
                <span>Studio 3D Aktif</span>
              </div>
            </div>
          </section>

          {/* Daftar Cepat Tokoh Siap Dipanggil (terlihat rapi di desktop maupun mobile) */}
          <section className="neo-card p-4 bg-white space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold">Panggil Cepat Tokoh 3D</h3>
              <span className="text-[10px] font-extrabold text-slate-500 uppercase">By Tokoh</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {mentors.slice(0, 6).map((m) => {
                const fm = getFieldMeta(m.field);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onSelectMentor(m)}
                    className="p-2 rounded-xl border-[2px] border-[#0F242D] bg-[#EEF8FA] hover:bg-[#F7C948]/40 text-left flex items-center gap-2 transition"
                  >
                    <div
                      className="w-8 h-8 rounded-lg border-[1.5px] border-[#0F242D] flex items-center justify-center shrink-0"
                      style={{ backgroundColor: fm.bgColor }}
                    >
                      <FieldIcon field={m.field} size={16} color={fm.iconColor} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-extrabold truncate">{m.name}</p>
                      <p className="text-[10px] font-bold text-slate-500 truncate">{fm.label}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
