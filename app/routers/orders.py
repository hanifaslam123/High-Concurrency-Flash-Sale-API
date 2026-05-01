"""
Orders router — checkout and order history.

The /checkout endpoint is the high-concurrency entry point protected by
Redis distributed locking inside InventoryService.
"""

from typing import List

from fastapi import APIRouter, status

from app.routers.deps import CurrentUser, DBSession
from app.schemas.order import CheckoutRequest, OrderResponse
from app.services.inventory_service import inventory_service
from app.services.order_service import order_service

router = APIRouter()


@router.post(
    "/checkout",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Atomic checkout (Redis-locked)",
    description=(
        "Place an order for a product. Uses Redis distributed locking to handle "
        "10,000+ concurrent requests without overselling inventory."
    ),
)
async def checkout(
    body: CheckoutRequest,
    db: DBSession,
    current_user: CurrentUser,
):
    """Atomically deduct inventory and create an order."""
    order = await inventory_service.checkout(
        db=db,
        user_id=current_user.id,
        product_id=body.product_id,
        quantity=body.quantity,
    )
    return order


@router.get("", response_model=List[OrderResponse])
async def list_my_orders(
    db: DBSession,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 50,
):
    """Get the current user's order history."""
    return await order_service.get_user_orders(db, current_user.id, skip, limit)


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: int, db: DBSession, current_user: CurrentUser):
    """Get a specific order (must belong to the current user)."""
    return await order_service.get_order_by_id(db, order_id, user_id=current_user.id)
