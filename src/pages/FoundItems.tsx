import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Search, MapPin, Calendar, ArrowRight, Loader2, HandHeart } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Item } from '../types';

const ALL_CATEGORIES = [
  'Electronics', 'ID Cards', 'Books', 'Stationery',
  'Accessories', 'Wallet / Money', 'Keys', 'Clothing', 'Documents', 'Other'
];

const ALL_LOCATIONS = [
  'Library', 'Canteen', 'Classroom', 'Lab',
  'Hostel', 'Auditorium', 'Sports Ground', 'Parking Area', 'Bus Area', 'Other'
];

export default function FoundItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getItems('found').then(data => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  // Only show claimable items on the public board — resolved items are archived
  const visibleItems = items.filter(item => item.status !== 'resolved');

  const filtered = visibleItems.filter(item => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory ? item.category === selectedCategory : true;
    const matchesLoc = selectedLocation ? item.location === selectedLocation : true;
    return matchesSearch && matchesCat && matchesLoc;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Recovered Archive</h1>
          <p className="text-slate-500 mt-1">
            Browse all found belongings waiting to be reunited with their owners.{' '}
            <span className="text-emerald-600 font-medium">{visibleItems.length} items awaiting claims</span>
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search archive..."
              className="input-field !pl-10 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="input-field text-sm !w-auto"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            className="input-field text-sm !w-auto"
            value={selectedLocation}
            onChange={e => setSelectedLocation(e.target.value)}
          >
            <option value="">All Locations</option>
            {ALL_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-900">No found items listed</h3>
          <p className="text-slate-500">Check back later if you lost something recently.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item, i) => (
            <motion.div 
              key={item.id} 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
              whileHover={{ scale: 1.03, y: -5 }}
              className="bg-white rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50 border border-slate-100 hover:border-emerald-300 transition-all duration-300 flex flex-col group border-t-4 border-t-emerald-500"
            >
              <div className="h-48 bg-emerald-50 flex items-center justify-center border-b border-emerald-100 relative overflow-hidden">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl.startsWith('/uploads') ? `http://localhost:5000${item.imageUrl}` : item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <HandHeart className="w-12 h-12 text-emerald-300 group-hover:scale-110 transition-transform duration-500" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {/* Status chip */}
                {item.status !== 'active' && (
                  <div className="absolute top-3 right-3">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full shadow ${
                      item.status === 'claimed' ? 'bg-amber-500 text-white' :
                      item.status === 'matched' ? 'bg-purple-600 text-white' :
                      'bg-emerald-700 text-white'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-900 line-clamp-1 text-lg group-hover:text-emerald-700 transition-colors">{item.title}</h3>
                  <span className="text-xs font-medium bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full whitespace-nowrap ml-2">
                    {item.category}
                  </span>
                </div>
                
                <div className="space-y-2 mt-auto pt-4">
                  <div className="flex items-center text-sm text-slate-500 gap-2">
                    <MapPin className="w-4 h-4 text-emerald-500/60" /> <span>Found at {item.location}</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-500 gap-2">
                    <Calendar className="w-4 h-4 text-emerald-500/60" /> <span>{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono">{item.id}</span>
                  <Link to={`/item/${item.id}`} className="text-sm font-medium text-emerald-600 hover:text-emerald-800 flex items-center gap-1 group/link">
                    Claim Item <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
