"""Pydantic schemas for order/checkout endpoints."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.order import OrderStatus
from app.schemas.product import ProductResponse


class CheckoutRequest(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(gt=0, le=100, description="Max 100 units per order")


class OrderResponse(BaseModel):
    id: int
    user_id: int
    product_id: int
    quantity: int
    total_price: Decimal
    status: OrderStatus
    created_at: datetime
    product: ProductResponse

    model_config = {"from_attributes": True}
