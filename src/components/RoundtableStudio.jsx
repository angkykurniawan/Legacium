import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Users,
  Sparkles,
  Send,
  AlertTriangle,
  Lock,
  ShieldCheck,
  LogOut,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { getFieldMeta } from '../data/fields.js';
import { Mentor3DStage } from './Mentor3DStage.jsx';
import { LegaciumLogo } from './LegaciumLogo.jsx';
import { api } from '../services/api.js';

const SLOT_LABELS = ['Tokoh 1', 'Tokoh 2', 'Tokoh 3', 'Tokoh 4'];
const SLOT_COLORS = ['#0E6BA8', '#E55827', '#0F766E', '#9333EA'];

function buildInitialUniqueIds(mentors, count = 2) {
  const picked = [];
  const usedFields = new Set();
  const maxCount = Math.min(4, Math.max(2, count), mentors.length);

  // Prioritaskan tokoh dari bidang ilmu berbeda
  for (const m of mentors) {
    if (picked.length >= maxCount) break;
    if (!usedFields.has(m.field)) {
      picked.push(Number(m.id));
      usedFields.add(m.field);
    }
  }
  for (const m of mentors) {
    if (picked.length >= maxCount) break;
    if (!picked.includes(Number(m.id))) {
      picked.push(Number(m.id));
    }
  }
  return picked;
}

