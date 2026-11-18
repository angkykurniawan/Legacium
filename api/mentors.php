<?php
/**
 * Katalog Tokoh Dunia + Tambah/Edit/Generate Deskripsi Tokoh via Google AI Studio (Admin)
 */
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';

$colorMap = [
    'fisika' => '#0E6BA8',
    'kimia' => '#3CC9B8',
    'biologi' => '#9AD1F5',
    'arsitektur' => '#E55827',
    'matematika' => '#F7C948',
    'dirgantara' => '#66D7C5',
];

if ($method === 'GET' && $action === 'list') {
    $field = trim($_GET['field'] ?? '');
    $pdo = get_pdo();
    if ($field !== '') {
        $stmt = $pdo->prepare('SELECT * FROM mentors WHERE field = ? ORDER BY id ASC');
        $stmt->execute([$field]);
    } else {
        $stmt = $pdo->query('SELECT * FROM mentors ORDER BY id ASC');
    }
    json_response(['ok' => true, 'mentors' => $stmt->fetchAll()]);
}

if ($method === 'POST' && $action === 'recommend') {
    require_admin();
    $body = get_json_body();
    $field = trim($body['field'] ?? 'all');

    $apiKey = get_setting('gemini_api_key', '');
    $model = get_setting('gemini_model', 'gemini-2.5-flash');
    if ($apiKey === '') {
        json_response(['ok' => false, 'error' => 'API Key Google AI Studio belum diatur oleh Admin.'], 400);
    }

    $pdo = get_pdo();
    $existingNames = $pdo->query('SELECT name FROM mentors')->fetchAll(PDO::FETCH_COLUMN);
    $excludeList = count($existingNames) > 0 ? implode(', ', $existingNames) : '(belum ada)';

    $dynamicFields = ['fisika', 'kimia', 'biologi', 'arsitektur', 'matematika', 'dirgantara'];
    try {
        $fRows = $pdo->query('SELECT id FROM research_fields ORDER BY sort_order ASC')->fetchAll(PDO::FETCH_COLUMN);
        if (count($fRows) > 0) $dynamicFields = $fRows;
    } catch (Throwable $e) {
        // fallback ke 6 bidang default
    }
    $allowedFieldsStr = implode(', ', $dynamicFields);

    $fieldScope = ($field === '' || $field === 'all')
        ? "lintas bidang riset berikut ({$allowedFieldsStr})"
        : "khusus bidang \"{$field}\"";

    $systemPrompt = 'Kamu adalah kurator sejarah sains & tokoh dunia untuk game edukasi Legacium. Kembalikan HANYA JSON valid berbahasa Indonesia tanpa markdown fence.';
    $userPrompt = "Berikan 5 rekomendasi tokoh sejarah nyata (campuran tokoh dunia dan tokoh Indonesia jika relevan) {$fieldScope} yang cocok dijadikan mentor riset di game Legacium.\n"
        . "JANGAN merekomendasikan tokoh yang sudah ada berikut ini: {$excludeList}.\n"
        . "Nilai field WAJIB salah satu dari: {$allowedFieldsStr}.\n"
        . "Format JSON wajib:\n"
        . "{\n"
        . "  \"recommendations\": [\n"
        . "    {\"name\": \"Nama Tokoh\", \"field\": \"fisika\", \"era\": \"Tahun · Era\", \"specialty\": \"Keahlian utama\", \"reason\": \"1 kalimat alasan tokoh ini bermanfaat untuk kolaborasi STEAM\"}\n"
        . "  ]\n"
        . "}";

    $res = call_google_ai_generate($apiKey, $model, $systemPrompt, [
        ['role' => 'user', 'parts' => [['text' => $userPrompt]]]
    ], true);

    if (!$res['ok']) {
        json_response($res, 400);
    }

    $parsed = json_decode($res['text'], true);
    if (!is_array($parsed) && preg_match('/\{[\s\S]*\}/', $res['text'], $m)) {
        $parsed = json_decode($m[0], true);
    }
    $recs = is_array($parsed['recommendations'] ?? null) ? $parsed['recommendations'] : [];
    json_response(['ok' => true, 'recommendations' => $recs, 'model_used' => $model]);
}

