from app.core.database import mariadb_client

async def init_database():
    """Создание таблиц при первом запуске"""
    await mariadb_client.init_pool()
    
    # Таблица жителей с корректной обработкой массивов
    await mariadb_client.execute("""
        CREATE TABLE IF NOT EXISTS residents (
            _id VARCHAR(64) PRIMARY KEY,
            data JSON NOT NULL,
            full_name VARCHAR(255) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.ФИО'))) STORED,
            address VARCHAR(500) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.Почтовый адрес'))) STORED,
            house_number VARCHAR(50) GENERATED ALWAYS AS (
                CASE 
                    WHEN JSON_TYPE(JSON_EXTRACT(data, '$.№ дома')) = 'ARRAY' 
                        THEN JSON_UNQUOTE(JSON_EXTRACT(data, '$.№ дома[0]'))
                    ELSE JSON_UNQUOTE(JSON_EXTRACT(data, '$.№ дома'))
                END
            ) STORED,
            apartment VARCHAR(50) GENERATED ALWAYS AS (
                CASE 
                    WHEN JSON_TYPE(JSON_EXTRACT(data, '$.№ квартиры')) = 'ARRAY' 
                        THEN JSON_UNQUOTE(JSON_EXTRACT(data, '$.№ квартиры[0]'))
                    ELSE JSON_UNQUOTE(JSON_EXTRACT(data, '$.№ квартиры'))
                END
            ) STORED,
            phone VARCHAR(50) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.Телефон'))) STORED,
            gender VARCHAR(20) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.Пол'))) STORED,
            category VARCHAR(100) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.Категория'))) STORED,
            is_child BOOLEAN GENERATED ALWAYS AS (
                JSON_EXTRACT(data, '$.Ребенок') = 'Да' OR 
                JSON_EXTRACT(data, '$.Ребенок') = true OR
                JSON_EXTRACT(data, '$.Ребенок[0]') = 'Да'
            ) STORED,
            synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_full_name (full_name),
            INDEX idx_address (address(255)),
            INDEX idx_house_number (house_number),
            INDEX idx_gender (gender),
            INDEX idx_category (category),
            INDEX idx_is_child (is_child)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """)
    
    # Таблица собственников
    await mariadb_client.execute("""
        CREATE TABLE IF NOT EXISTS owners (
            _id VARCHAR(64) PRIMARY KEY,
            data JSON NOT NULL,
            full_name VARCHAR(255) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.ФИО'))) STORED,
            address VARCHAR(500) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.Почтовый адрес объекта'))) STORED,
            phone VARCHAR(50) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.Телефон'))) STORED,
            share VARCHAR(100) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.Доля'))) STORED,
            synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_full_name (full_name),
            INDEX idx_address (address(255))
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """)
    
    # Таблица жилого фонда
    await mariadb_client.execute("""
        CREATE TABLE IF NOT EXISTS housing (
            _id VARCHAR(64) PRIMARY KEY,
            data JSON NOT NULL,
            address VARCHAR(500) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.Почтовый адрес'))) STORED,
            house_number VARCHAR(50) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.Номер дома'))) STORED,
            category VARCHAR(100) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.Категория'))) STORED,
            building_type VARCHAR(100) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.Тип здания'))) STORED,
            is_emergency BOOLEAN GENERATED ALWAYS AS (JSON_EXTRACT(data, '$.Аварийный') = true OR JSON_EXTRACT(data, '$.Аварийный') = 'Да') STORED,
            synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_address (address(255)),
            INDEX idx_category (category),
            INDEX idx_building_type (building_type),
            INDEX idx_is_emergency (is_emergency)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """)
    
    # Таблица метаданных синхронизации
    await mariadb_client.execute("""
        CREATE TABLE IF NOT EXISTS sync_metadata (
            table_name VARCHAR(64) PRIMARY KEY,
            last_sync TIMESTAMP,
            total_records INT,
            sync_status VARCHAR(20)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)
    
    print("✅ Таблицы MariaDB созданы")