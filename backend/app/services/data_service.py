from typing import Dict, List, Optional, Any
import re
import json
from app.core.dtable_client import dtable_client
from app.core.database import mariadb_client
from app.core.config import get_settings


settings = get_settings()

class DataService:
    """Сервис для работы с данными жилого фонда"""
    
    def __init__(self):
        self.client = dtable_client
        self._residents_cache = None
        self._owners_cache = None
        self._housing_cache = None
        self._organisations_cache = None
        
    @staticmethod
    def extract_house_number(address: str) -> int:
        """Извлечение номера дома из адреса"""
        if not address:
            return 0
        match = re.search(r'\d+', str(address))
        return int(match.group()) if match else 0
    
# Временный тестовый код
    async def _load_owners_with_sql_pagination(self) -> List[Dict]:
        """Загрузка всех собственников через SQL с пагинацией по _id"""
        all_rows = []
        seen_ids = set()
        limit = 1000
        last_id = ""
        
        print(f"🔄 Загружаем собственников через SQL с пагинацией...")
        
        while True:
            if last_id:
                sql = f"""
                    SELECT * FROM `{settings.TABLE_OWNERS}`
                    WHERE `_id` > '{last_id}'
                    ORDER BY `_id`
                    LIMIT {limit}
                """
            else:
                sql = f"""
                    SELECT * FROM `{settings.TABLE_OWNERS}`
                    ORDER BY `_id`
                    LIMIT {limit}
                """
            
            try:
                result = await self.client.sql_query(sql)
                rows = result.get("results", [])
                
                if not rows:
                    print(f"   SQL вернул 0 записей, остановка")
                    break
                
                new_count = 0
                for row in rows:
                    row_id = row.get("_id")
                    if row_id and row_id not in seen_ids:
                        seen_ids.add(row_id)
                        all_rows.append(row)
                        new_count += 1
                        last_id = row_id
                
                print(f"   Загружено {len(rows)} записей, новых: {new_count}, всего: {len(all_rows)}")
                
                if len(rows) < limit:
                    break
                    
            except Exception as e:
                print(f"   ❌ Ошибка SQL: {e}")
                break
        
        print(f"✅ SQL загрузил {len(all_rows)} собственников")
        return all_rows


    async def _load_all_with_sql_pagination(self, table_name: str) -> List[Dict]:
        """Загрузка всех данных через SQL с пагинацией по _id"""
        all_rows = []
        seen_ids = set()
        limit = 1000
        last_id = ""
        
        print(f"🔄 Загружаем {table_name} через SQL с пагинацией по _id...")
        
        while True:
            # Строим SQL с условием WHERE _id > last_id
            if last_id:
                sql = f"""
                    SELECT * FROM `{table_name}`
                    WHERE `_id` > '{last_id}'
                    ORDER BY `_id`
                    LIMIT {limit}
                """
            else:
                sql = f"""
                    SELECT * FROM `{table_name}`
                    ORDER BY `_id`
                    LIMIT {limit}
                """
            
            try:
                result = await self.client.sql_query(sql)
                rows = result.get("results", [])
                
                if not rows:
                    print(f"   SQL вернул 0 записей, остановка")
                    break
                
                new_count = 0
                for row in rows:
                    row_id = row.get("_id")
                    if row_id and row_id not in seen_ids:
                        seen_ids.add(row_id)
                        all_rows.append(row)
                        new_count += 1
                        last_id = row_id  # Запоминаем последний ID
                
                print(f"   Загружено {len(rows)} записей, новых: {new_count}, всего: {len(all_rows)}, last_id: {last_id[:30]}...")
                
                if len(rows) < limit:
                    print(f"   Получено меньше limit, остановка")
                    break
                    
            except Exception as e:
                print(f"   ❌ Ошибка SQL: {e}")
                break
        
        print(f"✅ SQL загрузил {len(all_rows)} уникальных записей")
        return all_rows

    async def _get_cached_or_load(self, cache_key: str, table_name: str) -> List[Dict]:
        """Загружает данные из кэша или из API"""
        # Проверяем Redis только если он настроен
        if self.client._redis and settings.REDIS_URL:
            try:
                cached = await self.client._redis.get(cache_key)
                if cached:
                    print(f"✅ Данные из Redis: {cache_key}")
                    return json.loads(cached)
            except Exception as e:
                print(f"⚠️ Ошибка чтения из Redis: {e}")
        
        # Загружаем из API
        print(f"🔄 Загружаем из API: {table_name}")
        
        all_rows = []
        seen_ids = set()
        offset = 0
        limit = 1000
        empty_responses = 0
        max_empty = 3
        
        while True:
            try:
                result = await self.client.get_table_rows(
                    table_name=table_name,
                    limit=limit,
                    offset=offset,
                    convert_keys=True
                )
            except Exception as e:
                print(f"   ⚠️ Ошибка запроса на offset {offset}: {e}")
                break
            
            rows = result.get("rows", [])
            
            if not rows:
                empty_responses += 1
                if empty_responses >= max_empty:
                    print(f"   Достигнут лимит пустых ответов, остановка")
                    break
                offset += limit
                continue
            
            empty_responses = 0
            new_rows = 0
            
            for row in rows:
                row_id = row.get("_id")
                if row_id and row_id not in seen_ids:
                    seen_ids.add(row_id)
                    all_rows.append(row)
                    new_rows += 1
            
            print(f"   Загружено {len(all_rows)} записей (offset={offset}, новых={new_rows})")
            
            if new_rows == 0:
                print(f"   Нет новых записей, остановка")
                break
            
            if len(rows) < limit:
                print(f"   Получено меньше limit, остановка")
                break
            
            offset += limit
        
        print(f"✅ Всего загружено {len(all_rows)} уникальных записей из {table_name}")
        
        # Сохраняем в Redis только если он доступен
        if self.client._redis and settings.REDIS_URL and all_rows:
            try:
                await self.client._redis.setex(
                    cache_key, 
                    3600, 
                    json.dumps(all_rows, default=str, ensure_ascii=False)
                )
                print(f"💾 Сохранено в Redis: {cache_key}")
            except Exception as e:
                print(f"⚠️ Ошибка сохранения в Redis: {e}")
        
        return all_rows
    
    
    async def get_all_owners(self) -> List[Dict]:
        """Получить всех собственников (с кэшированием)"""
        if self._owners_cache is None:
            self._owners_cache = await self._get_cached_or_load(
                "dtable:all_owners",
                settings.TABLE_OWNERS
            )
        return self._owners_cache
    
    async def get_all_housing(self) -> List[Dict]:
        """Получить все объекты жилого фонда (с кэшированием)"""
        if self._housing_cache is None:
            self._housing_cache = await self._get_cached_or_load(
                "dtable:all_housing",
                settings.TABLE_HOUSING
            )
        return self._housing_cache
    
    async def _get_residents_list_fallback(
        self,
        page: int,
        page_size: int,
        search: Optional[str],
        sort_field: Optional[str],
        sort_order: str
    ) -> Dict[str, Any]:
        """Запасной метод через API"""
        try:
            offset = (page - 1) * page_size
            result = await self.client.get_table_rows(
                table_name=settings.TABLE_RESIDENTS,
                limit=page_size,
                offset=offset,
                convert_keys=True
            )
            
            rows = result.get("rows", [])
            total = result.get("total", 0)
            
            return {
                "data": rows,
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": (total + page_size - 1) // page_size if total > 0 else 1
            }
        except Exception as e:
            raise

    async def get_housing_list(
        self,
        page: int = 1,
        page_size: int = 50,
        search: Optional[str] = None,
        sort_field: Optional[str] = None,
        sort_order: str = "ASC",
        filters: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Получение списка объектов жилого фонда"""
        try:
            offset = (page - 1) * page_size
            
            # Получаем все данные
            rows = await self.get_all_housing()
            
            print(f"✅ Получено {len(rows)} записей из таблицы {settings.TABLE_HOUSING}")
            
            # Применяем фильтры
            if search:
                search_lower = search.lower()
                rows = [r for r in rows if search_lower in str(r.get("Почтовый адрес", "")).lower()]
            
            # Фильтры
            if filters:
                for key, value in filters.items():
                    if value:
                        if key == "Тип здания":
                            rows = [r for r in rows if str(r.get("Тип здания", "") or r.get("Тип объекта", "")) == str(value)]
                        else:
                            rows = [r for r in rows if str(r.get(key, "")) == str(value)]
                
            # Сортировка
            if sort_field:
                if sort_field == "house_number":
                    rows.sort(
                        key=lambda x: self.extract_house_number(x.get("Почтовый адрес", "")),
                        reverse=(sort_order == "DESC")
                    )
                else:
                    rows.sort(
                        key=lambda x: str(x.get(sort_field, "")),
                        reverse=(sort_order == "DESC")
                    )
            
            # Пагинация
            total = len(rows)
            paginated_rows = rows[offset:offset + page_size]
            
            return {
                "data": paginated_rows,
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": (total + page_size - 1) // page_size if total > 0 else 1
            }
        except Exception as e:
            print(f"❌ Ошибка в get_housing_list: {e}")
            import traceback
            traceback.print_exc()
            raise
    
    async def get_housing_from_db(
        self,
        page: int = 1,
        page_size: int = 50,
        search: Optional[str] = None,
        category: Optional[str] = None,
        building_type: Optional[str] = None,
        is_emergency: Optional[bool] = None,

    ) -> Dict[str, Any]:
        """Получение списка жилого фонда из MariaDB с сортировкой по номеру дома"""
        try:
            offset = (page - 1) * page_size
            
            # Базовый WHERE
            where_parts = ["1=1"]
            params = []
            
            if search:
                where_parts.append("JSON_EXTRACT(data, '$.Почтовый адрес') LIKE %s")
                params.append(f"%{search}%")
            
            if category:
                where_parts.append("JSON_EXTRACT(data, '$.Категория') = %s")
                params.append(category)
            
            if building_type:
                where_parts.append("JSON_EXTRACT(data, '$.Тип здания') = %s")
                params.append(building_type)
            
            if is_emergency is not None:
                where_parts.append("JSON_EXTRACT(data, '$.Аварийный') = %s")
                params.append("Да" if is_emergency else "Нет")
            
            where_clause = " AND ".join(where_parts)
            
            # Запрос данных
            sql = f"""
                SELECT _id, data FROM housing
                WHERE {where_clause}
                {order_clause}
                LIMIT %s OFFSET %s
            """
            params.extend([page_size, offset])
            
            rows = await mariadb_client.fetch_all(sql, tuple(params))
            
            housing_list = []
            for row in rows:
                item = json.loads(row["data"]) if isinstance(row["data"], str) else row["data"]
                item["_id"] = row["_id"]
                housing_list.append(item)
            
            # Общее количество
            count_sql = f"SELECT COUNT(*) as total FROM housing WHERE {where_clause}"
            count_result = await mariadb_client.fetch_one(count_sql, tuple(params[:-2]))
            total = count_result["total"] if count_result else 0
            
            return {
                "data": housing_list,
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": (total + page_size - 1) // page_size if total > 0 else 1
            }
            
        except Exception as e:
            print(f"❌ Ошибка в get_housing_from_db: {e}")
            raise        

    async def get_housing_details(self, housing_id: str) -> Dict[str, Any]:
        """Получение детальной информации об объекте со всеми связями через SQL"""
        try:
            print(f"🔍 Получаем детали для ID: {housing_id}")
            
            # Пробуем получить данные через SQL с JOIN
            # Это самый надежный способ получить связанные данные
            
            # SQL для получения объекта с жителями
            sql_residents = f"""
            SELECT 
                h.*,
                r._id as resident_id,
                r.`ФИО` as resident_name,
                r.`Дата рождения` as resident_birth,
                r.`Возраст` as resident_age,
                r.`Пол` as resident_gender,
                r.`Родство` as resident_relation,
                r.`Телефон` as resident_phone
            FROM `{settings.TABLE_HOUSING}` h
            LEFT JOIN `{settings.TABLE_RESIDENTS}` r 
                ON FIND_IN_SET(r._id, REPLACE(REPLACE(h.`Список граждан Вынгапур`, '[', ''), ']', ''))
            WHERE h._id = '{housing_id}'
            """
            
            # SQL для получения объекта с собственниками
            sql_owners = f"""
            SELECT 
                h.*,
                o._id as owner_id,
                o.`ФИО` as owner_name,
                o.`Доля` as owner_share,
                o.`Телефон` as owner_phone,
                o.`Вид собственности` as owner_type
            FROM `{settings.TABLE_HOUSING}` h
            LEFT JOIN `{settings.TABLE_OWNERS}` o 
                ON FIND_IN_SET(o._id, REPLACE(REPLACE(h.`Список собственников жилья`, '[', ''), ']', ''))
            WHERE h._id = '{housing_id}'
            """
            
            housing = None
            residents_details = []
            owners_details = []
            
            # Пробуем выполнить SQL-запросы
            try:
                # Запрос жителей
                result_residents = await self.client.sql_query(sql_residents)
                rows = result_residents.get("results", [])
                
                if rows:
                    # Первая строка - данные объекта
                    housing = {
                        "_id": rows[0].get("_id"),
                        "Почтовый адрес": rows[0].get("Почтовый адрес"),
                        "Адрес": rows[0].get("Адрес"),
                        "Категория": rows[0].get("Категория"),
                        "Площадь": rows[0].get("Площадь"),
                        "Этажность": rows[0].get("Этажность"),
                        "Год постройки": rows[0].get("Год постройки"),
                        "Год ввода": rows[0].get("Год ввода"),
                    }
                    # Добавляем все остальные поля
                    for key, value in rows[0].items():
                        if key not in housing and not key.startswith("resident_"):
                            housing[key] = value
                    
                    # Собираем жителей
                    seen_residents = set()
                    for row in rows:
                        resident_id = row.get("resident_id")
                        if resident_id and resident_id not in seen_residents:
                            seen_residents.add(resident_id)
                            residents_details.append({
                                "_id": resident_id,
                                "ФИО": row.get("resident_name"),
                                "Дата рождения": row.get("resident_birth"),
                                "Возраст": row.get("resident_age"),
                                "Пол": row.get("resident_gender"),
                                "Родство": row.get("resident_relation"),
                                "Телефон": row.get("resident_phone"),
                            })
                    
                    print(f"✅ Через SQL JOIN найдено {len(residents_details)} жителей")
            except Exception as e:
                print(f"⚠️ SQL для жителей не сработал: {e}")
            
            try:
                # Запрос собственников
                result_owners = await self.client.sql_query(sql_owners)
                rows = result_owners.get("results", [])
                
                if rows and not housing:
                    # Если housing еще не создан
                    housing = {
                        "_id": rows[0].get("_id"),
                        "Почтовый адрес": rows[0].get("Почтовый адрес"),
                        "Адрес": rows[0].get("Адрес"),
                    }
                    for key, value in rows[0].items():
                        if key not in housing and not key.startswith("owner_"):
                            housing[key] = value
                
                # Собираем собственников
                seen_owners = set()
                for row in rows:
                    owner_id = row.get("owner_id")
                    if owner_id and owner_id not in seen_owners:
                        seen_owners.add(owner_id)
                        owners_details.append({
                            "_id": owner_id,
                            "ФИО": row.get("owner_name"),
                            "Доля": row.get("owner_share"),
                            "Телефон": row.get("owner_phone"),
                            "Вид собственности": row.get("owner_type"),
                        })
                
                print(f"✅ Через SQL JOIN найдено {len(owners_details)} собственников")
            except Exception as e:
                print(f"⚠️ SQL для собственников не сработал: {e}")
            
            # Если SQL не сработал, пробуем старый метод с прямым поиском по row_id
            if not housing:
                print("🔄 SQL не сработал, используем прямой поиск по API...")
                return await self._get_housing_details_fallback(housing_id)
            
            housing["residents_details"] = residents_details
            housing["owners_details"] = owners_details
            
            print(f"✅ Итого: {len(owners_details)} собственников, {len(residents_details)} жителей")
            
            return housing
            
        except Exception as e:
            print(f"❌ Ошибка в get_housing_details: {e}")
            import traceback
            traceback.print_exc()
            # Fallback
            return await self._get_housing_details_fallback(housing_id)
    
    async def _get_housing_details_fallback(self, housing_id: str) -> Dict[str, Any]:
        """Запасной метод - поиск через API с прямым сопоставлением row_id"""
        try:
            print(f"🔄 Используем fallback-метод для ID: {housing_id}")
            
            # Загружаем все данные
            residents = await self.get_all_residents()
            owners = await self.get_all_owners()
            housing_rows = await self.get_all_housing()
            
            # Ищем объект
            housing = None
            for row in housing_rows:
                if row.get("_id") == housing_id:
                    housing = row
                    break
            
            if not housing:
                raise ValueError("Объект не найден")
            
            # Создаем словарь для поиска по row_id
            # В SeaTable/DTable связь хранит row_id, а не _id
            residents_by_row = {}
            for r in residents:
                # Пробуем разные варианты ID
                if "_id" in r:
                    residents_by_row[r["_id"]] = r
                # В SeaTable может быть поле row_id
                if "row_id" in r:
                    residents_by_row[r["row_id"]] = r
            
            owners_by_row = {}
            for o in owners:
                if "_id" in o:
                    owners_by_row[o["_id"]] = o
                if "row_id" in o:
                    owners_by_row[o["row_id"]] = o
            
            # Получаем жителей
            housing["residents_details"] = []
            if "Список граждан Вынгапур" in housing and housing["Список граждан Вынгапур"]:
                for item in housing["Список граждан Вынгапур"]:
                    if isinstance(item, dict):
                        row_id = item.get("row_id")
                        if row_id and row_id in residents_by_row:
                            housing["residents_details"].append(residents_by_row[row_id])
                            print(f"   ✅ Найден житель по row_id: {row_id}")
            
            # Получаем собственников
            housing["owners_details"] = []
            if "Список собственников жилья" in housing and housing["Список собственников жилья"]:
                for item in housing["Список собственников жилья"]:
                    if isinstance(item, dict):
                        row_id = item.get("row_id")
                        if row_id and row_id in owners_by_row:
                            housing["owners_details"].append(owners_by_row[row_id])
                            print(f"   ✅ Найден собственник по row_id: {row_id}")
            
            return housing
            
        except Exception as e:
            print(f"❌ Ошибка в fallback: {e}")
            raise


    async def get_categories(self) -> List[str]:
        """Получение списка уникальных категорий"""
        try:
            rows = await self.get_all_housing()
            
            categories = set()
            for row in rows:
                if "Категория" in row and row["Категория"]:
                    categories.add(str(row["Категория"]))
            
            return sorted(list(categories))
        except Exception as e:
            print(f"❌ Ошибка в get_categories: {e}")
            return []
    
    async def get_owners_list(
        self,
        page: int = 1,
        page_size: int = 50,
        search: Optional[str] = None,
        sort_field: Optional[str] = None,
        sort_order: str = "ASC"
    ) -> Dict[str, Any]:
        """Получение списка собственников"""
        try:
            offset = (page - 1) * page_size
            
            rows = await self.get_all_owners()
            
            # Поиск
            if search:
                search_lower = search.lower()
                filtered_rows = []
                for row in rows:
                    for value in row.values():
                        if value and search_lower in str(value).lower():
                            filtered_rows.append(row)
                            break
                rows = filtered_rows
            
            # Сортировка
            if sort_field:
                rows.sort(
                    key=lambda x: str(x.get(sort_field, "")),
                    reverse=(sort_order == "DESC")
                )
            
            # Пагинация
            total = len(rows)
            paginated_rows = rows[offset:offset + page_size]
            
            return {
                "data": paginated_rows,
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": (total + page_size - 1) // page_size if total > 0 else 1
            }
        except Exception as e:
            print(f"❌ Ошибка в get_owners_list: {e}")
            raise
    
    async def get_owner_details(self, owner_id: str) -> Dict[str, Any]:
        """Получение детальной информации о собственнике"""
        try:
            print(f"🔍 Получаем детали собственника ID: {owner_id}")
            
            # Ищем в MariaDB
            sql = "SELECT _id, data FROM owners WHERE _id = %s"
            result = await mariadb_client.fetch_one(sql, (owner_id,))
            
            if not result:
                # Пробуем найти в DTable напрямую
                all_owners = await self.get_all_owners()
                for owner in all_owners:
                    if owner.get("_id") == owner_id:
                        return owner
                raise ValueError(f"Собственник с ID {owner_id} не найден")
            
            owner = json.loads(result["data"]) if isinstance(result["data"], str) else result["data"]
            owner["_id"] = result["_id"]
            
            print(f"✅ Найден собственник: {owner.get('ФИО', owner.get('Наименование', 'Не указано'))}")
            
            return owner
            
        except Exception as e:
            print(f"❌ Ошибка в get_owner_details: {e}")
            raise
    
    async def get_owners_from_db(
        self,
        page: int = 1,
        page_size: int = 50,
        search: Optional[str] = None,
        sort_field: Optional[str] = None,
        sort_order: str = "ASC"
    ) -> Dict[str, Any]:
        """Получение списка собственников из MariaDB"""
        try:
            offset = (page - 1) * page_size
            
            # Строим WHERE
            where_parts = ["1=1"]
            params = []
            
            if search:
                where_parts.append("(full_name LIKE %s OR address LIKE %s OR phone LIKE %s)")
                search_pattern = f"%{search}%"
                params.extend([search_pattern, search_pattern, search_pattern])
            
            where_clause = " AND ".join(where_parts)
            
            # Строим ORDER BY
            order_field = "full_name"
            if sort_field:
                order_field = f"JSON_EXTRACT(data, '$.{sort_field}')"
            
            direction = "DESC" if sort_order == "DESC" else "ASC"
            
            # Запрос данных
            sql = f"""
                SELECT data FROM owners
                WHERE {where_clause}
                ORDER BY {order_field} {direction}
                LIMIT %s OFFSET %s
            """
            params.extend([page_size, offset])
            
            rows = await mariadb_client.fetch_all(sql, tuple(params))
            owners = [json.loads(row["data"]) for row in rows]
            
            # Общее количество
            count_sql = f"SELECT COUNT(*) as total FROM owners WHERE {where_clause}"
            count_result = await mariadb_client.fetch_one(count_sql, tuple(params[:-2]))
            total = count_result["total"] if count_result else 0
            
            return {
                "data": owners,
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": (total + page_size - 1) // page_size if total > 0 else 1
            }
            
        except Exception as e:
            print(f"❌ Ошибка в get_owners_from_db: {e}")
            raise

    async def get_owners_count(
        self,
        search: Optional[str] = None
    ) -> int:
        """Получение точного количества собственников"""
        try:
            where_parts = ["1=1"]
            params = []
            
            if search:
                where_parts.append("(full_name LIKE %s OR address LIKE %s OR phone LIKE %s)")
                search_pattern = f"%{search}%"
                params.extend([search_pattern, search_pattern, search_pattern])
            
            where_clause = " AND ".join(where_parts)
            sql = f"SELECT COUNT(*) as total FROM owners WHERE {where_clause}"
            result = await mariadb_client.fetch_one(sql, tuple(params))
            
            return result["total"] if result else 0
        except Exception as e:
            print(f"❌ Ошибка в get_owners_count: {e}")
            return 0
    async def get_residents_list(
        self,
        page: int = 1,
        page_size: int = 50,
        search: Optional[str] = None,
        gender: Optional[str] = None,
        category: Optional[str] = None,
        is_child: Optional[str] = None,
        sort_field: Optional[str] = None,
        sort_order: str = "ASC"
    ) -> Dict[str, Any]:
        """Получение списка жителей из MariaDB"""
        try:
            offset = (page - 1) * page_size
            
            # Строим WHERE
            where_parts = ["1=1"]
            params = []
            
            if search:
                where_parts.append("(full_name LIKE %s OR address_display LIKE %s OR phone LIKE %s)")
                search_pattern = f"%{search}%"
                params.extend([search_pattern, search_pattern, search_pattern])
            
            if gender:
                where_parts.append("gender = %s")
                params.append(gender)
            
            if category:
                where_parts.append("category = %s")
                params.append(category)
            
            if is_child == "yes":
                where_parts.append("is_child = TRUE")
            elif is_child == "no":
                where_parts.append("is_child = FALSE")
            
            where_clause = " AND ".join(where_parts)
            
            # Строим ORDER BY
            order_field = "full_name"
            if sort_field:
                field_map = {
                    "ФИО": "full_name",
                    "Возраст": "CAST(JSON_EXTRACT(data, '$.Возраст (числом)') AS UNSIGNED)",
                    "Адрес": "address_display",
                }
                order_field = field_map.get(sort_field, f"JSON_EXTRACT(data, '$.{sort_field}')")
            
            direction = "DESC" if sort_order == "DESC" else "ASC"
            
            # Запрос данных
            sql = f"""
                SELECT data FROM residents
                WHERE {where_clause}
                ORDER BY {order_field} {direction}
                LIMIT %s OFFSET %s
            """
            params.extend([page_size, offset])
            
            rows = await mariadb_client.fetch_all(sql, tuple(params))
            residents = [json.loads(row["data"]) for row in rows]
            
            # Общее количество
            count_sql = f"SELECT COUNT(*) as total FROM residents WHERE {where_clause}"
            count_result = await mariadb_client.fetch_one(count_sql, tuple(params[:-2]))
            total = count_result["total"] if count_result else 0
            
            return {
                "data": residents,
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": (total + page_size - 1) // page_size if total > 0 else 1
            }
            
        except Exception as e:
            print(f"❌ Ошибка в get_residents_list: {e}")
            raise
    
    async def get_resident_details(self, resident_id: str) -> Dict[str, Any]:
        """Получение детальной информации о жителе через SQL"""
        try:
            sql = f"""
            SELECT * FROM `{settings.TABLE_RESIDENTS}`
            WHERE `_id` = '{resident_id}'
            """
            
            result = await self.client.sql_query(sql)
            rows = result.get("results", [])
            
            if not rows:
                raise ValueError("Житель не найден")
            
            return rows[0]
            
        except Exception as e:
            print(f"❌ Ошибка SQL в get_resident_details: {e}")
            # Fallback
            residents = await self.get_all_residents()
            for r in residents:
                if r.get("_id") == resident_id:
                    return r
            raise ValueError("Житель не найден")


    async def get_organizations_list(
        self,
        page: int = 1,
        page_size: int = 50
    ) -> Dict[str, Any]:
        """Получение списка организаций"""
        try:
            offset = (page - 1) * page_size
            
            result = await self.client.get_table_rows(
                table_name=settings.TABLE_ORGANIZATIONS,
                limit=page_size,
                offset=offset,
                convert_keys=True
            )
            
            return {
                "data": result.get("rows", []),
                "total": result.get("total", 0),
                "page": page,
                "page_size": page_size
            }
        except Exception as e:
            print(f"❌ Ошибка в get_organizations_list: {e}")
            raise
    
    async def get_organizations_from_db(
        self,
        page: int = 1,
        page_size: int = 50,
        search: Optional[str] = None,
        sort_field: Optional[str] = None,
        sort_order: str = "ASC"
    ) -> Dict[str, Any]:
        """Получение списка организаций из MariaDB"""
        try:
            offset = (page - 1) * page_size
            
            # Строим WHERE
            where_parts = ["1=1"]
            params = []
            
            if search:
                # Ищем в JSON поле data
                where_parts.append("(JSON_EXTRACT(data, '$.Название') LIKE %s OR JSON_EXTRACT(data, '$.Наименование') LIKE %s OR JSON_EXTRACT(data, '$.ИНН') LIKE %s OR JSON_EXTRACT(data, '$.Телефон') LIKE %s)")
                search_pattern = f"%{search}%"
                params.extend([search_pattern, search_pattern, search_pattern, search_pattern])
            
            where_clause = " AND ".join(where_parts)
            
            # Сортировка - используем JSON_EXTRACT
            order_field = "JSON_EXTRACT(data, '$.Название')"
            if sort_field:
                order_field = f"JSON_EXTRACT(data, '$.{sort_field}')"
            
            direction = "DESC" if sort_order == "DESC" else "ASC"
            
            # Запрос данных
            sql = f"""
                SELECT _id, data FROM organizations
                WHERE {where_clause}
                ORDER BY {order_field} {direction}
                LIMIT %s OFFSET %s
            """
            params.extend([page_size, offset])
            
            rows = await mariadb_client.fetch_all(sql, tuple(params))
            organizations = []
            for row in rows:
                org = json.loads(row["data"]) if isinstance(row["data"], str) else row["data"]
                org["_id"] = row["_id"]
                organizations.append(org)
            
            # Общее количество
            count_sql = f"SELECT COUNT(*) as total FROM organizations WHERE {where_clause}"
            count_result = await mariadb_client.fetch_one(count_sql, tuple(params[:-2]))
            total = count_result["total"] if count_result else 0
            
            return {
                "data": organizations,
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": (total + page_size - 1) // page_size if total > 0 else 1
            }
            
        except Exception as e:
            print(f"❌ Ошибка в get_organizations_from_db: {e}")
            raise

    async def get_organizations_count(self, search: Optional[str] = None) -> int:
        """Получение точного количества организаций"""
        try:
            where_parts = ["1=1"]
            params = []
            
            if search:
                where_parts.append("(JSON_EXTRACT(data, '$.Название') LIKE %s OR JSON_EXTRACT(data, '$.ИНН') LIKE %s)")
                search_pattern = f"%{search}%"
                params.extend([search_pattern, search_pattern])
            
            where_clause = " AND ".join(where_parts)
            sql = f"SELECT COUNT(*) as total FROM organizations WHERE {where_clause}"
            result = await mariadb_client.fetch_one(sql, tuple(params))
            
            return result["total"] if result else 0
        except Exception as e:
            print(f"❌ Ошибка в get_organizations_count: {e}")
            return 0

    async def get_organization_details(self, org_id: str) -> Dict[str, Any]:
        """Получение детальной информации об организации"""
        try:
            sql = "SELECT _id, data FROM organizations WHERE _id = %s"
            result = await mariadb_client.fetch_one(sql, (org_id,))
            
            if not result:
                raise ValueError("Организация не найдена")
            
            org = json.loads(result["data"]) if isinstance(result["data"], str) else result["data"]
            org["_id"] = result["_id"]
            
            return org
            
        except Exception as e:
            print(f"❌ Ошибка в get_organization_details: {e}")
            raise


    async def get_statistics(
        self, 
        group_by: str, 
        table: str = "housing",
        aggregation: str = "COUNT"
    ) -> List[Dict]:
        """Получение статистики для дашбордов с выбором таблицы и агрегации"""
        
        table_mapping = {
            "housing": settings.TABLE_HOUSING,
            "owners": settings.TABLE_OWNERS,
            "residents": settings.TABLE_RESIDENTS,
            "organizations": settings.TABLE_ORGANIZATIONS
        }
        
        table_name = table_mapping.get(table, settings.TABLE_HOUSING)
        
        try:
            # Получаем все данные
            result = await self.client.get_table_rows(
                table_name=table_name,
                limit=10000,
                convert_keys=True
            )
            
            rows = result.get("rows", [])
            
            if not rows:
                return []
            
            # Группируем данные
            stats = {}
            for row in rows:
                key = str(row.get(group_by, "Не указано"))
                if not key or key == "None" or key == "":
                    key = "Не указано"
                
                if aggregation == "COUNT":
                    stats[key] = stats.get(key, 0) + 1
                else:
                    if key not in stats:
                        stats[key] = []
                    value = row.get(group_by)
                    if isinstance(value, (int, float)):
                        stats[key].append(value)
            
            # Применяем агрегацию
            result_stats = []
            for key, values in stats.items():
                if aggregation == "COUNT":
                    value = values
                elif aggregation == "SUM":
                    value = sum(values) if isinstance(values, list) else 0
                elif aggregation == "AVG":
                    value = sum(values) / len(values) if isinstance(values, list) and values else 0
                elif aggregation == "MAX":
                    value = max(values) if isinstance(values, list) and values else 0
                elif aggregation == "MIN":
                    value = min(values) if isinstance(values, list) and values else 0
                else:
                    value = len(values) if isinstance(values, list) else values
                
                result_stats.append({
                    "category": key,
                    "value": round(value, 2) if isinstance(value, float) else value
                })
            
            # Сортируем по значению
            result_stats.sort(key=lambda x: x["value"], reverse=True)
            
            return result_stats[:20]  # Топ-20
            
        except Exception as e:
            print(f"Error in get_statistics: {e}")
            return []

    async def get_table_fields(self, table: str) -> List[str]:
        """Получение списка полей таблицы"""
        table_mapping = {
            "housing": settings.TABLE_HOUSING,
            "owners": settings.TABLE_OWNERS,
            "residents": settings.TABLE_RESIDENTS,
            "organizations": settings.TABLE_ORGANIZATIONS
        }
        
        table_name = table_mapping.get(table, settings.TABLE_HOUSING)
        
        try:
            # Получаем одну строку чтобы узнать поля
            result = await self.client.get_table_rows(
                table_name=table_name,
                limit=1,
                convert_keys=True
            )
            
            rows = result.get("rows", [])
            if rows:
                # Возвращаем все ключи кроме служебных
                fields = [k for k in rows[0].keys() if not k.startswith('_')]
                return fields
            
            return []
            
        except Exception as e:
            print(f"Error in get_table_fields: {e}")
            return []

    async def get_chart_data(self, config: Dict) -> List[Dict]:
        """Получение данных для конкретного графика"""
        return await self.get_statistics(
            group_by=config.get("groupBy", "Категория"),
            table=config.get("table", "housing"),
            aggregation=config.get("aggregation", "COUNT")
        )

    async def get_advanced_statistics(self) -> Dict[str, Any]:
        """Получение расширенной статистики по всем таблицам"""
        try:
            # Получаем количество записей через limit=0
            housing_result = await self.client.get_table_rows(
                table_name=settings.TABLE_HOUSING,
                limit=0,
                convert_keys=True
            )
            total_housing = housing_result.get("total", 0)
            
            owners_result = await self.client.get_table_rows(
                table_name=settings.TABLE_OWNERS,
                limit=0,
                convert_keys=True
            )
            total_owners = owners_result.get("total", 0)
            
            residents_result = await self.client.get_table_rows(
                table_name=settings.TABLE_RESIDENTS,
                limit=0,
                convert_keys=True
            )
            total_residents = residents_result.get("total", 0)
            
            orgs_result = await self.client.get_table_rows(
                table_name=settings.TABLE_ORGANIZATIONS,
                limit=0,
                convert_keys=True
            )
            total_orgs = orgs_result.get("total", 0)
            
            # Для расчета площади нужно получить все записи жилого фонда
            housing_rows_result = await self.client.get_table_rows(
                table_name=settings.TABLE_HOUSING,
                limit=10000,
                convert_keys=True
            )
            housing_rows = housing_rows_result.get("rows", [])
            
            # Расчет общей площади
            total_area = 0
            for row in housing_rows:
                area = row.get("Площадь")
                if isinstance(area, (int, float)):
                    total_area += area
                elif isinstance(area, str):
                    try:
                        total_area += float(area)
                    except:
                        pass
            
            avg_area = round(total_area / len(housing_rows), 2) if housing_rows else 0
            
            return {
                "summary": {
                    "total_housing": total_housing,
                    "total_owners": total_owners,
                    "total_residents": total_residents,
                    "total_organizations": total_orgs,
                    "total_area": round(total_area, 2),
                    "avg_area": avg_area
                },
                "categories": {},
                "build_years": {},
                "housing_by_floors": {}
            }
            
        except Exception as e:
            print(f"Error in get_advanced_statistics: {e}")
            return {
                "summary": {
                    "total_housing": 0,
                    "total_owners": 0,
                    "total_residents": 0,
                    "total_organizations": 0,
                    "total_area": 0,
                    "avg_area": 0
                },
                "categories": {},
                "build_years": {},
                "housing_by_floors": {}
            }

    def _group_by_field(self, rows: List[Dict], field: str) -> Dict:
        """Группировка строк по полю"""
        result = {}
        for row in rows:
            value = row.get(field, "Не указано")
            result[str(value)] = result.get(str(value), 0) + 1
        return dict(sorted(result.items()))

    def _get_top_owners(self, owners_rows: List[Dict], housing_rows: List[Dict]) -> List[Dict]:
        """Получение топ собственников"""
        # Упрощенная версия - в реальности нужно анализировать связи
        return []

    def _get_residents_stats(self, residents_rows: List[Dict]) -> Dict:
        """Статистика по жителям"""
        # Анализ возрастов и т.д.
        return {
            "total": len(residents_rows),
            "adults": len([r for r in residents_rows if self._is_adult(r)]),
            "children": len([r for r in residents_rows if not self._is_adult(r)])
        }

    def _is_adult(self, resident: Dict) -> bool:
        """Проверка совершеннолетия по дате рождения"""
        from datetime import datetime
        birth_date = resident.get("Дата рождения")
        if not birth_date:
            return True
        
        try:
            if isinstance(birth_date, str):
                birth_date = datetime.strptime(birth_date, "%Y-%m-%d")
            age = (datetime.now() - birth_date).days // 365
            return age >= 18
        except:
            return True
    
    async def get_dashboard_data(self) -> Dict[str, Any]:
        """Получение общих данных для дашборда через SQL"""
        try:
            # Используем SQL для получения точного количества
            counts = {}
            
            for table_key, table_name in [
                ("total_housing", settings.TABLE_HOUSING),
                ("total_owners", settings.TABLE_OWNERS),
                ("total_residents", settings.TABLE_RESIDENTS),
                ("total_organizations", settings.TABLE_ORGANIZATIONS)
            ]:
                try:
                    sql = f"SELECT COUNT(*) as count FROM `{table_name}`"
                    result = await self.client.sql_query(sql)
                    counts[table_key] = result.get("results", [{}])[0].get("count", 0) if result.get("results") else 0
                except Exception as e:
                    print(f"Error counting {table_name}: {e}")
                    counts[table_key] = 0
            
            return {
                "summary": {
                    "total_housing": counts.get("total_housing", 0),
                    "total_owners": counts.get("total_owners", 0),
                    "total_residents": counts.get("total_residents", 0),
                    "total_organizations": counts.get("total_organizations", 0)
                }
            }
        except Exception as e:
            print(f"Error getting dashboard data: {e}")
            return {
                "summary": {
                    "total_housing": 0,
                    "total_owners": 0,
                    "total_residents": 0,
                    "total_organizations": 0
                }
            }
    
    async def get_owners_grouped_by_address(
        self,
        page: int = 1,
        page_size: int = 50,
        search: Optional[str] = None
    ) -> Dict[str, Any]:
        """Получение собственников, сгруппированных по адресу объекта"""
        try:
            print(f"📊 Получаем собственников, сгруппированных по адресу")
            
            # Загружаем всех собственников
            all_owners = await self.get_all_owners()
            total_all_owners = len(all_owners)  # ← ДОБАВЛЕНО: общее количество всех собственников
            print(f"📊 Всего загружено {len(all_owners)} собственников")
            
            # Функция для безопасного получения адреса
            def get_address(owner: Dict) -> str:
                addr = owner.get("Почтовый адрес объекта")
                if not addr:
                    addr = owner.get("Адрес объекта")
                if not addr:
                    addr = owner.get("Адрес")
                if not addr:
                    return "Без адреса"
                
                if isinstance(addr, dict):
                    addr = addr.get("display_value") or addr.get("Почтовый адрес") or str(addr)
                elif isinstance(addr, list):
                    if addr and isinstance(addr[0], dict):
                        addr = addr[0].get("display_value") or str(addr[0])
                    else:
                        addr = str(addr[0]) if addr else "Без адреса"
                
                return str(addr) if addr else "Без адреса"
            
            def get_house_number(owner: Dict) -> str:
                num = owner.get("№ дома") or owner.get("Номер дома")
                if isinstance(num, list):
                    num = num[0] if num else ""
                return str(num) if num else "—"
            
            # Группируем по адресу
            grouped: Dict[str, List[Dict]] = {}
            
            for owner in all_owners:
                address = get_address(owner)
                house_num = get_house_number(owner)
                full_address = f"{address}, д.{house_num}" if house_num != "—" else address
                
                if search:
                    search_lower = search.lower()
                    owner_fio = str(owner.get("ФИО") or owner.get("Наименование") or "")
                    owner_phone = str(owner.get("Телефон") or "")
                    
                    if not (search_lower in owner_fio.lower() or 
                            search_lower in owner_phone.lower() or 
                            search_lower in full_address.lower()):
                        continue
                
                if full_address not in grouped:
                    grouped[full_address] = []
                
                grouped[full_address].append({
                    "_id": owner.get("_id"),
                    "ФИО": owner.get("ФИО") or owner.get("Наименование") or "Не указано",
                    "Наименование": owner.get("Наименование"),
                    "Телефон": owner.get("Телефон"),
                    "Email": owner.get("Email") or owner.get("Почта"),
                    "Доля": owner.get("Доля"),
                    "Вид собственности": owner.get("Вид собственности"),
                    "Общая S (м2)": owner.get("Общая S (м2)") or owner.get("Общая площадь"),
                    "№ квартиры": owner.get("№ квартиры"),
                    "ИНН": owner.get("ИНН"),
                })
            
            # Формируем результат
            groups = []
            for address, owners in grouped.items():
                # Извлекаем номер дома для сортировки
                import re
                match = re.search(r'д\.(\d+)', address)
                house_num = match.group(1) if match else "0"
                
                groups.append({
                    "address": address,
                    "house_number": house_num,
                    "owners_count": len(owners),
                    "owners": owners
                })
            
            # Сортируем по номеру дома
            groups.sort(key=lambda g: int(g["house_number"]) if g["house_number"].isdigit() else 0)
            
            total_groups = len(groups)
            offset = (page - 1) * page_size
            paginated_groups = groups[offset:offset + page_size]
            
            return {
                "data": paginated_groups,
                "total_groups": total_groups,
                "total_owners": sum(g["owners_count"] for g in groups),  # отфильтрованные
                "total_all_owners": total_all_owners,  # ← ДОБАВЛЕНО: все собственники
                "page": page,
                "page_size": page_size,
                "total_pages": (total_groups + page_size - 1) // page_size if total_groups > 0 else 1
            }
            
        except Exception as e:
            print(f"❌ Ошибка в get_owners_grouped_by_address: {e}")
            import traceback
            traceback.print_exc()
            raise

    async def get_residents_count(
        self,
        search: Optional[str] = None,
        gender: Optional[str] = None,
        category: Optional[str] = None,
        is_child: Optional[str] = None
    ) -> int:
        """Получение точного количества жителей"""
        all_residents = await self.get_all_residents()
        
        filtered = all_residents
        if search:
            search_lower = search.lower()
            filtered = [r for r in filtered if search_lower in str(r.get("ФИО", "")).lower()]
        if gender:
            filtered = [r for r in filtered if str(r.get("Пол", "")) == gender]
        if category:
            filtered = [r for r in filtered if str(r.get("Категория", "")) == category]
        if is_child == "yes":
            filtered = [r for r in filtered if r.get("Ребенок") == "Да" or r.get("Ребенок") == True]
        elif is_child == "no":
            filtered = [r for r in filtered if r.get("Ребенок") != "Да" and r.get("Ребенок") != True]
        
        return len(filtered)
    
    async def get_residents_exact_count(
        self,
        search: Optional[str] = None,
        gender: Optional[str] = None,
        category: Optional[str] = None,
        is_child: Optional[str] = None
    ) -> int:
        """Получение ТОЧНОГО количества жителей"""
        # Используем get_all_residents для точного подсчёта
        return await self.get_residents_count(
            search=search,
            gender=gender,
            category=category,
            is_child=is_child
        )

    async def sync_residents(self) -> int:
        """Синхронизация жителей с заполнением адреса из связанной таблицы"""
        print("🔄 Синхронизация жителей...")
        
        # Сначала синхронизируем адреса (housing)
        await self.sync_housing()
        
        # Загружаем всех жителей
        all_residents = await self._load_all_with_sql_pagination(settings.TABLE_RESIDENTS)
        print(f"   Загружено {len(all_residents)} жителей")
        
        # Загружаем все адреса для связи
        housing_dict = {}
        housing_rows = await mariadb_client.fetch_all("SELECT _id, address, house_number FROM housing")
        for row in housing_rows:
            housing_dict[row["_id"]] = {
                "address": row["address"],
                "house_number": row["house_number"]
            }
        
        # Очищаем таблицу
        await mariadb_client.execute("TRUNCATE TABLE residents")
        
        # Вставляем данные с заполненным address_display
        inserted = 0
        batch_size = 100
        
        for i in range(0, len(all_residents), batch_size):
            batch = all_residents[i:i + batch_size]
            
            for resident in batch:
                resident_id = resident.get("_id")
                if not resident_id:
                    continue
                
                # Извлекаем address_id
                address_id = None
                addr_field = resident.get("Почтовый адрес")
                if isinstance(addr_field, list) and addr_field:
                    address_id = addr_field[0].get("row_id") if isinstance(addr_field[0], dict) else None
                elif isinstance(addr_field, dict):
                    address_id = addr_field.get("row_id")
                
                # Получаем отображаемый адрес
                address_display = "Без адреса"
                house_number = resident.get("№ дома", "")
                
                if address_id and address_id in housing_dict:
                    address_display = housing_dict[address_id]["address"]
                    if not house_number:
                        house_number = housing_dict[address_id]["house_number"]
                
                # Если адрес массив — берём первый элемент
                if isinstance(house_number, list):
                    house_number = house_number[0] if house_number else ""
                
                # Квартира
                apartment = resident.get("№ квартиры") or resident.get("Квартира")
                if isinstance(apartment, list):
                    apartment = apartment[0] if apartment else ""
                
                # Сохраняем
                sql = """
                    INSERT INTO residents (_id, data, address_display, house_number, apartment)
                    VALUES (%s, %s, %s, %s, %s)
                """
                await mariadb_client.execute(sql, (
                    resident_id,
                    json.dumps(resident, ensure_ascii=False),
                    address_display,
                    str(house_number) if house_number else "",
                    str(apartment) if apartment else ""
                ))
                inserted += 1
            
            print(f"   Вставлено {inserted}/{len(all_residents)}")
        
        # Обновляем метаданные
        await mariadb_client.execute("""
            INSERT INTO sync_metadata (table_name, last_sync, total_records, sync_status)
            VALUES ('residents', NOW(), %s, 'success')
            ON DUPLICATE KEY UPDATE last_sync = NOW(), total_records = %s, sync_status = 'success'
        """, (inserted, inserted))
        
        print(f"✅ Синхронизировано {inserted} жителей")
        return inserted
        
    async def sync_owners(self) -> int:
        """Синхронизация собственников через SQL"""
        print("🔄 Синхронизация собственников через SQL...")
        
        # Загружаем через SQL с пагинацией
        all_owners = await self._load_owners_with_sql_pagination()
        
        print(f"   Загружено {len(all_owners)} собственников")
        
        # Очищаем таблицу
        try:
            await mariadb_client.execute("TRUNCATE TABLE owners")
        except:
            await mariadb_client.execute("DELETE FROM owners")
        
        inserted = 0
        batch_size = 100
        
        for i in range(0, len(all_owners), batch_size):
            batch = all_owners[i:i + batch_size]
            values = [(o.get("_id"), json.dumps(o, ensure_ascii=False)) for o in batch if o.get("_id")]
            
            if values:
                sql = "INSERT INTO owners (_id, data) VALUES (%s, %s)"
                async with mariadb_client.pool.acquire() as conn:
                    async with conn.cursor() as cursor:
                        await cursor.executemany(sql, values)
                inserted += len(values)
        
        await mariadb_client.execute("""
            INSERT INTO sync_metadata (table_name, last_sync, total_records, sync_status)
            VALUES ('owners', NOW(), %s, 'success')
            ON DUPLICATE KEY UPDATE last_sync = NOW(), total_records = %s, sync_status = 'success'
        """, (inserted, inserted))
        
        print(f"✅ Синхронизировано {inserted} собственников")
        return inserted

    async def sync_housing(self) -> int:
        """Синхронизация жилого фонда через SQL"""
        print("🔄 Синхронизация жилого фонда...")
        
        all_housing = await self._load_housing_with_sql_pagination()
        
        print(f"   Загружено {len(all_housing)} объектов")
        
        try:
            await mariadb_client.execute("TRUNCATE TABLE housing")
        except:
            await mariadb_client.execute("DELETE FROM housing")
        
        inserted = 0
        batch_size = 100
        
        for i in range(0, len(all_housing), batch_size):
            batch = all_housing[i:i + batch_size]
            values = [(h.get("_id"), json.dumps(h, ensure_ascii=False)) for h in batch if h.get("_id")]
            
            if values:
                sql = "INSERT INTO housing (_id, data) VALUES (%s, %s)"
                async with mariadb_client.pool.acquire() as conn:
                    async with conn.cursor() as cursor:
                        await cursor.executemany(sql, values)
                inserted += len(values)
        
        await mariadb_client.execute("""
            INSERT INTO sync_metadata (table_name, last_sync, total_records, sync_status)
            VALUES ('housing', NOW(), %s, 'success')
            ON DUPLICATE KEY UPDATE last_sync = NOW(), total_records = %s, sync_status = 'success'
        """, (inserted, inserted))
        
        print(f"✅ Синхронизировано {inserted} объектов жилого фонда")
        return inserted
    

    async def _load_housing_with_sql_pagination(self) -> List[Dict]:
        """Загрузка всех объектов жилого фонда через SQL"""
        all_rows = []
        seen_ids = set()
        limit = 1000
        last_id = ""
        
        print(f"🔄 Загружаем жилой фонд через SQL...")
        
        while True:
            if last_id:
                sql = f"""
                    SELECT * FROM `{settings.TABLE_HOUSING}`
                    WHERE `_id` > '{last_id}'
                    ORDER BY `_id`
                    LIMIT {limit}
                """
            else:
                sql = f"""
                    SELECT * FROM `{settings.TABLE_HOUSING}`
                    ORDER BY `_id`
                    LIMIT {limit}
                """
            
            try:
                result = await self.client.sql_query(sql)
                rows = result.get("results", [])
                
                if not rows:
                    break
                
                new_count = 0
                for row in rows:
                    row_id = row.get("_id")
                    if row_id and row_id not in seen_ids:
                        seen_ids.add(row_id)
                        all_rows.append(row)
                        new_count += 1
                        last_id = row_id
                
                print(f"   Загружено {len(rows)} записей, новых: {new_count}, всего: {len(all_rows)}")
                
                if len(rows) < limit:
                    break
                    
            except Exception as e:
                print(f"   ❌ Ошибка SQL: {e}")
                break
        
        print(f"✅ SQL загрузил {len(all_rows)} объектов")
        return all_rows

    async def sync_organizations(self) -> int:
        """Синхронизация организаций через SQL"""
        print("🔄 Синхронизация организаций...")
        
        all_orgs = await self._load_organizations_with_sql_pagination()
        
        print(f"   Загружено {len(all_orgs)} организаций")
        
        try:
            await mariadb_client.execute("TRUNCATE TABLE organizations")
        except:
            await mariadb_client.execute("DELETE FROM organizations")
        
        inserted = 0
        batch_size = 100
        
        for i in range(0, len(all_orgs), batch_size):
            batch = all_orgs[i:i + batch_size]
            values = [(o.get("_id"), json.dumps(o, ensure_ascii=False)) for o in batch if o.get("_id")]
            
            if values:
                sql = "INSERT INTO organizations (_id, data) VALUES (%s, %s)"
                async with mariadb_client.pool.acquire() as conn:
                    async with conn.cursor() as cursor:
                        await cursor.executemany(sql, values)
                inserted += len(values)
        
        await mariadb_client.execute("""
            INSERT INTO sync_metadata (table_name, last_sync, total_records, sync_status)
            VALUES ('organizations', NOW(), %s, 'success')
            ON DUPLICATE KEY UPDATE last_sync = NOW(), total_records = %s, sync_status = 'success'
        """, (inserted, inserted))
        
        print(f"✅ Синхронизировано {inserted} организаций")
        return inserted


    async def _load_organizations_with_sql_pagination(self) -> List[Dict]:
        """Загрузка всех организаций через SQL с пагинацией"""
        all_rows = []
        seen_ids = set()
        limit = 1000
        last_id = ""
        
        print(f"🔄 Загружаем организации через SQL...")
        
        while True:
            if last_id:
                sql = f"""
                    SELECT * FROM `{settings.TABLE_ORGANIZATIONS}`
                    WHERE `_id` > '{last_id}'
                    ORDER BY `_id`
                    LIMIT {limit}
                """
            else:
                sql = f"""
                    SELECT * FROM `{settings.TABLE_ORGANIZATIONS}`
                    ORDER BY `_id`
                    LIMIT {limit}
                """
            
            try:
                result = await self.client.sql_query(sql)
                rows = result.get("results", [])
                
                if not rows:
                    break
                
                new_count = 0
                for row in rows:
                    row_id = row.get("_id")
                    if row_id and row_id not in seen_ids:
                        seen_ids.add(row_id)
                        all_rows.append(row)
                        new_count += 1
                        last_id = row_id
                
                print(f"   Загружено {len(rows)} записей, новых: {new_count}, всего: {len(all_rows)}")
                
                if len(rows) < limit:
                    break
                    
            except Exception as e:
                print(f"   ❌ Ошибка SQL: {e}")
                break
        
        print(f"✅ SQL загрузил {len(all_rows)} организаций")
        return all_rows

    async def sync_all_data(self) -> Dict[str, int]:
        """Синхронизация всех данных"""
        print("🚀 Запуск полной синхронизации...")
        
        result = {}
        
        # Синхронизируем жителей
        try:
            result["residents"] = await self.sync_residents()
        except Exception as e:
            print(f"❌ Ошибка синхронизации жителей: {e}")
            result["residents"] = 0
        
        # Синхронизируем собственников
        try:
            result["owners"] = await self.sync_owners()
        except Exception as e:
            print(f"❌ Ошибка синхронизации собственников: {e}")
            result["owners"] = 0
        
        # Синхронизируем жилой фонд
        try:
            result["housing"] = await self.sync_housing()
        except Exception as e:
            print(f"❌ Ошибка синхронизации жилого фонда: {e}")
            result["housing"] = 0

        try:
            result["organizations"] = await self.sync_organizations()
        except Exception as e:
            print(f"❌ organizations: {e}")
            result["organizations"] = 0    
        
        print(f"✅ Полная синхронизация завершена: {result}")
        return result
    
    async def _load_all_from_dtable(self, table_name: str) -> List[Dict]:
        """Загрузка через представление (view)"""
        all_rows = []
        seen_ids = set()
        
        # Если есть представление "Все записи", используем его
        try:
            result = await self.client.get_table_rows(
                table_name=table_name,
                view_name="all",  # ← укажите имя представления
                limit=10000,
                convert_keys=True
            )
            
            rows = result.get("rows", [])
            for row in rows:
                row_id = row.get("_id")
                if row_id and row_id not in seen_ids:
                    seen_ids.add(row_id)
                    all_rows.append(row)
            
            print(f"✅ Через view загружено {len(all_rows)} записей")
            return all_rows
        except:
            pass
        
        # Fallback: загружаем что можем
        result = await self.client.get_table_rows(
            table_name=table_name,
            limit=10000,
            convert_keys=True
        )
        
        rows = result.get("rows", [])
        print(f"⚠️ Загружено только {len(rows)} записей (ограничение API)")
        return rows




    # Методы для работы с MariaDB (вместо DTable)
    async def get_residents_from_db(
        self,
        page: int = 1,
        page_size: int = 50,
        search: Optional[str] = None,
        gender: Optional[str] = None,
        category: Optional[str] = None,
        is_child: Optional[str] = None,
        sort_field: Optional[str] = None,
        sort_order: str = "ASC"
    ) -> Dict[str, Any]:
        """Получение жителей из MariaDB"""
        offset = (page - 1) * page_size
        
        where_parts = ["1=1"]
        params = []
        
        if search:
            # ✅ Экранируем спецсимволы и используем правильную кодировку
            search_pattern = f"%{search}%"
            where_parts.append("(full_name LIKE %s OR address_display LIKE %s OR phone LIKE %s)")
            params.extend([search_pattern, search_pattern, search_pattern])
        
        if gender:
            where_parts.append("gender = %s")
            params.append(gender)
        
        if category:
            where_parts.append("category = %s")
            params.append(category)
        
        if is_child == "yes":
            where_parts.append("is_child = TRUE")
        elif is_child == "no":
            where_parts.append("is_child = FALSE")
        
        where_clause = " AND ".join(where_parts)
        
        # Сортировка
        order_field = "full_name"
        direction = "DESC" if sort_order == "DESC" else "ASC"
        
        sql = f"""
            SELECT data FROM residents
            WHERE {where_clause}
            ORDER BY {order_field} {direction}
            LIMIT %s OFFSET %s
        """
        params.extend([page_size, offset])
        
        rows = await mariadb_client.fetch_all(sql, tuple(params))
        residents = [json.loads(row["data"]) for row in rows]
        
        # Общее количество
        count_sql = f"SELECT COUNT(*) as total FROM residents WHERE {where_clause}"
        count_result = await mariadb_client.fetch_one(count_sql, tuple(params[:-2]))
        total = count_result["total"] if count_result else 0
        
        return {
            "data": residents,
            "total": total,
            "page": page,
            "page_size": page_size
        }
    
    
    async def get_residents_grouped_by_house(
        self,
        search: Optional[str] = None,
        gender: Optional[str] = None,
        category: Optional[str] = None,
        is_child: Optional[str] = None
    ) -> List[Dict]:
        """Получение жителей, сгруппированных по домам"""
        
        where_parts = ["1=1"]
        params = []
        
        if search:
            where_parts.append("(full_name LIKE %s OR address_display LIKE %s OR phone LIKE %s)")
            search_pattern = f"%{search}%"
            params.extend([search_pattern, search_pattern, search_pattern])
        
        if gender:
            where_parts.append("gender = %s")
            params.append(gender)
        
        if category:
            where_parts.append("category = %s")
            params.append(category)
        
        if is_child == "yes":
            where_parts.append("is_child = TRUE")
        elif is_child == "no":
            where_parts.append("is_child = FALSE")
        
        where_clause = " AND ".join(where_parts)
        
        # ✅ Группировка по address_display и house_number
        sql = f"""
            SELECT 
                address_display as address,
                house_number,
                COUNT(*) as total_residents,
                SUM(CASE WHEN is_child = TRUE THEN 1 ELSE 0 END) as children_count,
                SUM(CASE WHEN is_child = FALSE THEN 1 ELSE 0 END) as adults_count,
                COUNT(DISTINCT apartment) as apartments_count,
                address_id
            FROM residents
            WHERE {where_clause}
            GROUP BY address_display, house_number, address_id
            ORDER BY address_display, house_number
        """
        
        rows = await mariadb_client.fetch_all(sql, tuple(params))
        
        houses = []
        for row in rows:
            # Получаем аварийность из housing
            is_emergency = False
            if row["address_id"]:
                housing = await mariadb_client.fetch_one(
                    "SELECT is_emergency FROM housing WHERE _id = %s",
                    (row["address_id"],)
                )
                if housing:
                    is_emergency = bool(housing["is_emergency"])
            
            houses.append({
                "address": row["address"] or "Без адреса",
                "house_number": row["house_number"] or "—",
                "total_residents": row["total_residents"],
                "children_count": row["children_count"],
                "adults_count": row["adults_count"],
                "apartments": row["apartments_count"],
                "is_emergency": is_emergency,
            })
        
        return houses

    def clear_cache(self):
        """Очистка внутреннего кэша"""
        self._residents_cache = None
        self._owners_cache = None
        self._housing_cache = None
        print("🧹 Внутренний кэш очищен")


# Singleton сервис
data_service = DataService()