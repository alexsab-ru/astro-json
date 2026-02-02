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
$APP_VERSION = '1.3.0';                    // Текущая версия инструмента (SemVer)
$SRC_ROOT = __DIR__ . '/src';                 // Корень с сайтами
$DATA_DIR_NAME = 'data';                      // Внутренняя папка с данными
$READ_ONLY_BASENAMES = [                      // Имена файлов только для чтения
    'cars.json',
    'federal-models_price.json',
    'models.json',
];

// ChangeLog (Keep a Changelog): краткая история изменений
// Формат: https://keepachangelog.com/en/1.1.0/
$CHANGELOG = [
    'Unreleased' => [
        // Здесь можно добавлять будущие изменения перед релизом
    ],
    '1.3.0' => [
        'date' => '2025-10-23',
        'Added' => [
            'Сохранение фильтров при возврате из редактирования к списку.',
            'Сводка баннера в заголовке элемента: type + title + миниатюра.',
            'Миниатюры рядом с ссылками в image.* (desktop/tablet/mobile).',
        ],
        'Changed' => [
            'Отключённые баннеры (show=false) свернуты по умолчанию.',
            'Сохранение banners.json всегда сортирует по id убыванию; перенумерация — отдельной кнопкой.',
        ],
    ],
    '1.2.0' => [
        'date' => '2025-10-23',
        'Added' => [
            'Кнопка «Проставить ID от Большего к Меньшему» для banners.json (перенумерация от конца к началу).',
            'Кнопка «Добавить элемент» в корне banners.json создаёт пустой объект баннера.',
            'Нормализация структуры banners.json: image/video {desktop, tablet, mobile}, position {desktop, tablet, mobile}, badge-объект.',
        ],
        'Changed' => [
            'Сохранение banners.json теперь всегда сортирует баннеры по id по убыванию.',
            'Убран предзаполненный контент в badge, значения по умолчанию — пустые.',
            'Поля title/descr/dataTitle/dataFormName и badge.autoname/title/descr редактируются как textarea с экранированием HTML.',
            'Порядок полей баннера фиксирован: id, show, type, view, image, position, video, alt, title, descr, btn, btnColor, btnUrl, bannerUrl, target, dataTitle, dataFormName, badge, autoplay, gradient.',
        ],
        'Removed' => [
            'Убраны кнопки добавления/удаления отдельных полей объектов в формах.',
        ],
        'Fixed' => [
            'Удаление последнего элемента массива сохраняет пустой массив (value: []).',
        ],
    ],
    '1.1.0' => [
        'date' => '2025-10-23',
        'Added' => [
            'Спец-правила для scripts.json: запрет удаления/добавления ключей объектов, защита ключа fn от редактирования.',
            'Автодобавление trackHash:false для каждого объекта в metrika.value.',
            'widgets.value редактируется в textarea с экранированием HTML.',
        ],
        'Changed' => [
            'Нормализация переводов строк (CRLF/CR → LF) перед сохранением.',
            'Внедрён Post/Redirect/Get после сохранения, чтобы F5 не пересылал форму.',
        ],
        'Fixed' => [
            'Обработка кнопки “Сохранить”: action теперь читается из POST (исправлена невозможность сохранения).',
        ],
    ],
    '1.0.0' => [
        'date' => '2025-10-23',
        'Added' => [
            'Первый выпуск: список файлов src/*/data, фильтры, просмотр/редактирование JSON, бэкап .bak.YmdHis, CSRF и защита путей.',
            'Режим только для чтения для cars.json, federal-models_price.json, models.json.',
        ],
    ],
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

/** Превратить HTML в читаемый однострочный текст (игнорировать <br/>) */
function plainTextFromHtml(string $value): string {
    // Заменяем <br> на пробелы, остальное удаляем
    $value = preg_replace('/<\\s*br\\s*\\/?>/i', ' ', $value);
    $value = strip_tags((string)$value);
    $value = html_entity_decode($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    // Сжимаем пробелы
    $value = preg_replace('/\\s+/u', ' ', $value);
    return trim((string)$value);
}

/** Построить query-строку для фильтров списка (sites/files) */
function buildFiltersQuery(array $sites, array $files): string {
    $query = http_build_query([
        'sites' => array_values($sites),
        'files' => array_values($files),
    ]);
    return $query ? ('&' . $query) : '';
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

/** Нормализовать переводы строк: CRLF/CR -> LF ("\n") рекурсивно по всему JSON */
function normalizeNewlines($value) {
    // Если это массив (объект или список) — обрабатываем рекурсивно
    if (is_array($value)) {
        $normalized = [];
        foreach ($value as $k => $v) {
            $normalized[$k] = normalizeNewlines($v);
        }
        return $normalized;
    }
    // Строки: заменяем \r\n и одиночные \r на \n
    if (is_string($value)) {
        return str_replace(["\r\n", "\r"], "\n", $value);
    }
    // Остальные типы возвращаем как есть
    return $value;
}

/** Нормализация структуры banners.json: добавление недостающих ключей и дефолтов */
function normalizeBannersData($data) {
    $normalizeItem = function ($item) {
        if (!is_array($item)) $item = [];

        $defImage = ['desktop' => '', 'tablet' => '', 'mobile' => ''];
        $defVideo = ['desktop' => '', 'tablet' => '', 'mobile' => ''];
        $defPosition = ['desktop' => 'center', 'tablet' => 'center', 'mobile' => 'center'];
        $defBadge = [
            'autoname' => '',
            'title' => '',
            'descr' => '',
            'image' => '',
            'position' => 'right',
            'colorText' => '',
            'bg' => false,
        ];

        $ensureObj = function ($value, $defaults) {
            $res = is_array($value) ? $value : [];
            foreach ($defaults as $k => $v) {
                if (!array_key_exists($k, $res)) $res[$k] = $v;
            }
            return $res;
        };

        $badge = $ensureObj($item['badge'] ?? null, $defBadge);
        // Ограничим позицию бейджа допустимыми значениями
        if (!in_array($badge['position'], ['left','center','right'], true)) {
            $badge['position'] = 'right';
        }

        // Собираем объект баннера в фиксированном порядке ключей
        $res = [];
        $res['id'] = isset($item['id']) ? (int)$item['id'] : 0;
        $res['show'] = isset($item['show']) ? (bool)$item['show'] : false;
        $res['type'] = isset($item['type']) ? (string)$item['type'] : '';
        $res['view'] = isset($item['view']) ? (string)$item['view'] : 'link';
        $res['image'] = $ensureObj($item['image'] ?? null, $defImage);
        $res['position'] = $ensureObj($item['position'] ?? null, $defPosition);
        $res['title'] = isset($item['title']) ? (string)$item['title'] : '';
        $res['descr'] = isset($item['descr']) ? (string)$item['descr'] : '';
        $res['btn'] = isset($item['btn']) ? (string)$item['btn'] : '';
        $res['btnUrl'] = isset($item['btnUrl']) ? (string)$item['btnUrl'] : '';
        $res['dataTitle'] = isset($item['dataTitle']) ? (string)$item['dataTitle'] : '';
        $res['dataFormName'] = isset($item['dataFormName']) ? (string)$item['dataFormName'] : '';
        $res['badge'] = $badge;
        $res['autoplay'] = isset($item['autoplay']) ? (int)$item['autoplay'] : 0;
        $res['gradient'] = isset($item['gradient']) ? (bool)$item['gradient'] : false;
        $res['alt'] = isset($item['alt']) ? (string)$item['alt'] : '';
        $res['video'] = $ensureObj($item['video'] ?? null, $defVideo);
        $res['bannerUrl'] = isset($item['bannerUrl']) ? (string)$item['bannerUrl'] : '';
        $res['target'] = isset($item['target']) ? (string)$item['target'] : '';
        $res['btnColor'] = isset($item['btnColor']) ? (string)$item['btnColor'] : '';

        return $res;
    };

    if (is_array($data)) {
        // Если это массив элементов баннеров
        if (!isAssoc($data)) {
            $out = [];
            foreach ($data as $item) { $out[] = $normalizeItem($item); }
            return $out;
        }
        // Если это один объект, нормализуем его
        return $normalizeItem($data);
    }
    // Иное — вернём пустой массив
    return [];
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
function renderJsonFields(string $name, $value, bool $disabled = false, array $ctx = []): void {
    $type = jsonTypeOf($value);
    $isScripts = (bool)($ctx['isScripts'] ?? false);
    $isBanners = (bool)($ctx['isBanners'] ?? false);
    $path = $ctx['pathParts'] ?? [];

    if ($type === 'object') {
        echo '<div class="obj">';
        echo '<details open><summary>Объект</summary>';
        echo '<div class="object-fields">';
        // Для banners: на уровне элемента (path: [index]) применим порядок полей
        $keysToIterate = array_keys($value);
        if ($isBanners && count($path) === 1) {
            $desired = ['id','show','type','view','image','position','video','alt','title','descr','btn','btnColor','btnUrl','bannerUrl','target','dataTitle','dataFormName','badge','autoplay','gradient'];
            $ordered = [];
            foreach ($desired as $dk) { if (array_key_exists($dk, $value)) { $ordered[] = $dk; } }
            foreach ($value as $kExisting => $_) { if (!in_array($kExisting, $ordered, true)) { $ordered[] = $kExisting; } }
            $keysToIterate = $ordered;
        }
        foreach ($keysToIterate as $k) {
            $v = $value[$k];
            echo '<div class="field-row">';
            echo '<label>' . h((string)$k) . '</label>';
            $childName = $name . '[' . h((string)$k) . ']';
            $childCtx = $ctx; $childCtx['pathParts'] = array_merge($path, [(string)$k]);
            $childDisabled = $disabled || ($isScripts && (string)$k === 'fn');
            renderJsonFields($childName, $v, $childDisabled, $childCtx);
            echo '</div>';
        }
        echo '</div>';
        echo '</details>';
        echo '</div>';
        return;
    }

    if ($type === 'array') {
        echo '<div class="arr">';
        echo '<details open><summary>Массив</summary>';
        $dataAttrs = ' data-name="' . h($name) . '"';
        // Пометим специальные контейнеры scripts.json
        if ($isScripts && count($path) >= 2 && $path[0] === 'metrika' && $path[1] === 'value') {
            $dataAttrs .= ' data-scripts-context="metrika-value"';
        }
        if ($isScripts && count($path) >= 2 && $path[0] === 'widgets' && $path[1] === 'value') {
            $dataAttrs .= ' data-scripts-context="widgets-value"';
        }
        if ($isBanners && count($path) >= 1 && $path[0] === 'image') {
            $dataAttrs .= ' data-banners-context="image"';
        }
        if ($isBanners && count($path) === 0) {
            $dataAttrs .= ' data-banners-context="banners-root"';
        }
        echo '<div class="array-items"' . $dataAttrs . '>';
        foreach ($value as $idx => $v) {
            $childName = $name . '[' . h((string)$idx) . ']';
            $childCtx = $ctx; $childCtx['pathParts'] = array_merge($path, [(string)$idx]);
            // Для корневого массива banners.json — оборачиваем элемент в details с кратким заголовком
            if ($isBanners && count($path) === 0 && is_array($v)) {
                $isEnabled = isset($v['show']) ? (bool)$v['show'] : true;
                $typeLabel = isset($v['type']) && $v['type'] !== '' ? (string)$v['type'] : 'banner';
                $typeLabel = ($isEnabled ? '' : '(Не активно) ') . $typeLabel;
                $titleLabel = isset($v['title']) ? plainTextFromHtml((string)$v['title']) : '';
                $titleLabel = mb_strlen($titleLabel) > 60 ? mb_substr($titleLabel, 0, 60) . '…' : $titleLabel;
                $thumb = '';
                if (isset($v['image']) && is_array($v['image'])) {
                    $thumb = (string)($v['image']['desktop'] ?? '');
                }
                echo '<div class="array-item' . ($isEnabled ? '' : ' banner-disabled') . '">';
                echo '<details' . ($isEnabled ? ' open' : '') . '>';
                echo '<summary style="display:flex;gap:10px;align-items:center">';
                if ($thumb !== '') {
                    echo '<img src="' . h($thumb) . '" alt="" style="width:100px;height:auto;object-fit:cover;border:1px solid #2a2d36;border-radius:4px">';
                }
                echo '<span><b>' . h($typeLabel) . '</b>' . ($titleLabel !== '' ? ' — ' . h($titleLabel) : '') . '</span>';
                echo '</summary>';
                renderJsonFields($childName, $v, $disabled, $childCtx);
                echo '<button type="button" class="btn btn-danger" onclick="removeArrayItem(this)" ' . ($disabled ? 'disabled' : '') . '>Удалить элемент</button>';
                echo '</details>';
                echo '</div>';
            } else {
                echo '<div class="array-item">';
                renderJsonFields($childName, $v, $disabled, $childCtx);
                echo '<button type="button" class="btn btn-danger" onclick="removeArrayItem(this)" ' . ($disabled ? 'disabled' : '') . '>Удалить элемент</button>';
                echo '</div>';
            }
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

    // Спец: для scripts.json -> widgets.value всегда textarea и экранирование
    $forceTextarea = false;
    if ($isScripts && count($path) >= 2 && $path[0] === 'widgets' && $path[1] === 'value') {
        $forceTextarea = true;
    }
    // Для banners.json — position.* (desktop/tablet/mobile) и badge.position — отдельные контролы
    $bannerPath = $path;
    // В корневом массиве баннеров первый элемент пути — индекс
    if ($isBanners && isset($bannerPath[0]) && is_numeric($bannerPath[0])) {
        $bannerPath = array_slice($bannerPath, 1);
    }
    $isBannerPosition = ($isBanners && count($bannerPath) >= 1 && $bannerPath[0] === 'position');
    $isBadgePosition = ($isBanners && count($bannerPath) >= 2 && $bannerPath[0] === 'badge' && $bannerPath[1] === 'position');
    $isBannerImage = ($isBanners && count($bannerPath) >= 2 && $bannerPath[0] === 'image' && in_array($bannerPath[1], ['desktop','tablet','mobile'], true));

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
            // Миниатюра рядом с image.* в banners.json
            if ($isBannerImage) {
                echo '<div style="display:flex;gap:10px;align-items:center;width:100%">';
                echo '<input type="text" name="' . h($inputName) . '" value="' . h($str) . '"' . $common . ' class="input">';
                if ($str !== '') {
                    echo '<img src="' . h($str) . '" alt="" style="width:100px;height:auto;object-fit:cover;border:1px solid #2a2d36;border-radius:4px">';
                }
                echo '</div>';
                break;
            }
            // select для badge.position
            if ($isBadgePosition) {
                $opts = ['left','center','right'];
                echo '<select name="' . h($inputName) . '"' . $common . ' class="input">';
                foreach ($opts as $opt) {
                    $sel = ($str === $opt) ? ' selected' : '';
                    echo '<option value="' . h($opt) . '"' . $sel . '>' . h($opt) . '</option>';
                }
                echo '</select>';
                break;
            }
            // select/text гибрид для position.desktop/tablet/mobile
            if ($isBannerPosition && count($path) >= 2) {
                // Предопределённые опции и свободный ввод процента
                $presets = ['top','center','bottom'];
                $isPreset = in_array($str, $presets, true);
                echo '<div style="display:flex;gap:6px;align-items:center">';
                echo '<select onchange="if(this.value===\'custom\'){this.nextElementSibling.style.display=\'block\'}else{this.nextElementSibling.style.display=\'none\';this.nextElementSibling.value=this.value}" class="input">';
                foreach ($presets as $opt) {
                    $sel = ($str === $opt) ? ' selected' : '';
                    echo '<option value="' . h($opt) . '"' . $sel . '>' . h($opt) . '</option>';
                }
                echo '<option value="custom"' . ($isPreset ? '' : ' selected') . '>custom %</option>';
                echo '</select>';
                echo '<input type="text" name="' . h($inputName) . '" value="' . h($str) . '"' . ($isPreset ? ' style=\"display:none\"' : '') . ' class="input" placeholder="например 25%">';
                echo '</div>';
                break;
            }
            // Большие строки или с переводами строк рендерим textarea
            // Требуется экранировать HTML в: title, descr, dataTitle, dataFormName, badge.autoname, badge.title, badge.descr
            $shouldTextarea = $forceTextarea || strlen($str) > 120 || strpos($str, "\n") !== false;
            $needsHtml = false;
            if ($isBanners) {
                $p = $bannerPath;
                // баннерные поля
                if (in_array($p[0] ?? '', ['title','descr','dataTitle','dataFormName'], true)) $needsHtml = true;
                if (($p[0] ?? '') === 'badge' && in_array($p[1] ?? '', ['autoname','title','descr'], true)) $needsHtml = true;
            }
            if ($shouldTextarea || $needsHtml) {
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

// Действие: учитываем POST (формы) и затем GET
$action = $_POST['action'] ?? ($_GET['action'] ?? 'list');

// CSRF: генерируем токен если нет
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(16));
}
$csrfToken = $_SESSION['csrf_token'];

// Сообщения пользователю
$notice = '';
$error = '';
// Отложенные уведомления после редиректа (PRG)
if (!empty($_SESSION['notice'])) {
    $notice = (string)$_SESSION['notice'];
    unset($_SESSION['notice']);
}

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

        // Спец-правила для scripts.json
        if ($file === 'scripts.json') {
            // 1) Нельзя удалять ключи верхнего уровня и добавлять новые —
            //    мы приводим структуру к исходным ключам файла:
            $original = loadJson($path);
            if (is_array($original) && is_array($normalized)) {
                $fixed = [];
                foreach ($original as $key => $origVal) {
                    if (array_key_exists($key, $normalized)) {
                        $fixed[$key] = $normalized[$key];
                    } else {
                        // если ключ удалили — вернём пустое значение того же типа
                        $t = jsonTypeOf($origVal);
                        $fixed[$key] = ($t==='object')?[]:(($t==='array')?[]:(($t==='bool')?false:(($t==='number')?0:(($t==='null')?null:''))));
                    }
                }
                $normalized = $fixed;
            }
            // 2) Нельзя менять значения ключей "fn" — вернём оригинальные
            $restoreFnRec = function (&$dst, $src) use (&$restoreFnRec) {
                if (!is_array($dst) || !is_array($src)) return;
                foreach ($src as $k => $v) {
                    if ($k === 'fn') { $dst[$k] = $v; continue; }
                    if (is_array($v) && isset($dst[$k]) && is_array($dst[$k])) {
                        $restoreFnRec($dst[$k], $v);
                    }
                }
            };
            $orig = loadJson($path);
            $restoreFnRec($normalized, $orig);

            // 3) В метрике внутри каждого объекта value добавить trackHash:false по умолчанию
            if (isset($normalized['metrika']['value']) && is_array($normalized['metrika']['value'])) {
                foreach ($normalized['metrika']['value'] as $i => $obj) {
                    if (is_array($obj) && !array_key_exists('trackHash', $obj)) {
                        $normalized['metrika']['value'][$i]['trackHash'] = false;
                    }
                }
            }
            // Если массивы value стали полностью пустыми и это единственный элемент был удалён — оставляем [] (ничего не добавляем), форма останется с кнопкой «Добавить элемент»
        }
        // Спец-правила для banners.json — нормализация структуры и сортировка
        if ($file === 'banners.json') {
            $normalized = normalizeBannersData($normalized);
            // Перенумерация ID по требованию и сортировка
            if (is_array($normalized) && !isAssoc($normalized)) {
                if (!empty($_POST['banners_reassign_ids'])) {
                    // Проставить ID от большего к меньшему по позиции (с конца к началу)
                    $id = 1;
                    for ($i = count($normalized) - 1; $i >= 0; $i--) {
                        $normalized[$i]['id'] = $id++;
                    }
                } else {
                    // Обычное сохранение — сортировать по id убыванию
                    usort($normalized, function($a, $b) {
                        return ((int)($b['id'] ?? 0)) <=> ((int)($a['id'] ?? 0));
                    });
                }
            }
        }

        // Нормализуем переводы строк (CRLF/CR -> LF) перед сохранением
        $normalized = normalizeNewlines($normalized);
        // Сохраняем с бэкапом
        saveJsonWithBackup($path, $normalized);
        $_SESSION['notice'] = 'Файл успешно сохранён: ' . $site . '/' . $DATA_DIR_NAME . '/' . $file;
        // PRG: перенаправляем на GET, чтобы F5 не пересылал форму
        $postSites = isset($_POST['sites']) && is_array($_POST['sites']) ? $_POST['sites'] : [];
        $postFiles = isset($_POST['files']) && is_array($_POST['files']) ? $_POST['files'] : [];
        $filtersQuery = buildFiltersQuery($postSites, $postFiles);
        header('Location: ?action=edit&site=' . rawurlencode($site) . '&file=' . rawurlencode($file) . $filtersQuery, true, 303);
        exit;
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
        .obj{width: 100%}
        .add-kv{display:flex;gap:8px;align-items:center;margin-top:6px}
        .top-actions{display:flex;gap:8px;align-items:center}
        .readonly-note{color:#ffdf9b}
        .path{font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace}
        .banner-disabled{opacity:.55;filter:grayscale(1);background:#101218}
    </style>
    <script>
        // Небольшие JS-хелперы для добавления/удаления полей массива и объектов
        function removeArrayItem(btn){
            const item = btn.closest('.array-item');
            if (item) item.remove();
            const container = btn.closest('.array-items');
            renumberArrayIndexes(container);
            // Если остался 0 элементов, оставим пустой массив, чтобы была кнопка «Добавить элемент»
            if (container && container.querySelectorAll(':scope > .array-item').length === 0) {
                const name = container.getAttribute('data-name');
                // Для текстового массива — добавим пустой placeholder только визуально?
                // Проще оставить пусто: сервер воспримет как []
            }
        }
        function addArrayItem(btn){
            const container = btn.previousElementSibling; // .array-items
            if (!container) return;
            const name = container.getAttribute('data-name');
            const idx = container.querySelectorAll(':scope > .array-item').length;
            const ctx = container.getAttribute('data-scripts-context');
            const bctx = container.getAttribute('data-banners-context');
            // По умолчанию добавляем строковое поле, но для metrika.value добавляем с ключом trackHash:false
            const div = document.createElement('div');
            div.className = 'array-item';
            if (ctx === 'metrika-value') {
                const base = `${name}[${idx}]`;
                div.innerHTML = `<div class="field-row"><label>trackHash</label><input type="checkbox" name="${base}[trackHash]" value="1"></div>` +
                    `<button type="button" class="btn btn-danger" onclick="removeArrayItem(this)">Удалить элемент</button>`;
            } else if (ctx === 'widgets-value') {
                // widgets.value — textarea для HTML
                div.innerHTML = `<textarea name="${name}[${idx}]" rows="4" class="textarea"></textarea>` +
                    `<button type="button" class="btn btn-danger" onclick="removeArrayItem(this)">Удалить элемент</button>`;
            } else if (bctx === 'banners-root') {
                // Создаём пустой объект баннера с основными ключами
                const base = `${name}[${idx}]`;
                div.innerHTML = `
                    <div class="field-row"><label>id</label><input type="number" step="1" name="${base}[id]" value="0" class="input"></div>
                    <div class="field-row"><label>show</label><input type="hidden" name="${base}[show]" value="0"><input type="checkbox" name="${base}[show]" value="1"></div>
                    <div class="field-row"><label>type</label><input type="text" name="${base}[type]" value="" class="input"></div>
                    <div class="field-row"><label>view</label><input type="text" name="${base}[view]" value="link" class="input"></div>
                    <div class="field-row"><label>image</label>
                        <div class="obj">
                            <div class="object-fields">
                                <div class="field-row"><label>desktop</label><input type="text" name="${base}[image][desktop]" value="" class="input"></div>
                                <div class="field-row"><label>tablet</label><input type="text" name="${base}[image][tablet]" value="" class="input"></div>
                                <div class="field-row"><label>mobile</label><input type="text" name="${base}[image][mobile]" value="" class="input"></div>
                            </div>
                        </div>
                    </div>
                    <div class="field-row"><label>position</label>
                        <div class="obj">
                            <div class="object-fields">
                                <div class="field-row"><label>desktop</label><input type="text" name="${base}[position][desktop]" value="center" class="input"></div>
                                <div class="field-row"><label>tablet</label><input type="text" name="${base}[position][tablet]" value="center" class="input"></div>
                                <div class="field-row"><label>mobile</label><input type="text" name="${base}[position][mobile]" value="center" class="input"></div>
                            </div>
                        </div>
                    </div>
                    <div class="field-row"><label>video</label>
                        <div class="obj">
                            <div class="object-fields">
                                <div class="field-row"><label>desktop</label><input type="text" name="${base}[video][desktop]" value="" class="input"></div>
                                <div class="field-row"><label>tablet</label><input type="text" name="${base}[video][tablet]" value="" class="input"></div>
                                <div class="field-row"><label>mobile</label><input type="text" name="${base}[video][mobile]" value="" class="input"></div>
                            </div>
                        </div>
                    </div>
                    <div class="field-row"><label>alt</label><input type="text" name="${base}[alt]" value="" class="input"></div>
                    <div class="field-row"><label>title</label><textarea name="${base}[title]" rows="2" class="textarea"></textarea></div>
                    <div class="field-row"><label>descr</label><textarea name="${base}[descr]" rows="3" class="textarea"></textarea></div>
                    <div class="field-row"><label>btn</label><input type="text" name="${base}[btn]" value="" class="input"></div>
                    <div class="field-row"><label>btnColor</label><input type="text" name="${base}[btnColor]" value="" class="input"></div>
                    <div class="field-row"><label>btnUrl</label><input type="text" name="${base}[btnUrl]" value="" class="input"></div>
                    <div class="field-row"><label>bannerUrl</label><input type="text" name="${base}[bannerUrl]" value="" class="input"></div>
                    <div class="field-row"><label>target</label><input type="text" name="${base}[target]" value="" class="input"></div>
                    <div class="field-row"><label>dataTitle</label><textarea name="${base}[dataTitle]" rows="2" class="textarea"></textarea></div>
                    <div class="field-row"><label>dataFormName</label><textarea name="${base}[dataFormName]" rows="2" class="textarea"></textarea></div>
                    <div class="field-row"><label>badge</label>
                        <div class="obj">
                            <div class="object-fields">
                                <div class="field-row"><label>autoname</label><textarea name="${base}[badge][autoname]" rows="1" class="textarea"></textarea></div>
                                <div class="field-row"><label>title</label><textarea name="${base}[badge][title]" rows="1" class="textarea"></textarea></div>
                                <div class="field-row"><label>descr</label><textarea name="${base}[badge][descr]" rows="2" class="textarea"></textarea></div>
                                <div class="field-row"><label>image</label><input type="text" name="${base}[badge][image]" value="" class="input"></div>
                                <div class="field-row"><label>position</label><select name="${base}[badge][position]" class="input"><option value="left">left</option><option value="center" selected>center</option><option value="right">right</option></select></div>
                                <div class="field-row"><label>colorText</label><input type="text" name="${base}[badge][colorText]" value="" class="input"></div>
                                <div class="field-row"><label>bg</label><input type="hidden" name="${base}[badge][bg]" value="0"><input type="checkbox" name="${base}[badge][bg]" value="1"></div>
                            </div>
                        </div>
                    </div>
                    <div class="field-row"><label>autoplay</label><input type="number" step="1" name="${base}[autoplay]" value="0" class="input"></div>
                    <div class="field-row"><label>gradient</label><input type="hidden" name="${base}[gradient]" value="0"><input type="checkbox" name="${base}[gradient]" value="1"></div>
                    <button type="button" class="btn btn-danger" onclick="removeArrayItem(this)">Удалить элемент</button>
                `;
            } else {
                div.innerHTML = `<input type="text" name="${name}[${idx}]" value="" class="input">` +
                    `<button type="button" class="btn btn-danger" onclick="removeArrayItem(this)">Удалить элемент</button>`;
            }
            container.appendChild(div);
            renumberArrayIndexes(container);
        }
        function renumberArrayIndexes(container){
            if (!container) return;
            const name = container.getAttribute('data-name');
            const items = container.querySelectorAll(':scope > .array-item');
            items.forEach((item, i) => {
                // Перенумеровываем только плоские инпуты верхнего уровня внутри элемента
                item.querySelectorAll(':scope > input, :scope > textarea, :scope > select, :scope > .field-row input, :scope > .field-row textarea, :scope > .field-row select').forEach(el => {
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
            // В scripts.json добавление ключей запрещено — кнопки нет.
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
            // Текущие фильтры списка, чтобы сохранить их при возврате
            $backSites = isset($_GET['sites']) && is_array($_GET['sites']) ? $_GET['sites'] : [];
            $backFiles = isset($_GET['files']) && is_array($_GET['files']) ? $_GET['files'] : [];
            $backQuery = buildFiltersQuery($backSites, $backFiles);
            try {
                $jsonData = loadJson((string)$path);
            } catch (Throwable $e) {
                $jsonData = null;
                $error = $error ?: $e->getMessage();
            }
    ?>
        <div class="panel">
            <div class="breadcrumbs">
                <a href="?<?= ltrim($backQuery, '&') ?>">← К списку</a>
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
                    <?php foreach ($backSites as $s): ?>
                        <input type="hidden" name="sites[]" value="<?= h((string)$s) ?>">
                    <?php endforeach; ?>
                    <?php foreach ($backFiles as $f): ?>
                        <input type="hidden" name="files[]" value="<?= h((string)$f) ?>">
                    <?php endforeach; ?>
                    <?php
                        // Встраиваем карту типов в скрытом JSON-поле
                        renderTypesForValue('types', $jsonData);
                        // Рендерим поля данных (корневое имя — data)
                        $ctx = [];
                        if ($file === 'scripts.json') { $ctx['isScripts'] = true; $ctx['pathParts'] = []; }
                        if ($file === 'banners.json') { $ctx['isBanners'] = true; $ctx['pathParts'] = []; }
                        renderJsonFields('data', $jsonData, $readonly, $ctx);
                    ?>
                    <div class="top-actions">
                        <a class="btn" href="?action=edit&amp;site=<?= h($site) ?>&amp;file=<?= h($file) ?>">Сбросить изменения</a>
                        <?php if (!$readonly): ?>
                            <button type="submit" class="btn btn-primary">Сохранить</button>
                            <?php if ($file === 'banners.json'): ?>
                                <button type="submit" name="banners_reassign_ids" value="1" class="btn">Проставить ID от Большего к Меньшему</button>
                            <?php endif; ?>
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
                <?php
                    $listFiltersQuery = buildFiltersQuery($filterSites, $filterFiles);
                ?>
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
                                <a class="btn" href="?action=edit&amp;site=<?= h($site) ?>&amp;file=<?= h($file) ?><?= $listFiltersQuery ?>">Открыть</a>
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
        <div>Версия: <?= h($APP_VERSION) ?></div>
    </div>

    <div class="panel">
        <h1 style="font-size:16px;margin:0 0 8px">ChangeLog</h1>
        <div class="muted">Формат по <a href="https://keepachangelog.com/en/1.1.0/" target="_blank" rel="noopener">Keep a Changelog</a>. Версии следуют <a href="https://semver.org/spec/v2.0.0.html" target="_blank" rel="noopener">Semantic Versioning</a>.</div>
        <div style="margin-top:10px"></div>
        <?php
        $renderList = function(array $items) {
            if (empty($items)) return;
            echo '<ul style="margin:6px 0 12px 18px">';
            foreach ($items as $it) echo '<li>' . h($it) . '</li>';
            echo '</ul>';
        };
        // Unreleased
        if (isset($CHANGELOG['Unreleased'])) {
            echo '<div style="margin:8px 0"><span class="kbd">[Unreleased]</span></div>';
            $unrel = $CHANGELOG['Unreleased'];
            foreach (['Added','Changed','Deprecated','Removed','Fixed','Security'] as $sec) {
                if (!empty($unrel[$sec])) { echo '<div><b>' . h($sec) . '</b></div>'; $renderList($unrel[$sec]); }
            }
        }
        // Остальные версии (последняя — первая)
        foreach ($CHANGELOG as $ver => $info) {
            if ($ver === 'Unreleased') continue;
            $date = isset($info['date']) ? $info['date'] : '';
            echo '<div style="margin:12px 0"><span class="kbd">[' . h($ver) . ']</span>' . ($date ? ' - ' . h($date) : '') . '</div>';
            foreach (['Added','Changed','Deprecated','Removed','Fixed','Security'] as $sec) {
                if (!empty($info[$sec])) { echo '<div><b>' . h($sec) . '</b></div>'; $renderList($info[$sec]); }
            }
        }
        ?>
    </div>

<?php /* Конец контейнера */ ?>
</div>
</body>
</html>


