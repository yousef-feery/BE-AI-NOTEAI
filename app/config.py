import os
from pydantic import BaseModel

class Settings(BaseModel):
    db_host: str = os.getenv("DB_HOST", "127.0.0.1")
    db_port: int = int(os.getenv("DB_PORT", "5432"))
    db_user: str = os.getenv("DB_USER", "postgres")
    db_pass: str = os.getenv("DB_PASS", "123456789")
    db_name: str = os.getenv("DB_NAME", "postgres")

settings = Settings()
