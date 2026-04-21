import json
import aiomysql
from typing import Dict, List, Optional, Any
from datetime import datetime
from app.core.config import get_settings

settings = get_settings()

class MariaDBClient:
    """Клиент для работы с MariaDB"""
    
    def __init__(self):
        self.pool = None
    
    async def init_pool(self):
        """Инициализация пула соединений"""
        if not self.pool:
            self.pool = await aiomysql.create_pool(
                host=settings.DB_HOST,
                port=settings.DB_PORT,
                user=settings.DB_USER,
                password=settings.DB_PASSWORD,
                db=settings.DB_NAME,
                charset='utf8mb4',
                autocommit=True,
                minsize=1,
                maxsize=10
            )
            print("✅ Пул соединений MariaDB создан")
    
    async def close(self):
        """Закрытие пула"""
        if self.pool:
            self.pool.close()
            await self.pool.wait_closed()
    
    async def execute(self, sql: str, args: tuple = ()):
        """Выполнение SQL запроса"""
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                await cursor.execute(sql, args)
                return cursor
    
    async def fetch_all(self, sql: str, args: tuple = ()) -> List[Dict]:
        """Получение всех строк"""
        cursor = await self.execute(sql, args)
        return await cursor.fetchall()
    
    async def fetch_one(self, sql: str, args: tuple = ()) -> Optional[Dict]:
        """Получение одной строки"""
        cursor = await self.execute(sql, args)
        return await cursor.fetchone()
    
    async def execute_many(self, sql: str, args_list: List[tuple]):
        """Массовая вставка"""
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.executemany(sql, args_list)

# Singleton клиент
mariadb_client = MariaDBClient()