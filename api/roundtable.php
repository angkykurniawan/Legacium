<?php
/**
 * Meja Bundar Lintas Era (Cross-Mentor Roundtable 2 sampai 4 Tokoh Unik)
 * - Jumlah tokoh dapat dicustom: minimal 2, maksimal 4 tokoh.
 * - Validasi ketat: tokoh yang dipilih TIDAK BOLEH sama.
 * - Hanya dapat dijalankan setelah login sebagai role 'user'.
 */
require_once __DIR__ . '/db.php';

$user = require_auth();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';

function has_roundtable_json_columns(PDO $pdo): bool {
    static $cached = null;
    if ($cached !== null) return $cached;
    try {
        $stmt = $pdo->query("SHOW COLUMNS FROM roundtable_sessions LIKE 'participants_json'");
        $cached = (bool)$stmt->fetch();
    } catch (Throwable $e) {
        $cached = false;
    }
    return $cached;
}

if ($method === 'GET' && $action === 'list') {
    $pdo = get_pdo();
    $stmt = $pdo->prepare(
        'SELECT r.*,
                ma.name AS mentor_a_name, ma.field AS mentor_a_field,
                mb.name AS mentor_b_name, mb.field AS mentor_b_field
         FROM roundtable_sessions r
         INNER JOIN mentors ma ON ma.id = r.mentor_a_id
         INNER JOIN mentors mb ON mb.id = r.mentor_b_id
         WHERE r.user_id = ?
         ORDER BY r.id DESC
         LIMIT 20'
    );
    $stmt->execute([$user['id']]);
    $rows = $stmt->fetchAll();

    foreach ($rows as &$r) {
        $participants = !empty($r['participants_json']) ? json_decode($r['participants_json'], true) : null;
        $replies = !empty($r['replies_json']) ? json_decode($r['replies_json'], true) : null;

        if (!is_array($participants) || count($participants) === 0) {
            $participants = [
                ['id' => (int)$r['mentor_a_id'], 'name' => $r['mentor_a_name'], 'field' => $r['mentor_a_field']],
                ['id' => (int)$r['mentor_b_id'], 'name' => $r['mentor_b_name'], 'field' => $r['mentor_b_field']],
            ];
        }
        if (!is_array($replies) || count($replies) === 0) {
            $replies = [
                ['mentor_id' => (int)$r['mentor_a_id'], 'mentor_name' => $r['mentor_a_name'], 'field' => $r['mentor_a_field'], 'reply' => $r['mentor_a_reply']],
                ['mentor_id' => (int)$r['mentor_b_id'], 'mentor_name' => $r['mentor_b_name'], 'field' => $r['mentor_b_field'], 'reply' => $r['mentor_b_reply']],
            ];
        }

        $r['participants'] = $participants;
        $r['replies'] = $replies;
        unset($r['participants_json'], $r['replies_json']);
    }

    json_response(['ok' => true, 'sessions' => $rows]);
}

