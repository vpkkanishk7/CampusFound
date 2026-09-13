import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { api } from '../services/api';
import { Bell, CheckCircle, Clock, Loader2, ArrowRight } from 'lucide-react';
import type { Notification } from '../types';

export default function Notifications() {
  const { user } = useAppContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      api.getNotifications(user.id).then(data => {
        setNotifications(data);
        setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  const markAsRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const typeStyles: Record<string, { icon: ReactNode; bg: string }> = {
    match: {
      icon: <CheckCircle className="w-5 h-5" />,
      bg: 'bg-emerald-100 text-emerald-600',
    },
    claim_request: {
      icon: <Bell className="w-5 h-5" />,
      bg: 'bg-amber-100 text-amber-600',
    },
    status_update: {
      icon: <CheckCircle className="w-5 h-5" />,
      bg: 'bg-blue-100 text-blue-600',
    },
    system: {
      icon: <Bell className="w-5 h-5" />,
      bg: 'bg-campus-100 text-campus-700',
    },
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Notifications</h1>
          <p className="text-slate-500">Updates on your reports, matches, and claims.</p>
        </div>
        <div className="bg-campus-100 text-campus-800 p-3 rounded-full">
          <Bell className="w-6 h-6" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-campus-600" /></div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-900">You're all caught up!</h3>
          <p className="text-slate-500">No new notifications.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map(notification => {
            const style = typeStyles[notification.type] ?? typeStyles.system;
            return (
              <div 
                key={notification.id} 
                className={`p-5 rounded-xl border transition-colors flex gap-4 ${
                  notification.isRead ? 'bg-white border-slate-200' : 'bg-campus-50 border-campus-200'
                }`}
              >
                <div className="mt-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${style.bg}`}>
                    {style.icon}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`font-semibold ${notification.isRead ? 'text-slate-700' : 'text-slate-900'}`}>
                      {notification.title}
                    </h4>
                    <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0 ml-2">
                      <Clock className="w-3 h-3" /> Just now
                    </span>
                  </div>

                  <p className="text-slate-600 text-sm">{notification.message}</p>
                  
                  {/* Action row */}
                  <div className="flex items-center gap-4 mt-3">
                    {/* Deep-link to the related item */}
                    {notification.relatedItemId && (
                      <Link
                        to={`/item/${notification.relatedItemId}`}
                        className="text-xs font-semibold text-campus-600 hover:text-campus-800 flex items-center gap-1"
                      >
                        View Item <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}

                    {!notification.isRead && (
                      <button 
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs font-medium text-slate-400 hover:text-slate-600"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
