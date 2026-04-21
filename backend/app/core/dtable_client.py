import httpx
import json
import pickle
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from app.core.config import get_settings

settings = get_settings()

class DTableClient:
    """
    Клиент для работы с API DTable (SeaTable)
    с автоматическим получением и обновлением Base Token
    """
    
    def __init__(self):
        self.base_url = settings.DTABLE_BASE_URL
        self.base_uuid = settings.DTABLE_BASE_UUID
        self.api_token = settings.DTABLE_API_TOKEN
        self._base_token = None
        self._token_expiry = None
        self._redis = None
        
    async def init_redis(self):
        """Инициализация Redis для кэширования"""
        if settings.REDIS_URL:
            try:
                self._redis = await redis.from_url(settings.REDIS_URL)
                print("✅ Redis подключен")
            except Exception as e:
                print(f"⚠️ Redis недоступен: {e}")
                self._redis = None
    
    async def _get_base_token(self) -> str:
        """
        Получение Base Token с кэшированием
        """
        # Проверяем кэш в Redis
        if self._redis:
            try:
                cached = await self._redis.get("dtable:base_token")
                if cached:
                    print("✅ Base token получен из Redis")
                    return cached.decode()
            except:
                pass
        
        # Проверяем локальный кэш
        if self._base_token and self._token_expiry and datetime.now() < self._token_expiry:
            print("✅ Base token получен из локального кэша")
            return self._base_token
        
        # Получаем новый токен
        print("🔄 Получаем новый Base token...")
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/api/v2.1/dtable/app-access-token/",
                headers={
                    "accept": "application/json",
                    "authorization": f"Bearer {self.api_token}"
                },
                params={"exp": "3d"}  # Токен на 3 дня
            )
            response.raise_for_status()
            data = response.json()
            self._base_token = data["access_token"]
            self._token_expiry = datetime.now() + timedelta(days=3)
            
            # Кэшируем в Redis на 2 дня
            if self._redis:
                try:
                    await self._redis.setex("dtable:base_token", 172800, self._base_token)
                except:
                    pass
            
            print("✅ Новый Base token получен")
            return self._base_token
    
    async def get_table_rows(
        self, 
        table_name: str, 
        limit: int = 1000, 
        offset: int = 0,
        convert_keys: bool = True,
        view_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Получение строк из таблицы с конвертацией ключей
        """
        base_token = await self._get_base_token()
        
        params = {
            "table_name": table_name,
            "limit": limit,
            "offset": offset,
            "convert_keys": convert_keys
        }
        
        if view_name:
            params["view_name"] = view_name
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{self.base_url}/api-gateway/api/v2/dtables/{self.base_uuid}/rows/",
                headers={
                    "accept": "application/json",
                    "authorization": f"Bearer {base_token}"
                },
                params=params
            )
            response.raise_for_status()
            return response.json()
    
    async def get_table_metadata(self) -> Dict[str, Any]:
        """
        Получение метаданных всех таблиц
        """
        base_token = await self._get_base_token()
        
        # Проверяем кэш метаданных
        cache_key = f"dtable:metadata:{self.base_uuid}"
        if self._redis:
            try:
                cached = await self._redis.get(cache_key)
                if cached:
                    return pickle.loads(cached)
            except:
                pass
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/api-gateway/api/v2/dtables/{self.base_uuid}/metadata/",
                headers={
                    "accept": "application/json",
                    "authorization": f"Bearer {base_token}"
                }
            )
            response.raise_for_status()
            metadata = response.json()
            
            # Кэшируем метаданные
            if self._redis:
                try:
                    await self._redis.setex(
                        cache_key, 
                        settings.CACHE_TTL, 
                        pickle.dumps(metadata)
                    )
                except:
                    pass
            
            return metadata
    
    async def sql_query(self, sql: str) -> Dict[str, Any]:
        """
        Выполнение SQL запроса к базе
        """
        base_token = await self._get_base_token()
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/api-gateway/api/v2/dtables/{self.base_uuid}/sql/",
                headers={
                    "accept": "application/json",
                    "authorization": f"Bearer {base_token}",
                    "content-type": "application/json"
                },
                json={"sql": sql, "convert_keys": True}
            )
            response.raise_for_status()
            return response.json()
    
    async def close(self):
        """Закрытие соединений"""
        if self._redis:
            await self._redis.close()

# Singleton клиент
dtable_client = DTableClient()