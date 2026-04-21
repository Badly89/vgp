-- Создание таблиц, если их нет
CREATE TABLE IF NOT EXISTS residents (
    _id VARCHAR(64) PRIMARY KEY,
    data JSON NOT NULL,
    full_name VARCHAR(255) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.ФИО'))) STORED,
    address VARCHAR(500) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.Почтовый адрес'))) STORED,
    house_number VARCHAR(50) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.№ дома'))) STORED,
    apartment VARCHAR(50) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.№ квартиры'))) STORED,
    phone VARCHAR(50) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.Телефон'))) STORED,
    gender VARCHAR(20) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.Пол'))) STORED,
    category VARCHAR(100) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.Категория'))) STORED,
    is_child BOOLEAN GENERATED ALWAYS AS (JSON_EXTRACT(data, '$.Ребенок') = 'Да' OR JSON_EXTRACT(data, '$.Ребенок') = true) STORED,
    birth_date DATE GENERATED ALWAYS AS (STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(data, '$.Дата рождения')), '%Y-%m-%d')) STORED,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_full_name (full_name),
    INDEX idx_address (address(255)),
    INDEX idx_house_number (house_number),
    INDEX idx_gender (gender),
    INDEX idx_category (category),
    INDEX idx_is_child (is_child)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS owners (
    _id VARCHAR(64) PRIMARY KEY,
    data JSON NOT NULL,
    full_name VARCHAR(255) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.ФИО'))) STORED,
    address VARCHAR(500) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.Почтовый адрес объекта'))) STORED,
    house_number VARCHAR(50) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.№ дома'))) STORED,
    phone VARCHAR(50) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.Телефон'))) STORED,
    share VARCHAR(100) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.Доля'))) STORED,
    owner_type VARCHAR(50) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.Тип собственника'))) STORED,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_full_name (full_name),
    INDEX idx_address (address(255)),
    INDEX idx_house_number (house_number),
    INDEX idx_owner_type (owner_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS housing (
    _id VARCHAR(64) PRIMARY KEY,
    data JSON NOT NULL,
    address VARCHAR(500) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.Почтовый адрес'))) STORED,
    house_number VARCHAR(50) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.Номер дома'))) STORED,
    category VARCHAR(100) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.Категория'))) STORED,
    building_type VARCHAR(100) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.Тип здания'))) STORED,
    is_emergency BOOLEAN GENERATED ALWAYS AS (JSON_EXTRACT(data, '$.Аварийный') = true OR JSON_EXTRACT(data, '$.Аварийный') = 'Да') STORED,
    floors INT GENERATED ALWAYS AS (CAST(JSON_UNQUOTE(JSON_EXTRACT(data, '$.Этажность')) AS UNSIGNED)) STORED,
    area DECIMAL(10,2) GENERATED ALWAYS AS (CAST(JSON_UNQUOTE(JSON_EXTRACT(data, '$.Площадь')) AS DECIMAL(10,2))) STORED,
    build_year INT GENERATED ALWAYS AS (CAST(JSON_UNQUOTE(JSON_EXTRACT(data, '$.Год постройки')) AS UNSIGNED)) STORED,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_address (address(255)),
    INDEX idx_house_number (house_number),
    INDEX idx_category (category),
    INDEX idx_building_type (building_type),
    INDEX idx_is_emergency (is_emergency)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS organizations (
    _id VARCHAR(64) PRIMARY KEY,
    data JSON NOT NULL,
    name VARCHAR(500) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.Название'))) STORED,
    org_type VARCHAR(100) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.Тип организации'))) STORED,
    inn VARCHAR(20) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.ИНН'))) STORED,
    address TEXT GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.Адрес'))) STORED,
    phone VARCHAR(50) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.Телефон'))) STORED,
    email VARCHAR(255) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.Email'))) STORED,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name(100)),
    INDEX idx_org_type (org_type),
    INDEX idx_inn (inn),
    INDEX idx_address (address(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sync_metadata (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(64) UNIQUE,
    last_sync TIMESTAMP NULL,
    total_records INT DEFAULT 0,
    sync_status VARCHAR(20) DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;