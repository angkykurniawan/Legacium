<?php
/**
 * Core DB, Response, Auth Middleware, dan Google AI Studio HTTP Client
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

set_exception_handler(function ($e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Terjadi error di server PHP: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit;
});

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/crypto.php';
$APP_CONFIG = require __DIR__ . '/config.php';

function json_response(array $data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function get_json_body(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function get_pdo(): PDO {
    static $pdo = null;
    global $APP_CONFIG;

    if ($pdo !== null) {
        return $pdo;
    }

    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
        $APP_CONFIG['DB_HOST'],
        $APP_CONFIG['DB_PORT'],
        $APP_CONFIG['DB_NAME']
    );

    try {
        $pdo = new PDO($dsn, $APP_CONFIG['DB_USER'], $APP_CONFIG['DB_PASS'], [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
        return $pdo;
    } catch (PDOException $e) {
        json_response([
            'ok'    => false,
            'error' => 'Gagal terhubung ke MySQL. Periksa kredensial MySQL di file .env.',
            'detail' => $e->getMessage()
        ], 500);
    }
}

function get_bearer_token(): ?string {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (!$auth && function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    }
    if (preg_match('/Bearer\s+(.+)/i', $auth, $m)) {
        return trim($m[1]);
    }
    return null;
}

function get_auth_user(): ?array {
    $token = get_bearer_token();
    if (!$token) {
        return null;
    }
    $pdo = get_pdo();
    $stmt = $pdo->prepare(
        'SELECT u.id, u.name, u.email, u.role, u.specialty_field, u.city_name, u.city_level, u.research_points
         FROM user_sessions s
         INNER JOIN users u ON u.id = s.user_id
         WHERE s.token = ? AND s.expires_at > NOW()
         LIMIT 1'
    );
    $stmt->execute([$token]);
    $user = $stmt->fetch();
    return $user ?: null;
}

function require_auth(): array {
    $user = get_auth_user();
    if (!$user) {
        json_response(['ok' => false, 'error' => 'Sesi tidak valid atau belum login.'], 401);
    }
    return $user;
}

function require_admin(): array {
    $user = require_auth();
    if ($user['role'] !== 'admin') {
        json_response(['ok' => false, 'error' => 'Akses ditolak. Fitur ini khusus role Admin.'], 403);
    }
    return $user;
}

function get_setting(string $key, string $default = ''): string {
    global $APP_CONFIG;
    $pdo = get_pdo();
    $stmt = $pdo->prepare('SELECT setting_value, is_encrypted FROM app_settings WHERE setting_key = ? LIMIT 1');
    $stmt->execute([$key]);
    $row = $stmt->fetch();
    if (!$row || $row['setting_value'] === null) {
        return $default;
    }
    if ((int)$row['is_encrypted'] === 1) {
        $decrypted = legacium_decrypt($row['setting_value'], $APP_CONFIG['APP_SECRET']);
        return $decrypted !== '' ? $decrypted : $default;
    }
    return $row['setting_value'];
}

function set_setting(string $key, string $value, bool $encrypt = false, ?int $userId = null): void {
    global $APP_CONFIG;
    $pdo = get_pdo();
    $stored = $encrypt ? legacium_encrypt($value, $APP_CONFIG['APP_SECRET']) : $value;
    $stmt = $pdo->prepare(
        'INSERT INTO app_settings (setting_key, setting_value, is_encrypted, updated_by)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           setting_value = VALUES(setting_value),
           is_encrypted = VALUES(is_encrypted),
           updated_by = VALUES(updated_by)'
    );
    $stmt->execute([$key, $stored, $encrypt ? 1 : 0, $userId]);
}

function http_request_json(string $method, string $url, ?array $payload = null, int $timeout = 30): array {
    $ch = curl_init($url);
    $opts = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => $timeout,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_SSL_VERIFYPEER => true,
    ];
    if ($method === 'POST') {
        $opts[CURLOPT_POST] = true;
        $opts[CURLOPT_POSTFIELDS] = json_encode($payload ?? []);
    }
    curl_setopt_array($ch, $opts);
    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err  = curl_error($ch);
    curl_close($ch);

    if ($err) {
        return ['ok' => false, 'status' => 502, 'error' => 'Gagal koneksi ke Google AI Studio: ' . $err];
    }
    $decoded = json_decode($body, true);
    if ($code < 200 || $code >= 300) {
        $msg = $decoded['error']['message'] ?? ('HTTP ' . $code . ' dari Google AI Studio');
        return ['ok' => false, 'status' => $code, 'error' => $msg, 'raw' => $decoded];
    }
    return ['ok' => true, 'status' => $code, 'data' => $decoded];
}

function fetch_google_ai_models(string $apiKey): array {
    $url = 'https://generativelanguage.googleapis.com/v1beta/models?key=' . urlencode($apiKey);
    $res = http_request_json('GET', $url, null, 20);
    if (!$res['ok']) {
        return $res;
    }
    $models = [];
    foreach (($res['data']['models'] ?? []) as $m) {
        $methods = $m['supportedGenerationMethods'] ?? [];
        if (!in_array('generateContent', $methods, true)) {
            continue;
        }
        $rawName = $m['name'] ?? '';
        $shortId = preg_replace('#^models/#', '', $rawName);
        if (stripos($shortId, 'embedding') !== false || stripos($shortId, 'aqa') !== false) {
            continue;
        }
        $models[] = [
            'id'           => $shortId,
            'displayName'  => $m['displayName'] ?? $shortId,
            'description'  => $m['description'] ?? '',
            'inputLimit'   => $m['inputTokenLimit'] ?? null,
            'outputLimit'  => $m['outputTokenLimit'] ?? null,
        ];
    }
    return ['ok' => true, 'models' => $models];
}

function call_google_ai_generate(string $apiKey, string $modelId, string $systemInstruction, array $contents, bool $jsonMode = false): array {
    $cleanModel = preg_replace('#^models/#', '', trim($modelId));
    $url = sprintf(
        'https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s',
        rawurlencode($cleanModel),
        urlencode($apiKey)
    );

    $payload = [
        'system_instruction' => [
            'parts' => [['text' => $systemInstruction]]
        ],
        'contents' => $contents,
        'generationConfig' => [
            'temperature' => $jsonMode ? 0.4 : 0.75,
            'maxOutputTokens' => 1024,
        ]
    ];
    if ($jsonMode) {
        $payload['generationConfig']['responseMimeType'] = 'application/json';
    }

    $res = http_request_json('POST', $url, $payload, 30);
    if (!$res['ok']) {
        return $res;
    }

    $text = $res['data']['candidates'][0]['content']['parts'][0]['text'] ?? '';
    if ($text === '') {
        return ['ok' => false, 'error' => 'Model tidak mengembalikan teks jawaban.'];
    }
    return ['ok' => true, 'text' => $text];
}
