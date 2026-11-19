<?php
require_once __DIR__ . '/db.php';

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

if ($action === 'me' && $method === 'GET') {
    $user = require_auth();
    $season = get_setting('active_season', 'ERA 01 · SEASON GENESIS');
    $serverLoc = get_setting('server_location', 'Kota Lab #01');
    $aiConfigured = get_setting('gemini_api_key', '') !== '';
    $activeModel = get_setting('gemini_model', 'gemini-2.5-flash');

    json_response([
        'ok' => true,
        'user' => $user,
        'meta' => [
            'season' => $season,
            'server_location' => $serverLoc,
            'ai_configured' => $aiConfigured,
            'active_model' => $activeModel,
        ]
    ]);
}

if ($action === 'register' && $method === 'POST') {
    json_response([
        'ok' => false,
        'error' => 'Pendaftaran mandiri dinonaktifkan. Akun baru hanya dapat didaftarkan oleh Admin.'
    ], 403);
}

if ($action === 'login' && $method === 'POST') {
    $body = get_json_body();
    $email = strtolower(trim($body['email'] ?? ''));
    $password = $body['password'] ?? '';

    if ($email === '' || $password === '') {
        json_response(['ok' => false, 'error' => 'Email dan password wajib diisi.'], 422);
    }

    $pdo = get_pdo();
    $stmt = $pdo->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $row = $stmt->fetch();

    if (!$row && ($email === 'user@legacium.app' || $email === 'guruh@legacium.app')) {
        $altEmail = ($email === 'user@legacium.app') ? 'guruh@legacium.app' : 'user@legacium.app';
        $stmt = $pdo->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
        $stmt->execute([$altEmail]);
        $row = $stmt->fetch();
    }

    if (!$row) {
        json_response(['ok' => false, 'error' => 'Email atau password salah.'], 401);
    }

    $valid = false;
    // Upgrade otomatis akun seed awal dari schema.sql ke bcrypt saat login pertama (kompatibel PHP 7.4 & 8.x)
    if (substr($row['password_hash'], 0, 11) === 'SEED_PLAIN:') {
        $seedPlain = substr($row['password_hash'], 11);
        if (hash_equals($seedPlain, $password)) {
            $valid = true;
            $newHash = password_hash($password, PASSWORD_BCRYPT);
            $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([$newHash, $row['id']]);
        }
    } else {
        $valid = password_verify($password, $row['password_hash']);
    }

    if (!$valid) {
        json_response(['ok' => false, 'error' => 'Email atau password salah.'], 401);
    }

    $token = bin2hex(random_bytes(32));
    $pdo->prepare('INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 14 DAY))')
        ->execute([$row['id'], $token]);

    unset($row['password_hash']);
    json_response([
        'ok' => true,
        'token' => $token,
        'user' => $row
    ]);
}

if ($action === 'logout' && $method === 'POST') {
    $token = get_bearer_token();
    if ($token) {
        get_pdo()->prepare('DELETE FROM user_sessions WHERE token = ?')->execute([$token]);
    }
    json_response(['ok' => true]);
}

json_response(['ok' => false, 'error' => 'Endpoint auth tidak ditemukan.'], 404);
