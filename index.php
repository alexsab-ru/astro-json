<?php
declare(strict_types=1);

// ============================================================================
// Admin tool for browsing and editing JSON files under src/*/data/*.json
// ----------------------------------------------------------------------------
// Описание:
// - Страница показывает список сайтов (подпапки в src/) и JSON-файлы внутри их
//   подпапок data/.
// - Есть 2 фильтра (мультивыбор): по сайтам и по именам файлов.
// - Кнопка «Редактировать» открывает форму редактирования JSON, с рекурсивным
//   рендером полей (строки, числа, булевы, объекты, массивы).
// - Для files: cars.json, federal-models_price.json, models.json — только чтение.
// - При сохранении создаётся .bak (с меткой времени), затем файл перезаписывается
//   красивым JSON (pretty print, без экранирования Unicode/слэшей).
// - Есть простая защита: проверка путей (разрешены только src/*/data/), CSRF-токен.
//
// Примечание по типам:
// - Типы сохраняются за счёт скрытого массива types[...], созданного при рендере
//   из исходного JSON. Для новых полей по умолчанию — string.
// - Для массивов и объектов поддерживается добавление/удаление элементов в UI.
// ============================================================================

session_start();

// ----------------------- Константы/настройки -------------------------------
$SRC_ROOT = __DIR__ . '/src';                 // Корень с сайтами
$DATA_DIR_NAME = 'data';                      // Внутренняя папка с данными
$READ_ONLY_BASENAMES = [                      // Имена файлов только для чтения
    'cars.json',
    'federal-models_price.json',
    'models.json',
];

// ----------------------- Утилиты -------------------------------------------
/** Экранирование вывода для HTML */
function h(string $value): string {
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** Проверка ассоциативного массива (для различения объекта/массива из JSON) */
function isAssoc(array $arr): bool {
    if ($arr === []) {
        return false;
    }
    return array_keys($arr) !== range(0, count($arr) - 1);
}

/** Определить строковый тип узла JSON для скрытого массива типов */
function jsonTypeOf($value): string {
    if (is_null($value)) return 'null';
    if (is_bool($value)) return 'bool';
    if (is_int($value) || is_float($value)) return 'number';
    if (is_array($value)) return isAssoc($value) ? 'object' : 'array';
    return 'string';
}

// Сканирование каталога данных: src/<site>/<dataDirName>/*.json -> [site => [filenames...]]
function scanSitesAndFiles(string $srcRoot, string $dataDirName): array {
    $result = [];
    $sites = glob($srcRoot . '/*', GLOB_ONLYDIR) ?: [];
    foreach ($sites as $siteDir) {
        $site = basename($siteDir);
        $dataDir = $siteDir . '/' . $dataDirName;
        if (!is_dir($dataDir)) {
            continue;
        }
        $files = glob($dataDir . '/*.json') ?: [];
        $fileBasenames = array_map('basename', $files);
        sort($fileBasenames);
        if (!empty($fileBasenames)) {
            $result[$site] = $fileBasenames;
        }
    }
    ksort($result);
    return $result;
}

/** Список всех уникальных имён файлов (типов данных) из каталога */
function collectAllFilenames(array $catalog): array {
    $all = [];
    foreach ($catalog as $site => $files) {
        foreach ($files as $f) $all[$f] = true;
    }
    $names = array_keys($all);
    sort($names);
    return $names;
}

/** Является ли файл read-only по имени */
function isReadOnlyFile(string $basename, array $readOnlyList): bool {
    return in_array($basename, $readOnlyList, true);
}

/** Безопасная сборка пути до файла данных */
function buildDataFilePath(string $srcRoot, string $dataDirName, string $site, string $basename): ?string {
    // Запрещаем путь с разделителями и выход из каталогов
    if ($site === '' || $basename === '' || str_contains($site, '..') || str_contains($basename, '..') || str_contains($site, '/') || str_contains($basename, '/')) {
        return null;
    }
    $path = $srcRoot . '/' . $site . '/' . $dataDirName . '/' . $basename;
    // Проверяем, что реально лежит внутри src/*/data/* и существует
    $real = realpath($path);
    if ($real === false) return null;
    $allowedPrefix = realpath($srcRoot);
    if ($allowedPrefix === false) return null;
    if (strpos($real, $allowedPrefix . DIRECTORY_SEPARATOR) !== 0) return null;
    return $real;
}

/** Загрузка JSON как массив/скаляр с ошибкой при невалидном JSON */
function loadJson(string $path) {
    $raw = @file_get_contents($path);
    if ($raw === false) {
        throw new RuntimeException('Не удалось прочитать файл: ' . $path);
    }
    $data = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new RuntimeException('Ошибка парсинга JSON: ' . json_last_error_msg());
    }
    return $data;
}

