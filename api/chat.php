<?php
/**
 * Percakapan by Tokoh dengan Gema Memori Tokoh Dunia via Google AI Studio (Gemini)
 * + Penyimpanan Memori Kolaborasi Mentor di MySQL
 *
 * ATURAN ROLE: Percakapan hanya bisa dilakukan setelah login sebagai role 'user'.
 */
require_once __DIR__ . '/db.php';

$user = require_auth();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'history';

if ($method === 'GET' && $action === 'history') {
    $mentorId = (int)($_GET['mentor_id'] ?? 0);
    if ($mentorId <= 0) {
        json_response(['ok' => false, 'error' => 'mentor_id wajib diisi.'], 422);
    }

    // Jika bukan role user, kembalikan riwayat kosong beserta status izin chat
    if ($user['role'] !== 'user') {
        json_response([
            'ok' => true,
            'can_chat' => false,
            'messages' => [],
            'memories' => [],
        ]);
    }

    $pdo = get_pdo();
    $msgStmt = $pdo->prepare(
        'SELECT id, sender, message, model_used, created_at
         FROM chat_messages
         WHERE user_id = ? AND mentor_id = ?
         ORDER BY id ASC
         LIMIT 60'
    );
    $msgStmt->execute([$user['id'], $mentorId]);

    $memStmt = $pdo->prepare(
        'SELECT id, title, memory_summary, created_at
         FROM mentor_memories
         WHERE user_id = ? AND mentor_id = ?
         ORDER BY id DESC'
    );
    $memStmt->execute([$user['id'], $mentorId]);

    json_response([
        'ok' => true,
        'can_chat' => true,
        'messages' => $msgStmt->fetchAll(),
        'memories' => $memStmt->fetchAll(),
    ]);
}