export function RoundtableStudio({
  user,
  mentors,
  quests,
  onBack,
  onOpenAdmin,
  onLogout,
  onReloadAll
}) {
  const maxAllowed = Math.min(4, mentors.length);
  const [selectedIds, setSelectedIds] = useState(() => buildInitialUniqueIds(mentors, 2));
  const [questId, setQuestId] = useState(''); // '' = Diskusi Bebas (tidak terkait World Quest)
  const [topic, setTopic] = useState('');

  const [sessions, setSessions] = useState([]);
  const [running, setRunning] = useState(false);
  const [activeSpeakerIndex, setActiveSpeakerIndex] = useState(-1); // -1 | 0..3 | 'all'
  const [submittingQuestId, setSubmittingQuestId] = useState(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const timersRef = useRef([]);
  const isUserRole = user?.role === 'user';

  // Pastikan semua ID terpilih valid & unik saat daftar mentor berubah
  useEffect(() => {
    if (mentors.length < 2) return;
    setSelectedIds((prev) => {
      const validIds = new Set(mentors.map((m) => Number(m.id)));
      const clean = [...new Set(prev.filter((id) => validIds.has(Number(id))))];
      const desiredCount = Math.min(4, Math.max(2, clean.length || 2), mentors.length);
      if (clean.length === desiredCount) return clean;
      const next = [...clean];
      for (const m of mentors) {
        if (next.length >= desiredCount) break;
        if (!next.includes(Number(m.id))) next.push(Number(m.id));
      }
      return next;
    });
  }, [mentors]);

  const selectedMentors = useMemo(
    () =>
      selectedIds
        .map((id) => mentors.find((m) => Number(m.id) === Number(id)))
        .filter(Boolean),
    [selectedIds, mentors]
  );

  const uniqueFields = useMemo(
    () => [...new Set(selectedMentors.map((m) => m.field))],
    [selectedMentors]
  );

  useEffect(() => {
    api
      .getRoundtables()
      .then((res) => setSessions(res.sessions || []))
      .catch(() => {});

    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  function handleChangeCount(targetCount) {
    const safeCount = Math.min(maxAllowed, Math.max(2, targetCount));
    setError('');
    setSelectedIds((prev) => {
      if (prev.length >= safeCount) return prev.slice(0, safeCount);
      const next = [...prev];
      const usedFields = new Set(
        next.map((id) => mentors.find((m) => Number(m.id) === Number(id))?.field)
      );
      // Isi slot tambahan dari tokoh unik yang belum dipilih (utamakan bidang baru)
      for (const m of mentors) {
        if (next.length >= safeCount) break;
        if (!next.includes(Number(m.id)) && !usedFields.has(m.field)) {
          next.push(Number(m.id));
          usedFields.add(m.field);
        }
      }
      for (const m of mentors) {
        if (next.length >= safeCount) break;
        if (!next.includes(Number(m.id))) {
          next.push(Number(m.id));
        }
      }
      return next;
    });
  }

  function handleSelectSlot(slotIdx, newMentorId) {
    const idNum = Number(newMentorId);
    setError('');
    setSelectedIds((prev) => {
      // Blokir jika sudah dipakai di slot lain
      if (prev.some((existing, idx) => idx !== slotIdx && Number(existing) === idNum)) {
        setError('Tokoh yang sama tidak boleh dipilih di dua slot berbeda.');
        return prev;
      }
      const copy = [...prev];
      copy[slotIdx] = idNum;
      return copy;
    });
  }

  function triggerSequentialSpeech(participantCount) {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
    for (let i = 0; i < participantCount; i++) {
      timersRef.current.push(setTimeout(() => setActiveSpeakerIndex(i), i * 2600));
    }
    timersRef.current.push(
      setTimeout(() => setActiveSpeakerIndex('all'), participantCount * 2600)
    );
    timersRef.current.push(
      setTimeout(() => setActiveSpeakerIndex(-1), participantCount * 2600 + 2800)
    );
  }

  async function handleDiscuss(e) {
    e.preventDefault();
    if (!isUserRole || selectedMentors.length < 2 || !topic.trim() || running) return;
    if (new Set(selectedIds).size !== selectedIds.length) {
      setError('Setiap slot wajib berisi tokoh yang berbeda.');
      return;
    }

    setRunning(true);
    setError('');
    setNotice('');
    setActiveSpeakerIndex(-1);

    try {
      const res = await api.runRoundtableDiscussion({
        mentor_ids: selectedIds,
        quest_id: questId || null,
        topic: topic.trim()
      });
      setSessions((prev) => [res.session, ...prev]);
      setTopic('');
      triggerSequentialSpeech(selectedIds.length);
      setNotice(
        questId
          ? `Sidang Meja Bundar ${selectedIds.length} Tokoh berhasil! Kamu bisa mengirim sintesisnya ke World Quest terkait (+${uniqueFields.length} bidang STEAM).`
          : `Sidang Meja Bundar Bebas (${selectedIds.length} Tokoh) berhasil disimpan ke arsip diskusimu!`
      );
      await onReloadAll?.();
    } catch (err) {
      setError(err.message || 'Gagal menjalankan diskusi Meja Bundar Lintas Era.');
    } finally {
      setRunning(false);
    }
  }

  async function handleSendSynthesisToQuest(session) {
    const targetQuestId = session.quest_id || quests[0]?.id;
    if (!targetQuestId) return;
    const parts = session.participants || [];
    const fields = [...new Set(parts.map((p) => p.field).filter(Boolean))];
    const primaryField = fields[0] || 'fisika';
    const extraFields = fields.slice(1);

    setSubmittingQuestId(session.id);
    setError('');
    setNotice('');
    try {
      await api.submitContribution({
        quest_id: targetQuestId,
        mentor_id: parts[0]?.id || null,
        field: primaryField,
        secondary_field: extraFields[0] || '',
        extra_fields: extraFields,
        discovery_title: `[Sintesis ${parts.length} Tokoh] ${session.synthesis_title}`,
        summary: `${session.synthesis_summary} (Kolaborasi: ${parts.map((p) => p.name).join(' × ')})`
      });

      const fieldLabels = fields.map((f) => getFieldMeta(f).label).join(', ');
      setNotice(
        `Sintesis terkirim ke World Quest! Bidang ${fieldLabels} sama-sama meningkat (+45 RP)!`
      );
      await onReloadAll?.();
    } catch (err) {
      setError(err.message || 'Gagal mengirim sintesis ke World Quest.');
    } finally {
      setSubmittingQuestId(null);
    }
  }

  const quickTopics = [
    'Bagaimana menggabungkan keahlian lintas bidang kalian untuk mempercepat World Quest kita?',
    'Rancang solusi energi bersih yang aman secara kimia, kokoh secara arsitektur, dan efisien secara fisika!'
  ];

  return (
    <div className="space-y-4 pb-28 md:pb-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="neo-btn bg-white px-3 py-2 text-xs flex items-center gap-1.5"
          >
            <ArrowLeft size={16} />
            <span>Kembali</span>
          </button>
          <LegaciumLogo size="xs" />
        </div>
        <span className="text-xs font-extrabold uppercase tracking-wide px-3 py-1 rounded-full bg-[#F7C948] border-[2px] border-[#0F242D] flex items-center gap-1">
          <Users size={13} />
          <span>Meja Bundar Lintas Era (2–4 Tokoh)</span>
        </span>
      </div>

      {/* Layout Responsif: 1 Kolom Mobile, 2 Kolom Desktop (12-col grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* KOLOM KIRI: Panggung 3D Multi-Tokoh + Konfigurasi 2–4 Tokoh Unik + Form */}
        <div className="lg:col-span-5 space-y-4">
          {selectedMentors.length > 0 && (
            <Mentor3DStage
              mentorsList={selectedMentors}
              isThinking={running}
              activeSpeakerIndex={activeSpeakerIndex}
            />
          )}

          <div className="neo-card p-4 bg-white space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-extrabold">Susun Peserta Meja Bundar</h2>
                <p className="text-[11px] font-semibold text-slate-500">
                  Pilih 2 hingga 4 tokoh berbeda (tidak bisa memilih tokoh yang sama).
                </p>
              </div>
              {/* Custom Jumlah Tokoh: 2, 3, atau 4 */}
              <div className="inline-flex items-center gap-1 p-1 bg-[#EEF8FA] border-[2px] border-[#0F242D] rounded-xl">
                {[2, 3, 4].map((num) => {
                  const disabled = num > maxAllowed;
                  const active = selectedIds.length === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleChangeCount(num)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition disabled:opacity-40 ${
                        active
                          ? 'bg-[#F7C948] border-[1.5px] border-[#0F242D]'
                          : 'text-slate-600 hover:bg-white'
                      }`}
                    >
                      {num} Tokoh
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dropdown Slot Tokoh Unik (Otomatis menyaring tokoh yang sudah dipakai slot lain) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {selectedIds.map((currentId, idx) => {
                const otherSelected = new Set(
                  selectedIds.filter((_, otherIdx) => otherIdx !== idx).map(Number)
                );
                const availableOptions = mentors.filter(
                  (m) => !otherSelected.has(Number(m.id)) || Number(m.id) === Number(currentId)
                );

                return (
                  <div key={idx}>
                    <label
                      className="block text-[10px] font-extrabold uppercase mb-1"
                      style={{ color: SLOT_COLORS[idx] || '#0F242D' }}
                    >
                      {SLOT_LABELS[idx]}
                    </label>
                    <select
                      value={currentId}
                      onChange={(e) => handleSelectSlot(idx, e.target.value)}
                      className="neo-input text-xs py-2"
                    >
                      {availableOptions.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({getFieldMeta(m.field).label})
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>

            {/* Badge Sinergi STEAM */}
            <div className="px-3 py-2 rounded-xl bg-[#E5F5F1] border-[1.5px] border-[#0F242D] text-[11px] font-extrabold flex flex-wrap items-center justify-between gap-1">
              <span>
                Sinergi: {uniqueFields.map((f) => getFieldMeta(f).label).join(' × ')}
              </span>
              <span className="text-emerald-800">+{uniqueFields.length} Bidang STEAM</span>
            </div>

            {/* DISCLAIMER AI */}
            <div className="p-2.5 rounded-xl bg-amber-50 border-[2px] border-[#0F242D] flex items-start gap-2">
              <AlertTriangle size={15} className="text-[#E55827] shrink-0 mt-0.5" />
              <p className="text-[11px] font-semibold text-[#0F242D] leading-snug">
                <strong>Disclaimer AI:</strong> Diskusi Meja Bundar Lintas Era dihasilkan oleh AI
                (Google Gemini). Terdapat kemungkinan AI melakukan kesalahan fakta sejarah atau
                sains — mohon tetap verifikasi secara mandiri.
              </p>
            </div>

            {!isUserRole ? (
              <div className="p-4 rounded-2xl bg-[#EEF8FA] border-[2px] border-dashed border-[#0F242D] text-center space-y-2.5">
                <Lock size={20} className="mx-auto" />
                <p className="text-xs font-extrabold">
                  Meja Bundar Lintas Era hanya aktif untuk akun dengan role <strong>User</strong>.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={onOpenAdmin}
                    className="neo-btn bg-[#F7C948] py-2 text-xs flex items-center justify-center gap-1"
                  >
                    <ShieldCheck size={14} /> Panel Admin
                  </button>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="neo-btn bg-white py-2 text-xs flex items-center justify-center gap-1"
                  >
                    <LogOut size={14} /> Login User
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleDiscuss} className="space-y-2.5">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase mb-1">
                    Hubungkan dengan World Quest (Opsional)
                  </label>
                  <select
                    value={questId}
                    onChange={(e) => setQuestId(e.target.value ? Number(e.target.value) : '')}
                    className="neo-input text-xs py-2"
                  >
                    <option value="">— Diskusi Bebas (Tidak Terkait World Quest) —</option>
                    {quests.map((q) => (
                      <option key={q.id} value={q.id}>
                        World Quest: {q.title} ({q.subtitle})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase mb-1">
                    Ajukan Tantangan / Masalah Lintas Disiplin
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Contoh: Bagaimana merancang pembangkit energi bersih yang aman, efisien, dan estetis?"
                    className="neo-input text-xs"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {quickTopics.map((qt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setTopic(qt)}
                      className="text-left text-[10px] font-bold px-2.5 py-1 rounded-xl bg-[#EEF8FA] border border-[#0F242D] hover:bg-[#F7C948]/50"
                    >
                      &ldquo;{qt}&rdquo;
                    </button>
                  ))}
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
                  disabled={running || !topic.trim()}
                  className="neo-btn-dark w-full justify-center py-3 text-xs disabled:opacity-50"
                >
                  <Sparkles size={15} />
                  <span>
                    {running
                      ? `${selectedMentors.length} Tokoh Sedang Berdiskusi...`
                      : `Mulai Sidang ${selectedMentors.length} Tokoh`}
                  </span>
                  <Send size={14} />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* KOLOM KANAN: Arsip & Alur Diskusi Berantai */}
        <div className="lg:col-span-7 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold">
              Hasil Diskusi &amp; Sintesis ({sessions.length})
            </h3>
            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-white border-[2px] border-[#0F242D]">
              Interdisipliner STEAM
            </span>
          </div>

          {sessions.length === 0 ? (
            <div className="neo-card p-6 bg-white/90 text-center space-y-2">
              <Users size={28} className="mx-auto text-[#0E6BA8]" />
              <p className="text-sm font-extrabold">Belum Ada Sidang Meja Bundar</p>
              <p className="text-xs font-semibold text-slate-600 max-w-md mx-auto leading-relaxed">
                Pilih <strong>2 sampai 4 tokoh berbeda</strong> di sebelah kiri lalu ajukan masalah
                riset. Para tokoh 3D akan saling menanggapi dari sudut pandang era &amp; bidang
                masing-masing lalu menghasilkan <strong>Blueprint Sintesis Gabungan</strong>!
              </p>
            </div>
          ) : (
            sessions.map((s) => {
              const parts = s.participants || [];
              const replies = s.replies || [];
              const sFields = [...new Set(parts.map((p) => p.field).filter(Boolean))];
              const linkedQuest = s.quest_id
                ? quests.find((q) => Number(q.id) === Number(s.quest_id))
                : null;

              return (
                <div key={s.id} className="neo-card p-4 bg-white space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1">
                      {parts.map((p, idx) => (
                        <span
                          key={`${p.id}_${idx}`}
                          className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#F7C948] border border-[#0F242D]"
                        >
                          {p.name}
                        </span>
                      ))}
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#EEF8FA] border border-[#0F242D]">
                        {linkedQuest ? `Quest: ${linkedQuest.title}` : 'Diskusi Bebas'}
                      </span>
                    </div>
                    {s.model_used && (
                      <span className="text-[10px] font-bold text-[#0E6BA8]">
                        {s.model_used}
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-extrabold text-[#0F242D] bg-[#EEF8FA] p-2.5 rounded-xl border border-[#0F242D]/30">
                    Topik: &ldquo;{s.topic}&rdquo;
                  </p>

                  {/* Balasan Berantai Semua Peserta (2–4 Tokoh) */}
                  <div className="space-y-2">
                    {replies.map((rep, idx) => {
                      const fm = getFieldMeta(rep.field);
                      return (
                        <div
                          key={`${rep.mentor_id}_${idx}`}
                          className="p-3 rounded-2xl border-[2px] border-[#0F242D]"
                          style={{ backgroundColor: fm.badgeBg }}
                        >
                          <p className="text-[11px] font-extrabold">
                            {idx + 1}. {rep.mentor_name} ({fm.label})
                            {idx > 0 ? ' menanggapi' : ' membuka gagasan'}
                          </p>
                          <p className="text-xs font-semibold text-[#0F242D] mt-1 leading-relaxed">
                            {rep.reply}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Kartu Sintesis Gabungan */}
                  <div className="p-3.5 rounded-2xl bg-[#A8D8F5] border-[2px] border-[#0F242D] space-y-2">
                    <p className="text-[10px] font-extrabold uppercase flex items-center gap-1">
                      <CheckCircle2 size={12} /> Sintesis Lintas Disiplin (
                      {sFields.map((f) => getFieldMeta(f).label).join(' + ')})
                    </p>
                    <h4 className="text-sm font-extrabold">{s.synthesis_title}</h4>
                    <p className="text-xs font-semibold text-[#183846] leading-relaxed">
                      {s.synthesis_summary}
                    </p>

                    {isUserRole && linkedQuest && (
                      <button
                        type="button"
                        disabled={submittingQuestId === s.id}
                        onClick={() => handleSendSynthesisToQuest(s)}
                        className="neo-btn-dark w-full justify-center text-xs py-2.5 mt-1"
                      >
                        <span>
                          {submittingQuestId === s.id
                            ? 'Mengirim ke World Quest...'
                            : `Kirim ke "${linkedQuest.title}" (+${sFields.length} Bidang STEAM)`}
                        </span>
                        <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