/** Сохранение JSON с бэкапом (.bak.YmdHis) и красивым форматированием */
function saveJsonWithBackup(string $path, $data): void {
    $dir = dirname($path);
    $base = basename($path);
    $backup = $dir . '/' . $base . '.bak.' . date('YmdHis');
    // Создаём резервную копию исходного содержимого
    $orig = @file_get_contents($path);
    if ($orig === false) {
        throw new RuntimeException('Не удалось прочитать исходный файл для бэкапа');
    }
    if (@file_put_contents($backup, $orig) === false) {
        throw new RuntimeException('Не удалось записать резервную копию: ' . $backup);
    }
    // Записываем новый JSON c pretty print и без экранирования Unicode/слэшей
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    if ($json === false) {
        throw new RuntimeException('Не удалось сериализовать данные в JSON');
    }
    if (@file_put_contents($path, $json) === false) {
        throw new RuntimeException('Не удалось записать обновлённый JSON в файл');
    }
}

/** Рекурсивное преобразование $postedData по карте типов $types */
function castByTypes($postedData, $types) {
    // Если типов нет — возвращаем как есть (fallback)
    if ($types === null) return $postedData;

    if (is_array($types)) {
        // Определяем контейнер: object/array или скалярный тип в ноде
        $containerType = $types['__self'] ?? null;
        if ($containerType === 'object' || $containerType === 'array') {
            $result = [];
            $childrenTypes = $types['__children'] ?? [];
            if (is_array($postedData)) {
                foreach ($postedData as $k => $v) {
                    $childTypeMap = $childrenTypes[$k] ?? null;
                    $result[$k] = castByTypes($v, $childTypeMap);
                }
            }
            // Для массивов приводим ключи к 0..N-1 (в порядке текущих индексов)
            if ($containerType === 'array') {
                // Сохраняем порядок по текущим ключам
                $normalized = [];
                foreach ($result as $k => $v) { $normalized[] = $v; }
                return $normalized;
            }
            return $result; // object
        }
        // Если это скалярный узел, ожидаем строковый тип в $types['__self']
        $scalarType = $types['__self'] ?? 'string';
        $val = $postedData;
        switch ($scalarType) {
            case 'null':
                return null;
            case 'bool':
                // Чекбокс шлёт '1' или '0'
                return $val === '1' || $val === 1 || $val === true || $val === 'true';
            case 'number':
                if ($val === '' || $val === null) return null; // пустое -> null
                // Допускаем дробные и экспоненциальные
                return is_numeric($val) ? (strpos((string)$val, '.') !== false ? (float)$val : (int)$val) : 0;
            case 'string':
            default:
                return (string)$val;
        }
    }
    // Если карта типов не массив, считаем строковым
    return (string)$postedData;
}

/** Построение карты типов для рекурсивного рендера и последующего кастинга */
function buildTypesMap($value) {
    $type = jsonTypeOf($value);
    if ($type === 'object') {
        $children = [];
        foreach ($value as $k => $v) {
            $children[$k] = buildTypesMap($v);
        }
        return ['__self' => 'object', '__children' => $children];
    }
    if ($type === 'array') {
        $children = [];
        foreach ($value as $idx => $v) {
            $children[(string)$idx] = buildTypesMap($v);
        }
        return ['__self' => 'array', '__children' => $children];
    }
    // Скаляр/Null
    return ['__self' => $type];
}

