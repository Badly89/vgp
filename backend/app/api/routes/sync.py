from typing import Dict, List, Optional, Any
from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.services.data_service import data_service
from app.core.database import mariadb_client
from app.core.config import get_settings
import asyncio
from datetime import datetime, time, timedelta  # ← добавить timedelta
import json
import os

from pydantic import BaseModel

class ScheduleConfig(BaseModel):
    enabled: Optional[bool] = None
    time: Optional[str] = None
    tables: Optional[List[str]] = None


router = APIRouter(prefix="/api/sync", tags=["sync"])
settings = get_settings()

# Хранилище настроек расписания
SCHEDULE_CONFIG_FILE = "/app/data/sync_schedule.json"
sync_schedule = {
    "enabled": False,
    "time": "02:00",  # По умолчанию в 2 часа ночи
    "tables": ["residents", "owners", "housing", "organizations"],
    "last_run": None,
    "next_run": None
}

# Загружаем сохраненные настройки
def load_schedule():
    global sync_schedule
    try:
        if os.path.exists(SCHEDULE_CONFIG_FILE):
            with open(SCHEDULE_CONFIG_FILE, 'r') as f:
                sync_schedule.update(json.load(f))
    except:
        pass

def save_schedule():
    try:
        os.makedirs(os.path.dirname(SCHEDULE_CONFIG_FILE), exist_ok=True)
        with open(SCHEDULE_CONFIG_FILE, 'w') as f:
            json.dump(sync_schedule, f, default=str)
    except:
        pass

load_schedule()

# Фоновая задача для автоматической синхронизации
async def auto_sync_task():
    """Фоновая задача автоматической синхронизации"""
    while True:
        try:
            if sync_schedule["enabled"]:
                now = datetime.now()
                scheduled_time = datetime.strptime(sync_schedule["time"], "%H:%M").time()
                scheduled_datetime = datetime.combine(now.date(), scheduled_time)
                
                # Если время уже прошло сегодня, планируем на завтра
                if scheduled_datetime < now:
                    scheduled_datetime = datetime.combine(now.date() + timedelta(days=1), scheduled_time)
                
                sync_schedule["next_run"] = scheduled_datetime.isoformat()
                
                # Проверяем, не пора ли запустить
                if abs((now - scheduled_datetime).total_seconds()) < 30:  # В течение 30 секунд от запланированного
                    print(f"🕐 Запуск автоматической синхронизации по расписанию ({sync_schedule['time']})")
                    
                    for table in sync_schedule["tables"]:
                        try:
                            if table == "residents":
                                await data_service.sync_residents()
                            elif table == "owners":
                                await data_service.sync_owners()
                            elif table == "housing":
                                await data_service.sync_housing()
                            elif table == "organizations":
                                await data_service.sync_organizations()
                        except Exception as e:
                            print(f"❌ Ошибка синхронизации {table}: {e}")
                    
                    sync_schedule["last_run"] = datetime.now().isoformat()
                    save_schedule()
                    print("✅ Автоматическая синхронизация завершена")
                    
                    # Ждем минуту чтобы не запустить повторно
                    await asyncio.sleep(60)
            
            await asyncio.sleep(30)  # Проверяем каждые 30 секунд
            
        except Exception as e:
            print(f"❌ Ошибка в auto_sync_task: {e}")
            await asyncio.sleep(60)


@router.get("/schedule")
async def get_schedule():
    """Получить настройки расписания"""
    return sync_schedule


@router.post("/schedule")
async def set_schedule(config: ScheduleConfig):
    """Настроить расписание автосинхронизации"""
    if config.enabled is not None:
        sync_schedule["enabled"] = config.enabled
    if config.time:
        try:
            datetime.strptime(config.time, "%H:%M")
            sync_schedule["time"] = config.time
        except ValueError:
            raise HTTPException(status_code=400, detail="Неверный формат времени. Используйте ЧЧ:ММ")
    if config.tables is not None:
        valid_tables = ["residents", "owners", "housing", "organizations"]
        for t in config.tables:
            if t not in valid_tables:
                raise HTTPException(status_code=400, detail=f"Неизвестная таблица: {t}")
        sync_schedule["tables"] = config.tables
    
    save_schedule()
    return sync_schedule


