import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, CheckCheck } from 'lucide-react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../components/localData';

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => { setNotifications(getNotifications()); }, []);

  const handleRead = (id) => {
    setNotifications(markNotificationRead(id));
  };

  const handleReadAll = () => {
    setNotifications(markAllNotificationsRead());
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center border border-gray-800">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            {unreadCount > 0 && <p className="text-gray-400 text-sm">{unreadCount} unread</p>}
          </div>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleReadAll} className="flex items-center gap-1 text-yellow-400 text-sm font-medium">
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      <div className="px-6 space-y-3 pb-6">
        {notifications.length === 0 && (
          <div className="bg-gray-900 rounded-2xl p-12 border border-gray-800 text-center">
            <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No notifications</p>
          </div>
        )}

        {notifications.map((n) => (
          <button
            key={n.id}
            onClick={() => handleRead(n.id)}
            className={`w-full text-left p-4 rounded-2xl border transition-colors ${n.read ? 'bg-gray-900 border-gray-800' : 'bg-gray-900 border-yellow-400/30'
              }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${n.read ? 'bg-gray-800' : 'bg-yellow-400/20'}`}>
                <Bell className={`w-5 h-5 ${n.read ? 'text-gray-500' : 'text-yellow-400'}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className={`font-semibold text-sm ${n.read ? 'text-gray-300' : 'text-white'}`}>{n.title}</p>
                  {!n.read && <div className="w-2 h-2 bg-yellow-400 rounded-full" />}
                </div>
                <p className="text-gray-400 text-sm mt-0.5">{n.message}</p>
                <p className="text-gray-600 text-xs mt-1">{n.time}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}