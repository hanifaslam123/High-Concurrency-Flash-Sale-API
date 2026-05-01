"""Product endpoint tests."""

import pytest
from httpx import AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_list_products_unauthenticated():
    """Product listing should be publicly accessible."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/v1/products")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_get_nonexistent_product_returns_404():
    """Fetching a non-existent product ID should return 404."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/v1/products/999999")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_product_requires_auth():
    """Creating a product without a token should return 403."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/products",
            json={"name": "Test Item", "price": 9.99, "stock_quantity": 10},
        )
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_health_check():
    """Health endpoint should always return 200."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
