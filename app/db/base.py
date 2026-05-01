"""SQLAlchemy declarative base — import this in all models."""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Import all models here so that Alembic autogenerate can discover them
from app.models.user import User        # noqa: F401 E402
from app.models.product import Product  # noqa: F401 E402
from app.models.order import Order      # noqa: F401 E402
