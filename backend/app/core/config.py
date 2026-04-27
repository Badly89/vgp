from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional

class Settings(BaseSettings):
    # DTable настройки
    DTABLE_API_TOKEN: str
    DTABLE_BASE_UUID: str
    DTABLE_BASE_URL: str = "https://ditable.yanao.ru"
    
    # Названия таблиц (из вашего кода)
    TABLE_HOUSING: str = "Почтовый адрес объекта"
    TABLE_OWNERS: str = "Собственники жилья"
    TABLE_RESIDENTS: str = "Список граждан Вынгапур"
    TABLE_ORGANIZATIONS: str = "Место работы"
    
    # MariaDB
    DB_HOST: str = "10.87.0.59"
    DB_PORT: int = 3308
    DB_USER: str = "housing_user"
    DB_PASSWORD: str = ""
    DB_NAME: str = "housing_registry"

    # Настройки кэширования
    CACHE_TTL: int = 300  # 5 минут
    REDIS_URL: Optional[str] = "redis://localhost:6379"
    
    # CORS
    CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:3001"]
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()