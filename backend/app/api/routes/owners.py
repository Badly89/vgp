from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.services.data_service import data_service
from app.core.database import mariadb_client

router = APIRouter(prefix="/api/owners", tags=["owners"])

# # ✅ НОВЫЙ ENDPOINT — группировка по адресу
@router.get("/grouped-by-address")
async def get_owners_grouped_by_address(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=5000),  # Уменьшаем лимит до 5000
    search: Optional[str] = None
):
    """Получение собственников, сгруппированных по адресу"""
    try:
        result = await data_service.get_owners_grouped_by_address(
            page=page,
            page_size=page_size,
            search=search
        )
        return result
    except Exception as e:
        print(f"❌ Ошибка в get_owners_grouped_by_address: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

    
@router.get("/count")
async def get_owners_count(
    search: Optional[str] = None
):
    """Получение точного количества собственников"""
    try:
        count = await data_service.get_owners_count(search=search)
        return {"count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
async def get_owners_list(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=5000),
    search: Optional[str] = None,
    sort_field: Optional[str] = None,
    sort_order: str = Query("ASC", regex="^(ASC|DESC)$")
):
    """Получение списка собственников из MariaDB"""
    try:
        result = await data_service.get_owners_from_db(
            page=page,
            page_size=page_size,
            search=search,
            sort_field=sort_field,
            sort_order=sort_order
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


        
@router.get("/{owner_id}")
async def get_owner_details(owner_id: str):
    """Получение детальной информации о собственнике"""
    try:
        details = await data_service.get_owner_details(owner_id)
        return details
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"❌ Ошибка в get_owner_details: {e}")
        raise HTTPException(status_code=500, detail=str(e))
