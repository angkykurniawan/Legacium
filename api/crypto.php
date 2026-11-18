<?php
/**
 * Helper enkripsi AES-256-CBC agar Google AI Studio API Key
 * tersimpan aman di MySQL dan tidak bocor dalam plain text.
 */

function legacium_encrypt(string $plainText, string $secret): string {
    if ($plainText === '') {
        return '';
    }
    $key = hash('sha256', $secret, true);
    $iv  = random_bytes(16);
    $cipher = openssl_encrypt($plainText, 'AES-256-CBC', $key, OPENSSL_RAW_DATA, $iv);
    return base64_encode($iv . $cipher);
}

function legacium_decrypt(?string $encoded, string $secret): string {
    if (!$encoded) {
        return '';
    }
    $raw = base64_decode($encoded, true);
    if ($raw === false || strlen($raw) < 17) {
        return '';
    }
    $key = hash('sha256', $secret, true);
    $iv  = substr($raw, 0, 16);
    $cipher = substr($raw, 16);
    $plain = openssl_decrypt($cipher, 'AES-256-CBC', $key, OPENSSL_RAW_DATA, $iv);
    return $plain === false ? '' : $plain;
}

function legacium_mask_key(string $key): string {
    $len = strlen($key);
    if ($len === 0) {
        return '';
    }
    if ($len <= 10) {
        return str_repeat('•', $len);
    }
    return substr($key, 0, 6) . '••••••' . substr($key, -4);
}
