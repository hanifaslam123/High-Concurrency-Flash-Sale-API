"""Order model — represents a successful checkout transaction."""

import enum
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint, DateTime, Enum, ForeignKey, Integer, Numeric, String
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"


class Order(Base):
    __tablename__ = "orders"

    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_order_quantity_positive"),
        CheckConstraint("total_price > 0", name="ck_order_total_price_positive"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    product_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    total_price: Mapped[Decimal] = mapped_column(
        Numeric(precision=10, scale=2), nullable=False
    )
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus), nullable=False, default=OrderStatus.CONFIRMED
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="orders")  # noqa: F821
    product: Mapped["Product"] = relationship("Product", back_populates="orders")  # noqa: F821

    def __repr__(self) -> str:
        return (
            f"<Order id={self.id} user_id={self.user_id} "
            f"product_id={self.product_id} qty={self.quantity}>"
        )