/** Рендер скрытых полей с картой типов (рекурсивно) */
function renderTypesHiddenInputs(string $namePrefix, $types): void {
    if (!is_array($types)) return;
    foreach ($types as $k => $v) {
        $fieldName = $namePrefix . '[' . h((string)$k) . ']';
        if (is_array($v)) {
            echo '<input type="hidden" name="' . $fieldName . '[__key]" value="1">';
            renderTypesHiddenInputs($fieldName, $v);
        } else {
            echo '<input type="hidden" name="' . $fieldName . '" value="' . h((string)$v) . '">';
        }
    }
}

/** Упрощённый рендер типов — использует buildTypesMap и сериализует в inputs */
function renderTypesForValue(string $rootName, $value): void {
    $map = buildTypesMap($value);
    // Рекурсивно разложим в структуру inputs, но более явным способом:
    $emit = function ($prefix, $node) use (&$emit) {
        foreach ($node as $key => $child) {
            $field = $prefix . '[' . h((string)$key) . ']';
            if (is_array($child)) {
                echo '<input type="hidden" name="' . $field . '[__marker]" value="1">';
                $emit($field, $child);
            } else {
                echo '<input type="hidden" name="' . $field . '" value="' . h((string)$child) . '">';
            }
        }
    };
    // Сериализуем карту типов в виде массива inputs под именем types
    echo '<div style="display:none">';
    // Чтобы упростить разбор, сериализуем карту типов в JSON одинарным полем
    // и дополнительно кладём её в inputs для наглядности/расширяемости.
    $json = json_encode($map, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    echo '<input type="hidden" name="types_json" value="' . h((string)$json) . '">';
    echo '</div>';
}

/** Получение карты типов из POST: сначала пробуем types_json, иначе null */
function getTypesMapFromPost(): ?array {
    if (!isset($_POST['types_json'])) return null;
    $decoded = json_decode((string)$_POST['types_json'], true);
    return is_array($decoded) ? $decoded : null;
}

/** Рекурсивный рендер формы для редактирования JSON */
function renderJsonFields(string $name, $value, bool $disabled = false): void {
    $type = jsonTypeOf($value);

    if ($type === 'object') {
        echo '<div class="obj">';
        echo '<details open><summary>Объект</summary>';
        echo '<div class="object-fields">';
        foreach ($value as $k => $v) {
            echo '<div class="field-row">';
            echo '<label>' . h((string)$k) . '</label>';
            $childName = $name . '[' . h((string)$k) . ']';
            renderJsonFields($childName, $v, $disabled);
            echo '<button type="button" class="btn btn-danger" onclick="removeParentField(this)" ' . ($disabled ? 'disabled' : '') . '>Удалить поле</button>';
            echo '</div>';
        }
        echo '</div>';
        // Добавить новое поле (ключ/значение строка по умолчанию)
        echo '<div class="add-kv">';
        echo '<input type="text" class="new-key" placeholder="новый ключ" ' . ($disabled ? 'disabled' : '') . '>'; 
        echo '<button type="button" class="btn" onclick="addObjectField(this, ' . "'" . h($name) . "'" . ')" ' . ($disabled ? 'disabled' : '') . '>+ Добавить поле</button>';
        echo '</div>';
        echo '</details>';
        echo '</div>';
        return;
    }

    if ($type === 'array') {
        echo '<div class="arr">';
        echo '<details open><summary>Массив</summary>';
        echo '<div class="array-items" data-name="' . h($name) . '">';
        foreach ($value as $idx => $v) {
            $childName = $name . '[' . h((string)$idx) . ']';
            echo '<div class="array-item">';
            renderJsonFields($childName, $v, $disabled);
            echo '<button type="button" class="btn btn-danger" onclick="removeArrayItem(this)" ' . ($disabled ? 'disabled' : '') . '>Удалить элемент</button>';
            echo '</div>';
        }
        echo '</div>';
        echo '<button type="button" class="btn" onclick="addArrayItem(this)" ' . ($disabled ? 'disabled' : '') . '>+ Добавить элемент</button>';
        echo '</details>';
        echo '</div>';
        return;
    }

    // Скалярные и null значения
    $inputName = $name;
    $val = $value;
    $common = $disabled ? ' disabled' : '';

    switch ($type) {
        case 'bool':
            // Чекбокс с hidden = 0 на случай, если не отмечен
            echo '<input type="hidden" name="' . h($inputName) . '" value="0"' . $common . '>'; 
            echo '<input type="checkbox" name="' . h($inputName) . '" value="1"' . ($val ? ' checked' : '') . $common . '>';
            break;
        case 'number':
            // Числовое поле (допускаем дробные)
            $str = (string)$val;
            echo '<input type="number" step="any" name="' . h($inputName) . '" value="' . h($str) . '"' . $common . ' class="input">';
            break;
        case 'null':
            // null представляем пустой строкой (тип сохраняем через types_json)
            echo '<input type="text" name="' . h($inputName) . '" value="" placeholder="null"' . $common . ' class="input">';
            break;
        case 'string':
        default:
            $str = (string)$val;
            // Большие строки или с переводами строк рендерим textarea
            if (strlen($str) > 120 || strpos($str, "\n") !== false) {
                echo '<textarea name="' . h($inputName) . '" rows="4" class="textarea"' . $common . '>' . h($str) . '</textarea>';
            } else {
                echo '<input type="text" name="' . h($inputName) . '" value="' . h($str) . '"' . $common . ' class="input">';
            }
            break;
    }
}

// ----------------------- Контроллер/Роутинг -------------------------------
$catalog = scanSitesAndFiles($SRC_ROOT, $DATA_DIR_NAME);
$allSites = array_keys($catalog);

// Собираем уникальные имена файлов (типов данных) по всем сайтам
$allFileNames = collectAllFilenames($catalog);

// Фильтры (мультивыбор): sites[], files[] из GET
$filterSites = isset($_GET['sites']) && is_array($_GET['sites']) ? array_values(array_intersect($allSites, array_map('strval', $_GET['sites']))) : [];
$filterFiles = isset($_GET['files']) && is_array($_GET['files']) ? array_values(array_intersect($allFileNames, array_map('strval', $_GET['files']))) : [];

// Действие
$action = $_GET['action'] ?? 'list';

// CSRF: генерируем токен если нет
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(16));
}
$csrfToken = $_SESSION['csrf_token'];

