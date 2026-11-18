<?php
/**
 * Manajemen Bidang Riset Dinamis (Admin dapat menambah/menghapus bidang baru)
 * Setiap bidang baru otomatis membangun Gedung Paviliun 3D baru di Open World!
 */
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';

function default_fields_fallback(): array {
    return [
        ['id' => 'fisika', 'label' => 'Fisika', 'description' => 'Energi, plasma, relativitas & elektromagnetik', 'icon_name' => 'atom', 'bg_color' => '#0E6BA8', 'icon_color' => '#FFFFFF', 'badge_bg' => '#DBEAFE', 'sort_order' => 1],
        ['id' => 'kimia', 'label' => 'Kimia', 'description' => 'Sintesis material, katalis & radiokimia', 'icon_name' => 'flask', 'bg_color' => '#3CC9B8', 'icon_color' => '#0F242D', 'badge_bg' => '#CCFBF1', 'sort_order' => 2],
        ['id' => 'biologi', 'label' => 'Biologi', 'description' => 'Genetika molekuler, vaksin & ekosistem', 'icon_name' => 'dna', 'bg_color' => '#9AD1F5', 'icon_color' => '#0F242D', 'badge_bg' => '#E0F2FE', 'sort_order' => 3],
        ['id' => 'arsitektur', 'label' => 'Arsitektur', 'description' => 'Tata kota riset, estetika & struktur kubah', 'icon_name' => 'landmark', 'bg_color' => '#E55827', 'icon_color' => '#0F242D', 'badge_bg' => '#FFEDD5', 'sort_order' => 4],
        ['id' => 'matematika', 'label' => 'Matematika', 'description' => 'Aljabar, algoritma & pemodelan komputasi', 'icon_name' => 'cpu', 'bg_color' => '#F7C948', 'icon_color' => '#0F242D', 'badge_bg' => '#FEF3C7', 'sort_order' => 5],
        ['id' => 'dirgantara', 'label' => 'Dirgantara', 'description' => 'Aerodinamika, propulsi & satelit arsip', 'icon_name' => 'rocket', 'bg_color' => '#66D7C5', 'icon_color' => '#0F242D', 'badge_bg' => '#D1FAE5', 'sort_order' => 6],
    ];
}

function ensure_fields_table(PDO $pdo): void {
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS `research_fields` (
          `id` VARCHAR(50) NOT NULL,
          `label` VARCHAR(80) NOT NULL,
          `description` VARCHAR(200) NOT NULL DEFAULT "",
          `icon_name` VARCHAR(40) NOT NULL DEFAULT "atom",
          `bg_color` VARCHAR(20) NOT NULL DEFAULT "#0E6BA8",
          `icon_color` VARCHAR(20) NOT NULL DEFAULT "#0F242D",
          `badge_bg` VARCHAR(20) NOT NULL DEFAULT "#E0F2FE",
          `sort_order` INT UNSIGNED NOT NULL DEFAULT 10,
          `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
    $count = (int)$pdo->query('SELECT COUNT(*) FROM research_fields')->fetchColumn();
    if ($count === 0) {
        $ins = $pdo->prepare(
            'INSERT IGNORE INTO research_fields (id, label, description, icon_name, bg_color, icon_color, badge_bg, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        foreach (default_fields_fallback() as $f) {
            $ins->execute([$f['id'], $f['label'], $f['description'], $f['icon_name'], $f['bg_color'], $f['icon_color'], $f['badge_bg'], $f['sort_order']]);
        }
    }
}

function slugify_field_id(string $label): string {
    $slug = strtolower(trim($label));
    $slug = preg_replace('/[^a-z0-9]+/', '_', $slug);
    $slug = trim($slug, '_');
    return substr($slug, 0, 42);
}

if ($method === 'GET' && $action === 'list') {
    $pdo = get_pdo();
    ensure_fields_table($pdo);
    $rows = $pdo->query('SELECT * FROM research_fields ORDER BY sort_order ASC, created_at ASC')->fetchAll();
    json_response(['ok' => true, 'fields' => $rows]);
}

if ($method === 'POST' && $action === 'create') {
    require_admin();
    $body = get_json_body();

    $label = trim($body['label'] ?? '');
    $description = trim($body['description'] ?? '');
    $iconName = trim($body['icon_name'] ?? 'book');
    $bgColor = trim($body['bg_color'] ?? '#7C3AED');
    $iconColor = trim($body['icon_color'] ?? '#FFFFFF');
    $badgeBg = trim($body['badge_bg'] ?? '#EDE9FE');

    if ($label === '') {
        json_response(['ok' => false, 'error' => 'Nama bidang riset wajib diisi.'], 422);
    }

    $id = slugify_field_id($body['id'] ?? $label);
    if ($id === '') {
        json_response(['ok' => false, 'error' => 'Nama bidang harus mengandung huruf atau angka.'], 422);
    }

    $pdo = get_pdo();
    ensure_fields_table($pdo);

    $chk = $pdo->prepare('SELECT id FROM research_fields WHERE id = ? LIMIT 1');
    $chk->execute([$id]);
    if ($chk->fetch()) {
        json_response(['ok' => false, 'error' => "Bidang dengan ID '{$id}' sudah ada."], 409);
    }

    $maxSort = (int)$pdo->query('SELECT COALESCE(MAX(sort_order), 0) FROM research_fields')->fetchColumn();
    $stmt = $pdo->prepare(
        'INSERT INTO research_fields (id, label, description, icon_name, bg_color, icon_color, badge_bg, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $id,
        $label,
        $description ?: "Riset & inovasi bidang {$label}",
        $iconName,
        $bgColor,
        $iconColor,
        $badgeBg,
        $maxSort + 1
    ]);

    $fStmt = $pdo->prepare('SELECT * FROM research_fields WHERE id = ?');
    $fStmt->execute([$id]);
    json_response(['ok' => true, 'field' => $fStmt->fetch()], 201);
}

if ($method === 'POST' && $action === 'delete') {
    require_admin();
    $body = get_json_body();
    $id = trim($body['id'] ?? '');
    if ($id === '') {
        json_response(['ok' => false, 'error' => 'ID bidang tidak valid.'], 422);
    }

    $pdo = get_pdo();
    ensure_fields_table($pdo);

    $total = (int)$pdo->query('SELECT COUNT(*) FROM research_fields')->fetchColumn();
    if ($total <= 1) {
        json_response(['ok' => false, 'error' => 'Minimal harus tersisa 1 bidang riset.'], 400);
    }

    $mChk = $pdo->prepare('SELECT COUNT(*) FROM mentors WHERE field = ?');
    $mChk->execute([$id]);
    if ((int)$mChk->fetchColumn() > 0) {
        json_response([
            'ok' => false,
            'error' => 'Bidang ini masih memiliki tokoh terdaftar. Pindahkan atau hapus tokohnya terlebih dahulu.'
        ], 409);
    }

    $pdo->prepare('DELETE FROM research_fields WHERE id = ?')->execute([$id]);
    json_response(['ok' => true]);
}

json_response(['ok' => false, 'error' => 'Endpoint fields tidak ditemukan.'], 404);
