import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Zap, RefreshCw, ShoppingBag } from 'lucide-react';
import { ordersApi, Order } from '../api/flashSaleApi';
import { format } from 'date-fns';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

function StatusBadge({ status }) {
  const map = {
    CONFIRMED:  'bg-green-500/20 text-green-400 border-green-500/30',
    PENDING:    'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    CANCELLED:  'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return (
    <span className={"inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border " + (map[status] || 'bg-gray-700 text-gray-400')}>
      {status}
    </span>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try { setOrders(await ordersApi.list({ limit: 50 })); }
    catch { setError('Failed to load orders.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const totalSpent = orders.reduce((s, o) => s + o.total_price, 0);
  const confirmed  = orders.filter(o => o.status === 'CONFIRMED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Orders</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {orders.length} order{orders.length !== 1 ? 's' : ''} · {fmt(totalSpent)} total spent
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-ghost flex items-center gap-2 text-sm"><RefreshCw size={14} /> Refresh</button>
          <Link to="/products" className="btn-primary flex items-center gap-2 text-sm"><Zap size={14} /> Shop More</Link>
        </div>
      </div>

      {/* Summary cards */}
      {orders.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card border-gray-800">
            <p className="text-gray-500 text-xs">Total Orders</p>
            <p className="text-2xl font-bold text-white mt-1">{orders.length}</p>
          </div>
          <div className="card border-gray-800">
            <p className="text-gray-500 text-xs">Confirmed</p>
            <p className="text-2xl font-bold text-green-400 mt-1">{confirmed}</p>
          </div>
          <div className="card border-gray-800">
            <p className="text-gray-500 text-xs">Total Spent</p>
            <p className="text-2xl font-bold text-orange-400 mt-1">{fmt(totalSpent)}</p>
          </div>
        </div>
      )}

      {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}

      {/* Orders list */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin h-10 w-10 rounded-full border-b-2 border-orange-500" /></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          <Package size={48} className="mx-auto mb-3 opacity-20" />
          <p className="text-lg font-medium text-gray-500">No orders yet</p>
          <p className="text-sm mt-1">Browse the flash sale and snag something before it sells out!</p>
          <Link to="/products" className="inline-flex items-center gap-2 mt-4 btn-primary text-sm">
            <ShoppingBag size={15} /> View Flash Sale
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(o => (
            <div key={o.id} className="card-hover flex items-center gap-4">
              {/* Icon */}
              <div className="bg-orange-500/10 p-3 rounded-xl flex-shrink-0">
                <Package size={20} className="text-orange-400" />
              </div>

              {/* Main info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">{o.product?.name || "Product #" + o.product_id}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      Order #{o.id} · Qty: {o.quantity} · {format(new Date(o.created_at), 'MMM d, yyyy · h:mm a')}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-orange-400 font-bold text-lg">{fmt(o.total_price)}</p>
                    <StatusBadge status={o.status} />
                  </div>
                </div>

                {/* Redis lock callout for confirmed orders */}
                {o.status === 'CONFIRMED' && (
                  <p className="text-xs text-gray-600 mt-1.5 flex items-center gap-1">
                    <Zap size={10} className="text-orange-500/50" />
                    Processed atomically via Redis distributed lock — ACID-compliant
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