// Сообщения пользователю
$notice = '';
$error = '';

// Обработка сохранения
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($action === 'save')) {
    try {
        // Проверка CSRF
        $token = $_POST['csrf_token'] ?? '';
        if (!hash_equals($csrfToken, (string)$token)) {
            throw new RuntimeException('Неверный CSRF-токен. Обновите страницу и попробуйте снова.');
        }

        // Валидируем site/file на основе каталога
        $site = (string)($_POST['site'] ?? '');
        $file = (string)($_POST['file'] ?? '');
        if ($site === '' || $file === '' || !isset($catalog[$site]) || !in_array($file, $catalog[$site], true)) {
            throw new RuntimeException('Некорректные параметры site/file.');
        }
        if (isReadOnlyFile($file, $READ_ONLY_BASENAMES)) {
            throw new RuntimeException('Файл только для чтения: сохранение запрещено.');
        }
        $path = buildDataFilePath($SRC_ROOT, $DATA_DIR_NAME, $site, $file);
        if ($path === null) {
            throw new RuntimeException('Невозможно построить безопасный путь к файлу.');
        }

        // Получаем данные формы
        $posted = $_POST['data'] ?? null; // может быть массив или скаляр
        // Получаем карту типов
        $typesMap = getTypesMapFromPost();

        // Приводим типы
        $normalized = castByTypes($posted, $typesMap);

        // Сохраняем с бэкапом
        saveJsonWithBackup($path, $normalized);
        $notice = 'Файл успешно сохранён: ' . h($site . '/' . $DATA_DIR_NAME . '/' . $file);

        // После сохранения остаёмся на экране редактирования
        $action = 'edit';
        $_GET['site'] = $site;
        $_GET['file'] = $file;
    } catch (Throwable $e) {
        $error = $e->getMessage();
        // Остаёмся на форме редактирования для показа ошибки, если параметры есть
        $action = 'edit';
        if (!isset($_GET['site']) && isset($_POST['site'])) $_GET['site'] = (string)$_POST['site'];
        if (!isset($_GET['file']) && isset($_POST['file'])) $_GET['file'] = (string)$_POST['file'];
    }
}

