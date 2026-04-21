from fastapi import APIRouter, Query, HTTPException, Body
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from app.services.data_service import data_service

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

class ChartConfig(BaseModel):
    id: str
    title: str
    type: str
    table: str
    groupBy: str
    aggregation: str = 'COUNT'
    limit: int = 20
    colors: Optional[List[str]] = None
    showLabels: Optional[bool] = True
    showLegend: Optional[bool] = True

@router.get("/stats")
async def get_statistics(
    group_by: str = Query("Категория"),
    table: str = Query("housing"),
    aggregation: str = Query("COUNT")
):
    """Получение статистики для графиков"""
    try:
        stats = await data_service.get_statistics(
            group_by=group_by,
            table=table,
            aggregation=aggregation
        )
        return {"data": stats}
    except Exception as e:
        print(f"Error in /stats endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/summary")
async def get_dashboard_summary():
    """Получение сводной информации для дашборда"""
    try:
        summary = await data_service.get_dashboard_data()
        return summary
    except Exception as e:
        print(f"Error in /summary endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/fields/{table}")
async def get_table_fields(table: str):
    """Получение списка полей таблицы для группировки"""
    try:
        fields = await data_service.get_table_fields(table)
        return {"fields": fields}
    except Exception as e:
        print(f"Error in /fields endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chart-data")
async def get_chart_data(config: ChartConfig):
    """Получение данных для конкретной конфигурации графика"""
    try:
        data = await data_service.get_chart_data(config.dict())
        return {"data": data, "config": config}
    except Exception as e:
        print(f"Error in /chart-data endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/advanced-stats")
async def get_advanced_statistics():
    """Получение расширенной статистики"""
    try:
        stats = await data_service.get_advanced_statistics()
        return stats
    except Exception as e:
        print(f"Error in /advanced-stats endpoint: {e}")
        # Возвращаем базовую структуру при ошибке
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