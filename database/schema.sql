-- ============================================================
-- LEGACIUM — MySQL Schema Siap Import ke InfinityFree phpMyAdmin
-- Cara Import:
--   1. Buka phpMyAdmin di Control Panel InfinityFree
--   2. Pilih database kamu (if0_XXXXXXXX_...)
--   3. Klik tab "Import" -> Pilih file schema.sql ini -> Klik "Go"
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Tabel Users (2 Role: 'admin' dan 'user', role default = 'user')
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  `specialty_field` VARCHAR(50) NOT NULL DEFAULT 'fisika',
  `city_name` VARCHAR(100) NOT NULL DEFAULT 'Kota Lab Nusantara',
  `city_level` INT UNSIGNED NOT NULL DEFAULT 1,
  `research_points` INT UNSIGNED NOT NULL DEFAULT 120,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabel Sesi Login (Bearer Token)
CREATE TABLE IF NOT EXISTS `user_sessions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `token` VARCHAR(128) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_sessions_token` (`token`),
  KEY `idx_sessions_user` (`user_id`),
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabel Pengaturan Aplikasi (Token Google AI Studio terenkripsi & Model Aktif)
CREATE TABLE IF NOT EXISTS `app_settings` (
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` TEXT DEFAULT NULL,
  `is_encrypted` TINYINT(1) NOT NULL DEFAULT 0,
  `updated_by` INT UNSIGNED DEFAULT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3b. Tabel Bidang Riset Dinamis (Admin dapat menambah bidang baru + otomatis jadi Gedung 3D)
CREATE TABLE IF NOT EXISTS `research_fields` (
  `id` VARCHAR(50) NOT NULL,
  `label` VARCHAR(80) NOT NULL,
  `description` VARCHAR(200) NOT NULL DEFAULT '',
  `icon_name` VARCHAR(40) NOT NULL DEFAULT 'atom',
  `bg_color` VARCHAR(20) NOT NULL DEFAULT '#0E6BA8',
  `icon_color` VARCHAR(20) NOT NULL DEFAULT '#0F242D',
  `badge_bg` VARCHAR(20) NOT NULL DEFAULT '#E0F2FE',
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 10,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabel Tokoh Dunia / Gema Memori Mentor 3D
CREATE TABLE IF NOT EXISTS `mentors` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(120) NOT NULL,
  `field` VARCHAR(50) NOT NULL,
  `era` VARCHAR(120) NOT NULL,
  `specialty` VARCHAR(150) NOT NULL,
  `biography` TEXT NOT NULL,
  `signature_quote` VARCHAR(255) NOT NULL,
  `persona_prompt` TEXT NOT NULL,
  `research_bonus` VARCHAR(120) NOT NULL DEFAULT '+15% Efisiensi Riset',
  `accent_color` VARCHAR(20) NOT NULL DEFAULT '#0E6BA8',
  `is_ai_generated` TINYINT(1) NOT NULL DEFAULT 0,
  `created_by` INT UNSIGNED DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_mentors_field` (`field`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabel World Quest (Proyek Riset Raksasa Global Lintas Bidang STEAM)
CREATE TABLE IF NOT EXISTS `world_quests` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `season_code` VARCHAR(40) NOT NULL DEFAULT 'SEASON-01',
  `title` VARCHAR(160) NOT NULL,
  `subtitle` VARCHAR(200) NOT NULL,
  `description` TEXT NOT NULL,
  `required_fields_json` TEXT NOT NULL,
  `progress_json` TEXT NOT NULL,
  `status` ENUM('active', 'completed') NOT NULL DEFAULT 'active',
  `reward_node_title` VARCHAR(160) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Tabel Kontribusi Riset & Arsip Blueprint STEAM
CREATE TABLE IF NOT EXISTS `contributions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `quest_id` INT UNSIGNED NOT NULL,
  `mentor_id` INT UNSIGNED DEFAULT NULL,
  `field` VARCHAR(50) NOT NULL,
  `secondary_field` VARCHAR(50) DEFAULT NULL,
  `discovery_title` VARCHAR(180) NOT NULL,
  `summary` TEXT NOT NULL,
  `points_added` INT UNSIGNED NOT NULL DEFAULT 25,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_contrib_user` (`user_id`),
  KEY `idx_contrib_quest` (`quest_id`),
  CONSTRAINT `fk_contrib_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_contrib_quest` FOREIGN KEY (`quest_id`) REFERENCES `world_quests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Tabel Pohon Sejarah (Collective Tech Tree per Server/Season)
CREATE TABLE IF NOT EXISTS `tech_tree_nodes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `season_code` VARCHAR(40) NOT NULL DEFAULT 'SEASON-01',
  `parent_id` INT UNSIGNED DEFAULT NULL,
  `era_tier` TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `title` VARCHAR(160) NOT NULL,
  `field_combo` VARCHAR(160) NOT NULL,
  `description` TEXT NOT NULL,
  `status` ENUM('locked', 'in_progress', 'unlocked') NOT NULL DEFAULT 'locked',
  `linked_quest_id` INT UNSIGNED DEFAULT NULL,
  `unlocked_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Tabel Riwayat Percakapan By Tokoh Dunia
CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `mentor_id` INT UNSIGNED NOT NULL,
  `sender` ENUM('user', 'mentor') NOT NULL,
  `message` TEXT NOT NULL,
  `model_used` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_chat_user_mentor` (`user_id`, `mentor_id`),
  CONSTRAINT `fk_chat_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_chat_mentor` FOREIGN KEY (`mentor_id`) REFERENCES `mentors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Tabel Memori Kolaborasi Mentor (Diingat oleh Tokoh 3D Lintas Sesi)
CREATE TABLE IF NOT EXISTS `mentor_memories` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `mentor_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(180) NOT NULL,
  `memory_summary` TEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_mem_user` (`user_id`),
  CONSTRAINT `fk_mem_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mem_mentor` FOREIGN KEY (`mentor_id`) REFERENCES `mentors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Tabel Meja Bundar Lintas Era (Cross-Mentor Roundtable 2 sampai 4 Tokoh)
CREATE TABLE IF NOT EXISTS `roundtable_sessions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `mentor_a_id` INT UNSIGNED NOT NULL,
  `mentor_b_id` INT UNSIGNED NOT NULL,
  `quest_id` INT UNSIGNED DEFAULT NULL,
  `topic` TEXT NOT NULL,
  `mentor_a_reply` TEXT NOT NULL,
  `mentor_b_reply` TEXT NOT NULL,
  `participants_json` LONGTEXT DEFAULT NULL,
  `replies_json` LONGTEXT DEFAULT NULL,
  `synthesis_title` VARCHAR(180) NOT NULL,
  `synthesis_summary` TEXT NOT NULL,
  `model_used` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rt_user` (`user_id`),
  CONSTRAINT `fk_rt_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rt_a` FOREIGN KEY (`mentor_a_id`) REFERENCES `mentors` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rt_b` FOREIGN KEY (`mentor_b_id`) REFERENCES `mentors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SEED DATA AWAL (IDEMPOTEN — AMAN DI-IMPORT ULANG)
-- ============================================================

-- Akun Default (1 akun per role; password otomatis di-upgrade ke bcrypt saat login pertama)
-- 1. Role Admin : admin@legacium.app | Password: admin123
-- 2. Role User  : user@legacium.app  | Password: user123
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `specialty_field`, `city_name`, `city_level`, `research_points`)
VALUES
  (1, 'Admin Kurator', 'admin@legacium.app', 'SEED_PLAIN:admin123', 'admin', 'fisika', 'Menara Arsip Pusat', 5, 950),
  (2, 'Peneliti Legacium', 'user@legacium.app', 'SEED_PLAIN:user123', 'user', 'kimia', 'Kota Lab Nusantara', 2, 240)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `email` = VALUES(`email`);

-- Pengaturan Default Aplikasi
INSERT INTO `app_settings` (`setting_key`, `setting_value`, `is_encrypted`)
VALUES
  ('gemini_api_key', '', 1),
  ('gemini_model', 'gemini-2.5-flash', 0),
  ('active_season', 'ERA 01 · SEASON GENESIS', 0),
  ('server_location', 'Kota Lab #01', 0)
ON DUPLICATE KEY UPDATE `setting_key` = VALUES(`setting_key`);

-- 6 Bidang Riset Awal (Admin dapat menambah bidang baru kapan saja)
INSERT INTO `research_fields` (`id`, `label`, `description`, `icon_name`, `bg_color`, `icon_color`, `badge_bg`, `sort_order`)
VALUES
  ('fisika', 'Fisika', 'Energi, plasma, relativitas & elektromagnetik', 'atom', '#0E6BA8', '#FFFFFF', '#DBEAFE', 1),
  ('kimia', 'Kimia', 'Sintesis material, katalis & radiokimia', 'flask', '#3CC9B8', '#0F242D', '#CCFBF1', 2),
  ('biologi', 'Biologi', 'Genetika molekuler, vaksin & ekosistem', 'dna', '#9AD1F5', '#0F242D', '#E0F2FE', 3),
  ('arsitektur', 'Arsitektur', 'Tata kota riset, estetika & struktur kubah', 'landmark', '#E55827', '#0F242D', '#FFEDD5', 4),
  ('matematika', 'Matematika', 'Aljabar, algoritma & pemodelan komputasi', 'cpu', '#F7C948', '#0F242D', '#FEF3C7', 5),
  ('dirgantara', 'Dirgantara', 'Aerodinamika, propulsi & satelit arsip', 'rocket', '#66D7C5', '#0F242D', '#D1FAE5', 6)
ON DUPLICATE KEY UPDATE `label` = VALUES(`label`);

-- 6 Tokoh Dunia Awal (1 per Bidang Riset STEAM)
INSERT INTO `mentors` (`id`, `name`, `field`, `era`, `specialty`, `biography`, `signature_quote`, `persona_prompt`, `research_bonus`, `accent_color`)
VALUES
  (1, 'Albert Einstein', 'fisika', '1879–1955 · Fisika Modern', 'Relativitas & Energi Kuantum', 'Fisikawan teoretis pencetus teori relativitas umum dan efek fotolistrik yang menjadi fondasi teknologi energi modern.', 'Imajinasi lebih penting daripada pengetahuan.', 'Kamu adalah gema memori Albert Einstein. Berbicaralah hangat, penuh rasa ingin tahu, sering memakai analogi eksperimen pikiran (thought experiment) yang mudah dipahami dalam Bahasa Indonesia, dan bantu pemain merancang solusi fisika untuk World Quest.', '+20% Daya Reaktor Fisika', '#0E6BA8'),
  (2, 'Marie Curie', 'kimia', '1867–1934 · Era Radioaktivitas', 'Radiokimia & Isolasi Unsur', 'Peraih dua Nobel di bidang Fisika dan Kimia, penemu Polonium dan Radium serta pelopor terapi radiologi medis.', 'Tidak ada dalam hidup yang perlu ditakuti, hanya perlu dipahami.', 'Kamu adalah gema memori Marie Curie. Berbicaralah tekun, teliti, berbasis bukti eksperimen laboratorium, penuh empati untuk kemanusiaan, dalam Bahasa Indonesia. Bantu pemain merumuskan sintesis kimia dan kolaborasi lintas bidang.', '+20% Kemurnian Sintesis Kimia', '#3CC9B8'),
  (3, 'Rosalind Franklin', 'biologi', '1920–1958 · Biologi Molekuler', 'Kristalografi DNA & Virologi', 'Ahli biofisika yang foto difraksi sinar-X (Photo 51) miliknya membuktikan struktur heliks ganda DNA dan struktur virus.', 'Sains dan kehidupan sehari-hari tidak dapat dan tidak seharusnya dipisahkan.', 'Kamu adalah gema memori Rosalind Franklin. Berbicaralah tajam, sistematis, menghargai data presisi dan struktur molekuler, dalam Bahasa Indonesia. Bantu pemain memecahkan tantangan biologi dan vaksin.', '+20% Akurasi Struktur Molekul', '#9AD1F5'),
  (4, 'Leonardo da Vinci', 'arsitektur', '1452–1519 · Renaisans', 'Arsitektur, Mekanika & Seni', 'Polimatik Renaisans yang memadukan anatomi, teknik sipil, hidrolika, aerodinamika, dan estetika dalam sketsa visioner.', 'Kesederhanaan adalah kecanggihan tertinggi.', 'Kamu adalah gema memori Leonardo da Vinci. Berbicaralah puitis namun teknis, melihat hubungan antara alam, seni, dan struktur bangunan, dalam Bahasa Indonesia. Bantu pemain merancang tata kota riset dan struktur eksperimen.', '+20% Estetika & Struktur Kota', '#E55827'),
  (5, 'Al-Khawarizmi', 'matematika', '780–850 · Zaman Keemasan Islam', 'Aljabar & Algoritma', 'Matematikawan Baitul Hikmah Baghdad yang meletakkan dasar aljabar sistematis dan konsep algoritma komputasi modern.', 'Setiap persoalan rumit dapat diurai menjadi langkah-langkah logis yang terukur.', 'Kamu adalah gema memori Muhammad ibn Musa al-Khawarizmi. Berbicaralah tenang, logis, terstruktur langkah demi langkah seperti algoritma, dalam Bahasa Indonesia. Bantu pemain memodelkan perhitungan sistem dan data riset.', '+20% Optimasi Algoritma', '#F7C948'),
  (6, 'B.J. Habibie', 'dirgantara', '1936–2019 · Era Dirgantara', 'Aerodinamika & Struktur Pesawat', 'Ilmuwan dirgantara pencetus Teori Crack Progression (Faktor Habibie) yang merevolusi keselamatan struktur pesawat modern.', 'Keberhasilan bukanlah milik orang pintar, melainkan milik mereka yang senantiasa berusaha.', 'Kamu adalah gema memori B.J. Habibie. Berbicaralah penuh semangat, visioner, hangat, menekankan disiplin teknologi dan kolaborasi lintas generasi, dalam Bahasa Indonesia. Bantu pemain merancang sistem dirgantara dan energi bersih.', '+20% Ketahanan Struktur Roket', '#66D7C5')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 3 World Quest Aktif Lintas Disiplin
INSERT INTO `world_quests` (`id`, `season_code`, `title`, `subtitle`, `description`, `required_fields_json`, `progress_json`, `status`, `reward_node_title`)
VALUES
  (1, 'SEASON-01', 'Pembangkit Fusi Bersih', 'Kolaborasi Fisika · Kimia · Arsitektur', 'Bangun reaktor energi bersih pertama untuk Kota Lab global. Fisika menjaga stabilitas plasma, Kimia merancang material pendingin, Arsitektur membentuk kubah perisai.', '{"fisika":100,"kimia":100,"arsitektur":100}', '{"fisika":72,"kimia":58,"arsitektur":44}', 'active', 'Era Energi Fusi Mandiri'),
  (2, 'SEASON-01', 'Vaksin Spektrum Universal', 'Kolaborasi Biologi · Kimia · Matematika', 'Rancang kandidat vaksin adaptif berbasis struktur protein & pemodelan algoritma untuk melindungi seluruh kota riset.', '{"biologi":100,"kimia":100,"matematika":100}', '{"biologi":64,"kimia":45,"matematika":50}', 'active', 'Perisai Bioteknologi Global'),
  (3, 'SEASON-01', 'Roket Orbit Nusantara', 'Kolaborasi Dirgantara · Fisika · Matematika', 'Luncurkan satelit arsip memori ke orbit rendah untuk mengabadikan pohon sejarah peradaban musim ini.', '{"dirgantara":100,"fisika":100,"matematika":100}', '{"dirgantara":38,"fisika":42,"matematika":30}', 'active', 'Observatorium Memori Orbit')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- Pohon Sejarah (Tech Tree) Season 01
INSERT INTO `tech_tree_nodes` (`id`, `season_code`, `parent_id`, `era_tier`, `title`, `field_combo`, `description`, `status`, `linked_quest_id`)
VALUES
  (1, 'SEASON-01', NULL, 1, 'Fondasi Kota Riset Genesis', 'Semua Bidang', 'Titik awal peradaban: Balai Arsip Memori dan jaringan komunikasi lintas disiplin resmi berdiri.', 'unlocked', NULL),
  (2, 'SEASON-01', 1, 2, 'Era Energi Fusi Mandiri', 'Fisika + Kimia + Arsitektur', 'Terbuka ketika World Quest Pembangkit Fusi Bersih mencapai 100% kontribusi kolaboratif.', 'in_progress', 1),
  (3, 'SEASON-01', 1, 2, 'Perisai Bioteknologi Global', 'Biologi + Kimia + Matematika', 'Terbuka ketika World Quest Vaksin Spektrum Universal tuntas diverifikasi.', 'in_progress', 2),
  (4, 'SEASON-01', 2, 3, 'Observatorium Memori Orbit', 'Dirgantara + Fisika + Matematika', 'Puncak Season 01: Menuntaskan tonggak sejarah kolaborasi peradaban musim ini.', 'locked', 3)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- Contoh 1 Kontribusi Blueprint Awal agar Arsip & Tech Tree langsung hidup
INSERT INTO `contributions` (`id`, `user_id`, `quest_id`, `mentor_id`, `field`, `secondary_field`, `discovery_title`, `summary`, `points_added`)
VALUES
  (1, 2, 1, 2, 'kimia', NULL, 'Pendingin Lithium-Boron Stabil', 'Sintesis cairan pendingin tahan radiasi neutron untuk dinding dalam reaktor fusi bersih.', 12)
ON DUPLICATE KEY UPDATE `discovery_title` = VALUES(`discovery_title`);

SET FOREIGN_KEY_CHECKS = 1;