if ($method === 'POST' && $action === 'discuss') {
    if ($user['role'] !== 'user') {
        json_response([
            'ok' => false,
            'error' => 'Meja Bundar Lintas Era hanya dapat dijalankan setelah login sebagai role User.'
        ], 403);
    }

    $body = get_json_body();
    $questId = !empty($body['quest_id']) ? (int)$body['quest_id'] : null;
    $topic = trim($body['topic'] ?? '');

    // Terima array mentor_ids (2..4 tokoh) atau fallback mentor_a_id + mentor_b_id
    $rawIds = $body['mentor_ids'] ?? null;
    if (!is_array($rawIds)) {
        $rawIds = [
            (int)($body['mentor_a_id'] ?? 0),
            (int)($body['mentor_b_id'] ?? 0),
        ];
    }

    $mentorIds = array_values(array_filter(array_map('intval', $rawIds), fn($id) => $id > 0));
    $uniqueIds = array_values(array_unique($mentorIds));

    if (count($mentorIds) !== count($uniqueIds)) {
        json_response(['ok' => false, 'error' => 'Tokoh yang dipilih tidak boleh sama antar slot.'], 422);
    }
    if (count($uniqueIds) < 2 || count($uniqueIds) > 4) {
        json_response(['ok' => false, 'error' => 'Pilih minimal 2 tokoh dan maksimal 4 tokoh untuk Meja Bundar Lintas Era.'], 422);
    }
    if ($topic === '') {
        json_response(['ok' => false, 'error' => 'Tuliskan masalah atau topik kolaborasi terlebih dahulu.'], 422);
    }

    $apiKey = get_setting('gemini_api_key', '');
    $model = get_setting('gemini_model', 'gemini-2.5-flash');
    if ($apiKey === '') {
        json_response(['ok' => false, 'error' => 'API Key Google AI Studio belum dipasang oleh Admin.'], 400);
    }

    $pdo = get_pdo();
    $placeholders = implode(',', array_fill(0, count($uniqueIds), '?'));
    $mStmt = $pdo->prepare("SELECT * FROM mentors WHERE id IN ({$placeholders})");
    $mStmt->execute($uniqueIds);
    $rows = $mStmt->fetchAll();

    $byId = [];
    foreach ($rows as $row) {
        $byId[(int)$row['id']] = $row;
    }

    $orderedMentors = [];
    foreach ($uniqueIds as $id) {
        if (!isset($byId[$id])) {
            json_response(['ok' => false, 'error' => 'Salah satu tokoh tidak ditemukan di database.'], 404);
        }
        $orderedMentors[] = $byId[$id];
    }

    $questTitle = '';
    if ($questId) {
        $qStmt = $pdo->prepare('SELECT title, description FROM world_quests WHERE id = ? LIMIT 1');
        $qStmt->execute([$questId]);
        $q = $qStmt->fetch();
        if ($q) {
            $questTitle = $q['title'] . ' (' . $q['description'] . ')';
        }
    }

    $mentorLines = [];
    foreach ($orderedMentors as $idx => $m) {
        $num = $idx + 1;
        $mentorLines[] = "TOKOH #{$num} (id={$m['id']}): {$m['name']} ({$m['era']}, bidang {$m['field']} - {$m['specialty']}). Deskripsi: {$m['biography']}. Gaya: {$m['persona_prompt']}";
    }
    $mentorDescBlock = implode("\n", $mentorLines);
    $countN = count($orderedMentors);

    $systemPrompt = 'Kamu adalah sutradara simulasi Meja Bundar Lintas Era untuk game STEAM Legacium. Kembalikan HANYA JSON valid berbahasa Indonesia tanpa markdown fence.';
    $userPrompt = "Peneliti bernama {$user['name']} dari {$user['city_name']} mengajukan tantangan lintas disiplin:\n"
        . "\"{$topic}\"\n"
        . ($questTitle !== '' ? "Konteks World Quest: {$questTitle}\n" : '')
        . "\nPeserta Meja Bundar ({$countN} tokoh):\n{$mentorDescBlock}\n\n"
        . "Susun diskusi berantai di mana setiap tokoh berbicara sebagai orang pertama (2-3 kalimat) sesuai era & bidangnya, dan tokoh berikutnya secara spesifik menanggapi & melengkapi gagasan tokoh sebelumnya.\n"
        . "Format JSON wajib:\n"
        . "{\n"
        . "  \"replies\": [\n"
        . "    {\"mentor_id\": ID_ANGKA_TOKOH, \"reply\": \"Tanggapan orang pertama tokoh tersebut\"}\n"
        . "  ],\n"
        . "  \"synthesis_title\": \"Judul Blueprint Sintesis Gabungan (maks 70 karakter)\",\n"
        . "  \"synthesis_summary\": \"Ringkasan konkret 2-3 kalimat bagaimana gabungan semua bidang peserta memecahkan masalah ini.\"\n"
        . "}";

    $aiRes = call_google_ai_generate($apiKey, $model, $systemPrompt, [
        ['role' => 'user', 'parts' => [['text' => $userPrompt]]]
    ], true);

    if (!$aiRes['ok']) {
        json_response($aiRes, 400);
    }

    $parsed = json_decode($aiRes['text'], true);
    if (!is_array($parsed) && preg_match('/\{[\s\S]*\}/', $aiRes['text'], $m)) {
        $parsed = json_decode($m[0], true);
    }
    if (!is_array($parsed) || empty($parsed['replies']) || !is_array($parsed['replies'])) {
        json_response(['ok' => false, 'error' => 'Format diskusi sintesis dari Gemini tidak valid.'], 500);
    }

    // Petakan balasan sesuai urutan tokoh
    $replyById = [];
    foreach ($parsed['replies'] as $idx => $item) {
        $mid = isset($item['mentor_id']) ? (int)$item['mentor_id'] : (int)($orderedMentors[$idx]['id'] ?? 0);
        if ($mid > 0 && !empty($item['reply'])) {
            $replyById[$mid] = trim((string)$item['reply']);
        }
    }

    $participants = [];
    $replies = [];
    foreach ($orderedMentors as $idx => $m) {
        $mid = (int)$m['id'];
        $participants[] = [
            'id' => $mid,
            'name' => $m['name'],
            'field' => $m['field'],
            'era' => $m['era']
        ];
        $text = $replyById[$mid] ?? trim((string)($parsed['replies'][$idx]['reply'] ?? 'Mari kita satukan gagasan lintas disiplin ini!'));
        $replies[] = [
            'mentor_id' => $mid,
            'mentor_name' => $m['name'],
            'field' => $m['field'],
            'reply' => $text
        ];
    }

    $synthTitle = trim($parsed['synthesis_title'] ?? ('Sintesis ' . implode(' × ', array_column($participants, 'name'))));
    $synthSummary = trim($parsed['synthesis_summary'] ?? '');

    $firstReply = $replies[0]['reply'] ?? '';
    $secondReply = $replies[1]['reply'] ?? '';

    if (has_roundtable_json_columns($pdo)) {
        $ins = $pdo->prepare(
            'INSERT INTO roundtable_sessions
             (user_id, mentor_a_id, mentor_b_id, quest_id, topic, mentor_a_reply, mentor_b_reply, participants_json, replies_json, synthesis_title, synthesis_summary, model_used)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $ins->execute([
            $user['id'],
            $participants[0]['id'],
            $participants[1]['id'],
            $questId,
            $topic,
            $firstReply,
            $secondReply,
            json_encode($participants, JSON_UNESCAPED_UNICODE),
            json_encode($replies, JSON_UNESCAPED_UNICODE),
            $synthTitle,
            $synthSummary,
            $model
        ]);
    } else {
        $ins = $pdo->prepare(
            'INSERT INTO roundtable_sessions
             (user_id, mentor_a_id, mentor_b_id, quest_id, topic, mentor_a_reply, mentor_b_reply, synthesis_title, synthesis_summary, model_used)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $ins->execute([
            $user['id'],
            $participants[0]['id'],
            $participants[1]['id'],
            $questId,
            $topic,
            $firstReply,
            $secondReply,
            $synthTitle,
            $synthSummary,
            $model
        ]);
    }

    $newId = (int)$pdo->lastInsertId();
    $bonusRp = 10 + (count($participants) * 5);
    $pdo->prepare('UPDATE users SET research_points = research_points + ? WHERE id = ?')->execute([$bonusRp, $user['id']]);

    json_response([
        'ok' => true,
        'session' => [
            'id' => $newId,
            'quest_id' => $questId,
            'topic' => $topic,
            'participants' => $participants,
            'replies' => $replies,
            'synthesis_title' => $synthTitle,
            'synthesis_summary' => $synthSummary,
            'model_used' => $model
        ]
    ], 201);
}

json_response(['ok' => false, 'error' => 'Endpoint roundtable tidak ditemukan.'], 404);