if ($method === 'POST' && $action === 'generate') {
    require_admin();
    $body = get_json_body();
    $figureName = trim($body['name'] ?? '');
    $field = trim($body['field'] ?? 'fisika');
    $customHint = trim($body['description_hint'] ?? '');

    if ($figureName === '') {
        json_response(['ok' => false, 'error' => 'Nama tokoh sejarah wajib diisi.'], 422);
    }

    $apiKey = get_setting('gemini_api_key', '');
    $model = get_setting('gemini_model', 'gemini-2.5-flash');
    if ($apiKey === '') {
        json_response(['ok' => false, 'error' => 'API Key Google AI Studio belum diatur oleh Admin.'], 400);
    }

    $systemPrompt = 'Kamu adalah kurator sejarah sains untuk game Legacium. Kembalikan HANYA JSON valid berbahasa Indonesia tanpa markdown fence.';
    $hintLine = $customHint !== '' ? "\nCatatan/deskripsi awal dari Admin yang wajib dipertimbangkan: {$customHint}" : '';
    $userPrompt = "Buat profil data tokoh sejarah nyata bernama \"{$figureName}\" pada bidang riset \"{$field}\" untuk menjadi mentor di game Legacium.{$hintLine}\n"
        . "Format JSON wajib persis dengan key berikut:\n"
        . "{\n"
        . "  \"name\": \"Nama lengkap tokoh\",\n"
        . "  \"era\": \"Rentang tahun hidup · Nama era singkat (maks 45 karakter)\",\n"
        . "  \"specialty\": \"Keahlian utama singkat (maks 50 karakter)\",\n"
        . "  \"biography\": \"Deskripsi & biografi singkat akurat 2-3 kalimat dalam Bahasa Indonesia\",\n"
        . "  \"signature_quote\": \"Kutipan terkenal atau filosofi tokoh dalam Bahasa Indonesia (maks 120 karakter)\",\n"
        . "  \"persona_prompt\": \"Instruksi gaya bicara & karakter tokoh saat bercakap dengan pemain sebagai orang pertama dalam Bahasa Indonesia untuk membantu kolaborasi World Quest\",\n"
        . "  \"research_bonus\": \"Bonus riset game singkat misal '+20% Daya Reaktor'\"\n"
        . "}";

    $res = call_google_ai_generate($apiKey, $model, $systemPrompt, [
        ['role' => 'user', 'parts' => [['text' => $userPrompt]]]
    ], true);

    if (!$res['ok']) {
        json_response($res, 400);
    }

    $parsed = json_decode($res['text'], true);
    if (!is_array($parsed)) {
        if (preg_match('/\{[\s\S]*\}/', $res['text'], $m)) {
            $parsed = json_decode($m[0], true);
        }
    }
    if (!is_array($parsed)) {
        json_response(['ok' => false, 'error' => 'Respons AI tidak berupa JSON valid.', 'raw' => $res['text']], 500);
    }

    $parsed['field'] = $field;
    $parsed['accent_color'] = $colorMap[$field] ?? '#0E6BA8';
    json_response(['ok' => true, 'draft' => $parsed, 'model_used' => $model]);
}

if ($method === 'POST' && $action === 'create') {
    $admin = require_admin();
    $body = get_json_body();

    $name = trim($body['name'] ?? '');
    $field = trim($body['field'] ?? 'fisika');
    $era = trim($body['era'] ?? 'Era Sejarah');
    $specialty = trim($body['specialty'] ?? ucfirst($field));
    $biography = trim($body['biography'] ?? '');
    $quote = trim($body['signature_quote'] ?? 'Ilmu pengetahuan adalah warisan abadi kemanusiaan.');
    $persona = trim($body['persona_prompt'] ?? '');
    $bonus = trim($body['research_bonus'] ?? '+15% Efisiensi Riset');
    $accent = trim($body['accent_color'] ?? ($colorMap[$field] ?? '#0E6BA8'));
    $isAi = !empty($body['is_ai_generated']) ? 1 : 0;

    if ($name === '' || $biography === '') {
        json_response(['ok' => false, 'error' => 'Nama dan deskripsi/biografi tokoh wajib diisi.'], 422);
    }

    if ($persona === '') {
        $persona = "Kamu adalah gema memori {$name} ({$era}), ahli {$specialty}. Berbicaralah hangat, edukatif, dan autentik sesuai latar belakangmu: {$biography}";
    }

    $pdo = get_pdo();
    $stmt = $pdo->prepare(
        'INSERT INTO mentors (name, field, era, specialty, biography, signature_quote, persona_prompt, research_bonus, accent_color, is_ai_generated, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([$name, $field, $era, $specialty, $biography, $quote, $persona, $bonus, $accent, $isAi, $admin['id']]);

    $id = (int)$pdo->lastInsertId();
    $mStmt = $pdo->prepare('SELECT * FROM mentors WHERE id = ?');
    $mStmt->execute([$id]);

    json_response(['ok' => true, 'mentor' => $mStmt->fetch()], 201);
}

if ($method === 'POST' && $action === 'update') {
    require_admin();
    $body = get_json_body();
    $id = (int)($body['id'] ?? 0);
    $name = trim($body['name'] ?? '');
    $field = trim($body['field'] ?? 'fisika');
    $era = trim($body['era'] ?? '');
    $specialty = trim($body['specialty'] ?? '');
    $biography = trim($body['biography'] ?? '');
    $quote = trim($body['signature_quote'] ?? '');
    $persona = trim($body['persona_prompt'] ?? '');
    $bonus = trim($body['research_bonus'] ?? '+15% Efisiensi Riset');
    $accent = trim($body['accent_color'] ?? ($colorMap[$field] ?? '#0E6BA8'));

    if ($id <= 0 || $name === '' || $biography === '') {
        json_response(['ok' => false, 'error' => 'ID, nama, dan deskripsi tokoh wajib diisi.'], 422);
    }

    if ($persona === '') {
        $persona = "Kamu adalah gema memori {$name} ({$era}), ahli {$specialty}. {$biography}";
    }

    $pdo = get_pdo();
    $stmt = $pdo->prepare(
        'UPDATE mentors
         SET name = ?, field = ?, era = ?, specialty = ?, biography = ?, signature_quote = ?, persona_prompt = ?, research_bonus = ?, accent_color = ?
         WHERE id = ?'
    );
    $stmt->execute([$name, $field, $era, $specialty, $biography, $quote, $persona, $bonus, $accent, $id]);

    $mStmt = $pdo->prepare('SELECT * FROM mentors WHERE id = ?');
    $mStmt->execute([$id]);

    json_response(['ok' => true, 'mentor' => $mStmt->fetch()]);
}

if ($method === 'POST' && $action === 'delete') {
    require_admin();
    $body = get_json_body();
    $id = (int)($body['id'] ?? 0);
    if ($id <= 0) {
        json_response(['ok' => false, 'error' => 'ID tokoh tidak valid.'], 422);
    }
    get_pdo()->prepare('DELETE FROM mentors WHERE id = ?')->execute([$id]);
    json_response(['ok' => true]);
}

json_response(['ok' => false, 'error' => 'Endpoint mentors tidak ditemukan.'], 404);
