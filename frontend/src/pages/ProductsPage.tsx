import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, RefreshCw, Search, ShoppingCart } from 'lucide-react';
import { productsApi, Product } from '../api/flashSaleApi';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

function StockBar({ qty, max = 500 }) {
  const pct = Math.min((qty / max) * 100, 100);
  const color = qty === 0 ? 'bg-red-500' : qty <= 20 ? 'bg-yellow-500' : 'bg-green-500';
  return (
    <div className="w-full bg-gray-800 rounded-full h-1.5 mt-1">
      <div className={"stock-bar " + color} style={{ width: pct + "%" }} />
    </div>
  );
}

function ProductCard({ product }) {
  const soldOut = product.stock_quantity === 0;
  const low = product.stock_quantity > 0 && product.stock_quantity <= 20;
  return (
    <div className="card-hover flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <span className="inline-flex items-center gap-1 bg-orange-500/20 text-orange-400 text-xs font-bold px-2.5 py-1 rounded-lg border border-orange-500/30">
          <Zap size={10} /> FLASH SALE
        </span>
        {low && !soldOut && <span className="text-yellow-400 text-xs font-bold animate-pulse">ONLY {product.stock_quantity} LEFT!</span>}
        {soldOut && <span className="text-red-400 text-xs font-bold">SOLD OUT</span>}
      </div>
      <div className="flex-1">
        <h3 className="text-white font-bold text-base leading-tight">{product.name}</h3>
        {product.description && <p className="text-gray-500 text-xs mt-1 line-clamp-2">{product.description}</p>}
      </div>
      <div className="mt-4 mb-3">
        <p className="text-orange-400 text-2xl font-bold">{fmt(product.price)}</p>
      </div>
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Stock remaining</span>
          <span className="font-medium text-gray-400">{product.stock_quantity.toLocaleString()} units</span>
        </div>
        <StockBar qty={product.stock_quantity} />
      </div>
      {soldOut ? (
        <div className="w-full py-3 px-4 rounded-xl bg-gray-800 text-gray-600 font-semibold text-sm text-center cursor-not-allowed">Sold Out</div>
      ) : (
        <Link to={"/products/" + product.id + "/buy"} state={{ product }} className="btn-primary w-full text-center flex items-center justify-center gap-2 text-sm">
          <ShoppingCart size={15} /> Buy Now
        </Link>
      )}
    </div>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const load = async () => {
    setLoading(true); setError('');
    try { const data = await productsApi.list(false); setProducts(data); }
    catch { setError('Failed to load products.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let result = products;
    if (search) result = result.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    if (filter === 'available') result = result.filter(p => p.stock_quantity > 20);
    if (filter === 'low')       result = result.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 20);
    if (filter === 'sold')      result = result.filter(p => p.stock_quantity === 0);
    setFiltered(result);
  }, [search, filter, products]);

  const available = products.filter(p => p.stock_quantity > 0).length;
  const soldOut   = products.filter(p => p.stock_quantity === 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Zap className="text-orange-500" size={24} /> Flash Sale
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{available} available · {soldOut} sold out · Redis-locked checkout</p>
        </div>
        <button onClick={load} className="btn-ghost flex items-center gap-2 text-sm"><RefreshCw size={14} /> Refresh</button>
      </div>

      {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">Error: {error}</div>}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className="input pl-9" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {['all','available','low','sold'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={"px-3 py-2 rounded-xl text-xs font-semibold transition-colors " + (filter===f ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700')}
            >{f === 'all' ? 'All' : f === 'available' ? 'Available' : f === 'low' ? 'Low Stock' : 'Sold Out'}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin h-10 w-10 rounded-full border-b-2 border-orange-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-600"><Zap size={40} className="mx-auto mb-3 opacity-20" /><p>No products found.</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