// ----------------------- Визуализация (HTML) -------------------------------
?><!doctype html>
<html lang="ru">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>JSON Admin — src/*/data</title>
    <style>
        /* Минимальный, аккуратный стиль для удобства */
        :root{--bg:#0b0c10;--panel:#121318;--border:#2a2d36;--text:#e6e6e6;--muted:#a9a9a9;--accent:#4c8bf5;--danger:#e05555;--ok:#4caf50}
        html,body{margin:0;padding:0;background:var(--bg);color:var(--text);font:14px/1.45 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial}
        a{color:var(--accent);text-decoration:none}
        a:hover{text-decoration:underline}
        .container{max-width:1200px;margin:24px auto;padding:0 16px}
        .panel{background:var(--panel);border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:16px}
        h1{font-size:20px;margin:0 0 12px}
        .filters{display:flex;gap:12px;flex-wrap:wrap}
        .filters .group{flex:1 1 280px;min-width:240px}
        label{display:block;margin-bottom:6px;color:var(--muted)}
        select{width:100%;min-height:120px;background:#0f1017;color:var(--text);border:1px solid var(--border);border-radius:6px;padding:8px}
        .btn{background:#1a1c24;color:var(--text);border:1px solid var(--border);padding:6px 10px;border-radius:6px;cursor:pointer}
        .btn:hover{border-color:var(--accent)}
        .btn-primary{background:var(--accent);border-color:var(--accent);color:#fff}
        .btn-danger{background:#2a1414;border-color:#3a1f1f;color:#ffbdbd;margin-left:8px}
        .muted{color:var(--muted)}
        table{width:100%;border-collapse:collapse}
        th,td{padding:8px 10px;border-bottom:1px solid var(--border);vertical-align:top}
        th{color:var(--muted);text-align:left}
        .ro{opacity:.7}
        .notice{background:#132619;border:1px solid #1f3d2a;color:#b3e3c0;padding:10px 12px;border-radius:6px;margin-bottom:12px}
        .error{background:#2a1111;border:1px solid #452020;color:#ffbdbd;padding:10px 12px;border-radius:6px;margin-bottom:12px}
        .breadcrumbs{margin-bottom:12px}
        .kbd{font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;background:#0f1017;border:1px solid var(--border);padding:2px 6px;border-radius:4px}
        .form{display:flex;flex-direction:column;gap:12px}
        .field-row{display:flex;gap:10px;align-items:flex-start;margin:6px 0}
        .field-row > label{min-width:180px;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .input, .textarea{width:100%;background:#0f1017;color:var(--text);border:1px solid var(--border);border-radius:6px;padding:6px}
        .textarea{min-height:80px}
        details{border:1px dashed var(--border);border-radius:6px;padding:8px;margin:6px 0}
        summary{cursor:pointer;color:var(--muted)}
        .array-item{border:1px solid var(--border);border-radius:6px;padding:8px;margin:8px 0}
        .object-fields{display:flex;flex-direction:column}
        .add-kv{display:flex;gap:8px;align-items:center;margin-top:6px}
        .top-actions{display:flex;gap:8px;align-items:center}
        .readonly-note{color:#ffdf9b}
        .path{font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace}
    </style>
    <script>
        // Небольшие JS-хелперы для добавления/удаления полей массива и объектов
        function removeArrayItem(btn){
            const item = btn.closest('.array-item');
            if (item) item.remove();
            renumberArrayIndexes(btn.closest('.array-items'));
        }
        function addArrayItem(btn){
            const container = btn.previousElementSibling; // .array-items
            if (!container) return;
            const name = container.getAttribute('data-name');
            const idx = container.querySelectorAll(':scope > .array-item').length;
            // По умолчанию добавляем строковое поле
            const div = document.createElement('div');
            div.className = 'array-item';
            div.innerHTML = `<input type="text" name="${name}[${idx}]" value="" class="input">` +
                `<button type="button" class="btn btn-danger" onclick="removeArrayItem(this)">Удалить элемент</button>`;
            container.appendChild(div);
            renumberArrayIndexes(container);
        }
        function renumberArrayIndexes(container){
            if (!container) return;
            const name = container.getAttribute('data-name');
            const items = container.querySelectorAll(':scope > .array-item');
            items.forEach((item, i) => {
                // Перенумеровываем только плоские инпуты верхнего уровня внутри элемента
                item.querySelectorAll('input, textarea, select').forEach(el => {
                    const old = el.getAttribute('name');
                    if (!old) return;
                    // Заменяем последний индекс в скобках на i
                    const newName = old.replace(/\[(\d+)\](?!.*\[\d+\])/ , '['+i+']');
                    el.setAttribute('name', newName);
                });
            });
        }
        function removeParentField(btn){
            const row = btn.closest('.field-row');
            if (row) row.remove();
        }
        function addObjectField(button, rootName){
            const wrap = button.closest('.obj');
            if (!wrap) return;
            const keyInput = wrap.querySelector('.new-key');
            if (!keyInput) return;
            const key = keyInput.value.trim();
            if (!key) return;
            const fields = wrap.querySelector('.object-fields');
            const row = document.createElement('div');
            row.className = 'field-row';
            row.innerHTML = `<label>${escapeHtml(key)}</label>` +
                `<input type="text" name="${rootName}[${escapeAttr(key)}]" value="" class="input">` +
                `<button type="button" class="btn btn-danger" onclick="removeParentField(this)">Удалить поле</button>`;
            fields.appendChild(row);
            keyInput.value = '';
        }
        function escapeHtml(s){
            const d = document.createElement('div');
            d.innerText = s; return d.innerHTML;
        }
        function escapeAttr(s){
            return s.replace(/"/g,'&quot;');
        }
    </script>
</head>
<body>
<div class="container">
    <div class="panel">
        <h1>JSON Admin — src/*/data</h1>
        <div class="muted">Локальный просмотр и редактирование JSON. Файлы только для чтения: <span class="kbd">cars.json</span>, <span class="kbd">federal-models_price.json</span>, <span class="kbd">models.json</span>.</div>
    </div>

    <?php if ($notice): ?>
        <div class="notice"><?= $notice ?></div>
    <?php endif; ?>
    <?php if ($error): ?>
        <div class="error"><?= h($error) ?></div>
    <?php endif; ?>

    <?php if ($action === 'edit'):
        $site = (string)($_GET['site'] ?? '');
        $file = (string)($_GET['file'] ?? '');
        $valid = ($site !== '' && $file !== '' && isset($catalog[$site]) && in_array($file, $catalog[$site], true));
        if ($valid):
            $path = buildDataFilePath($SRC_ROOT, $DATA_DIR_NAME, $site, $file);
            $readonly = isReadOnlyFile($file, $READ_ONLY_BASENAMES);
            try {
                $jsonData = loadJson((string)$path);
            } catch (Throwable $e) {
                $jsonData = null;
                $error = $error ?: $e->getMessage();
            }
    ?>
        <div class="panel">
            <div class="breadcrumbs">
                <a href="?">← К списку</a>
            </div>
            <div class="muted">Файл: <span class="path"><?= h($site . '/' . $DATA_DIR_NAME . '/' . $file) ?></span></div>
            <?php if ($readonly): ?>
                <div class="readonly-note">Этот файл доступен только для чтения. Изменения сохранить нельзя.</div>
            <?php endif; ?>
        </div>

        <div class="panel">
            <?php if ($jsonData !== null): ?>
                <form method="post" class="form">
                    <input type="hidden" name="action" value="save">
                    <input type="hidden" name="site" value="<?= h($site) ?>">
                    <input type="hidden" name="file" value="<?= h($file) ?>">
                    <input type="hidden" name="csrf_token" value="<?= h($csrfToken) ?>">
                    <?php
                        // Встраиваем карту типов в скрытом JSON-поле
                        renderTypesForValue('types', $jsonData);
                        // Рендерим поля данных (корневое имя — data)
                        renderJsonFields('data', $jsonData, $readonly);
                    ?>
                    <div class="top-actions">
                        <a class="btn" href="?action=edit&amp;site=<?= h($site) ?>&amp;file=<?= h($file) ?>">Сбросить изменения</a>
                        <?php if (!$readonly): ?>
                            <button type="submit" class="btn btn-primary">Сохранить</button>
                        <?php endif; ?>
                    </div>
                </form>
            <?php else: ?>
                <div class="error">Невозможно отобразить содержимое файла.</div>
            <?php endif; ?>
        </div>
    <?php else: ?>
        <div class="panel">
            <div class="error">Некорректные параметры для редактирования.</div>
            <div><a class="btn" href="?">Вернуться к списку</a></div>
        </div>
    <?php endif; ?>
    <?php else: ?>
        <div class="panel">
            <form method="get" class="filters">
                <div class="group">
                    <label>Фильтр по сайтам (мультивыбор)</label>
                    <select name="sites[]" multiple>
                        <?php foreach ($allSites as $s): $sel = empty($filterSites) ? '' : (in_array($s, $filterSites, true) ? ' selected' : ''); ?>
                            <option value="<?= h($s) ?>"<?= $sel ?>><?= h($s) ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="group">
                    <label>Фильтр по типам файлов (именам)</label>
                    <select name="files[]" multiple>
                        <?php foreach ($allFileNames as $fn): $sel = empty($filterFiles) ? '' : (in_array($fn, $filterFiles, true) ? ' selected' : ''); ?>
                            <option value="<?= h($fn) ?>"<?= $sel ?>><?= h($fn) ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="group" style="align-self:flex-end;min-width:auto">
                    <button type="submit" class="btn btn-primary">Применить</button>
                    <a class="btn" href="?">Сбросить</a>
                </div>
            </form>
        </div>

        <div class="panel">
            <table>
                <thead>
                    <tr>
                        <th>Сайт</th>
                        <th>Файл</th>
                        <th>Путь</th>
                        <th>Действие</th>
                    </tr>
                </thead>
                <tbody>
                <?php foreach ($catalog as $site => $files): ?>
                    <?php if (!empty($filterSites) && !in_array($site, $filterSites, true)) continue; ?>
                    <?php foreach ($files as $file): ?>
                        <?php if (!empty($filterFiles) && !in_array($file, $filterFiles, true)) continue; ?>
                        <?php $readonly = isReadOnlyFile($file, $READ_ONLY_BASENAMES); ?>
                        <tr class="<?= $readonly ? 'ro' : '' ?>">
                            <td><?= h($site) ?></td>
                            <td><?= h($file) ?><?= $readonly ? ' <span class="muted">(только чтение)</span>' : '' ?></td>
                            <td class="path"><?= h($site . '/' . $DATA_DIR_NAME . '/' . $file) ?></td>
                            <td>
                                <a class="btn" href="?action=edit&amp;site=<?= h($site) ?>&amp;file=<?= h($file) ?>">Открыть</a>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    <?php endif; ?>

    <div class="panel muted">
        <div>Подсказки:</div>
        <ul>
            <li>Запуск локального сервера: <span class="kbd">php -S 127.0.0.1:5134 -t ./</span> затем открыть <span class="kbd">http://127.0.0.1:5134/index.php</span>.</li>
            <li>Перед сохранением автоматически создаётся резервная копия файла с суффиксом <span class="kbd">.bak.YmdHis</span>.</li>
            <li>Добавление полей в объектах и элементов в массивах поддерживается на странице редактирования.</li>
        </ul>
    </div>

    <div class="panel muted">
        <div>Примечание по безопасности: редактор ограничен каталогами внутри <span class="kbd">src/*/data/</span>, пути нормализуются, запись запрещена для файлов только чтения.</div>
    </div>

    <div class="panel muted">
        <div>Версия: 1.0.0</div>
    </div>

<?php /* Конец контейнера */ ?>
</div>
</body>
</html>


