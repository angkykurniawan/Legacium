<?php
/**
 * Admin-only Google AI Studio Token & Model Selector API
 * Role wajib: admin
 */
require_once __DIR__ . '/db.php';

$admin = require_admin();
$action = $_GET['action'] ?? 'status';
$method = $_SERVER['REQUEST_METHOD'];

if ($action === 'status' && $method === 'GET') {
    $rawKey = get_setting('gemini_api_key', '');
    json_response([
        'ok' => true,
        'has_key' => $rawKey !== '',
        'masked_key' => legacium_mask_key($rawKey),
        'active_model' => get_setting('gemini_model', 'gemini-2.5-flash'),
        'active_season' => get_setting('active_season', 'ERA 01 · SEASON GENESIS'),
        'server_location' => get_setting('server_location', 'Kota Lab #01'),
    ]);
}

if ($action === 'fetch_models' && $method === 'POST') {
    $body = get_json_body();
    $apiKey = trim($body['api_key'] ?? '');
    if ($apiKey === '') {
        $apiKey = get_setting('gemini_api_key', '');
    }
    if ($apiKey === '') {
        json_response(['ok' => false, 'error' => 'Masukkan API Key Google AI Studio terlebih dahulu.'], 422);
    }

    $result = fetch_google_ai_models($apiKey);
    if (!$result['ok']) {
        json_response($result, 400);
    }

    json_response([
        'ok' => true,
        'models' => $result['models'],
        'count' => count($result['models']),
    ]);
}

if ($action === 'save' && $method === 'POST') {
    $body = get_json_body();
    $newKey = trim($body['api_key'] ?? '');
    $modelId = trim($body['model_id'] ?? '');
    $season = trim($body['active_season'] ?? '');
    $serverLoc = trim($body['server_location'] ?? '');

    $effectiveKey = $newKey !== '' ? $newKey : get_setting('gemini_api_key', '');
    if ($effectiveKey === '') {
        json_response(['ok' => false, 'error' => 'API Key Google AI Studio wajib diisi.'], 422);
    }

    // Validasi token & model ke Google AI Studio sebelum menyimpan
    if ($newKey !== '') {
        $check = fetch_google_ai_models($newKey);
        if (!$check['ok']) {
            json_response(['ok' => false, 'error' => 'Token Google AI Studio tidak valid: ' . ($check['error'] ?? 'Error')], 400);
        }
        set_setting('gemini_api_key', $newKey, true, (int)$admin['id']);
    }

    if ($modelId !== '') {
        set_setting('gemini_model', preg_replace('#^models/#', '', $modelId), false, (int)$admin['id']);
    }
    if ($season !== '') {
        set_setting('active_season', $season, false, (int)$admin['id']);
    }
    if ($serverLoc !== '') {
        set_setting('server_location', $serverLoc, false, (int)$admin['id']);
    }

    json_response([
        'ok' => true,
        'message' => 'Konfigurasi Google AI Studio berhasil disimpan.',
        'has_key' => true,
        'masked_key' => legacium_mask_key($effectiveKey),
        'active_model' => get_setting('gemini_model', 'gemini-2.5-flash'),
    ]);
}

json_response(['ok' => false, 'error' => 'Action admin_ai tidak dikenal.'], 404);
