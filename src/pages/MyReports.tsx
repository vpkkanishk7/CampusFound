import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { Package, ArrowRight, Loader2 } from 'lucide-react';
import type { Item, ItemStatus } from '../types';

// Colour-coded status badge
function StatusBadge({ status }: { status: ItemStatus }) {
  const styles: Record<ItemStatus, string> = {
    active: 'bg-blue-100 text-blue-700',
    matched: 'bg-purple-100 text-purple-700',
    claimed: 'bg-amber-100 text-amber-700',
    returned: 'bg-teal-100 text-teal-700',
    resolved: 'bg-emerald-100 text-emerald-700',
  };
  const labels: Record<ItemStatus, string> = {
    active: 'Active',
    matched: 'Matched',
    claimed: 'Claimed',
    returned: 'Returned',
    resolved: '✓ Resolved',
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export default function MyReports() {
  const { user } = useAppContext();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getItems('lost'), api.getItems('found')]).then(([lost, found]) => {
      const combined = [...lost, ...found];
      // Only show items that belong to this user; do NOT fall back to showing all items
      if (user?.id) {
        setItems(combined.filter(item => item.userId === user.id));
      } else {
        setItems([]);
      }
      setLoading(false);
    });
  }, [user]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">My Reports</h1>
        <p className="text-slate-500">Track the status of items you've reported lost or found.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-campus-600" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-900">No reports yet</h3>
          <p className="text-slate-500">You haven't reported any lost or found items.</p>
          <div className="flex justify-center gap-3 mt-6">
            <Link to="/create-lost" className="btn-primary text-sm">Report Lost Item</Link>
            <Link to="/create-found" className="btn-secondary text-sm">Report Found Item</Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="divide-y divide-slate-100">
            {items.map(item => (
              <div key={item.id} className={`p-6 flex flex-col sm:flex-row gap-6 items-center hover:bg-slate-50 transition-colors ${item.status === 'resolved' ? 'opacity-70' : ''}`}>
                <div className="w-24 h-24 bg-slate-100 rounded-lg shrink-0 flex items-center justify-center overflow-hidden">
                   {item.imageUrl ? (
                     <img 
                       src={item.imageUrl.startsWith('/uploads') ? `http://localhost:5000${item.imageUrl}` : item.imageUrl} 
                       alt={item.title} 
                       className="w-full h-full object-cover" 
                     />
                   ) : (
                     <Package className="w-8 h-8 text-slate-300" />
                   )}
                </div>
                
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-3 mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${item.type === 'lost' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {item.type}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{item.id}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-slate-500">Reported on {new Date(item.date).toLocaleDateString()}</p>
                </div>

                <div className="flex flex-col sm:items-end gap-2 text-center sm:text-right">
                  <StatusBadge status={item.status} />
                  <Link to={`/item/${item.id}`} className="text-sm font-medium text-campus-600 hover:text-campus-800 flex items-center justify-center sm:justify-end gap-1">
                    {item.status === 'resolved' ? 'View Archive' : 'Manage Report'} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
