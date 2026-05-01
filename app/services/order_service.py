"""Order query service — fetching orders for users."""

from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.order import Order


class OrderService:

    async def get_user_orders(
        self, db: AsyncSession, user_id: int, skip: int = 0, limit: int = 50
    ) -> List[Order]:
        """Get all orders belonging to a specific user."""
        result = await db.execute(
            select(Order)
            .where(Order.user_id == user_id)
            .options(selectinload(Order.product))
            .order_by(Order.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_order_by_id(
        self, db: AsyncSession, order_id: int, user_id: Optional[int] = None
    ) -> Order:
        """
        Get a specific order by ID.
        If user_id is provided, ensures the order belongs to that user.
        """
        query = (
            select(Order)
            .where(Order.id == order_id)
            .options(selectinload(Order.product))
        )
        if user_id is not None:
            query = query.where(Order.user_id == user_id)

        result = await db.execute(query)
        order = result.scalars().first()

        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order {order_id} not found.",
            )
        return order


order_service = OrderService()
