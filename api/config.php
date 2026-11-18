<?php
/**
 * ============================================================
 * LEGACIUM — Loader Konfigurasi Database dari file .env
 * ============================================================
 * Membaca kredensial MySQL InfinityFree secara otomatis dari file .env
 * di root proyek (htdocs/.env) maupun api/.env tanpa butuh library eksternal.
 */

function legacium_load_env_file(string $path): void {
    if (!is_file($path) || !is_readable($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if (!is_array($lines)) {
        return;
    }

    foreach ($lines as $line) {
        $trimmed = trim($line);
        if ($trimmed === '' || substr($trimmed, 0, 1) === '#') {
            continue;
        }
        $pos = strpos($trimmed, '=');
        if ($pos === false) {
            continue;
        }

        $key = trim(substr($trimmed, 0, $pos));
        $val = trim(substr($trimmed, $pos + 1));

        // Hapus tanda kutip pembungkus jika ada (kompatibel PHP 7.4 & 8.x)
        $firstChar = substr($val, 0, 1);
        $lastChar = substr($val, -1);
        if (strlen($val) >= 2 && (($firstChar === '"' && $lastChar === '"') || ($firstChar === "'" && $lastChar === "'"))) {
            $val = substr($val, 1, -1);
        }

        if ($key !== '' && getenv($key) === false) {
            putenv("{$key}={$val}");
            $_ENV[$key] = $val;
        }
    }
}

// Prioritas pembacaan .env: root proyek (../.env) lalu folder api (./.env)
legacium_load_env_file(dirname(__DIR__) . '/.env');
legacium_load_env_file(__DIR__ . '/.env');

function legacium_env(string $key, string $default = ''): string {
    $val = $_ENV[$key] ?? getenv($key);
    if ($val === false || $val === null || $val === '') {
        return $default;
    }
    return (string)$val;
}

return [
    'DB_HOST'    => legacium_env('DB_HOST', '127.0.0.1'),
    'DB_PORT'    => legacium_env('DB_PORT', '3306'),
    'DB_NAME'    => legacium_env('DB_NAME', 'legacium'),
    'DB_USER'    => legacium_env('DB_USER', 'root'),
    'DB_PASS'    => legacium_env('DB_PASS', ''),
    'APP_SECRET' => legacium_env('APP_SECRET', 'legacium-change-this-32char-secret-key-2026'),
];