@router.post("/schedule/run-now")
async def run_sync_now(background_tasks: BackgroundTasks):
    """Запустить синхронизацию по расписанию прямо сейчас"""
    tables = sync_schedule.get("tables", ["residents", "owners", "housing", "organizations"])
    background_tasks.add_task(data_service.sync_all_data)
    return {"status": "started", "message": f"Синхронизация таблиц {tables} запущена"}


@router.post("/all")
async def sync_all_data(background_tasks: BackgroundTasks):
    """Запуск полной синхронизации (в фоне)"""
    background_tasks.add_task(data_service.sync_all_data)
    return {"status": "started", "message": "Синхронизация запущена в фоновом режиме"}


@router.post("/residents")
async def sync_residents():
    """Синхронизация только жителей"""
    try:
        count = await data_service.sync_residents()
        return {"status": "success", "synced": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/owners")
async def sync_owners():
    """Синхронизация только собственников"""
    try:
        count = await data_service.sync_owners()
        return {"status": "success", "synced": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/housing")
async def sync_housing():
    """Синхронизация только жилого фонда"""
    try:
        count = await data_service.sync_housing()
        return {"status": "success", "synced": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/organizations")
async def sync_organizations():
    """Синхронизация только организаций"""
    try:
        count = await data_service.sync_organizations()
        return {"status": "success", "synced": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/table/{table}")
async def sync_table(table: str):
    """Синхронизация конкретной таблицы"""
    try:
        if table == "residents":
            count = await data_service.sync_residents()
        elif table == "owners":
            count = await data_service.sync_owners()
        elif table == "housing":
            count = await data_service.sync_housing()
        elif table == "organizations":
            count = await data_service.sync_organizations()
        else:
            raise HTTPException(status_code=400, detail=f"Unknown table: {table}")
        return {"status": "success", "table": table, "synced": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/info/{table}")
async def get_table_info(table: str):
    """Получение информации о таблице"""
    try:
        table_mapping = {
            "housing": settings.TABLE_HOUSING,
            "owners": settings.TABLE_OWNERS,
            "residents": settings.TABLE_RESIDENTS,
            "organizations": settings.TABLE_ORGANIZATIONS
        }
        
        if table not in table_mapping:
            raise HTTPException(status_code=400, detail=f"Unknown table: {table}")
        
        result = await mariadb_client.fetch_one(
            f"SELECT COUNT(*) as cnt FROM {table}"
        )
        return {"table": table, "total": result["cnt"] if result else 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/test-api")
async def test_dtable_api(table: str = "residents"):
    """Тест API DTable"""
    try:
        mapping = {
            "residents": settings.TABLE_RESIDENTS,
            "owners": settings.TABLE_OWNERS,
            "housing": settings.TABLE_HOUSING,
            "organizations": settings.TABLE_ORGANIZATIONS
        }
        table_name = mapping.get(table, settings.TABLE_RESIDENTS)
        await data_service.test_dtable_api(table_name)
        return {"status": "ok", "message": f"Тест {table} запущен, смотрите консоль бэкенда"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/test-sql")
async def test_sql_pagination(table: str = "residents"):
    """Тест SQL-загрузки с пагинацией"""
    try:
        mapping = {
            "residents": settings.TABLE_RESIDENTS,
            "owners": settings.TABLE_OWNERS,
            "housing": settings.TABLE_HOUSING,
            "organizations": settings.TABLE_ORGANIZATIONS
        }
        table_name = mapping.get(table, settings.TABLE_RESIDENTS)
        rows = await data_service._load_all_with_sql_pagination(table_name)
        return {"status": "ok", "table": table, "count": len(rows)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_sync_status():
    """Получение статуса последней синхронизации"""
    try:
        result = await mariadb_client.fetch_all(
            "SELECT table_name, last_sync, total_records, sync_status FROM sync_metadata"
        )
        return {"sync_status": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))