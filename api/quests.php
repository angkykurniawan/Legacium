<?php
/**
 * World Quests (Proyek Raksasa Lintas Disiplin STEAM) + Arsip Blueprint
 */
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';

if ($method === 'GET' && $action === 'list') {
    $user = get_auth_user();
    $pdo = get_pdo();

    $quests = $pdo->query('SELECT * FROM world_quests ORDER BY id ASC')->fetchAll();
    foreach ($quests as &$q) {
        $q['required_fields'] = json_decode($q['required_fields_json'], true) ?: [];
        $q['progress'] = json_decode($q['progress_json'], true) ?: [];
        unset($q['required_fields_json'], $q['progress_json']);
    }

    $recentStmt = $pdo->query(
        'SELECT c.*, u.name AS user_name, u.city_name, m.name AS mentor_name, wq.title AS quest_title
         FROM contributions c
         INNER JOIN users u ON u.id = c.user_id
         INNER JOIN world_quests wq ON wq.id = c.quest_id
         LEFT JOIN mentors m ON m.id = c.mentor_id
         ORDER BY c.id DESC
         LIMIT 25'
    );

    $myContribs = [];
    if ($user) {
        $myStmt = $pdo->prepare(
            'SELECT c.*, m.name AS mentor_name, wq.title AS quest_title
             FROM contributions c
             INNER JOIN world_quests wq ON wq.id = c.quest_id
             LEFT JOIN mentors m ON m.id = c.mentor_id
             WHERE c.user_id = ?
             ORDER BY c.id DESC'
        );
        $myStmt->execute([$user['id']]);
        $myContribs = $myStmt->fetchAll();
    }

    json_response([
        'ok' => true,
        'quests' => $quests,
        'recent_contributions' => $recentStmt->fetchAll(),
        'my_contributions' => $myContribs,
    ]);
}

if ($method === 'POST' && $action === 'contribute') {
    $user = require_auth();
    $body = get_json_body();

    $questId = (int)($body['quest_id'] ?? 0);
    $mentorId = !empty($body['mentor_id']) ? (int)$body['mentor_id'] : null;
    $field = trim($body['field'] ?? $user['specialty_field']);
    $secondaryField = trim($body['secondary_field'] ?? '');
    $extraFields = is_array($body['extra_fields'] ?? null) ? $body['extra_fields'] : [];
    $discoveryTitle = trim($body['discovery_title'] ?? '');
    $summary = trim($body['summary'] ?? '');

    if ($questId <= 0 || $discoveryTitle === '' || $summary === '') {
        json_response(['ok' => false, 'error' => 'Quest, judul blueprint/temuan, dan ringkasan wajib diisi.'], 422);
    }

    $pdo = get_pdo();
    $qStmt = $pdo->prepare('SELECT * FROM world_quests WHERE id = ? LIMIT 1');
    $qStmt->execute([$questId]);
    $quest = $qStmt->fetch();
    if (!$quest) {
        json_response(['ok' => false, 'error' => 'World Quest tidak ditemukan.'], 404);
    }

    $required = json_decode($quest['required_fields_json'], true) ?: [];
    $progress = json_decode($quest['progress_json'], true) ?: [];

    $pointsAdded = 12;
    if (isset($required[$field])) {
        $current = (int)($progress[$field] ?? 0);
        $progress[$field] = min((int)$required[$field], $current + $pointsAdded);
    } else {
        $progress[$field] = min(100, (int)($progress[$field] ?? 0) + 8);
    }

    // Bonus Sinergi STEAM Multi-Bidang (dari Meja Bundar 2-4 tokoh berbeda)
    $allBonusFields = array_values(array_unique(array_filter(
        array_merge($secondaryField !== '' ? [$secondaryField] : [], $extraFields),
        fn($f) => is_string($f) && $f !== '' && $f !== $field
    )));
    $isCrossSynergy = count($allBonusFields) > 0;
    if ($isCrossSynergy && $secondaryField === '') {
        $secondaryField = $allBonusFields[0];
    }
    foreach ($allBonusFields as $bf) {
        $synergyBoost = 10;
        if (isset($required[$bf])) {
            $progress[$bf] = min((int)$required[$bf], (int)($progress[$bf] ?? 0) + $synergyBoost);
        } else {
            $progress[$bf] = min(100, (int)($progress[$bf] ?? 0) + 6);
        }
        $pointsAdded += $synergyBoost;
    }

    // Cek apakah semua bidang wajib sudah mencapai target 100%
    $allDone = true;
    foreach ($required as $reqField => $targetVal) {
        if ((int)($progress[$reqField] ?? 0) < (int)$targetVal) {
            $allDone = false;
            break;
        }
    }
    $newStatus = $allDone ? 'completed' : $quest['status'];

    $ins = $pdo->prepare(
        'INSERT INTO contributions (user_id, quest_id, mentor_id, field, secondary_field, discovery_title, summary, points_added)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $ins->execute([
        $user['id'],
        $questId,
        $mentorId,
        $field,
        $isCrossSynergy ? $secondaryField : null,
        $discoveryTitle,
        $summary,
        $pointsAdded
    ]);
    $contribId = (int)$pdo->lastInsertId();

    $pdo->prepare('UPDATE world_quests SET progress_json = ?, status = ? WHERE id = ?')
        ->execute([json_encode($progress), $newStatus, $questId]);

    $rpReward = $isCrossSynergy ? 45 : 30;
    $pdo->prepare('UPDATE users SET research_points = research_points + ?, city_level = FLOOR((research_points + ?) / 150) + 1 WHERE id = ?')
        ->execute([$rpReward, $rpReward, $user['id']]);

    // Jika World Quest selesai, buka node Pohon Sejarah terkait!
    if ($newStatus === 'completed') {
        $pdo->prepare(
            'UPDATE tech_tree_nodes SET status = "unlocked", unlocked_at = COALESCE(unlocked_at, NOW())
             WHERE linked_quest_id = ?'
        )->execute([$questId]);
    }

    $cStmt = $pdo->prepare('SELECT * FROM contributions WHERE id = ?');
    $cStmt->execute([$contribId]);

    json_response([
        'ok' => true,
        'contribution' => $cStmt->fetch(),
        'quest_status' => $newStatus,
        'progress' => $progress,
    ], 201);
}

