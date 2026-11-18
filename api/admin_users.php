<?php
/**
 * Admin-only User Management API
 * Memungkinkan role Admin melihat, menambahkan, dan menghapus akun User.
 */
require_once __DIR__ . '/db.php';

$admin = require_admin();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';

if ($method === 'GET' && $action === 'list') {
    $pdo = get_pdo();
    $stmt = $pdo->query(
        'SELECT id, name, email, role, specialty_field, city_name, city_level, research_points, created_at
         FROM users
         ORDER BY id DESC'
    );
    json_response(['ok' => true, 'users' => $stmt->fetchAll()]);
}

if ($method === 'POST' && $action === 'create') {
    $body = get_json_body();
    $name = trim($body['name'] ?? '');
    $email = strtolower(trim($body['email'] ?? ''));
    $password = $body['password'] ?? '';
    $role = ($body['role'] ?? 'user') === 'admin' ? 'admin' : 'user';
    $specialty = trim($body['specialty_field'] ?? 'fisika');
    $cityName = trim($body['city_name'] ?? 'Kota Lab Nusantara');

    if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 6) {
        json_response([
            'ok' => false,
            'error' => 'Nama, email valid, dan password minimal 6 karakter wajib diisi.'
        ], 422);
    }

    $specialty = preg_replace('/[^a-z0-9_]/', '', strtolower(trim($body['specialty_field'] ?? 'fisika')));
    if ($specialty === '') {
        $specialty = 'fisika';
    }

    $pdo = get_pdo();
    $check = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $check->execute([$email]);
    if ($check->fetch()) {
        json_response(['ok' => false, 'error' => 'Email sudah terdaftar di sistem.'], 409);
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare(
        'INSERT INTO users (name, email, password_hash, role, specialty_field, city_name)
         VALUES (?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([$name, $email, $hash, $role, $specialty, $cityName]);
    $newId = (int)$pdo->lastInsertId();

    $uStmt = $pdo->prepare(
        'SELECT id, name, email, role, specialty_field, city_name, city_level, research_points, created_at
         FROM users WHERE id = ?'
    );
    $uStmt->execute([$newId]);

    json_response([
        'ok' => true,
        'message' => 'Akun berhasil ditambahkan oleh Admin.',
        'user' => $uStmt->fetch()
    ], 201);
}

if ($method === 'POST' && $action === 'delete') {
    $body = get_json_body();
    $targetId = (int)($body['id'] ?? 0);
    if ($targetId <= 0) {
        json_response(['ok' => false, 'error' => 'ID user tidak valid.'], 422);
    }
    if ($targetId === (int)$admin['id']) {
        json_response(['ok' => false, 'error' => 'Admin tidak dapat menghapus akunnya sendiri.'], 400);
    }

    get_pdo()->prepare('DELETE FROM users WHERE id = ?')->execute([$targetId]);
    json_response(['ok' => true]);
}

json_response(['ok' => false, 'error' => 'Endpoint admin_users tidak ditemukan.'], 404);
