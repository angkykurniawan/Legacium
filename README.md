# Legacium — Kota Riset & Gema Memori 3D Tokoh Dunia

Game kolaborasi riset lintas disiplin STEAM (Fisika, Kimia, Biologi, Arsitektur, Matematika, Dirgantara) di mana pemain berdialog dengan **karakter 3D tokoh dunia** (powered by **Google AI Studio / Gemini**), menggelar **Meja Bundar Lintas Era (2–4 tokoh)**, menuntaskan **World Quest** global, dan membentuk **Pohon Sejarah (Tech Tree)** kolektif per season.

## Tech Stack
- **Frontend:** React 18 (JavaScript) + Vite + Tailwind CSS + **Three.js** (Avatar 3D interaktif 1–4 tokoh)
- **Backend Bridge:** PHP 8 PDO REST API (`/api/*.php`) — 100% kompatibel dengan hosting **InfinityFree**
- **Database:** MySQL (InfinityFree) via file `.env` — skema siap import di `database/schema.sql`
- **AI Mentor & Kurasi Tokoh:** Google AI Studio (Gemini API) dengan pengambilan daftar model dinamis & pengaturan token khusus role **Admin**

## 2 Role Bawaan (1 Akun per Role)
- **Admin (`admin@legacium.app` / `admin123`):**
  - Mengatur & mengganti **API Key Google AI Studio**, memuat daftar model yang tersedia, dan memilih model aktif.
  - Menambah bidang riset baru (otomatis memunculkan paviliun gedung 3D baru di pulau kota riset).
  - Menambah, menyunting, dan merekomendasikan data tokoh zaman dulu via Gemini AI.
  - Mendaftarkan akun User baru (role default `user`) dan membuat World Quest baru.
- **User (`user@legacium.app` / `user123`):**
  - Berkeliling bebas di **Open World 3D** (WASD, lari, lompat, mini-map, paviliun riset STEAM, NPC interaktif).
  - Bercakap langsung dengan karakter 3D tokoh dunia & menyimpan catatan memori kolaborasi.
  - Menjalankan **Meja Bundar Lintas Era (2–4 tokoh berbeda)** untuk menghasilkan Blueprint Sintesis STEAM.
  - Berkontribusi pada **World Quest** untuk membuka era baru di **Pohon Sejarah (Tech Tree)** kolektif.

> **Catatan Demo:** Tampilan login tidak membocorkan akun bawaan. Untuk permintaan akun demo, hubungi: `kurniawan.angang2005@gmail.com`.

## Menjalankan Lokal (Development)
```bash
npm install
npm run dev
```

## Deploy ke InfinityFree (MySQL via `.env`)
1. Buka **phpMyAdmin** di panel InfinityFree dan import file `database/schema.sql`.
2. Edit file `.env` lalu masukkan `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`, dan `APP_SECRET` dari InfinityFree.
3. Jalankan build produksi:
   ```bash
   npm run build
   ```
4. Upload seluruh isi folder `dist/` (termasuk `.htaccess`), folder `api/`, dan file `.env` ke direktori `htdocs/` InfinityFree.
5. Login sebagai **Admin**, buka **Panel Admin -> Gemini**, masukkan token Google AI Studio, klik **Cek Token & Ambil Daftar Model Tersedia**, pilih model, lalu simpan.
