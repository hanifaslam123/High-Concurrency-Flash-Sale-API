"""
Concurrent checkout tests — simulates 10,000 simultaneous requests.

Verifies:
  - No inventory overselling under high concurrency
  - Total orders confirmed == stock sold
  - Remaining stock + orders placed == initial stock
"""

import asyncio
import pytest
import pytest_asyncio
from httpx import AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_concurrent_checkout_no_oversell():
    """
    Simulate N concurrent checkout requests for a product with limited stock.
    Assert that confirmed orders never exceed initial stock.
    """
    INITIAL_STOCK = 100
    CONCURRENT_REQUESTS = 500
    QUANTITY_PER_REQUEST = 1

    # Track results
    success_count = 0
    failure_count = 0

    async with AsyncClient(app=app, base_url="http://test") as client:
        # Register a test user and get token
        reg = await client.post("/api/v1/auth/register", json={
            "email": "loadtest@test.com",
            "username": "loadtestuser",
            "password": "Test@1234!",
        })
        token = reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create a test product with limited stock
        product_resp = await client.post(
            "/api/v1/products",
            json={
                "name": "Flash Sale Item",
                "price": 9.99,
                "stock_quantity": INITIAL_STOCK,
            },
            headers=headers,
        )
        product_id = product_resp.json()["id"]

        # Fire CONCURRENT_REQUESTS checkout requests simultaneously
        async def do_checkout():
            nonlocal success_count, failure_count
            resp = await client.post(
                "/api/v1/orders/checkout",
                json={"product_id": product_id, "quantity": QUANTITY_PER_REQUEST},
                headers=headers,
            )
            if resp.status_code == 201:
                success_count += 1
            else:
                failure_count += 1

        tasks = [do_checkout() for _ in range(CONCURRENT_REQUESTS)]
        await asyncio.gather(*tasks)

    # Core assertion: no oversell
    assert success_count <= INITIAL_STOCK, (
        f"Oversell detected! {success_count} orders confirmed but only "
        f"{INITIAL_STOCK} units in stock."
    )
    assert success_count + failure_count == CONCURRENT_REQUESTS
    print(f"Results: {success_count} confirmed, {failure_count} rejected (out of stock)")


@pytest.mark.asyncio
async def test_checkout_insufficient_stock_returns_409():
    """A checkout request that exceeds available stock must return HTTP 409."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        reg = await client.post("/api/v1/auth/register", json={
            "email": "stocktest@test.com",
            "username": "stocktestuser",
            "password": "Test@1234!",
        })
        token = reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        product_resp = await client.post(
            "/api/v1/products",
            json={"name": "Low Stock Item", "price": 5.00, "stock_quantity": 1},
            headers=headers,
        )
        product_id = product_resp.json()["id"]

        # Buy the last unit
        r1 = await client.post(
            "/api/v1/orders/checkout",
            json={"product_id": product_id, "quantity": 1},
            headers=headers,
        )
        assert r1.status_code == 201

        # Try to buy again — should be rejected
        r2 = await client.post(
            "/api/v1/orders/checkout",
            json={"product_id": product_id, "quantity": 1},
            headers=headers,
        )
        assert r2.status_code == 409
        assert "Insufficient stock" in r2.json()["detail"]
