import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Send,
  BookmarkPlus,
  Sparkles,
  CheckCircle2,
  BookmarkCheck,
  Quote,
  AlertTriangle,
  Lock,
  ShieldCheck,
  LogOut,
  Users
} from 'lucide-react';
import { RESEARCH_FIELDS, getFieldMeta } from '../data/fields.js';
import { FieldIcon } from './FieldIcon.jsx';
import { Mentor3DStage } from './Mentor3DStage.jsx';
import { LegaciumLogo } from './LegaciumLogo.jsx';
import { api } from '../services/api.js';

export function MentorStudio({
  user,
  fields = RESEARCH_FIELDS,
  initialField,
  initialMentor,
  mentors,
  quests,
  onBack,
  onOpenRoundtable,
  onOpenAdmin,
  onLogout,
  onRefreshUser
}) {
  const [selectedField, setSelectedField] = useState(initialField || 'all');
  const [activeMentor, setActiveMentor] = useState(
    initialMentor ||
      mentors.find((m) => (initialField ? m.field === initialField : true)) ||
      mentors[0] ||
      null
  );

  const [messages, setMessages] = useState([]);
  const [memories, setMemories] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState('');

  // Pin Memory modal state
  const [showPinForm, setShowPinForm] = useState(false);
  const [memTitle, setMemTitle] = useState('');
  const [memSummary, setMemSummary] = useState('');
  const [pinning, setPinning] = useState(false);

  const chatEndRef = useRef(null);
  const speakTimerRef = useRef(null);

  const isUserRole = user?.role === 'user';

  const visibleMentors =
    selectedField === 'all' ? mentors : mentors.filter((m) => m.field === selectedField);

  useEffect(() => {
    if (initialMentor) {
      setActiveMentor(initialMentor);
      setSelectedField(initialMentor.field);
    } else if (initialField) {
      setSelectedField(initialField);
      const firstInField = mentors.find((m) => m.field === initialField);
      if (firstInField) setActiveMentor(firstInField);
    }
  }, [initialField, initialMentor, mentors]);

  useEffect(() => {
    if (!activeMentor) return;
    let cancelled = false;
    setError('');
    setIsSpeaking(false);
    api
      .getChatHistory(activeMentor.id)
      .then((res) => {
        if (!cancelled) {
          setMessages(res.messages || []);
          setMemories(res.memories || []);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activeMentor]);

  useEffect(() => {
    return () => {
      if (speakTimerRef.current) clearTimeout(speakTimerRef.current);
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  async function sendText(rawText) {
    const text = (rawText || '').trim();
    if (!text || !activeMentor || sending || !isUserRole) return;

    setInput('');
    setError('');
    setSending(true);
    setIsSpeaking(false);

    const optimisticMsg = {
      id: `tmp_${Date.now()}`,
      sender: 'user',
      message: text
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    const activeQuestText = quests
      .filter((q) => q.status === 'active')
      .map((q) => q.title)
      .join(', ');

    try {
      const res = await api.sendChatMessage({
        mentor_id: activeMentor.id,
        message: text,
        quest_context: activeQuestText
      });
      setMessages((prev) => [
        ...prev,
        {
          id: `reply_${Date.now()}`,
          sender: 'mentor',
          message: res.reply,
          model_used: res.model_used
        }
      ]);

      // Aktifkan animasi bicara karakter 3D
      setIsSpeaking(true);
      if (speakTimerRef.current) clearTimeout(speakTimerRef.current);
      speakTimerRef.current = setTimeout(() => setIsSpeaking(false), 4800);

      onRefreshUser?.();
    } catch (err) {
      setError(err.message || 'Gagal menghubungi Google AI Studio.');
    } finally {
      setSending(false);
    }
  }

  function handleSend(e) {
    e.preventDefault();
    sendText(input);
  }

  async function handlePinMemory(e) {
    e.preventDefault();
    if (!activeMentor || !memTitle.trim() || !memSummary.trim() || !isUserRole) return;
    setPinning(true);
    setError('');
    try {
      const res = await api.pinMemory({
        mentor_id: activeMentor.id,
        title: memTitle.trim(),
        memory_summary: memSummary.trim()
      });
      setMemories((prev) => [res.memory, ...prev]);
      setMemTitle('');
      setMemSummary('');
      setShowPinForm(false);
    } catch (err) {
      setError(err.message || 'Gagal menyimpan memori.');
    } finally {
      setPinning(false);
    }
  }

  const fieldMeta = getFieldMeta(activeMentor?.field);

  const starterPrompts = activeMentor
    ? [
        `Bagaimana peran ${fieldMeta.label} untuk World Quest saat ini?`,
        `Ceritakan penemuan terbesarmu di bidang ${activeMentor.specialty}.`
      ]
    : [];

  return (
    <div className="space-y-4 pb-28 md:pb-10">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="neo-btn bg-white px-3 py-2 text-xs flex items-center gap-1.5"
          >
            <ArrowLeft size={16} />
            <span>Kota Lab</span>
          </button>
          <LegaciumLogo size="xs" />
        </div>
        <button
          type="button"
          onClick={onOpenRoundtable}
          className="neo-btn bg-[#F7C948] px-3 py-2 text-xs flex items-center gap-1.5"
        >
          <Users size={14} />
          <span>Meja Bundar (2–4 Tokoh)</span>
        </button>
      </div>

      {/* Filter Bidang Riset */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setSelectedField('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-extrabold border-[2px] border-[#0F242D] shrink-0 ${
            selectedField === 'all' ? 'bg-[#0F242D] text-white' : 'bg-white'
          }`}
        >
          Semua ({mentors.length})
        </button>
        {fields.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => {
              setSelectedField(f.id);
              const first = mentors.find((m) => m.field === f.id);
              if (first) setActiveMentor(first);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-extrabold border-[2px] border-[#0F242D] shrink-0 ${
              selectedField === f.id ? 'bg-[#F7C948]' : 'bg-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Pilihan Tokoh Dunia */}
      <div className="flex gap-2.5 overflow-x-auto pb-1">
        {visibleMentors.map((m) => {
          const isSelected = activeMentor?.id === m.id;
          const fm = getFieldMeta(m.field);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setActiveMentor(m)}
              className={`shrink-0 p-2.5 rounded-2xl border-[2.5px] border-[#0F242D] flex items-center gap-2.5 text-left transition ${
                isSelected ? 'bg-[#A8D8F5] shadow-neo-sm' : 'bg-white'
              }`}
            >
              <div
                className="w-9 h-9 rounded-xl border-[2px] border-[#0F242D] flex items-center justify-center shrink-0"
                style={{ backgroundColor: fm.bgColor }}
              >
                <FieldIcon field={m.field} size={18} color={fm.iconColor} />
              </div>
              <div>
                <p className="text-xs font-extrabold leading-tight">{m.name}</p>
                <p className="text-[10px] font-bold text-slate-600">{fm.label}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Layout 2 Kolom Responsif: Kiri (3D + Profil & Memori), Kanan (Ruang Percakapan) */}
      {activeMentor && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-5 space-y-4">
            {/* Panggung Karakter 3D Mewakili Tokoh Aktif */}
            <Mentor3DStage
              mentor={activeMentor}
              isThinking={sending}
              isSpeaking={isSpeaking}
            />

            {/* Kartu Profil & Deskripsi Tokoh Aktif */}
            <div className="neo-card p-4 bg-white">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold leading-tight">{activeMentor.name}</h2>
              <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                {activeMentor.era} · {activeMentor.specialty}
              </p>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#E5F5F1] border border-[#0F242D] shrink-0">
              {activeMentor.research_bonus}
            </span>
          </div>

          <p className="text-xs font-semibold text-slate-700 mt-2 leading-relaxed">
            {activeMentor.biography}
          </p>

          <div className="mt-2 p-2 rounded-xl bg-[#EEF8FA] border border-[#0F242D]/30 flex items-start gap-1.5">
            <Quote size={13} className="shrink-0 mt-0.5 text-[#0E6BA8]" />
            <p className="text-[11px] italic font-semibold text-[#0F242D]">
              &ldquo;{activeMentor.signature_quote}&rdquo;
            </p>
          </div>

          {/* Tombol Simpan Memori Kolaborasi (khusus role user) */}
          {isUserRole && (
            <>
              <div className="mt-3 pt-3 border-t-2 border-dashed border-slate-200 flex items-center justify-between gap-2">
                <span className="text-[11px] font-extrabold text-slate-600 flex items-center gap-1">
                  <BookmarkCheck size={13} /> {memories.length} Memori Tersimpan
                </span>
                <button
                  type="button"
                  onClick={() => setShowPinForm((v) => !v)}
                  className="neo-btn bg-[#F7C948] px-3 py-1.5 text-[11px] flex items-center gap-1"
                >
                  <BookmarkPlus size={14} />
                  <span>Simpan Memori</span>
                </button>
              </div>

              {showPinForm && (
                <form
                  onSubmit={handlePinMemory}
                  className="mt-3 p-3 rounded-2xl bg-[#EEF8FA] border-[2px] border-[#0F242D] space-y-2"
                >
                  <p className="text-xs font-extrabold">
                    Catat Intisari Diskusi dengan {activeMentor.name}
                  </p>
                  <input
                    type="text"
                    required
                    value={memTitle}
                    onChange={(e) => setMemTitle(e.target.value)}
                    placeholder="Judul temuan/memori (misal: Rumus Pendingin Reaktor)"
                    className="neo-input text-xs py-2"
                  />
                  <textarea
                    rows={2}
                    required
                    value={memSummary}
                    onChange={(e) => setMemSummary(e.target.value)}
                    placeholder="Ringkasan ide agar diingat oleh tokoh pada sesi berikutnya..."
                    className="neo-input text-xs py-2"
                  />
                  <button
                    type="submit"
                    disabled={pinning}
                    className="neo-btn-dark w-full justify-center text-xs py-2"
                  >
                    <Sparkles size={14} />
                    <span>{pinning ? 'Menyimpan Memori...' : 'Simpan ke Memori Tokoh'}</span>
                  </button>
                </form>
              )}

              {memories.length > 0 && (
                <div className="mt-2.5 space-y-1.5">
                  {memories.slice(0, 3).map((mem) => (
                    <div
                      key={mem.id}
                      className="p-2 rounded-xl bg-[#E5F5F1] border-[1.5px] border-[#0F242D] text-[11px]"
                    >
                      <span className="font-extrabold flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-emerald-700" />
                        {mem.title}
                      </span>
                      <p className="text-slate-700 mt-0.5">{mem.memory_summary}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
            </div>
          </div>

          {/* KOLOM KANAN: Area Percakapan By Tokoh (HANYA TERBUKA UNTUK ROLE USER) */}
          <div className="lg:col-span-7 neo-card p-4 bg-white flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-600">
              Percakapan dengan {activeMentor.name}
            </p>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#EEF8FA] border border-[#0F242D]">
              Gemini AI
            </span>
          </div>

          {/* DISCLAIMER AI (Wajib Tampil) */}
          <div className="mb-3 p-2.5 rounded-xl bg-amber-50 border-[2px] border-[#0F242D] flex items-start gap-2">
            <AlertTriangle size={15} className="text-[#E55827] shrink-0 mt-0.5" />
            <p className="text-[11px] font-semibold text-[#0F242D] leading-snug">
              <strong>Disclaimer AI:</strong> Percakapan ini dihasilkan oleh AI (Google Gemini)
              sebagai simulasi gema memori tokoh. Terdapat kemungkinan AI melakukan kesalahan fakta
              sejarah atau sains — mohon tetap verifikasi informasi penting secara mandiri.
            </p>
          </div>

          {!isUserRole ? (
            /* KONTROL ROLE: Admin tidak bisa chat langsung, hanya User */
            <div className="p-4 rounded-2xl bg-[#EEF8FA] border-[2px] border-dashed border-[#0F242D] text-center space-y-3">
              <div className="w-11 h-11 rounded-full bg-[#F7C948] border-[2px] border-[#0F242D] mx-auto flex items-center justify-center">
                <Lock size={20} />
              </div>
              <div>
                <p className="text-sm font-extrabold text-[#0F242D]">
                  Percakapan Khusus Role User
                </p>
                <p className="text-xs font-semibold text-slate-600 mt-1 leading-relaxed">
                  Saat ini kamu login sebagai <strong>Admin</strong>. Percakapan langsung dengan
                  tokoh 3D hanya dapat dilakukan setelah login sebagai <strong>User</strong>.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className="neo-btn bg-[#F7C948] py-2 px-2.5 text-xs flex items-center justify-center gap-1"
                >
                  <ShieldCheck size={14} />
                  <span>Panel Admin</span>
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="neo-btn bg-white py-2 px-2.5 text-xs flex items-center justify-center gap-1"
                >
                  <LogOut size={14} />
                  <span>Login User</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2.5 max-h-[300px] lg:max-h-[460px] overflow-y-auto pr-1 mb-3">
                {messages.length === 0 && (
                  <div className="p-3 rounded-2xl bg-[#EEF8FA] border-[1.5px] border-dashed border-[#0F242D] space-y-2">
                    <p className="text-xs font-semibold text-slate-700">
                      Mulai percakapan langsung dengan gema memori 3D{' '}
                      <strong>{activeMentor.name}</strong>:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {starterPrompts.map((prompt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => sendText(prompt)}
                          className="text-left text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-white border-[1.5px] border-[#0F242D] hover:bg-[#F7C948]/50 transition"
                        >
                          &ldquo;{prompt}&rdquo;
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs font-semibold border-[2px] border-[#0F242D] leading-relaxed ${
                        msg.sender === 'user' ? 'bg-[#F7C948]' : 'bg-[#EEF8FA]'
                      }`}
                    >
                      {msg.sender === 'mentor' && (
                        <p className="text-[10px] font-extrabold text-[#0E6BA8] mb-0.5">
                          {activeMentor.name}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                      {msg.model_used && (
                        <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 mt-1">
                          Gemini: {msg.model_used}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {sending && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl px-3.5 py-2 text-xs font-bold border-[2px] border-[#0F242D] bg-[#EEF8FA] animate-pulse">
                      {activeMentor.name} sedang merangkai gagasan...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {error && (
                <div className="mb-2.5 p-2.5 rounded-xl bg-red-50 border-[2px] border-red-500 text-red-700 text-xs font-bold">
                  {error}
                </div>
              )}

              <form onSubmit={handleSend} className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Tanya langsung ke ${activeMentor.name}...`}
                  className="neo-input text-xs py-2.5"
                />
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  className="neo-btn bg-[#0E6BA8] text-white p-2.5 shrink-0 disabled:opacity-50"
                  aria-label="Kirim pesan"
                >
                  <Send size={17} />
                </button>
              </form>
            </>
          )}
          </div>
        </div>
      )}
    </div>
  );
}
