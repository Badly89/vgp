from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional

class Settings(BaseSettings):
    # DTable настройки
    DTABLE_API_TOKEN: str = ""
    DTABLE_BASE_UUID: str = ""
    DTABLE_BASE_URL: str = "https://ditable.yanao.ru"
    
    # Названия таблиц
    TABLE_HOUSING: str = "Почтовый адрес объекта"
    TABLE_OWNERS: str = "Собственники жилья"
    TABLE_RESIDENTS: str = "Список граждан Вынгапур"
    TABLE_ORGANIZATIONS: str = "Место работы"
    
    # MariaDB настройки
    DB_HOST: str = "mariadb"
    DB_PORT: int = 3306
    DB_USER: str = "vgp_user"
    DB_PASSWORD: str = "VgpUser2024!"
    DB_NAME: str = "vgp_db"
    
    # CORS
    CORS_ORIGINS: list = ["*"]
    
    ROOT_PATH: str = "/api"
    
    class Config:
        env_file = ".env"
        extra = "ignore"

@lru_cache()
def get_settings():
    return Settings()