/**
 * API Client untuk Legacium
 * - Mode Produksi / InfinityFree / Local PHP: otomatis memanggil ./api/*.php -> MySQL InfinityFree.
 * - Mode Preview Lokal (npm run dev tanpa server PHP): otomatis fallback ke localStorage
 *   dan tetap mendukung pemanggilan LIVE Google AI Studio API (fetch daftar model & percakapan)
 *   supaya bisa langsung diuji sebelum upload ke InfinityFree!
 */

import { DEFAULT_RESEARCH_FIELDS, normalizeField } from '../data/fields.js';

const TOKEN_KEY = 'legacium_auth_token';
const LOCAL_DB_KEY = 'legacium_local_preview_db_v2';

let backendMode = 'pure_js'; // 100% Pure JavaScript (LocalStorage & Direct Gemini API)

export function getBackendMode() {
  return backendMode;
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setStoredToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

function maskKey(key) {
  if (!key) return '';
  if (key.length <= 10) return '•'.repeat(key.length);
  return `${key.slice(0, 6)}••••••${key.slice(-4)}`;
}

// ============================================================
// SEED DATA UNTUK MODE PREVIEW LOKAL (identik dengan schema.sql)
// ============================================================
function createInitialLocalDb() {
  return {
    settings: {
      gemini_api_key: '',
      gemini_model: 'gemini-2.5-flash',
      active_season: 'ERA 01 · SEASON GENESIS',
      server_location: 'Kota Lab #01'
    },
    users: [
      {
        id: 1,
        name: 'Admin Kurator',
        email: 'admin@legacium.app',
        password: 'admin123',
        role: 'admin',
        specialty_field: 'fisika',
        city_name: 'Menara Arsip Pusat',
        city_level: 5,
        research_points: 950
      },
      {
        id: 2,
        name: 'Guruh (Peneliti)',
        email: 'user@legacium.app',
        password: 'user123',
        role: 'user',
        specialty_field: 'kimia',
        city_name: 'Kota Lab Nusantara',
        city_level: 2,
        research_points: 240
      }
    ],
    sessions: {},
    mentors: [
      {
        id: 1,
        name: 'Albert Einstein',
        field: 'fisika',
        era: '1879–1955 · Fisika Modern',
        specialty: 'Relativitas & Energi Kuantum',
        biography:
          'Fisikawan teoretis pencetus teori relativitas umum dan efek fotolistrik yang menjadi fondasi teknologi energi modern.',
        signature_quote: 'Imajinasi lebih penting daripada pengetahuan.',
        persona_prompt:
          'Kamu adalah gema memori Albert Einstein. Berbicaralah hangat, penuh rasa ingin tahu, memakai analogi eksperimen pikiran dalam Bahasa Indonesia, dan bantu pemain merancang solusi fisika untuk World Quest.',
        research_bonus: '+20% Daya Reaktor Fisika',
        accent_color: '#0E6BA8',
        is_ai_generated: 0
      },
      {
        id: 2,
        name: 'Marie Curie',
        field: 'kimia',
        era: '1867–1934 · Era Radioaktivitas',
        specialty: 'Radiokimia & Isolasi Unsur',
        biography:
          'Peraih dua Nobel di bidang Fisika dan Kimia, penemu Polonium dan Radium serta pelopor terapi radiologi medis.',
        signature_quote: 'Tidak ada dalam hidup yang perlu ditakuti, hanya perlu dipahami.',
        persona_prompt:
          'Kamu adalah gema memori Marie Curie. Berbicaralah tekun, teliti, berbasis bukti eksperimen laboratorium, penuh empati dalam Bahasa Indonesia. Bantu pemain merumuskan sintesis kimia dan kolaborasi lintas bidang.',
        research_bonus: '+20% Kemurnian Sintesis Kimia',
        accent_color: '#3CC9B8',
        is_ai_generated: 0
      },
      {
        id: 3,
        name: 'Rosalind Franklin',
        field: 'biologi',
        era: '1920–1958 · Biologi Molekuler',
        specialty: 'Kristalografi DNA & Virologi',
        biography:
          'Ahli biofisika yang foto difraksi sinar-X (Photo 51) miliknya membuktikan struktur heliks ganda DNA dan struktur virus.',
        signature_quote: 'Sains dan kehidupan sehari-hari tidak dapat dan tidak seharusnya dipisahkan.',
        persona_prompt:
          'Kamu adalah gema memori Rosalind Franklin. Berbicaralah tajam, sistematis, menghargai data presisi dan struktur molekuler dalam Bahasa Indonesia.',
        research_bonus: '+20% Akurasi Struktur Molekul',
        accent_color: '#9AD1F5',
        is_ai_generated: 0
      },
      {
        id: 4,
        name: 'Leonardo da Vinci',
        field: 'arsitektur',
        era: '1452–1519 · Renaisans',
        specialty: 'Arsitektur, Mekanika & Seni',
        biography:
          'Polimatik Renaisans yang memadukan anatomi, teknik sipil, hidrolika, aerodinamika, dan estetika dalam sketsa visioner.',
        signature_quote: 'Kesederhanaan adalah kecanggihan tertinggi.',
        persona_prompt:
          'Kamu adalah gema memori Leonardo da Vinci. Berbicaralah puitis namun teknis, menghubungkan alam, seni, dan struktur bangunan dalam Bahasa Indonesia.',
        research_bonus: '+20% Estetika & Struktur Kota',
        accent_color: '#E55827',
        is_ai_generated: 0
      },
      {
        id: 5,
        name: 'Al-Khawarizmi',
        field: 'matematika',
        era: '780–850 · Zaman Keemasan Islam',
        specialty: 'Aljabar & Algoritma',
        biography:
          'Matematikawan Baitul Hikmah Baghdad yang meletakkan dasar aljabar sistematis dan konsep algoritma komputasi modern.',
        signature_quote: 'Setiap persoalan rumit dapat diurai menjadi langkah-langkah logis yang terukur.',
        persona_prompt:
          'Kamu adalah gema memori Al-Khawarizmi. Berbicaralah tenang, logis, terstruktur langkah demi langkah seperti algoritma dalam Bahasa Indonesia.',
        research_bonus: '+20% Optimasi Algoritma',
        accent_color: '#F7C948',
        is_ai_generated: 0
      },
      {
        id: 6,
        name: 'B.J. Habibie',
        field: 'dirgantara',
        era: '1936–2019 · Era Dirgantara',
        specialty: 'Aerodinamika & Struktur Pesawat',
        biography:
          'Ilmuwan dirgantara pencetus Teori Crack Progression (Faktor Habibie) yang merevolusi keselamatan struktur pesawat modern.',
        signature_quote:
          'Keberhasilan bukanlah milik orang pintar, melainkan milik mereka yang senantiasa berusaha.',
        persona_prompt:
          'Kamu adalah gema memori B.J. Habibie. Berbicaralah penuh semangat, visioner, hangat, menekankan disiplin teknologi dan kolaborasi lintas generasi dalam Bahasa Indonesia.',
        research_bonus: '+20% Ketahanan Struktur Roket',
        accent_color: '#66D7C5',
        is_ai_generated: 0
      }
    ],
    quests: [
      {
        id: 1,
        season_code: 'SEASON-01',
        title: 'Pembangkit Fusi Bersih',
        subtitle: 'Kolaborasi Fisika · Kimia · Arsitektur',
        description:
          'Bangun reaktor energi bersih pertama untuk Kota Lab global. Fisika menjaga stabilitas plasma, Kimia merancang material pendingin, Arsitektur membentuk kubah perisai.',
        required_fields: { fisika: 100, kimia: 100, arsitektur: 100 },
        progress: { fisika: 72, kimia: 58, arsitektur: 44 },
        status: 'active',
        reward_node_title: 'Era Energi Fusi Mandiri'
      },
      {
        id: 2,
        season_code: 'SEASON-01',
        title: 'Vaksin Spektrum Universal',
        subtitle: 'Kolaborasi Biologi · Kimia · Matematika',
        description:
          'Rancang kandidat vaksin adaptif berbasis struktur protein & pemodelan algoritma untuk melindungi seluruh kota riset.',
        required_fields: { biologi: 100, kimia: 100, matematika: 100 },
        progress: { biologi: 64, kimia: 45, matematika: 50 },
        status: 'active',
        reward_node_title: 'Perisai Bioteknologi Global'
      },
      {
        id: 3,
        season_code: 'SEASON-01',
        title: 'Roket Orbit Nusantara',
        subtitle: 'Kolaborasi Dirgantara · Fisika · Matematika',
        description:
          'Luncurkan satelit arsip memori ke orbit rendah untuk mengabadikan pohon sejarah peradaban musim ini.',
        required_fields: { dirgantara: 100, fisika: 100, matematika: 100 },
        progress: { dirgantara: 38, fisika: 42, matematika: 30 },
        status: 'active',
        reward_node_title: 'Observatorium Memori Orbit'
      }
    ],
    contributions: [
      {
        id: 1,
        user_id: 2,
        user_name: 'Guruh',
        city_name: 'Kota Lab Nusantara',
        quest_id: 1,
        quest_title: 'Pembangkit Fusi Bersih',
        mentor_id: 2,
        mentor_name: 'Marie Curie',
        field: 'kimia',
        discovery_title: 'Pendingin Lithium-Boron Stabil',
        summary: 'Sintesis cairan pendingin tahan radiasi neutron untuk dinding dalam reaktor fusi.',
        points_added: 12,
        created_at: new Date().toISOString()
      }
    ],
    tech_tree_nodes: [
      {
        id: 1,
        season_code: 'SEASON-01',
        parent_id: null,
        era_tier: 1,
        title: 'Fondasi Kota Riset Genesis',
        field_combo: 'Semua Bidang',
        description:
          'Titik awal peradaban: Balai Arsip Memori dan jaringan komunikasi lintas disiplin resmi berdiri.',
        status: 'unlocked',
        linked_quest_id: null
      },
      {
        id: 2,
        season_code: 'SEASON-01',
        parent_id: 1,
        era_tier: 2,
        title: 'Era Energi Fusi Mandiri',
        field_combo: 'Fisika + Kimia + Arsitektur',
        description:
          'Terbuka ketika World Quest Pembangkit Fusi Bersih mencapai 100% kontribusi kolaboratif.',
        status: 'in_progress',
        linked_quest_id: 1
      },
      {
        id: 3,
        season_code: 'SEASON-01',
        parent_id: 1,
        era_tier: 2,
        title: 'Perisai Bioteknologi Global',
        field_combo: 'Biologi + Kimia + Matematika',
        description:
          'Terbuka ketika World Quest Vaksin Spektrum Universal tuntas diverifikasi.',
        status: 'in_progress',
        linked_quest_id: 2
      },
      {
        id: 4,
        season_code: 'SEASON-01',
        parent_id: 2,
        era_tier: 3,
        title: 'Observatorium Memori Orbit',
        field_combo: 'Dirgantara + Fisika + Matematika',
        description:
          'Puncak Season 01: Menuntaskan tonggak sejarah kolaborasi peradaban musim ini.',
        status: 'locked',
        linked_quest_id: 3
      }
    ],
    chat_messages: [],
    mentor_memories: []
  };
}

function loadLocalDb() {
  const init = createInitialLocalDb();
  try {
    const raw = localStorage.getItem(LOCAL_DB_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(init));
      return init;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.users) || parsed.users.length === 0) {
      localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(init));
      return init;
    }
    return {
      settings: { ...init.settings, ...(parsed.settings || {}) },
      users: parsed.users,
      sessions: parsed.sessions || {},
      mentors: Array.isArray(parsed.mentors) && parsed.mentors.length > 0 ? parsed.mentors : init.mentors,
      quests: Array.isArray(parsed.quests) && parsed.quests.length > 0 ? parsed.quests : init.quests,
      contributions: Array.isArray(parsed.contributions) ? parsed.contributions : init.contributions,
      tech_tree_nodes: Array.isArray(parsed.tech_tree_nodes) && parsed.tech_tree_nodes.length > 0 ? parsed.tech_tree_nodes : init.tech_tree_nodes,
      chat_messages: Array.isArray(parsed.chat_messages) ? parsed.chat_messages : [],
      mentor_memories: Array.isArray(parsed.mentor_memories) ? parsed.mentor_memories : []
    };
  } catch {
    localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(init));
    return init;
  }
}