if ($method === 'POST' && $action === 'send') {
    if ($user['role'] !== 'user') {
        json_response([
            'ok' => false,
            'error' => 'Percakapan dengan tokoh hanya dapat dilakukan setelah login sebagai role User.'
        ], 403);
    }

    $body = get_json_body();
    $mentorId = (int)($body['mentor_id'] ?? 0);
    $message = trim($body['message'] ?? '');
    $questContext = trim($body['quest_context'] ?? '');

    if ($mentorId <= 0 || $message === '') {
        json_response(['ok' => false, 'error' => 'mentor_id dan pesan wajib diisi.'], 422);
    }

    $apiKey = get_setting('gemini_api_key', '');
    $model = get_setting('gemini_model', 'gemini-2.5-flash');
    if ($apiKey === '') {
        json_response([
            'ok' => false,
            'error' => 'Google AI Studio API Key belum dipasang oleh Admin. Silakan hubungi Admin untuk mengatur token.'
        ], 400);
    }

    $pdo = get_pdo();
    $mStmt = $pdo->prepare('SELECT * FROM mentors WHERE id = ? LIMIT 1');
    $mStmt->execute([$mentorId]);
    $mentor = $mStmt->fetch();
    if (!$mentor) {
        json_response(['ok' => false, 'error' => 'Tokoh mentor tidak ditemukan.'], 404);
    }

    // Ambil memori yang sudah terikat sebelumnya KHUSUS untuk tokoh ini (percakapan by tokoh)
    $memStmt = $pdo->prepare(
        'SELECT title, memory_summary FROM mentor_memories WHERE user_id = ? AND mentor_id = ? ORDER BY id DESC LIMIT 5'
    );
    $memStmt->execute([$user['id'], $mentorId]);
    $memories = $memStmt->fetchAll();

    $memoryBlock = '';
    if (count($memories) > 0) {
        $lines = [];
        foreach ($memories as $mem) {
            $lines[] = '- ' . $mem['title'] . ': ' . $mem['memory_summary'];
        }
        $memoryBlock = "\n\nMemori kolaborasi yang sudah terikat permanen dengan peneliti {$user['name']}:\n" . implode("\n", $lines);
    }

    // Ambil 12 pesan terakhir KHUSUS untuk percakapan dengan tokoh ini
    $histStmt = $pdo->prepare(
        'SELECT sender, message FROM chat_messages WHERE user_id = ? AND mentor_id = ? ORDER BY id DESC LIMIT 12'
    );
    $histStmt->execute([$user['id'], $mentorId]);
    $history = array_reverse($histStmt->fetchAll());

    $contents = [];
    foreach ($history as $h) {
        $contents[] = [
            'role' => $h['sender'] === 'user' ? 'user' : 'model',
            'parts' => [['text' => $h['message']]]
        ];
    }
    $contents[] = [
        'role' => 'user',
        'parts' => [['text' => $message]]
    ];

    // System Instruction ketat by Tokoh (First-Person Roleplay sesuai deskripsi & era tokoh)
    $systemInstruction = "IDENTITAS TOKOH (WAJIB DIPERANKAN SEPENUHNYA SEBAGAI ORANG PERTAMA):\n"
        . "- Nama: {$mentor['name']}\n"
        . "- Bidang Ilmu: {$mentor['field']} ({$mentor['specialty']})\n"
        . "- Era Sejarah: {$mentor['era']}\n"
        . "- Deskripsi & Biografi: {$mentor['biography']}\n"
        . "- Filosofi / Kutipan: \"{$mentor['signature_quote']}\"\n"
        . "- Panduan Persona: {$mentor['persona_prompt']}\n\n"
        . "ATURAN PERCAKAPAN BY TOKOH:\n"
        . "1. Selalu berbicara sebagai {$mentor['name']} dengan sudut pandang, analogi, dan gaya bahasa yang mencerminkan era serta keahlianmu.\n"
        . "2. Jangan pernah keluar dari karakter atau menyebut dirimu sebagai asisten AI umum.\n"
        . "3. Kamu sedang membimbing peneliti bernama {$user['name']} dari {$user['city_name']} (bidang fokus: {$user['specialty_field']}).\n"
        . ($questContext !== '' ? "4. Konteks World Quest aktif saat ini: {$questContext}\n" : '')
        . "5. Jawab ringkas, mendalam, inspiratif, dan mudah dipahami (2-4 kalimat) dalam Bahasa Indonesia, serta dorong kolaborasi lintas disiplin."
        . $memoryBlock;

    $aiRes = call_google_ai_generate($apiKey, $model, $systemInstruction, $contents, false);
    if (!$aiRes['ok']) {
        json_response($aiRes, 400);
    }

    $reply = $aiRes['text'];

    // Simpan pesan user & balasan tokoh ke MySQL terikat pada mentor_id
    $ins = $pdo->prepare('INSERT INTO chat_messages (user_id, mentor_id, sender, message, model_used) VALUES (?, ?, ?, ?, ?)');
    $ins->execute([$user['id'], $mentorId, 'user', $message, null]);
    $ins->execute([$user['id'], $mentorId, 'mentor', $reply, $model]);

    // Tambah poin riset
    $pdo->prepare('UPDATE users SET research_points = research_points + 5 WHERE id = ?')->execute([$user['id']]);

    json_response([
        'ok' => true,
        'mentor_name' => $mentor['name'],
        'reply' => $reply,
        'model_used' => $model,
    ]);
}

if ($method === 'POST' && $action === 'pin_memory') {
    if ($user['role'] !== 'user') {
        json_response([
            'ok' => false,
            'error' => 'Hanya akun dengan role User yang dapat mengikat memori percakapan.'
        ], 403);
    }

    $body = get_json_body();
    $mentorId = (int)($body['mentor_id'] ?? 0);
    $title = trim($body['title'] ?? '');
    $summary = trim($body['memory_summary'] ?? '');

    if ($mentorId <= 0 || $title === '' || $summary === '') {
        json_response(['ok' => false, 'error' => 'Judul dan ringkasan memori wajib diisi.'], 422);
    }

    $pdo = get_pdo();
    $stmt = $pdo->prepare(
        'INSERT INTO mentor_memories (user_id, mentor_id, title, memory_summary)
         VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([$user['id'], $mentorId, $title, $summary]);
    $id = (int)$pdo->lastInsertId();

    $rowStmt = $pdo->prepare('SELECT id, title, memory_summary, created_at FROM mentor_memories WHERE id = ?');
    $rowStmt->execute([$id]);

    json_response(['ok' => true, 'memory' => $rowStmt->fetch()], 201);
}

json_response(['ok' => false, 'error' => 'Endpoint chat tidak ditemukan.'], 404);
