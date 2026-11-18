import React, { useEffect, useState } from 'react';
import {
  Compass,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Users,
  AlertCircle
} from 'lucide-react';
import { RESEARCH_FIELDS, getFieldMeta } from '../data/fields.js';
import { api } from '../services/api.js';
import { LegaciumLogo } from './LegaciumLogo.jsx';

export function QuestsTab({
  user,
  fields = RESEARCH_FIELDS,
  quests,
  recentContributions,
  mentors,
  selectedQuestId,
  onOpenRoundtable,
  onReload
}) {
  const [activeQuestId, setActiveQuestId] = useState(selectedQuestId || quests[0]?.id || 1);

  useEffect(() => {
    if (selectedQuestId) setActiveQuestId(selectedQuestId);
  }, [selectedQuestId]);

  const [field, setField] = useState(user.specialty_field || 'kimia');
  const [mentorId, setMentorId] = useState(mentors[0]?.id || '');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const activeQuest =
    quests.find((q) => Number(q.id) === Number(activeQuestId)) || quests[0];

  async function handleContribute(e) {
    e.preventDefault();
    if (!activeQuest || !title.trim() || !summary.trim()) return;
    setSubmitting(true);
    setError('');
    setNotice('');

    try {
      const res = await api.submitContribution({
        quest_id: activeQuest.id,
        mentor_id: mentorId || null,
        field,
        discovery_title: title.trim(),
        summary: summary.trim()
      });

      setTitle('');
      setSummary('');
      setNotice(
        `Blueprint "${res.contribution.discovery_title}" berhasil disimpan! Progres bidang ${
          getFieldMeta(field).label
        } bertambah (+30 RP).`
      );
      await onReload();
    } catch (err) {
      setError(err.message || 'Gagal mengirim kontribusi.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5 pb-28 md:pb-10">
      <div className="pt-1 flex items-center gap-3">
        <div className="md:hidden">
          <LegaciumLogo size="sm" />
        </div>
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            Kolaborasi Global Lintas Disiplin
          </p>
          <h1 className="text-[22px] md:text-[26px] font-extrabold text-[#0F242D] leading-tight">
            World Quest
          </h1>
        </div>
      </div>

      {/* Selector World Quest */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {quests.map((q) => {
          const isSelected = activeQuest?.id === q.id;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => setActiveQuestId(q.id)}
              className={`shrink-0 px-3.5 py-2 rounded-2xl border-[2.5px] border-[#0F242D] text-xs font-extrabold transition ${
                isSelected ? 'bg-[#F7C948] shadow-neo-sm' : 'bg-white'
              }`}
            >
              {q.title}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* KOLOM KIRI: Detail Progress + Form Kirim Blueprint */}
        <div className="lg:col-span-6 space-y-4">
          {activeQuest && (
            <div className="neo-card bg-[#A8D8F5] p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white border border-[#0F242D]">
                    {activeQuest.status === 'completed'
                      ? 'SELESAI & TERARSIP'
                      : activeQuest.subtitle}
                  </span>
                  <h2 className="text-lg font-extrabold mt-1">{activeQuest.title}</h2>
                </div>
                <Compass size={24} className="shrink-0" />
              </div>

              <p className="text-xs font-semibold text-[#183846] leading-relaxed">
                {activeQuest.description}
              </p>

              {/* Progress bar per bidang */}
              <div className="space-y-2 bg-white/85 rounded-2xl p-3 border-[2px] border-[#0F242D]">
                {Object.entries(activeQuest.required_fields || {}).map(([fKey, target]) => {
                  const fm = getFieldMeta(fKey);
                  const val = activeQuest.progress?.[fKey] || 0;
                  const pct = Math.min(100, Math.round((val / target) * 100));
                  return (
                    <div key={fKey}>
                      <div className="flex justify-between text-xs font-extrabold mb-1">
                        <span>{fm.label}</span>
                        <span>
                          {val}/{target} ({pct}%)
                        </span>
                      </div>
                      <div className="h-3 rounded-full bg-slate-200 border-[1.5px] border-[#0F242D] overflow-hidden">
                        <div
                          className="h-full transition-all duration-300"
                          style={{ width: `${pct}%`, backgroundColor: fm.bgColor }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-[11px] font-extrabold text-[#0F242D]">
                Membuka Node Tech Tree:{' '}
                <span className="underline">{activeQuest.reward_node_title}</span>
              </p>

              {/* Indikator Kolaborasi Wajib Lintas Disiplin STEAM */}
              {(() => {
                const entries = Object.entries(activeQuest.required_fields || {});
                const lowest = entries
                  .map(([fk, target]) => ({
                    field: fk,
                    pct: Math.min(
                      100,
                      Math.round(((activeQuest.progress?.[fk] || 0) / target) * 100)
                    )
                  }))
                  .sort((a, b) => a.pct - b.pct)[0];
                if (!lowest || activeQuest.status === 'completed') return null;
                return (
                  <div className="p-2.5 rounded-xl bg-[#F7C948] border-[2px] border-[#0F242D] space-y-2">
                    <p className="text-[11px] font-extrabold flex items-start gap-1.5 leading-snug">
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                      <span>
                        Kolaborasi Wajib STEAM: Proyek tidak dapat tuntas dari 1 bidang saja! Bidang{' '}
                        <strong>
                          {getFieldMeta(lowest.field).label} ({lowest.pct}%)
                        </strong>{' '}
                        paling dibutuhkan saat ini.
                      </span>
                    </p>
                    {onOpenRoundtable && (
                      <button
                        type="button"
                        onClick={onOpenRoundtable}
                        className="neo-btn bg-white w-full py-1.5 px-3 text-[11px] flex items-center justify-center gap-1.5"
                      >
                        <Users size={14} />
                        <span>Bahas di Meja Bundar 2–4 Tokoh (+Bonus Multi-Bidang)</span>
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Form Kirim Kontribusi & Blueprint */}
          <form onSubmit={handleContribute} className="neo-card p-4 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold flex items-center gap-1.5">
                <Sparkles size={16} className="text-[#E55827]" />
                Kirim Blueprint &amp; Kontribusi Riset
              </h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#E5F5F1] border border-[#0F242D]">
                +30 RP
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-extrabold uppercase mb-1">
                  Bidang Riset
                </label>
                <select
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                  className="neo-input text-xs py-2"
                >
                  {fields.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-extrabold uppercase mb-1">
                  Mentor Kolaborasi
                </label>
                <select
                  value={mentorId}
                  onChange={(e) => setMentorId(e.target.value)}
                  className="neo-input text-xs py-2"
                >
                  {mentors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase mb-1">
                Judul Blueprint / Penemuan
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Misal: Kubah Magnetik Toroidal Generasi II"
                className="neo-input text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase mb-1">
                Ringkasan Solusi Lintas Disiplin
              </label>
              <textarea
                rows={2}
                required
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Jelaskan hasil kolaborasimu dengan mentor untuk proyek ini..."
                className="neo-input text-xs"
              />
            </div>

            {notice && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border-[2px] border-emerald-600 text-emerald-800 text-xs font-bold">
                {notice}
              </div>
            )}
            {error && (
              <div className="p-2.5 rounded-xl bg-red-50 border-[2px] border-red-500 text-red-700 text-xs font-bold">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="neo-btn-dark w-full justify-center text-xs py-3"
            >
              <span>{submitting ? 'Menyimpan Kontribusi...' : 'Catat Kontribusi Blueprint'}</span>
              <ArrowRight size={15} />
            </button>
          </form>
        </div>

        {/* KOLOM KANAN: Feed Kontribusi Global */}
        <section className="lg:col-span-6 space-y-2.5">
          <h3 className="text-base font-extrabold">Arsip Blueprint Terbaru</h3>
          {recentContributions.map((c) => {
            const fm = getFieldMeta(c.field);
            return (
              <div key={c.id} className="neo-card p-3.5 bg-white space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap gap-1">
                      <span
                        className="inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-[#0F242D]"
                        style={{ backgroundColor: fm.badgeBg }}
                      >
                        {fm.label} · +{c.points_added} pts
                      </span>
                      {c.secondary_field && (
                        <span className="inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#F7C948] border border-[#0F242D]">
                          Sinergi +{getFieldMeta(c.secondary_field).label}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-extrabold mt-1">{c.discovery_title}</h4>
                    <p className="text-[11px] font-bold text-slate-500">
                      oleh {c.user_name} ({c.city_name}){' '}
                      {c.mentor_name ? `· Mentor: ${c.mentor_name}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-[#E5F5F1] border-[1.5px] border-[#0F242D] text-[10px] font-extrabold text-emerald-800">
                    <CheckCircle2 size={12} /> Terarsip
                  </span>
                </div>

                <p className="text-xs font-semibold text-slate-700">{c.summary}</p>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
