import asyncio
import sys
import os
from pathlib import Path
from app.core.database import mariadb_client
from app.core.init_db import init_database
from app.api.routes import sync


# Добавляем путь к корню проекта в PYTHONPATH
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# Теперь импорты должны работать
from app.core.config import get_settings
from app.core.dtable_client import dtable_client
from app.api.routes import housing, owners, residents, organizations, dashboard

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Запуск приложения...")
    await mariadb_client.init_pool()
    await init_database()

    # Проверяем, есть ли данные в БД
    count = await mariadb_client.fetch_one("SELECT COUNT(*) as cnt FROM residents")
    if count and count["cnt"] == 0:
        print("⚠️ База данных пуста. Запустите синхронизацию: POST /api/sync")
    
       # Запускаем фоновую задачу автосинхронизации
    from app.api.routes.sync import auto_sync_task
    asyncio.create_task(auto_sync_task())
    print("✅ Фоновая задача автосинхронизации запущена")
    

    yield
    
    # Shutdown
    print("👋 Завершение работы...")
    await dtable_client.close()
    await mariadb_client.close()


app = FastAPI(
    title="Жилой фонд API",
    description="API для работы с реестром жилого фонда мкр. Вынгапур",
    version="1.0.0",
    lifespan=lifespan
)

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роутеры
app.include_router(housing.router)
app.include_router(owners.router)
app.include_router(residents.router)
app.include_router(organizations.router)
app.include_router(dashboard.router)
app.include_router(sync.router)


@app.get("/")
async def root():
    return {
        "message": "API реестра жилого фонда мкр. Вынгапур",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}