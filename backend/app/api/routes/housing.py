from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.services.data_service import data_service
from app.core.database import mariadb_client

router = APIRouter(prefix="/api/housing", tags=["housing"])

@router.get("/list")
async def get_housing_list(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    search: Optional[str] = None,
    category: Optional[str] = None,
    building_type: Optional[str] = None  # ← ДОБАВЬТЕ ЭТУ СТРОКУ
):
    """Получение списка объектов жилого фонда"""
    try:
        filters = {}
        if category:
            filters["Категория"] = category
        if building_type:
            filters["Тип здания"] = building_type  # ← ДОБАВЬТЕ ЭТУ СТРОКУ
        
        result = await data_service.get_housing_list(
            page=page,
            page_size=page_size,
            search=search,
            filters=filters
        )
        
        return result
        
    except Exception as e:
        print(f"❌ Ошибка в get_housing_list роутере: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{housing_id}")
async def get_housing_details(housing_id: str):
    """Получение детальной информации об объекте"""
    try:
        details = await data_service.get_housing_details(housing_id)
        return details
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"❌ Ошибка в get_housing_details роутере: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/categories/list")
async def get_categories():
    """Получение списка уникальных категорий"""
    try:
        categories = await data_service.get_categories()
        return {"categories": categories}
    except Exception as e:
        print(f"❌ Ошибка в get_categories роутере: {e}")
        raise HTTPException(status_code=500, detail=str(e))