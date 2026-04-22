from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.services.data_service import data_service
from app.core.database import mariadb_client  # ← ДОБАВИТЬ ЭТУ СТРОКУ

router = APIRouter(prefix="/api/residents", tags=["residents"])

@router.get("/list")
async def get_residents_list(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=5000),
    search: Optional[str] = None,
    gender: Optional[str] = None,
    category: Optional[str] = None,
    is_child: Optional[str] = None,
    sort_field: Optional[str] = None,
    sort_order: str = Query("ASC", regex="^(ASC|DESC)$"),
    group_by: Optional[str] = None,
    vid_fond: Optional[str] = None,  # добавить
):
    """Получение списка жителей"""
    try:
        if group_by == "house":
            houses = await data_service.get_residents_grouped_by_house(
                search=search, gender=gender, category=category, is_child=is_child
            )
            return {"data": houses, "total": len(houses), "grouped": True}
        else:
            result = await data_service.get_residents_from_db(
                page=page, page_size=page_size,
                search=search, gender=gender, category=category, is_child=is_child,
                sort_field=sort_field, sort_order=sort_order, 
                vid_fond=vid_fond
            )
            return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/count")
async def get_residents_count(
    search: Optional[str] = None,
    gender: Optional[str] = None,
    category: Optional[str] = None,
    is_child: Optional[str] = None
):
    """Получение точного количества жителей из MariaDB"""
    try:
        where_parts = ["1=1"]
        params = []
        
        if search:
            where_parts.append("(full_name LIKE %s OR address LIKE %s OR phone LIKE %s)")
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
        
        # ✅ ВАЖНО: Используем COUNT(*) из residents
        sql = f"SELECT COUNT(*) as total FROM residents WHERE {where_clause}"
        print(f"📊 SQL COUNT: {sql}")
        print(f"📊 Params: {params}")
        
        result = await mariadb_client.fetch_one(sql, tuple(params))
        total = result["total"] if result else 0
        
        print(f"📊 Результат COUNT: {total}")
        return {"count": total}
    except Exception as e:
        print(f"❌ Ошибка в get_residents_count: {e}")
        raise HTTPException(status_code=500, detail=str(e))