function saveLocalDb(db) {
  localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(db));
}

function getLocalCurrentUser(db) {
  const token = getStoredToken();
  if (!token) return null;
  const userId = db.sessions[token];
  if (!userId) return null;
  const u = db.users.find((x) => x.id === userId);
  if (!u) return null;
  const { password, ...safeUser } = u;
  return safeUser;
}

// Direct Google AI Studio call (Pure JavaScript)
async function directFetchGeminiModels(apiKey) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `Google AI Studio HTTP ${res.status}`);
  }
  const models = (data.models || [])
    .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map((m) => ({
      id: (m.name || '').replace(/^models\//, ''),
      displayName: m.displayName || m.name,
      description: m.description || '',
      inputLimit: m.inputTokenLimit || null,
      outputLimit: m.outputTokenLimit || null
    }))
    .filter((m) => !/embedding|aqa/i.test(m.id));
  return models;
}

async function directCallGemini(apiKey, modelId, systemInstruction, contents, jsonMode = false) {
  const cleanModel = (modelId || 'gemini-2.5-flash').replace(/^models\//, '');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    cleanModel
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const payload = {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents,
    generationConfig: {
      temperature: jsonMode ? 0.3 : 0.7,
      maxOutputTokens: 4096,
      ...(jsonMode ? { responseMimeType: 'application/json' } : {})
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) {
    const errorMsg = data?.error?.message || `Google AI Studio HTTP ${res.status}`;
    throw new Error(errorMsg);
  }
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!text) throw new Error('Model tidak mengembalikan teks jawaban.');
  return text;
}

/**
 * Parser JSON tangguh (Fault-Tolerant JSON Parser) untuk respons AI:
 * - Menghilangkan markdown code fences (```json ... ```)
 * - Memperbaiki unescaped quotes & newlines
 * - Memperbaiki JSON terpotong (auto-close string/brackets/braces)
 * - Regex extractor fallback jika parsing JSON standar tetap gagal
 */
function robustParseJson(raw, fallback = {}) {
  if (!raw || typeof raw !== 'string') return fallback;

  // 1. Bersihkan markdown fences
  let clean = raw.trim();
  clean = clean.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

  // 2. Ambil substring dari { pertama sampai } terakhir, atau [ sampai ]
  const firstBrace = clean.indexOf('{');
  const firstBracket = clean.indexOf('[');
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    const lastBrace = clean.lastIndexOf('}');
    if (lastBrace !== -1 && lastBrace > firstBrace) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    } else {
      clean = clean.substring(firstBrace);
    }
  } else if (firstBracket !== -1) {
    const lastBracket = clean.lastIndexOf(']');
    if (lastBracket !== -1 && lastBracket > firstBracket) {
      clean = clean.substring(firstBracket, lastBracket + 1);
    } else {
      clean = clean.substring(firstBracket);
    }
  }

  // 3. Coba parse langsung
  try {
    return JSON.parse(clean);
  } catch {
    // lanjut perbaikan
  }

  // 4. Perbaikan trailing commas
  let repaired = clean.replace(/,\s*([\]}])/g, '$1');

  // 5. Perbaikan unclosed quotes & unclosed brackets/braces (jika output terpotong)
  try {
    let inString = false;
    let escaped = false;
    let openBraces = 0;
    let openBrackets = 0;
    for (let i = 0; i < repaired.length; i++) {
      const char = repaired[i];
      if (char === '\\' && !escaped) {
        escaped = true;
        continue;
      }
      if (char === '"' && !escaped) {
        inString = !inString;
      } else if (!inString) {
        if (char === '{') openBraces++;
        else if (char === '}') openBraces = Math.max(0, openBraces - 1);
        else if (char === '[') openBrackets++;
        else if (char === ']') openBrackets = Math.max(0, openBrackets - 1);
      }
      escaped = false;
    }

    let closed = repaired;
    if (inString) closed += '"';
    while (openBrackets > 0) {
      closed += ']';
      openBrackets--;
    }
    while (openBraces > 0) {
      closed += '}';
      openBraces--;
    }
    return JSON.parse(closed);
  } catch {
    // lanjut regex fallback
  }

  // 6. Regex Fallback: Ekstraksi toleran untuk Meja Bundar & Mentor
  try {
    const result = { ...fallback };

    // Ekstrak replies: {"mentor_id": X, "reply": "..."}
    const replyRegex = /\{\s*["']?mentor_id["']?\s*:\s*(\d+)[\s\S]*?["']?reply["']?\s*:\s*["']([\s\S]*?)(?:["']\s*\}|["']\s*,|$)/gi;
    const replies = [];
    let rMatch;
    while ((rMatch = replyRegex.exec(clean)) !== null) {
      replies.push({
        mentor_id: parseInt(rMatch[1], 10),
        reply: rMatch[2].replace(/\\"/g, '"').replace(/\\n/g, ' ').trim()
      });
    }
    if (replies.length > 0) {
      result.replies = replies;
    }

    // Ekstrak synthesis_title
    const titleMatch = clean.match(/["']?synthesis_title["']?\s*:\s*["']([^"'\n\r]+)["']/i);
    if (titleMatch) result.synthesis_title = titleMatch[1].trim();

    // Ekstrak synthesis_summary
    const summaryMatch = clean.match(/["']?synthesis_summary["']?\s*:\s*["']([\s\S]*?)(?:["']\s*\}|["']\s*,|$)/i);
    if (summaryMatch) result.synthesis_summary = summaryMatch[1].replace(/\\"/g, '"').replace(/\\n/g, ' ').trim();

    // Ekstrak rekomendasi
    const recRegex = /\{\s*["']?name["']?\s*:\s*["']([^"']+)["'][\s\S]*?["']?field["']?\s*:\s*["']([^"']+)["'][\s\S]*?["']?era["']?\s*:\s*["']([^"']+)["'][\s\S]*?["']?specialty["']?\s*:\s*["']([^"']+)["']/gi;
    const recs = [];
    let recMatch;
    while ((recMatch = recRegex.exec(clean)) !== null) {
      recs.push({
        name: recMatch[1],
        field: recMatch[2],
        era: recMatch[3],
        specialty: recMatch[4]
      });
    }
    if (recs.length > 0) {
      result.recommendations = recs;
    }

    // Ekstrak profil mentor tunggal
    const nameMatch = clean.match(/["']?name["']?\s*:\s*["']([^"']+)["']/i);
    if (nameMatch) result.name = nameMatch[1];
    const eraMatch = clean.match(/["']?era["']?\s*:\s*["']([^"']+)["']/i);
    if (eraMatch) result.era = eraMatch[1];
    const specMatch = clean.match(/["']?specialty["']?\s*:\s*["']([^"']+)["']/i);
    if (specMatch) result.specialty = specMatch[1];
    const bioMatch = clean.match(/["']?biography["']?\s*:\s*["']([\s\S]*?)(?:["']\s*,\s*["']|["']\s*\})/i);
    if (bioMatch) result.biography = bioMatch[1].replace(/\\"/g, '"').trim();
    const quoteMatch = clean.match(/["']?signature_quote["']?\s*:\s*["']([\s\S]*?)(?:["']\s*,\s*["']|["']\s*\})/i);
    if (quoteMatch) result.signature_quote = quoteMatch[1].replace(/\\"/g, '"').trim();
    const personaMatch = clean.match(/["']?persona_prompt["']?\s*:\s*["']([\s\S]*?)(?:["']\s*,\s*["']|["']\s*\})/i);
    if (personaMatch) result.persona_prompt = personaMatch[1].replace(/\\"/g, '"').trim();
    const bonusMatch = clean.match(/["']?research_bonus["']?\s*:\s*["']([^"']+)["']/i);
    if (bonusMatch) result.research_bonus = bonusMatch[1];

    if (result.replies || result.recommendations || result.name || result.synthesis_title) {
      return result;
    }
  } catch {
    // fallback
  }

  return fallback;
}

// ============================================================
// CORE API WRAPPER (100% PURE JAVASCRIPT - ZERO PHP/ZERO MYSQL)
// ============================================================
async function callApi(endpoint, options, localHandler) {
  // Semua request langsung ditangani oleh engine JavaScript murni + localStorage
  return await localHandler();
}

// ============================================================
// PUBLIC API METHODS
// ============================================================
export const api = {
  async login(email, password) {
    return callApi(
      'auth.php?action=login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
      async () => {
        const db = loadLocalDb();
        const normEmail = email.trim().toLowerCase();
        const found = db.users.find(
          (u) =>
            (u.email.toLowerCase() === normEmail ||
              (normEmail === 'user@legacium.app' && u.email.toLowerCase() === 'guruh@legacium.app') ||
              (normEmail === 'guruh@legacium.app' && u.email.toLowerCase() === 'user@legacium.app')) &&
            u.password === password
        );
        if (!found) throw new Error('Email atau password salah.');
        const token = `local_${Math.random().toString(36).slice(2)}_${Date.now()}`;
        db.sessions[token] = found.id;
        saveLocalDb(db);
        const { password: _, ...safeUser } = found;
        return { ok: true, token, user: safeUser };
      }
    );
  },

  async register() {
    throw new Error('Pendaftaran mandiri dinonaktifkan. Akun baru harus didaftarkan oleh Admin.');
  },

  async getMe() {
    return callApi('auth.php?action=me', { method: 'GET' }, async () => {
      const db = loadLocalDb();
      const user = getLocalCurrentUser(db);
      if (!user) throw new Error('Belum login');
      return {
        ok: true,
        user,
        meta: {
          season: db.settings.active_season,
          server_location: db.settings.server_location,
          ai_configured: Boolean(db.settings.gemini_api_key),
          active_model: db.settings.gemini_model
        }
      };
    });
  },

  async logout() {
    return callApi('auth.php?action=logout', { method: 'POST' }, async () => {
      const db = loadLocalDb();
      const token = getStoredToken();
      if (token) delete db.sessions[token];
      saveLocalDb(db);
      return { ok: true };
    });
  },

  // --- ADMIN AI CONFIG ---
  async getAdminAiStatus() {
    return callApi('admin_ai.php?action=status', { method: 'GET' }, async () => {
      const db = loadLocalDb();
      const curr = getLocalCurrentUser(db);
      if (!curr || curr.role !== 'admin') throw new Error('Khusus Admin');
      return {
        ok: true,
        has_key: Boolean(db.settings.gemini_api_key),
        masked_key: maskKey(db.settings.gemini_api_key),
        active_model: db.settings.gemini_model,
        active_season: db.settings.active_season,
        server_location: db.settings.server_location
      };
    });
  },

  async fetchGoogleAiModels(api_key) {
    return callApi(
      'admin_ai.php?action=fetch_models',
      { method: 'POST', body: JSON.stringify({ api_key }) },
      async () => {
        const db = loadLocalDb();
        const curr = getLocalCurrentUser(db);
        if (!curr || curr.role !== 'admin') throw new Error('Khusus Admin');
        const effectiveKey = (api_key || '').trim() || db.settings.gemini_api_key;
        if (!effectiveKey) throw new Error('Masukkan API Key Google AI Studio terlebih dahulu.');
        const models = await directFetchGeminiModels(effectiveKey);
        return { ok: true, models, count: models.length };
      }
    );
  },

  async saveAdminAiConfig({ api_key, model_id, active_season, server_location }) {
    return callApi(
      'admin_ai.php?action=save',
      {
        method: 'POST',
        body: JSON.stringify({ api_key, model_id, active_season, server_location })
      },
      async () => {
        const db = loadLocalDb();
        const curr = getLocalCurrentUser(db);
        if (!curr || curr.role !== 'admin') throw new Error('Khusus Admin');
        const newKey = (api_key || '').trim();
        const effectiveKey = newKey || db.settings.gemini_api_key;
        if (!effectiveKey) throw new Error('API Key Google AI Studio wajib diisi.');
        if (newKey) {
          await directFetchGeminiModels(newKey);
          db.settings.gemini_api_key = newKey;
        }
        if (model_id) db.settings.gemini_model = model_id.replace(/^models\//, '');
        if (active_season) db.settings.active_season = active_season;
        if (server_location) db.settings.server_location = server_location;
        saveLocalDb(db);
        return {
          ok: true,
          message: 'Konfigurasi Google AI Studio berhasil disimpan.',
          has_key: true,
          masked_key: maskKey(db.settings.gemini_api_key),
          active_model: db.settings.gemini_model
        };
      }
    );
  },

  // --- ADMIN USERS ---
  async getAdminUsers() {
    return callApi('admin_users.php?action=list', { method: 'GET' }, async () => {
      const db = loadLocalDb();
      const curr = getLocalCurrentUser(db);
      if (!curr || curr.role !== 'admin') throw new Error('Khusus Admin');
      return {
        ok: true,
        users: db.users.map(({ password, ...safe }) => safe)
      };
    });
  },

  async createAdminUser({ name, email, password, role = 'user', specialty_field, city_name }) {
    return callApi(
      'admin_users.php?action=create',
      {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role, specialty_field, city_name })
      },
      async () => {
        const db = loadLocalDb();
        const curr = getLocalCurrentUser(db);
        if (!curr || curr.role !== 'admin') throw new Error('Khusus Admin');
        const cleanEmail = (email || '').trim().toLowerCase();
        if (!name?.trim() || !cleanEmail || (password || '').length < 6) {
          throw new Error('Nama, email valid, dan password minimal 6 karakter wajib diisi.');
        }
        if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
          throw new Error('Email sudah terdaftar di sistem.');
        }
        const newUser = {
          id: Date.now(),
          name: name.trim(),
          email: cleanEmail,
          password,
          role: role === 'admin' ? 'admin' : 'user',
          specialty_field: specialty_field || 'fisika',
          city_name: city_name?.trim() || 'Kota Lab Nusantara',
          city_level: 1,
          research_points: 120,
          created_at: new Date().toISOString()
        };
        db.users.unshift(newUser);
        saveLocalDb(db);
        const { password: _, ...safeUser } = newUser;
        return { ok: true, message: 'Akun berhasil ditambahkan oleh Admin.', user: safeUser };
      }
    );
  },

  async deleteAdminUser(id) {
    return callApi(
      'admin_users.php?action=delete',
      { method: 'POST', body: JSON.stringify({ id }) },
      async () => {
        const db = loadLocalDb();
        const curr = getLocalCurrentUser(db);
        if (!curr || curr.role !== 'admin') throw new Error('Khusus Admin');
        if (Number(id) === Number(curr.id)) {
          throw new Error('Admin tidak dapat menghapus akunnya sendiri.');
        }
        db.users = db.users.filter((u) => Number(u.id) !== Number(id));
        saveLocalDb(db);
        return { ok: true };
      }
    );
  },

  // --- RESEARCH FIELDS (BIDANG RISET DINAMIS — ADMIN DAPAT MENAMBAH) ---
  async getFields() {
    return callApi('fields.php?action=list', { method: 'GET' }, async () => {
      const db = loadLocalDb();
      if (!Array.isArray(db.research_fields) || db.research_fields.length === 0) {
        db.research_fields = DEFAULT_RESEARCH_FIELDS.map((f, idx) => ({
          id: f.id,
          label: f.label,
          description: f.description,
          icon_name: f.iconName,
          bg_color: f.bgColor,
          icon_color: f.iconColor,
          badge_bg: f.badgeBg,
          sort_order: idx + 1
        }));
        saveLocalDb(db);
      }
      return { ok: true, fields: db.research_fields.map(normalizeField) };
    }).then((res) => ({
      ...res,
      fields: (res.fields || []).map(normalizeField)
    }));
  },

  async createField({ label, description, iconName, bgColor, iconColor, badgeBg }) {
    return callApi(
      'fields.php?action=create',
      {
        method: 'POST',
        body: JSON.stringify({
          label,
          description,
          icon_name: iconName,
          bg_color: bgColor,
          icon_color: iconColor,
          badge_bg: badgeBg
        })
      },
      async () => {
        const db = loadLocalDb();
        const curr = getLocalCurrentUser(db);
        if (!curr || curr.role !== 'admin') throw new Error('Khusus Admin');
        if (!Array.isArray(db.research_fields) || db.research_fields.length === 0) {
          db.research_fields = DEFAULT_RESEARCH_FIELDS.map((f, idx) => ({
            id: f.id,
            label: f.label,
            description: f.description,
            icon_name: f.iconName,
            bg_color: f.bgColor,
            icon_color: f.iconColor,
            badge_bg: f.badgeBg,
            sort_order: idx + 1
          }));
        }
        const cleanLabel = (label || '').trim();
        if (!cleanLabel) throw new Error('Nama bidang riset wajib diisi.');
        const id = cleanLabel
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '')
          .slice(0, 42);
        if (!id) throw new Error('Nama bidang harus mengandung huruf atau angka.');
        if (db.research_fields.some((f) => f.id === id)) {
          throw new Error(`Bidang "${cleanLabel}" sudah ada.`);
        }
        const newField = {
          id,
          label: cleanLabel,
          description: (description || '').trim() || `Riset & inovasi bidang ${cleanLabel}`,
          icon_name: iconName || 'book',
          bg_color: bgColor || '#8B5CF6',
          icon_color: iconColor || '#FFFFFF',
          badge_bg: badgeBg || '#EDE9FE',
          sort_order: db.research_fields.length + 1
        };
        db.research_fields.push(newField);
        saveLocalDb(db);
        return { ok: true, field: normalizeField(newField) };
      }
    );
  },

  async deleteField(id) {
    return callApi(
      'fields.php?action=delete',
      { method: 'POST', body: JSON.stringify({ id }) },
      async () => {
        const db = loadLocalDb();
        const curr = getLocalCurrentUser(db);
        if (!curr || curr.role !== 'admin') throw new Error('Khusus Admin');
        const list = db.research_fields || [];
        if (list.length <= 1) throw new Error('Minimal harus tersisa 1 bidang riset.');
        if (db.mentors.some((m) => m.field === id)) {
          throw new Error(
            'Bidang ini masih memiliki tokoh terdaftar. Pindahkan atau hapus tokohnya terlebih dahulu.'
          );
        }
        db.research_fields = list.filter((f) => f.id !== id);
        saveLocalDb(db);
        return { ok: true };
      }
    );
  },

  // --- MENTORS ---
  async getMentors(field = '') {
    const qs = field ? `?action=list&field=${encodeURIComponent(field)}` : '?action=list';
    return callApi(`mentors.php${qs}`, { method: 'GET' }, async () => {
      const db = loadLocalDb();
      const mentors = field ? db.mentors.filter((m) => m.field === field) : db.mentors;
      return { ok: true, mentors };
    });
  },

  async recommendMentorsWithAi(field = 'all') {
    return callApi(
      'mentors.php?action=recommend',
      { method: 'POST', body: JSON.stringify({ field }) },
      async () => {
        const db = loadLocalDb();
        const curr = getLocalCurrentUser(db);
        if (!curr || curr.role !== 'admin') throw new Error('Khusus Admin');
        const apiKey = db.settings.gemini_api_key;
        const model = db.settings.gemini_model || 'gemini-2.5-flash';
        if (!apiKey) throw new Error('API Key Google AI Studio belum diatur oleh Admin.');

        const excludeList = db.mentors.map((m) => m.name).join(', ') || '(belum ada)';
        const dynamicFieldIds = (
          Array.isArray(db.research_fields) && db.research_fields.length > 0
            ? db.research_fields
            : DEFAULT_RESEARCH_FIELDS
        ).map((f) => f.id);
        const allowedFieldsStr = dynamicFieldIds.join(', ');
        const fieldScope =
          !field || field === 'all'
            ? `lintas bidang riset berikut (${allowedFieldsStr})`
            : `khusus bidang "${field}"`;

        const systemPrompt =
          'Kamu adalah kurator sejarah sains & tokoh dunia untuk game edukasi Legacium. Kembalikan HANYA JSON valid berbahasa Indonesia tanpa markdown fence.';
        const userPrompt = `Berikan 5 rekomendasi tokoh sejarah nyata (campuran tokoh dunia dan tokoh Indonesia jika relevan) ${fieldScope} yang cocok dijadikan mentor riset di game Legacium.
JANGAN merekomendasikan tokoh yang sudah ada berikut ini: ${excludeList}.
Nilai field WAJIB salah satu dari: ${allowedFieldsStr}.
Format JSON wajib:
{"recommendations":[{"name":"","field":"${dynamicFieldIds[0] || 'fisika'}","era":"","specialty":"","reason":""}]}`;

        const raw = await directCallGemini(
          apiKey,
          model,
          systemPrompt,
          [{ role: 'user', parts: [{ text: userPrompt }] }],
          true
        );
        const parsed = robustParseJson(raw, { recommendations: [] });
        return {
          ok: true,
          recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
          model_used: model
        };
      }
    );
  },

  async generateMentorWithAi(name, field, description_hint = '') {
    return callApi(
      'mentors.php?action=generate',
      { method: 'POST', body: JSON.stringify({ name, field, description_hint }) },
      async () => {
        const db = loadLocalDb();
        const curr = getLocalCurrentUser(db);
        if (!curr || curr.role !== 'admin') throw new Error('Khusus Admin');
        const apiKey = db.settings.gemini_api_key;
        const model = db.settings.gemini_model || 'gemini-2.5-flash';
        if (!apiKey) throw new Error('API Key Google AI Studio belum diatur oleh Admin.');

        const systemPrompt =
          'Kamu adalah kurator sejarah sains untuk game Legacium. Kembalikan HANYA JSON valid berbahasa Indonesia tanpa markdown fence. Gunakan petik tunggal jika mengutip istilah.';
        const hintLine = description_hint?.trim()
          ? `\nCatatan/deskripsi awal dari Admin yang wajib dipertimbangkan: ${description_hint.trim()}`
          : '';
        const userPrompt = `Buat profil data tokoh sejarah nyata bernama "${name}" pada bidang riset "${field}" untuk menjadi mentor di game Legacium.${hintLine}
Format JSON wajib dengan key:
{"name":"","era":"","specialty":"","biography":"","signature_quote":"","persona_prompt":"","research_bonus":""}`;

        const raw = await directCallGemini(
          apiKey,
          model,
          systemPrompt,
          [{ role: 'user', parts: [{ text: userPrompt }] }],
          true
        );
        const parsed = robustParseJson(raw, {
          name,
          era: 'Era Sejarah',
          specialty: field,
          biography: `Tokoh bersejarah dalam bidang riset ${field}.`,
          signature_quote: 'Pengetahuan adalah warisan abadi kemanusiaan.',
          persona_prompt: `Kamu adalah gema memori ${name}. Berbicaralah edukatif dan hangat.`,
          research_bonus: '+15% Efisiensi Riset'
        });
        const colorMap = {
          fisika: '#0E6BA8',
          kimia: '#3CC9B8',
          biologi: '#9AD1F5',
          arsitektur: '#E55827',
          matematika: '#F7C948',
          dirgantara: '#66D7C5'
        };
        return {
          ok: true,
          draft: { ...parsed, field, accent_color: colorMap[field] || '#0E6BA8' },
          model_used: model
        };
      }
    );
  },

  async createMentor(payload) {
    return callApi(
      'mentors.php?action=create',
      { method: 'POST', body: JSON.stringify(payload) },
      async () => {
        const db = loadLocalDb();
        const curr = getLocalCurrentUser(db);
        if (!curr || curr.role !== 'admin') throw new Error('Khusus Admin');
        const colorMap = {
          fisika: '#0E6BA8',
          kimia: '#3CC9B8',
          biologi: '#9AD1F5',
          arsitektur: '#E55827',
          matematika: '#F7C948',
          dirgantara: '#66D7C5'
        };
        const mentor = {
          ...payload,
          id: Date.now(),
          era: payload.era || 'Era Sejarah',
          specialty: payload.specialty || payload.field,
          signature_quote:
            payload.signature_quote || 'Ilmu pengetahuan adalah warisan abadi kemanusiaan.',
          persona_prompt:
            payload.persona_prompt ||
            `Kamu adalah gema memori ${payload.name}. Berbicaralah hangat, edukatif, dan autentik sesuai deskripsimu: ${payload.biography}`,
          research_bonus: payload.research_bonus || '+15% Efisiensi Riset',
          accent_color: payload.accent_color || colorMap[payload.field] || '#0E6BA8',
          is_ai_generated: payload.is_ai_generated ? 1 : 0
        };
        db.mentors.push(mentor);
        saveLocalDb(db);
        return { ok: true, mentor };
      }
    );
  },

  async updateMentor(payload) {
    return callApi(
      'mentors.php?action=update',
      { method: 'POST', body: JSON.stringify(payload) },
      async () => {
        const db = loadLocalDb();
        const curr = getLocalCurrentUser(db);
        if (!curr || curr.role !== 'admin') throw new Error('Khusus Admin');
        const idx = db.mentors.findIndex((m) => Number(m.id) === Number(payload.id));
        if (idx === -1) throw new Error('Tokoh tidak ditemukan.');
        db.mentors[idx] = { ...db.mentors[idx], ...payload };
        saveLocalDb(db);
        return { ok: true, mentor: db.mentors[idx] };
      }
    );
  },

  async deleteMentor(id) {
    return callApi(
      'mentors.php?action=delete',
      { method: 'POST', body: JSON.stringify({ id }) },
      async () => {
        const db = loadLocalDb();
        db.mentors = db.mentors.filter((m) => m.id !== id);
        saveLocalDb(db);
        return { ok: true };
      }
    );
  },

  // --- CHAT & MEMORIES (KHUSUS ROLE USER, BY TOKOH) ---
  async getChatHistory(mentorId) {
    return callApi(`chat.php?action=history&mentor_id=${mentorId}`, { method: 'GET' }, async () => {
      const db = loadLocalDb();
      const curr = getLocalCurrentUser(db);
      if (!curr) throw new Error('Belum login');
      if (curr.role !== 'user') {
        return { ok: true, can_chat: false, messages: [], memories: [] };
      }
      return {
        ok: true,
        can_chat: true,
        messages: db.chat_messages.filter(
          (m) => m.user_id === curr.id && Number(m.mentor_id) === Number(mentorId)
        ),
        memories: db.mentor_memories.filter(
          (m) => m.user_id === curr.id && Number(m.mentor_id) === Number(mentorId)
        )
      };
    });
  },

  async sendChatMessage({ mentor_id, message, quest_context = '' }) {
    return callApi(
      'chat.php?action=send',
      { method: 'POST', body: JSON.stringify({ mentor_id, message, quest_context }) },
      async () => {
        const db = loadLocalDb();
        const curr = getLocalCurrentUser(db);
        if (!curr) throw new Error('Belum login');
        if (curr.role !== 'user') {
          throw new Error(
            'Percakapan dengan tokoh hanya dapat dilakukan setelah login sebagai role User.'
          );
        }
        const apiKey = db.settings.gemini_api_key;
        const model = db.settings.gemini_model || 'gemini-2.5-flash';
        if (!apiKey) {
          throw new Error(
            'Google AI Studio API Key belum dipasang oleh Admin. Masuk sebagai Admin untuk memasukkan token & memilih model.'
          );
        }
        const mentor = db.mentors.find((m) => Number(m.id) === Number(mentor_id));
        if (!mentor) throw new Error('Mentor tidak ditemukan.');

        const memories = db.mentor_memories
          .filter((m) => m.user_id === curr.id && Number(m.mentor_id) === Number(mentor_id))
          .slice(-5);
        const memText = memories.length
          ? `\n\nMemori kolaborasi terikat sebelumnya:\n${memories
              .map((x) => `- ${x.title}: ${x.memory_summary}`)
              .join('\n')}`
          : '';

        const prev = db.chat_messages
          .filter((m) => m.user_id === curr.id && Number(m.mentor_id) === Number(mentor_id))
          .slice(-12)
          .map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.message }]
          }));

        const systemInstruction = `IDENTITAS TOKOH (WAJIB DIPERANKAN SEPENUHNYA SEBAGAI ORANG PERTAMA):
- Nama: ${mentor.name}
- Bidang Ilmu: ${mentor.field} (${mentor.specialty})
- Era Sejarah: ${mentor.era}
- Deskripsi & Biografi: ${mentor.biography}
- Filosofi / Kutipan: "${mentor.signature_quote}"
- Panduan Persona: ${mentor.persona_prompt}

ATURAN PERCAKAPAN BY TOKOH:
1. Selalu berbicara sebagai ${mentor.name} dengan gaya bahasa, wawasan, dan analogi yang mencerminkan era serta keahlianmu.
2. Jangan keluar dari karakter atau menyebut dirimu sebagai asisten AI umum.
3. Kamu sedang membimbing peneliti ${curr.name} dari ${curr.city_name} (bidang fokus: ${curr.specialty_field}).
${quest_context ? `4. Konteks World Quest aktif: ${quest_context}\n` : ''}5. Jawab ringkas, inspiratif, dan edukatif (2-4 kalimat) dalam Bahasa Indonesia.${memText}`;

        const reply = await directCallGemini(apiKey, model, systemInstruction, [
          ...prev,
          { role: 'user', parts: [{ text: message }] }
        ]);

        let cleanReply = (reply || '').trim();
        // Bersihkan jika model mengembalikan format JSON atau markdown codeblock
        if (cleanReply.startsWith('{') && cleanReply.endsWith('}')) {
          try {
            const p = JSON.parse(cleanReply);
            cleanReply = p.reply || p.message || p.text || cleanReply;
          } catch {
            // abaikan
          }
        }
        cleanReply = cleanReply.replace(/^```[a-z]*\s*/i, '').replace(/```\s*$/i, '').trim();

        db.chat_messages.push(
          {
            id: Date.now(),
            user_id: curr.id,
            mentor_id: Number(mentor_id),
            sender: 'user',
            message,
            created_at: new Date().toISOString()
          },
          {
            id: Date.now() + 1,
            user_id: curr.id,
            mentor_id: Number(mentor_id),
            sender: 'mentor',
            message: cleanReply,
            model_used: model,
            created_at: new Date().toISOString()
          }
        );

        const targetUser = db.users.find((u) => u.id === curr.id);
        if (targetUser) targetUser.research_points += 5;
        saveLocalDb(db);
        return { ok: true, mentor_name: mentor.name, reply: cleanReply, model_used: model };
      }
    );
  },

  async pinMemory({ mentor_id, title, memory_summary }) {
    return callApi(
      'chat.php?action=pin_memory',
      { method: 'POST', body: JSON.stringify({ mentor_id, title, memory_summary }) },
      async () => {
        const db = loadLocalDb();
        const curr = getLocalCurrentUser(db);
        if (!curr) throw new Error('Belum login');
        if (curr.role !== 'user') {
          throw new Error('Hanya akun dengan role User yang dapat menyimpan memori percakapan.');
        }
        const memory = {
          id: Date.now(),
          user_id: curr.id,
          mentor_id: Number(mentor_id),
          title,
          memory_summary,
          created_at: new Date().toISOString()
        };
        db.mentor_memories.unshift(memory);
        saveLocalDb(db);
        return { ok: true, memory };
      }
    );
  },

  // --- MEJA BUNDAR LINTAS ERA (CROSS-MENTOR ROUNDTABLE 2–4 TOKOH UNIK) ---
  async getRoundtables() {
    return callApi('roundtable.php?action=list', { method: 'GET' }, async () => {
      const db = loadLocalDb();
      const curr = getLocalCurrentUser(db);
      if (!curr) throw new Error('Belum login');
      const list = (db.roundtable_sessions || [])
        .filter((r) => r.user_id === curr.id)
        .map((r) => {
          if (Array.isArray(r.participants) && Array.isArray(r.replies)) return r;
          return {
            ...r,
            participants: [
              { id: r.mentor_a_id, name: r.mentor_a_name, field: r.mentor_a_field },
              { id: r.mentor_b_id, name: r.mentor_b_name, field: r.mentor_b_field }
            ],
            replies: [
              {
                mentor_id: r.mentor_a_id,
                mentor_name: r.mentor_a_name,
                field: r.mentor_a_field,
                reply: r.mentor_a_reply
              },
              {
                mentor_id: r.mentor_b_id,
                mentor_name: r.mentor_b_name,
                field: r.mentor_b_field,
                reply: r.mentor_b_reply
              }
            ]
          };
        });
      return { ok: true, sessions: list };
    });
  },

  async runRoundtableDiscussion({ mentor_ids, quest_id = null, topic }) {
    return callApi(
      'roundtable.php?action=discuss',
      {
        method: 'POST',
        body: JSON.stringify({ mentor_ids, quest_id, topic })
      },
      async () => {
        const db = loadLocalDb();
        const curr = getLocalCurrentUser(db);
        if (!curr) throw new Error('Belum login');
        if (curr.role !== 'user') {
          throw new Error(
            'Meja Bundar Lintas Era hanya dapat dijalankan setelah login sebagai role User.'
          );
        }
        const apiKey = db.settings.gemini_api_key;
        const model = db.settings.gemini_model || 'gemini-2.5-flash';
        if (!apiKey) {
          throw new Error(
            'API Key Google AI Studio belum dipasang oleh Admin. Masuk sebagai Admin untuk memasukkan token.'
          );
        }

        const cleanIds = (mentor_ids || []).map(Number).filter((x) => x > 0);
        const uniqueIds = [...new Set(cleanIds)];
        if (cleanIds.length !== uniqueIds.length) {
          throw new Error('Tokoh yang dipilih tidak boleh sama antar slot.');
        }
        if (uniqueIds.length < 2 || uniqueIds.length > 4) {
          throw new Error('Pilih minimal 2 tokoh dan maksimal 4 tokoh untuk Meja Bundar Lintas Era.');
        }

        const orderedMentors = uniqueIds.map((id) => db.mentors.find((m) => Number(m.id) === id));
        if (orderedMentors.some((m) => !m)) {
          throw new Error('Salah satu tokoh tidak ditemukan.');
        }

        const quest = quest_id ? db.quests.find((q) => Number(q.id) === Number(quest_id)) : null;
        const mentorDescBlock = orderedMentors
          .map(
            (m, i) =>
              `TOKOH #${i + 1} (id=${m.id}): ${m.name} (${m.era}, bidang ${m.field} - ${m.specialty}). Deskripsi: ${m.biography}. Gaya: ${m.persona_prompt}`
          )
          .join('\n');

        const systemPrompt =
          'Kamu adalah sutradara simulasi Meja Bundar Lintas Era untuk game STEAM Legacium. Kembalikan HANYA format JSON valid berbahasa Indonesia tanpa markdown fence. PENTING: Gunakan tanda petik tunggal (\') jika ingin mengutip istilah di dalam teks agar tidak merusak format JSON.';
        const userPrompt = `Peneliti bernama ${curr.name} dari ${curr.city_name} mengajukan tantangan lintas disiplin:
"${topic}"
${quest ? `Konteks World Quest: ${quest.title} (${quest.description})\n` : ''}
Peserta Meja Bundar (${orderedMentors.length} tokoh):
${mentorDescBlock}

Susun diskusi berantai di mana setiap tokoh berbicara sebagai orang pertama (2-3 kalimat) sesuai era & bidangnya, dan tokoh berikutnya secara spesifik menanggapi & melengkapi gagasan tokoh sebelumnya.
Format JSON wajib:
{
  "replies": [
    {"mentor_id": ID_ANGKA_TOKOH, "reply": "Tanggapan orang pertama tokoh tersebut"}
  ],
  "synthesis_title": "Judul Blueprint Sintesis Gabungan (maks 70 karakter)",
  "synthesis_summary": "Ringkasan konkret 2-3 kalimat bagaimana gabungan semua bidang peserta memecahkan masalah ini."
}`;

        const raw = await directCallGemini(
          apiKey,
          model,
          systemPrompt,
          [{ role: 'user', parts: [{ text: userPrompt }] }],
          true
        );
        const parsed = robustParseJson(raw, {
          replies: [],
          synthesis_title: `Sintesis ${orderedMentors.map((m) => m.name).join(' × ')}`,
          synthesis_summary: `Kolaborasi multidisiplin antara ${orderedMentors.map((m) => m.name).join(', ')} untuk menyelesaikan tantangan riset ini.`
        });

        const participants = orderedMentors.map((m) => ({
          id: m.id,
          name: m.name,
          field: m.field,
          era: m.era
        }));
        const parsedReplies = Array.isArray(parsed.replies) ? parsed.replies : [];
        const replies = orderedMentors.map((m, idx) => {
          const hit =
            parsedReplies.find((r) => Number(r.mentor_id) === Number(m.id)) || parsedReplies[idx];
          return {
            mentor_id: m.id,
            mentor_name: m.name,
            field: m.field,
            reply: hit?.reply || `Dari perspektif ${m.field} (${m.specialty}), kita dapat menyatukan gagasan era ${m.era} dengan bidang rekan sekalian demi memecahkan masalah ini.`
          };
        });

        const session = {
          id: Date.now(),
          user_id: curr.id,
          quest_id: quest ? quest.id : null,
          topic,
          participants,
          replies,
          synthesis_title:
            parsed.synthesis_title || `Sintesis ${participants.map((p) => p.name).join(' × ')}`,
          synthesis_summary: parsed.synthesis_summary || '',
          model_used: model,
          created_at: new Date().toISOString()
        };

        db.roundtable_sessions = [session, ...(db.roundtable_sessions || [])];
        const targetUser = db.users.find((u) => u.id === curr.id);
        if (targetUser) targetUser.research_points += 10 + participants.length * 5;
        saveLocalDb(db);
        return { ok: true, session };
      }
    );
  },

  // --- WORLD QUESTS & CONTRIBUTIONS ---
  async getQuests() {
    return callApi('quests.php?action=list', { method: 'GET' }, async () => {
      const db = loadLocalDb();
      const curr = getLocalCurrentUser(db);
      return {
        ok: true,
        quests: db.quests,
        recent_contributions: db.contributions,
        my_contributions: curr ? db.contributions.filter((c) => c.user_id === curr.id) : []
      };
    });
  },

  async submitContribution({
    quest_id,
    mentor_id,
    field,
    secondary_field = '',
    extra_fields = [],
    discovery_title,
    summary
  }) {
    return callApi(
      'quests.php?action=contribute',
      {
        method: 'POST',
        body: JSON.stringify({
          quest_id,
          mentor_id,
          field,
          secondary_field,
          extra_fields,
          discovery_title,
          summary
        })
      },
      async () => {
        const db = loadLocalDb();
        const curr = getLocalCurrentUser(db);
        if (!curr) throw new Error('Belum login');
        const quest = db.quests.find((q) => Number(q.id) === Number(quest_id));
        if (!quest) throw new Error('World Quest tidak ditemukan');
        const mentor = db.mentors.find((m) => Number(m.id) === Number(mentor_id));

        let added = quest.required_fields[field] ? 12 : 8;
        quest.progress[field] = Math.min(
          quest.required_fields[field] || 100,
          (quest.progress[field] || 0) + added
        );

        // Bonus Sinergi STEAM lintas 2-4 bidang (dari Meja Bundar Lintas Era)
        const bonusFields = [
          ...new Set([secondary_field, ...(extra_fields || [])].filter((f) => f && f !== field))
        ];
        bonusFields.forEach((bf) => {
          const boost = quest.required_fields[bf] ? 10 : 6;
          quest.progress[bf] = Math.min(
            quest.required_fields[bf] || 100,
            (quest.progress[bf] || 0) + boost
          );
          added += boost;
        });

        const allDone = Object.entries(quest.required_fields).every(
          ([k, target]) => (quest.progress[k] || 0) >= target
        );
        if (allDone) {
          quest.status = 'completed';
          const linkedNode = db.tech_tree_nodes.find(
            (n) => Number(n.linked_quest_id) === Number(quest.id)
          );
          if (linkedNode) {
            linkedNode.status = 'unlocked';
          }
        }

        const contribution = {
          id: Date.now(),
          user_id: curr.id,
          user_name: curr.name,
          city_name: curr.city_name,
          quest_id: Number(quest_id),
          quest_title: quest.title,
          mentor_id: mentor ? mentor.id : null,
          mentor_name: mentor ? mentor.name : null,
          field,
          secondary_field: secondary_field || null,
          discovery_title,
          summary,
          points_added: added,
          created_at: new Date().toISOString()
        };
        db.contributions.unshift(contribution);

        const targetUser = db.users.find((u) => u.id === curr.id);
        if (targetUser) {
          targetUser.research_points += bonusFields.length > 0 ? 45 : 30;
          targetUser.city_level = Math.floor(targetUser.research_points / 150) + 1;
        }
        saveLocalDb(db);
        return { ok: true, contribution, quest_status: quest.status, progress: quest.progress };
      }
    );
  },

  async createQuest({ title, subtitle, description, fields, reward_node_title }) {
    return callApi(
      'quests.php?action=create_quest',
      {
        method: 'POST',
        body: JSON.stringify({ title, subtitle, description, fields, reward_node_title })
      },
      async () => {
        const db = loadLocalDb();
        const req = {};
        const prog = {};
        fields.forEach((f) => {
          req[f] = 100;
          prog[f] = 0;
        });
        const qId = Date.now();
        db.quests.push({
          id: qId,
          season_code: 'SEASON-01',
          title,
          subtitle: subtitle || `Kolaborasi ${fields.join(' · ')}`,
          description,
          required_fields: req,
          progress: prog,
          status: 'active',
          reward_node_title: reward_node_title || `Era ${title}`
        });
        db.tech_tree_nodes.push({
          id: qId + 1,
          season_code: 'SEASON-01',
          parent_id: 1,
          era_tier: 2,
          title: reward_node_title || `Era ${title}`,
          field_combo: fields.join(' + '),
          description,
          status: 'in_progress',
          linked_quest_id: qId
        });
        saveLocalDb(db);
        return { ok: true, quest_id: qId };
      }
    );
  },

  async deleteQuest(id) {
    return callApi(
      'quests.php?action=delete_quest',
      { method: 'POST', body: JSON.stringify({ id }) },
      async () => {
        const db = loadLocalDb();
        db.quests = db.quests.filter((q) => Number(q.id) !== Number(id));
        db.tech_tree_nodes = db.tech_tree_nodes.filter(
          (n) => Number(n.linked_quest_id) !== Number(id)
        );
        saveLocalDb(db);
        return { ok: true };
      }
    );
  },

  // --- TECH TREE (EVOLUSI KOLEKTIF KOMUNITAS) ---
  async getTechTree() {
    return callApi('techtree.php?action=list', { method: 'GET' }, async () => {
      const db = loadLocalDb();
      const enrichedNodes = db.tech_tree_nodes.map((n) => {
        const q = n.linked_quest_id
          ? db.quests.find((x) => Number(x.id) === Number(n.linked_quest_id))
          : null;
        if (!q) {
          return {
            ...n,
            collective_percent: n.status === 'unlocked' ? 100 : 0,
            field_breakdown: null,
            contributors: []
          };
        }
        const entries = Object.entries(q.required_fields || {});
        const totalTarget = entries.reduce((sum, [, tv]) => sum + Number(tv), 0);
        const totalCurr = entries.reduce(
          (sum, [fk, tv]) => sum + Math.min(Number(tv), Number(q.progress?.[fk] || 0)),
          0
        );
        const contribs = db.contributions
          .filter((c) => Number(c.quest_id) === Number(q.id))
          .slice(0, 8)
          .map((c) => ({ name: c.user_name, city_name: c.city_name, field: c.field }));
        return {
          ...n,
          collective_percent: totalTarget > 0 ? Math.round((totalCurr / totalTarget) * 100) : 0,
          field_breakdown: { required: q.required_fields, progress: q.progress },
          contributors: contribs
        };
      });

      return {
        ok: true,
        season: db.settings.active_season,
        nodes: enrichedNodes,
        stats: {
          total_researchers: db.users.length,
          total_blueprints: db.contributions.length,
          unlocked_nodes: db.tech_tree_nodes.filter((n) => n.status === 'unlocked').length,
          total_mentors: db.mentors.length,
          total_roundtables: (db.roundtable_sessions || []).length
        }
      };
    });
  }
};
