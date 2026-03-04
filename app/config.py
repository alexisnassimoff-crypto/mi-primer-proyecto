import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    APP_NAME: str = os.getenv("APP_NAME", "FactuApp")
    APP_URL: str = os.getenv("APP_URL", "http://localhost:8000")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./factuapp.db")
    MERCADOPAGO_ACCESS_TOKEN: str = os.getenv("MERCADOPAGO_ACCESS_TOKEN", "")
    MERCADOPAGO_PUBLIC_KEY: str = os.getenv("MERCADOPAGO_PUBLIC_KEY", "")


settings = Settings()
