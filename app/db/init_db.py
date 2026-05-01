"""Database seeding helper — creates an admin user and sample products."""

from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.product import Product


async def seed_db(db: AsyncSession) -> None:
    """Seed the database with an admin user and sample flash-sale products."""

    # --- Admin user ---
    result = await db.execute(select(User).where(User.email == "admin@flashsale.io"))
    if not result.scalars().first():
        admin = User(
            email="admin@flashsale.io",
            username="admin",
            hashed_password=hash_password("Admin@1234!"),
            full_name="System Administrator",
            role=UserRole.ADMIN,
            is_active=True,
        )
        db.add(admin)

    # --- Sample products ---
    sample_products = [
        ("iPhone 15 Pro (256GB)", "Apple iPhone 15 Pro in Natural Titanium", Decimal("999.00"), 100),
        ("Sony WH-1000XM5 Headphones", "Wireless noise-cancelling headphones", Decimal("349.00"), 250),
        ("Samsung 55" QLED TV", "4K Smart TV with Quantum HDR", Decimal("799.00"), 50),
        ("Nintendo Switch OLED", "White edition with enhanced audio", Decimal("349.00"), 200),
        ("Apple AirPods Pro (2nd Gen)", "ANC with MagSafe charging case", Decimal("249.00"), 500),
    ]

    result = await db.execute(select(Product))
    if not result.scalars().first():
        for name, desc, price, stock in sample_products:
            db.add(Product(
                name=name,
                description=desc,
                price=price,
                stock_quantity=stock,
                is_active=True,
            ))

    await db.commit()
