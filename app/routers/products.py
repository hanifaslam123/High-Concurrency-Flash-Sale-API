"""Products router — CRUD endpoints for product management."""

from typing import List

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.models.product import Product
from app.routers.deps import CurrentUser, AdminUser, DBSession
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse

router = APIRouter()


@router.get("", response_model=List[ProductResponse])
async def list_products(
    db: DBSession,
    skip: int = 0,
    limit: int = 50,
    active_only: bool = True,
):
    """List all products. Defaults to active products only."""
    query = select(Product).order_by(Product.id).offset(skip).limit(limit)
    if active_only:
        query = query.where(Product.is_active == True)  # noqa: E712
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: DBSession):
    """Get a single product by ID."""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    return product


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(body: ProductCreate, db: DBSession, _: AdminUser):
    """Create a new product (Admin only)."""
    product = Product(**body.model_dump())
    db.add(product)
    await db.flush()
    await db.refresh(product)
    return product


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(product_id: int, body: ProductUpdate, db: DBSession, _: AdminUser):
    """Update an existing product (Admin only)."""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(product, field, value)

    await db.flush()
    await db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(product_id: int, db: DBSession, _: AdminUser):
    """Soft-delete a product by marking it inactive (Admin only)."""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    product.is_active = False
    await db.flush()