if ($method === 'POST' && $action === 'create_quest') {
    require_admin();
    $body = get_json_body();
    $title = trim($body['title'] ?? '');
    $subtitle = trim($body['subtitle'] ?? '');
    $description = trim($body['description'] ?? '');
    $fields = $body['fields'] ?? ['fisika', 'kimia', 'arsitektur'];
    $rewardNode = trim($body['reward_node_title'] ?? ('Era ' . $title));

    if ($title === '' || $description === '' || !is_array($fields) || count($fields) === 0) {
        json_response(['ok' => false, 'error' => 'Judul, deskripsi, dan minimal 1 bidang riset wajib diisi.'], 422);
    }

    $reqObj = [];
    $progObj = [];
    foreach ($fields as $f) {
        $reqObj[$f] = 100;
        $progObj[$f] = 0;
    }

    $pdo = get_pdo();
    $stmt = $pdo->prepare(
        'INSERT INTO world_quests (season_code, title, subtitle, description, required_fields_json, progress_json, status, reward_node_title)
         VALUES ("SEASON-01", ?, ?, ?, ?, ?, "active", ?)'
    );
    $stmt->execute([
        $title,
        $subtitle ?: ('Kolaborasi ' . implode(' · ', array_map('ucfirst', $fields))),
        $description,
        json_encode($reqObj),
        json_encode($progObj),
        $rewardNode
    ]);
    $questId = (int)$pdo->lastInsertId();

    $pdo->prepare(
        'INSERT INTO tech_tree_nodes (season_code, parent_id, era_tier, title, field_combo, description, status, linked_quest_id)
         VALUES ("SEASON-01", 1, 2, ?, ?, ?, "in_progress", ?)'
    )->execute([$rewardNode, implode(' + ', array_map('ucfirst', $fields)), $description, $questId]);

    json_response(['ok' => true, 'quest_id' => $questId], 201);
}

if ($method === 'POST' && $action === 'delete_quest') {
    require_admin();
    $body = get_json_body();
    $id = (int)($body['id'] ?? 0);
    if ($id <= 0) {
        json_response(['ok' => false, 'error' => 'ID World Quest tidak valid.'], 422);
    }
    $pdo = get_pdo();
    $pdo->prepare('DELETE FROM tech_tree_nodes WHERE linked_quest_id = ?')->execute([$id]);
    $pdo->prepare('DELETE FROM world_quests WHERE id = ?')->execute([$id]);
    json_response(['ok' => true]);
}

json_response(['ok' => false, 'error' => 'Endpoint quests tidak ditemukan.'], 404);
