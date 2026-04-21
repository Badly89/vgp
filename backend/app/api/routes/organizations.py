from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.services.data_service import data_service
from app.core.database import mariadb_client

router = APIRouter(prefix="/api/organizations", tags=["organizations"])

@router.get("/list")
async def get_organizations_list(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=5000),
    search: Optional[str] = None,
    sort_field: Optional[str] = None,
    sort_order: str = Query("ASC", regex="^(ASC|DESC)$")
):
    """Получение списка организаций из MariaDB"""
    try:
        result = await data_service.get_organizations_from_db(
            page=page,
            page_size=page_size,
            search=search,
            sort_field=sort_field,
            sort_order=sort_order
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/count")
async def get_organizations_count(
    search: Optional[str] = None
):
    """Получение точного количества организаций"""
    try:
        count = await data_service.get_organizations_count(search=search)
        return {"count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{org_id}")
async def get_organization_details(org_id: str):
    """Получение детальной информации об организации"""
    try:
        result = await data_service.get_organization_details(org_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))