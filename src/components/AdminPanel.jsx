import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  KeyRound,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Trash2,
  PlusCircle,
  Cpu,
  UserPlus,
  Pencil,
  AlertTriangle,
  Building2
} from 'lucide-react';
import {
  DEFAULT_RESEARCH_FIELDS,
  FIELD_ICON_OPTIONS,
  FIELD_COLOR_PRESETS,
  getFieldMeta
} from '../data/fields.js';
import { api } from '../services/api.js';
import { LegaciumLogo } from './LegaciumLogo.jsx';
import { FieldIcon } from './FieldIcon.jsx';

const EMPTY_MENTOR_FORM = {
  id: null,
  name: '',
  field: 'fisika',
  era: '',
  specialty: '',
  biography: '',
  signature_quote: '',
  persona_prompt: '',
  research_bonus: '+15% Efisiensi Riset',
  is_ai_generated: 0
};

export function AdminPanel({
  fields = DEFAULT_RESEARCH_FIELDS,
  mentors,
  quests = [],
  onBack,
  onReloadAll
}) {
  const [subTab, setSubTab] = useState('ai'); // 'ai' | 'fields' | 'mentors' | 'users' | 'quests'

  // State Kelola Bidang Riset Dinamis (otomatis bangun Gedung 3D baru di Open World)
  const [fLabel, setFLabel] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fIcon, setFIcon] = useState('stethoscope');
  const [fColorIdx, setFColorIdx] = useState(6); // Ungu Royal default untuk bidang baru
  const [savingField, setSavingField] = useState(false);

  // State Konfigurasi Google AI Studio
  const [aiStatus, setAiStatus] = useState({
    has_key: false,
    masked_key: '',
    active_model: 'gemini-2.5-flash',
    active_season: 'ERA 01 · SEASON GENESIS',
    server_location: 'Kota Lab #01'
  });
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [seasonInput, setSeasonInput] = useState('ERA 01 · SEASON GENESIS');
  const [serverInput, setServerInput] = useState('Kota Lab #01');
  const [fetchingModels, setFetchingModels] = useState(false);
  const [savingAi, setSavingAi] = useState(false);

  // State Tokoh & Deskripsi (Tambah Manual / Edit / Generate / Rekomendasi Gemini)
  const [mentorForm, setMentorForm] = useState(EMPTY_MENTOR_FORM);
  const [generatingMentor, setGeneratingMentor] = useState(false);
  const [savingMentor, setSavingMentor] = useState(false);
  const [recommendField, setRecommendField] = useState('all');
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  // State Kelola User (Admin menambahkan user)
  const [usersList, setUsersList] = useState([]);
  const [uName, setUName] = useState('');
  const [uEmail, setUEmail] = useState('');
  const [uPassword, setUPassword] = useState('');
  const [uRole, setURole] = useState('user');
  const [uField, setUField] = useState('fisika');
  const [uCity, setUCity] = useState('Kota Lab Nusantara');
  const [savingUser, setSavingUser] = useState(false);

  // State Buat World Quest Baru
  const [qTitle, setQTitle] = useState('');
  const [qDesc, setQDesc] = useState('');
  const [qReward, setQReward] = useState('');
  const [qFields, setQFields] = useState(['fisika', 'kimia', 'arsitektur']);
  const [creatingQuest, setCreatingQuest] = useState(false);

  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getAdminAiStatus()
      .then((res) => {
        setAiStatus(res);
        setSelectedModel(res.active_model || 'gemini-2.5-flash');
        setSeasonInput(res.active_season || 'ERA 01 · SEASON GENESIS');
        setServerInput(res.server_location || 'Kota Lab #01');
      })
      .catch((err) => setError(err.message));

    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const res = await api.getAdminUsers();
      setUsersList(res.users || []);
    } catch {
      // ignore initial error
    }
  }

  async function handleFetchModels() {
    setFetchingModels(true);
    setError('');
    setNotice('');
    try {
      const res = await api.fetchGoogleAiModels(apiKeyInput.trim());
      setAvailableModels(res.models || []);
      if (res.models?.length > 0) {
        const exists = res.models.some((m) => m.id === selectedModel);
        if (!exists) setSelectedModel(res.models[0].id);
      }
      setNotice(`Berhasil memuat ${res.count} model tersedia dari Google AI Studio!`);
    } catch (err) {
      setError(err.message || 'Gagal mengambil daftar model dari Google AI Studio.');
    } finally {
      setFetchingModels(false);
    }
  }

  async function handleSaveAi(e) {
    e.preventDefault();
    setSavingAi(true);
    setError('');
    setNotice('');
    try {
      const res = await api.saveAdminAiConfig({
        api_key: apiKeyInput.trim(),
        model_id: selectedModel,
        active_season: seasonInput.trim(),
        server_location: serverInput.trim()
      });
      setAiStatus((prev) => ({
        ...prev,
        has_key: res.has_key,
        masked_key: res.masked_key,
        active_model: res.active_model
      }));
      setApiKeyInput('');
      setNotice(`Tersimpan! Model aktif sekarang: ${res.active_model}`);
      await onReloadAll();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan konfigurasi AI.');
    } finally {
      setSavingAi(false);
    }
  }

  async function handleGetRecommendations() {
    setLoadingRecs(true);
    setError('');
    setNotice('');
    try {
      const res = await api.recommendMentorsWithAi(recommendField);
      setRecommendations(res.recommendations || []);
      setNotice(
        `Gemini (${res.model_used}) merekomendasikan ${(res.recommendations || []).length} tokoh baru! Klik salah satu untuk langsung mengisi form.`
      );
    } catch (err) {
      setError(
        err.message ||
          'Gagal mengambil rekomendasi tokoh. Pastikan API Key Google AI Studio sudah disimpan.'
      );
    } finally {
      setLoadingRecs(false);
    }
  }

  async function handlePickRecommendation(rec) {
    const validFields = fields.map((f) => f.id);
    const safeField = validFields.includes(rec.field) ? rec.field : fields[0]?.id || 'fisika';
    setMentorForm({
      ...EMPTY_MENTOR_FORM,
      name: rec.name || '',
      field: safeField,
      era: rec.era || '',
      specialty: rec.specialty || ''
    });
    setGeneratingMentor(true);
    setError('');
    setNotice('');
    try {
      const res = await api.generateMentorWithAi(rec.name, safeField, rec.reason || '');
      setMentorForm((prev) => ({
        ...prev,
        ...res.draft,
        id: null,
        is_ai_generated: 1
      }));
      setNotice(
        `Profil lengkap "${res.draft.name}" dari rekomendasi AI siap ditinjau. Klik "Tambah Tokoh ke Database" untuk menyimpan!`
      );
    } catch (err) {
      setError(err.message || 'Gagal mengisi otomatis profil tokoh.');
    } finally {
      setGeneratingMentor(false);
    }
  }

  async function handleCreateField(e) {
    e.preventDefault();
    if (!fLabel.trim()) return;
    setSavingField(true);
    setError('');
    setNotice('');
    try {
      const preset = FIELD_COLOR_PRESETS[fColorIdx] || FIELD_COLOR_PRESETS[6];
      const res = await api.createField({
        label: fLabel.trim(),
        description: fDesc.trim(),
        iconName: fIcon,
        bgColor: preset.bgColor,
        iconColor: preset.iconColor,
        badgeBg: preset.badgeBg
      });
      setFLabel('');
      setFDesc('');
      setNotice(
        `Bidang "${res.field.label}" berhasil ditambahkan! Gedung Lab ${res.field.label} 3D otomatis dibangun di Dunia Open World.`
      );
      await onReloadAll();
    } catch (err) {
      setError(err.message || 'Gagal menambahkan bidang riset.');
    } finally {
      setSavingField(false);
    }
  }

  async function handleDeleteField(id, label) {
    if (!window.confirm(`Hapus bidang "${label}" beserta gedung 3D-nya?`)) return;
    setError('');
    setNotice('');
    try {
      await api.deleteField(id);
      setNotice(`Bidang "${label}" berhasil dihapus.`);
      await onReloadAll();
    } catch (err) {
      setError(err.message || 'Gagal menghapus bidang.');
    }
  }

  async function handleDeleteQuest(id, title) {
    if (!window.confirm(`Hapus World Quest "${title}" beserta node Tech Tree terkait?`)) return;
    setError('');
    try {
      await api.deleteQuest(id);
      setNotice(`World Quest "${title}" berhasil dihapus.`);
      await onReloadAll();
    } catch (err) {
      setError(err.message || 'Gagal menghapus World Quest.');
    }
  }

  async function handleGenerateMentor() {
    if (!mentorForm.name.trim()) {
      setError('Isi nama tokoh terlebih dahulu sebelum generate via Gemini.');
      return;
    }
    setGeneratingMentor(true);
    setError('');
    setNotice('');
    try {
      const res = await api.generateMentorWithAi(
        mentorForm.name.trim(),
        mentorForm.field,
        mentorForm.biography.trim()
      );
      setMentorForm((prev) => ({
        ...prev,
        ...res.draft,
        id: prev.id,
        is_ai_generated: 1
      }));
      setNotice(
        `Deskripsi & persona "${res.draft.name}" berhasil diisi otomatis dengan ${res.model_used}. Silakan tinjau/edit lalu simpan!`
      );
    } catch (err) {
      setError(err.message || 'Gagal generate tokoh. Pastikan token Google AI Studio sudah disimpan.');
    } finally {
      setGeneratingMentor(false);
    }
  }

  async function handleSaveMentor(e) {
    e.preventDefault();
    if (!mentorForm.name.trim() || !mentorForm.biography.trim()) {
      setError('Nama dan deskripsi tokoh wajib diisi.');
      return;
    }
    setSavingMentor(true);
    setError('');
    setNotice('');
    try {
      if (mentorForm.id) {
        await api.updateMentor(mentorForm);
        setNotice(`Data tokoh "${mentorForm.name}" berhasil diperbarui!`);
      } else {
        await api.createMentor(mentorForm);
        setNotice(`Tokoh "${mentorForm.name}" berhasil ditambahkan ke database!`);
      }
      setMentorForm(EMPTY_MENTOR_FORM);
      await onReloadAll();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan tokoh.');
    } finally {
      setSavingMentor(false);
    }
  }

  function startEditMentor(m) {
    setError('');
    setNotice('');
    setMentorForm({
      id: m.id,
      name: m.name || '',
      field: m.field || 'fisika',
      era: m.era || '',
      specialty: m.specialty || '',
      biography: m.biography || '',
      signature_quote: m.signature_quote || '',
      persona_prompt: m.persona_prompt || '',
      research_bonus: m.research_bonus || '+15% Efisiensi Riset',
      is_ai_generated: m.is_ai_generated || 0
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDeleteMentor(id, name) {
    if (!window.confirm(`Hapus tokoh "${name}"?`)) return;
    try {
      await api.deleteMentor(id);
      if (mentorForm.id === id) setMentorForm(EMPTY_MENTOR_FORM);
      await onReloadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    setSavingUser(true);
    setError('');
    setNotice('');
    try {
      const res = await api.createAdminUser({
        name: uName,
        email: uEmail,
        password: uPassword,
        role: uRole,
        specialty_field: uField,
        city_name: uCity
      });
      setNotice(`Akun "${res.user.name}" (${res.user.role}) berhasil ditambahkan!`);
      setUName('');
      setUEmail('');
      setUPassword('');
      setURole('user');
      await loadUsers();
      await onReloadAll();
    } catch (err) {
      setError(err.message || 'Gagal menambahkan user.');
    } finally {
      setSavingUser(false);
    }
  }

  async function handleDeleteUser(id, name) {
    if (!window.confirm(`Hapus akun "${name}"?`)) return;
    setError('');
    try {
      await api.deleteAdminUser(id);
      await loadUsers();
      await onReloadAll();
    } catch (err) {
      setError(err.message || 'Gagal menghapus akun.');
    }
  }

  function toggleQuestField(fId) {
    setQFields((prev) =>
      prev.includes(fId) ? prev.filter((x) => x !== fId) : [...prev, fId]
    );
  }

  async function handleCreateQuest(e) {
    e.preventDefault();
    if (!qTitle.trim() || !qDesc.trim() || qFields.length === 0) return;
    setCreatingQuest(true);
    setError('');
    setNotice('');
    try {
      await api.createQuest({
        title: qTitle.trim(),
        description: qDesc.trim(),
        fields: qFields,
        reward_node_title: qReward.trim() || `Era ${qTitle.trim()}`
      });
      setQTitle('');
      setQDesc('');
      setQReward('');
      setNotice('World Quest & Node Tech Tree baru berhasil dibuat!');
      await onReloadAll();
    } catch (err) {
      setError(err.message || 'Gagal membuat World Quest.');
    } finally {
      setCreatingQuest(false);
    }
  }

  return (
    <div className="space-y-4 pb-28 md:pb-10">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
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
        <span className="px-3 py-1 rounded-full bg-[#F7C948] border-[2px] border-[#0F242D] text-xs font-extrabold">
          Panel Admin
        </span>
      </div>

      {/* Sub-Navigasi Admin (5 Tab: Gemini, Bidang, Tokoh, User, Quest) */}
      <div className="grid grid-cols-5 gap-1 p-1 bg-white border-[2.5px] border-[#0F242D] rounded-2xl shadow-neo-sm">
        {[
          { id: 'ai', label: 'Gemini' },
          { id: 'fields', label: 'Bidang' },
          { id: 'mentors', label: 'Tokoh' },
          { id: 'users', label: 'User' },
          { id: 'quests', label: 'Quest' }
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setSubTab(t.id);
              setError('');
              setNotice('');
            }}
            className={`py-2 rounded-xl text-[11px] font-extrabold transition ${
              subTab === t.id
                ? 'bg-[#F7C948] border-[2px] border-[#0F242D]'
                : 'text-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {notice && (
        <div className="p-3 rounded-xl bg-emerald-50 border-[2px] border-emerald-600 text-emerald-800 text-xs font-bold">
          {notice}
        </div>
      )}
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border-[2px] border-red-500 text-red-700 text-xs font-bold">
          {error}
        </div>
      )}

      {/* TAB 1: GOOGLE AI STUDIO TOKEN & PILIH MODEL TERSEDIA */}
      {subTab === 'ai' && (
        <form onSubmit={handleSaveAi} className="neo-card p-4 bg-white space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-1.5">
                <KeyRound size={18} className="text-[#0E6BA8]" />
                Token Google AI Studio
              </h2>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Masukkan atau ganti API Key Gemini, lalu ambil &amp; pilih model yang tersedia.
              </p>
            </div>
            <span
              className={`shrink-0 px-2.5 py-1 rounded-full border-[1.5px] border-[#0F242D] text-[10px] font-extrabold ${
                aiStatus.has_key ? 'bg-[#66D7C5]' : 'bg-amber-100'
              }`}
            >
              {aiStatus.has_key ? 'Terpasang' : 'Belum Diisi'}
            </span>
          </div>

          {aiStatus.has_key && (
            <div className="p-3 rounded-2xl bg-[#EEF8FA] border-[2px] border-[#0F242D] text-xs space-y-1">
              <p className="font-bold">
                Token Saat Ini: <code className="font-extrabold">{aiStatus.masked_key}</code>
              </p>
              <p className="font-bold">
                Model Aktif:{' '}
                <span className="px-2 py-0.5 rounded-lg bg-[#F7C948] border border-[#0F242D]">
                  {aiStatus.active_model}
                </span>
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-extrabold uppercase mb-1">
              {aiStatus.has_key
                ? 'Ganti API Key Google AI Studio (Opsional)'
                : 'Masukkan API Key Google AI Studio'}
            </label>
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="neo-input text-xs"
            />
            <button
              type="button"
              disabled={fetchingModels}
              onClick={handleFetchModels}
              className="mt-2.5 w-full neo-btn bg-[#9AD1F5] py-2.5 px-3 text-xs flex items-center justify-center gap-1.5"
            >
              <RefreshCw size={15} className={fetchingModels ? 'animate-spin' : ''} />
              <span>
                {fetchingModels
                  ? 'Mengambil Model dari Google AI Studio...'
                  : 'Cek Token & Ambil Daftar Model Tersedia'}
              </span>
            </button>
          </div>

          {/* Pemilihan Model Tersedia */}
          <div>
            <label className="block text-xs font-extrabold uppercase mb-1 flex items-center gap-1">
              <Cpu size={14} /> Pilih Model Tersedia
            </label>
            {availableModels.length > 0 ? (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {availableModels.map((m) => {
                  const picked = selectedModel === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedModel(m.id)}
                      className={`w-full text-left p-2.5 rounded-xl border-[2px] border-[#0F242D] transition ${
                        picked ? 'bg-[#F7C948] shadow-neo-sm' : 'bg-[#EEF8FA]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold">{m.displayName}</span>
                        {picked && <CheckCircle2 size={15} />}
                      </div>
                      <p className="text-[11px] font-bold text-slate-600">{m.id}</p>
                      {m.description && (
                        <p className="text-[10px] text-slate-600 mt-0.5 line-clamp-2">
                          {m.description}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <input
                type="text"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                placeholder="Klik 'Cek Token & Ambil Daftar Model Tersedia'"
                className="neo-input text-xs"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t-2 border-dashed border-slate-200">
            <div>
              <label className="block text-[11px] font-extrabold uppercase mb-1">Label Season</label>
              <input
                type="text"
                value={seasonInput}
                onChange={(e) => setSeasonInput(e.target.value)}
                className="neo-input text-xs py-2"
              />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold uppercase mb-1">Lokasi Server</label>
              <input
                type="text"
                value={serverInput}
                onChange={(e) => setServerInput(e.target.value)}
                className="neo-input text-xs py-2"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingAi}
            className="neo-btn-dark w-full justify-center py-3 text-xs"
          >
            <span>{savingAi ? 'Menyimpan...' : 'Simpan Token & Model Aktif'}</span>
          </button>
        </form>
      )}

      {/* TAB 1B: KELOLA & TAMBAH BIDANG RISET BARU (+ OTOMATIS BANGUN GEDUNG 3D) */}
      {subTab === 'fields' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <form onSubmit={handleCreateField} className="lg:col-span-6 neo-card p-4 bg-white space-y-3.5">
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-1.5">
                <Building2 size={18} className="text-[#0E6BA8]" />
                Tambah Bidang Riset &amp; Gedung 3D Baru
              </h2>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Setiap bidang baru otomatis membangun <strong>Gedung Paviliun 3D + jalan batu</strong>{' '}
                di Dunia Open World dan langsung tersedia untuk tokoh &amp; World Quest!
              </p>
            </div>

            {/* Live Preview Tile */}
            <div className="p-3 rounded-2xl bg-[#EEF8FA] border-[2px] border-[#0F242D] flex items-center gap-3.5">
              <div
                className="w-16 h-16 neo-tile flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: (FIELD_COLOR_PRESETS[fColorIdx] || FIELD_COLOR_PRESETS[6]).bgColor
                }}
              >
                <FieldIcon
                  iconName={fIcon}
                  size={28}
                  color={(FIELD_COLOR_PRESETS[fColorIdx] || FIELD_COLOR_PRESETS[6]).iconColor}
                />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase text-slate-500">
                  Pratinjau Bidang &amp; Gedung 3D
                </p>
                <p className="text-sm font-extrabold truncate">
                  Lab {fLabel.trim() || 'Kedokteran'}
                </p>
                <p className="text-[11px] font-semibold text-slate-600 truncate">
                  {fDesc.trim() || 'Riset & inovasi bidang baru'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase mb-1">
                Nama Bidang Riset
              </label>
              <input
                type="text"
                required
                value={fLabel}
                onChange={(e) => setFLabel(e.target.value)}
                placeholder="Misal: Kedokteran / Filsafat / Ekonomi / Astronomi / Sastra"
                className="neo-input text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase mb-1">
                Deskripsi Singkat Bidang
              </label>
              <input
                type="text"
                value={fDesc}
                onChange={(e) => setFDesc(e.target.value)}
                placeholder="Misal: Ilmu medis, farmasi & kesehatan masyarakat"
                className="neo-input text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase mb-1.5">
                Pilih Ikon Bidang
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {FIELD_ICON_OPTIONS.map((opt) => {
                  const active = fIcon === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFIcon(opt.id)}
                      className={`p-2 rounded-xl border-[2px] border-[#0F242D] flex flex-col items-center gap-1 text-[10px] font-extrabold transition ${
                        active ? 'bg-[#F7C948] shadow-neo-sm' : 'bg-[#EEF8FA]'
                      }`}
                    >
                      <FieldIcon iconName={opt.id} size={18} color="#0F242D" />
                      <span className="truncate w-full text-center">{opt.label.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase mb-1.5">
                Pilih Warna Gedung 3D &amp; Kartu
              </label>
              <div className="flex flex-wrap gap-2">
                {FIELD_COLOR_PRESETS.map((cp, idx) => (
                  <button
                    key={cp.name}
                    type="button"
                    title={cp.name}
                    onClick={() => setFColorIdx(idx)}
                    style={{ backgroundColor: cp.bgColor }}
                    className={`w-9 h-9 rounded-xl border-[2.5px] border-[#0F242D] transition ${
                      fColorIdx === idx ? 'ring-2 ring-offset-2 ring-[#0F242D] scale-110' : ''
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={savingField || !fLabel.trim()}
              className="neo-btn-dark w-full justify-center py-3 text-xs disabled:opacity-50"
            >
              <PlusCircle size={15} />
              <span>{savingField ? 'Membangun Bidang...' : 'Tambah Bidang & Bangun Gedung 3D'}</span>
            </button>
          </form>

          <div className="lg:col-span-6 neo-card p-4 bg-white space-y-2.5">
            <h3 className="text-sm font-extrabold">Daftar Bidang Riset Aktif ({fields.length})</h3>
            {fields.map((f) => {
              const countMentors = mentors.filter((m) => m.field === f.id).length;
              return (
                <div
                  key={f.id}
                  className="p-2.5 rounded-xl bg-[#EEF8FA] border-[2px] border-[#0F242D] flex items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl border-[2px] border-[#0F242D] flex items-center justify-center shrink-0"
                      style={{ backgroundColor: f.bgColor }}
                    >
                      <FieldIcon field={f.id} iconName={f.iconName} size={19} color={f.iconColor} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-extrabold truncate">{f.label}</p>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-white border border-[#0F242D]">
                          {countMentors} tokoh
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-500 truncate">
                        {f.description}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteField(f.id, f.label)}
                    className="p-2 rounded-lg bg-white border-[1.5px] border-[#0F242D] text-red-600 shrink-0"
                    aria-label={`Hapus bidang ${f.label}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: TAMBAH / EDIT TOKOH & DESKRIPSI (MANUAL ATAU GENERATE PAKAI GEMINI) */}
      {subTab === 'mentors' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <form onSubmit={handleSaveMentor} className="lg:col-span-7 neo-card p-4 bg-white space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-extrabold flex items-center gap-1.5">
                <Sparkles size={18} className="text-[#E55827]" />
                {mentorForm.id ? 'Edit Tokoh & Deskripsi' : 'Tambah Tokoh & Deskripsi'}
              </h2>
              {mentorForm.id && (
                <button
                  type="button"
                  onClick={() => setMentorForm(EMPTY_MENTOR_FORM)}
                  className="text-[11px] font-extrabold underline text-slate-600"
                >
                  Batal Edit
                </button>
              )}
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50 border-[1.5px] border-[#0F242D] flex items-start gap-2">
              <AlertTriangle size={14} className="text-[#E55827] shrink-0 mt-0.5" />
              <p className="text-[11px] font-semibold text-[#0F242D]">
                <strong>Disclaimer AI:</strong> Data tokoh yang dibuat dengan Gemini berpotensi
                mengandung kesalahan fakta. Admin dapat menyunting deskripsi sebelum menyimpan.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="col-span-2">
                <label className="block text-[11px] font-extrabold uppercase mb-1">
                  Nama Tokoh Dunia
                </label>
                <input
                  type="text"
                  required
                  value={mentorForm.name}
                  onChange={(e) => setMentorForm({ ...mentorForm, name: e.target.value })}
                  placeholder="Misal: Nikola Tesla / Ibnu Sina / Ada Lovelace"
                  className="neo-input text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase mb-1">Bidang Riset</label>
                <select
                  value={mentorForm.field}
                  onChange={(e) => setMentorForm({ ...mentorForm, field: e.target.value })}
                  className="neo-input text-xs py-2"
                >
                  {fields.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  disabled={generatingMentor || !mentorForm.name.trim()}
                  onClick={handleGenerateMentor}
                  className="w-full neo-btn bg-[#F7C948] text-xs px-3 py-2.5 disabled:opacity-50"
                >
                  {generatingMentor ? 'Mengisi...' : 'Isi Otomatis via Gemini'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-extrabold uppercase mb-1">Era Sejarah</label>
                <input
                  type="text"
                  value={mentorForm.era}
                  onChange={(e) => setMentorForm({ ...mentorForm, era: e.target.value })}
                  placeholder="1856–1943 · Era Listrik"
                  className="neo-input text-xs py-2"
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold uppercase mb-1">Keahlian Utama</label>
                <input
                  type="text"
                  value={mentorForm.specialty}
                  onChange={(e) => setMentorForm({ ...mentorForm, specialty: e.target.value })}
                  placeholder="Arus Bolak-Balik & Resonansi"
                  className="neo-input text-xs py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase mb-1">
                Deskripsi &amp; Biografi Tokoh
              </label>
              <textarea
                rows={3}
                required
                value={mentorForm.biography}
                onChange={(e) => setMentorForm({ ...mentorForm, biography: e.target.value })}
                placeholder="Tulis deskripsi tokoh atau klik 'Isi Otomatis via Gemini'..."
                className="neo-input text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase mb-1">
                Kutipan Khas Tokoh
              </label>
              <input
                type="text"
                value={mentorForm.signature_quote}
                onChange={(e) => setMentorForm({ ...mentorForm, signature_quote: e.target.value })}
                placeholder="Kutipan inspiratif tokoh..."
                className="neo-input text-xs py-2"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase mb-1">
                Instruksi Persona Percakapan (By Tokoh)
              </label>
              <textarea
                rows={2}
                value={mentorForm.persona_prompt}
                onChange={(e) => setMentorForm({ ...mentorForm, persona_prompt: e.target.value })}
                placeholder="Gaya bicara dan karakter tokoh saat berdiskusi dengan user..."
                className="neo-input text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={savingMentor}
              className="neo-btn-dark w-full justify-center py-2.5 text-xs"
            >
              <PlusCircle size={15} />
              <span>
                {savingMentor
                  ? 'Menyimpan...'
                  : mentorForm.id
                    ? 'Simpan Perubahan Tokoh'
                    : 'Tambah Tokoh ke Database'}
              </span>
            </button>
          </form>

          {/* Daftar Tokoh Aktif + Rekomendasi Tokoh dari AI (Gemini) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="neo-card p-4 bg-[#EEF8FA] space-y-3">
              <div>
                <h3 className="text-sm font-extrabold flex items-center gap-1.5">
                  <Sparkles size={15} className="text-[#0E6BA8]" />
                  Rekomendasi Tokoh dari AI (Gemini)
                </h3>
                <p className="text-[11px] font-semibold text-slate-600 mt-0.5">
                  Minta Gemini menyarankan tokoh sejarah baru yang belum ada di database.
                </p>
              </div>
              <div className="flex gap-2">
                <select
                  value={recommendField}
                  onChange={(e) => setRecommendField(e.target.value)}
                  className="neo-input text-xs py-2 flex-1"
                >
                  <option value="all">Semua Bidang STEAM</option>
                  {fields.map((f) => (
                    <option key={f.id} value={f.id}>
                      Bidang {f.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={loadingRecs}
                  onClick={handleGetRecommendations}
                  className="neo-btn bg-[#F7C948] px-3 py-2 text-xs shrink-0 disabled:opacity-50"
                >
                  {loadingRecs ? 'Mencari...' : 'Minta Saran AI'}
                </button>
              </div>

              {recommendations.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {recommendations.map((rec, idx) => (
                    <div
                      key={`${rec.name}_${idx}`}
                      className="p-2.5 rounded-xl bg-white border-[2px] border-[#0F242D] space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-extrabold">{rec.name}</p>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#F7C948] border border-[#0F242D]">
                          {getFieldMeta(rec.field).label}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-500">
                        {rec.era} · {rec.specialty}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-700">{rec.reason}</p>
                      <button
                        type="button"
                        disabled={generatingMentor}
                        onClick={() => handlePickRecommendation(rec)}
                        className="mt-1 neo-btn bg-[#9AD1F5] w-full py-1.5 text-[11px]"
                      >
                        Pilih &amp; Isi Otomatis ke Form
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="neo-card p-4 bg-white space-y-2.5">
              <h3 className="text-sm font-extrabold">Daftar Tokoh Tersedia ({mentors.length})</h3>
            {mentors.map((m) => (
              <div
                key={m.id}
                className="p-2.5 rounded-xl bg-[#EEF8FA] border-[2px] border-[#0F242D] flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="text-xs font-extrabold truncate">{m.name}</p>
                  <p className="text-[11px] font-bold text-slate-500 truncate">
                    {getFieldMeta(m.field).label} · {m.era}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEditMentor(m)}
                    className="p-2 rounded-lg bg-[#F7C948] border-[1.5px] border-[#0F242D]"
                    aria-label={`Edit ${m.name}`}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteMentor(m.id, m.name)}
                    className="p-2 rounded-lg bg-white border-[1.5px] border-[#0F242D] text-red-600"
                    aria-label={`Hapus ${m.name}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: KELOLA USER (ADMIN MENAMBAHKAN USER BARU) */}
      {subTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <form onSubmit={handleCreateUser} className="lg:col-span-6 neo-card p-4 bg-white space-y-3">
            <h2 className="text-base font-extrabold flex items-center gap-1.5">
              <UserPlus size={18} className="text-[#0E6BA8]" />
              Tambah Akun User Baru
            </h2>
            <p className="text-xs font-semibold text-slate-500">
              Admin dapat membuat akun peneliti baru (role <strong>User</strong> dapat langsung
              bercakap dengan tokoh 3D).
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="col-span-2">
                <label className="block text-[11px] font-extrabold uppercase mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={uName}
                  onChange={(e) => setUName(e.target.value)}
                  placeholder="Misal: Siti Rahma"
                  className="neo-input text-xs py-2"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] font-extrabold uppercase mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={uEmail}
                  onChange={(e) => setUEmail(e.target.value)}
                  placeholder="siti@legacium.app"
                  className="neo-input text-xs py-2"
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold uppercase mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={uPassword}
                  onChange={(e) => setUPassword(e.target.value)}
                  placeholder="Min 6 karakter"
                  className="neo-input text-xs py-2"
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold uppercase mb-1">Role (Default: User)</label>
                <select
                  value={uRole}
                  onChange={(e) => setURole(e.target.value)}
                  className="neo-input text-xs py-2"
                >
                  <option value="user">User — Role Default (Peneliti)</option>
                  <option value="admin">Admin (Kurator)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-extrabold uppercase mb-1">Bidang Fokus</label>
                <select
                  value={uField}
                  onChange={(e) => setUField(e.target.value)}
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
                <label className="block text-[11px] font-extrabold uppercase mb-1">Kota Riset</label>
                <input
                  type="text"
                  value={uCity}
                  onChange={(e) => setUCity(e.target.value)}
                  className="neo-input text-xs py-2"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingUser}
              className="neo-btn-dark w-full justify-center py-2.5 text-xs"
            >
              <UserPlus size={15} />
              <span>{savingUser ? 'Menambahkan...' : 'Tambahkan User ke Database'}</span>
            </button>
          </form>

          <div className="lg:col-span-6 neo-card p-4 bg-white space-y-2.5">
            <h3 className="text-sm font-extrabold">Daftar Akun Terdaftar ({usersList.length})</h3>
            {usersList.map((u) => (
              <div
                key={u.id}
                className="p-2.5 rounded-xl bg-[#EEF8FA] border-[2px] border-[#0F242D] flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-extrabold truncate">{u.name}</p>
                    <span
                      className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full border border-[#0F242D] ${
                        u.role === 'admin' ? 'bg-[#F7C948]' : 'bg-[#9AD1F5]'
                      }`}
                    >
                      {u.role}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-500 truncate">
                    {u.email} · {u.city_name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteUser(u.id, u.name)}
                  className="p-2 rounded-lg bg-white border-[1.5px] border-[#0F242D] text-red-600 shrink-0"
                  aria-label={`Hapus ${u.name}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: KELOLA & BUAT WORLD QUEST BARU */}
      {subTab === 'quests' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <form onSubmit={handleCreateQuest} className="lg:col-span-6 neo-card p-4 bg-white space-y-3">
            <h2 className="text-base font-extrabold">Buat World Quest Global Baru</h2>
            <div>
              <label className="block text-xs font-extrabold uppercase mb-1">
                Nama Proyek Raksasa
              </label>
              <input
                type="text"
                required
                value={qTitle}
                onChange={(e) => setQTitle(e.target.value)}
                placeholder="Misal: Kubah Hutan Vertikal Antariksa"
                className="neo-input text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold uppercase mb-1">
                Deskripsi Kolaborasi
              </label>
              <textarea
                rows={2}
                required
                value={qDesc}
                onChange={(e) => setQDesc(e.target.value)}
                placeholder="Jelaskan peran tiap bidang ilmu dalam proyek ini..."
                className="neo-input text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold uppercase mb-1">
                Bidang Ilmu Wajib Kolaborasi
              </label>
              <div className="flex flex-wrap gap-1.5">
                {fields.map((f) => {
                  const active = qFields.includes(f.id);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => toggleQuestField(f.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-extrabold border-[2px] border-[#0F242D] ${
                        active ? 'bg-[#F7C948]' : 'bg-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-xs font-extrabold uppercase mb-1">
                Nama Node Tech Tree yang Terbuka
              </label>
              <input
                type="text"
                value={qReward}
                onChange={(e) => setQReward(e.target.value)}
                placeholder="Misal: Era Ekosistem Orbital"
                className="neo-input text-xs"
              />
            </div>
            <button
              type="submit"
              disabled={creatingQuest}
              className="neo-btn-dark w-full justify-center py-3 text-xs"
            >
              <span>{creatingQuest ? 'Membuat...' : 'Terbitkan World Quest'}</span>
            </button>
          </form>

          <div className="lg:col-span-6 neo-card p-4 bg-white space-y-2.5">
            <h3 className="text-sm font-extrabold">Daftar World Quest ({quests.length})</h3>
            {quests.map((q) => (
              <div
                key={q.id}
                className="p-3 rounded-xl bg-[#EEF8FA] border-[2px] border-[#0F242D] flex items-start justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-extrabold truncate">{q.title}</p>
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-[#F7C948] border border-[#0F242D]">
                      {q.status}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-500 mt-0.5">{q.subtitle}</p>
                  <p className="text-[10px] font-semibold text-slate-600 mt-1 line-clamp-2">
                    {q.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteQuest(q.id, q.title)}
                  className="p-2 rounded-lg bg-white border-[1.5px] border-[#0F242D] text-red-600 shrink-0"
                  aria-label={`Hapus ${q.title}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
