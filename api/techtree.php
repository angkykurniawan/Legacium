<?php
/**
 * Collective Tech Tree (Pohon Sejarah Unik per Server/Season yang Berevolusi dari Komunitas)
 */
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';

if ($method === 'GET' && $action === 'list') {
    $pdo = get_pdo();
    $nodes = $pdo->query('SELECT * FROM tech_tree_nodes ORDER BY era_tier ASC, id ASC')->fetchAll();

    $questMap = [];
    foreach ($pdo->query('SELECT id, title, required_fields_json, progress_json, status FROM world_quests')->fetchAll() as $q) {
        $questMap[(int)$q['id']] = [
            'title' => $q['title'],
            'required_fields' => json_decode($q['required_fields_json'], true) ?: [],
            'progress' => json_decode($q['progress_json'], true) ?: [],
            'status' => $q['status']
        ];
    }

    $contribStmt = $pdo->prepare(
        'SELECT DISTINCT u.name, u.city_name, c.field
         FROM contributions c
         INNER JOIN users u ON u.id = c.user_id
         WHERE c.quest_id = ?
         ORDER BY c.id DESC
         LIMIT 8'
    );

    foreach ($nodes as &$n) {
        $qId = !empty($n['linked_quest_id']) ? (int)$n['linked_quest_id'] : null;
        if ($qId && isset($questMap[$qId])) {
            $qData = $questMap[$qId];
            $req = $qData['required_fields'];
            $prog = $qData['progress'];
            $totalTarget = 0;
            $totalCurrent = 0;
            foreach ($req as $fk => $tv) {
                $totalTarget += (int)$tv;
                $totalCurrent += min((int)$tv, (int)($prog[$fk] ?? 0));
            }
            $n['collective_percent'] = $totalTarget > 0 ? (int)round(($totalCurrent / $totalTarget) * 100) : 0;
            $n['field_breakdown'] = [
                'required' => $req,
                'progress' => $prog
            ];
            $contribStmt->execute([$qId]);
            $n['contributors'] = $contribStmt->fetchAll();
        } else {
            $n['collective_percent'] = $n['status'] === 'unlocked' ? 100 : 0;
            $n['field_breakdown'] = null;
            $n['contributors'] = [];
        }
    }

    $stats = [
        'total_researchers' => (int)$pdo->query('SELECT COUNT(*) FROM users')->fetchColumn(),
        'total_blueprints'  => (int)$pdo->query('SELECT COUNT(*) FROM contributions')->fetchColumn(),
        'unlocked_nodes'    => (int)$pdo->query('SELECT COUNT(*) FROM tech_tree_nodes WHERE status = "unlocked"')->fetchColumn(),
        'total_mentors'     => (int)$pdo->query('SELECT COUNT(*) FROM mentors')->fetchColumn(),
        'total_roundtables' => (int)$pdo->query('SELECT COUNT(*) FROM roundtable_sessions')->fetchColumn(),
    ];

    json_response([
        'ok' => true,
        'season' => get_setting('active_season', 'ERA 01 · SEASON GENESIS'),
        'nodes' => $nodes,
        'stats' => $stats,
    ]);
}

json_response(['ok' => false, 'error' => 'Endpoint techtree tidak ditemukan.'], 404);
