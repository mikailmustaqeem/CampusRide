import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { NOTIFICATIONS_CHANGED_EVENT } from '../constants/events';

const typeColor = (type) => {
    if (type === 'Booking') return { bg: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: 'rgba(139,92,246,0.2)' };
    if (type === 'Payment') return { bg: 'rgba(52,211,153,0.1)', color: '#34d399', border: 'rgba(52,211,153,0.2)' };
    if (type === 'RideUpdate') return { bg: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: 'rgba(251,191,36,0.2)' };
    return { bg: 'rgba(255,255,255,0.05)', color: '#a1a1aa', border: 'rgba(255,255,255,0.1)' };
};

const typeIcon = (type) => {
    if (type === 'Booking') return '📋';
    if (type === 'Payment') return '💳';
    if (type === 'RideUpdate') return '🚗';
    return '🔔';
};

function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unread, setUnread] = useState(0);
    const token = localStorage.getItem('token');

    useEffect(() => { fetchNotifications(); }, []);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('http://localhost:5001/api/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setNotifications(data.data);
                setUnread(data.unreadCount);
                window.dispatchEvent(new CustomEvent(NOTIFICATIONS_CHANGED_EVENT));
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const markAllRead = async () => {
        try {
            const res = await fetch('http://localhost:5001/api/notifications/read-all', {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) return;
            setNotifications(prev => prev.map(n => ({ ...n, IsRead: true })));
            setUnread(0);
            window.dispatchEvent(new CustomEvent(NOTIFICATIONS_CHANGED_EVENT));
        } catch (e) { console.error(e); }
    };

    return (
        <div className="min-h-screen bg-[#0e0c15] text-white" style={{ fontFamily: "'Sora', sans-serif" }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');`}</style>
            <Navbar />

            <div className="max-w-2xl mx-auto px-6 pt-12 pb-20">

                <div className="mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-widest text-purple-400 bg-purple-900/20 border border-purple-700/40 mb-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        CAMPUSRIDE
                    </div>
                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-4xl font-bold">
                                <span className="text-purple-400">Notifications</span>
                            </h1>
                            <p className="text-zinc-500 text-sm mt-1">
                                {unread > 0 ? `${unread} unread` : 'All caught up!'}
                            </p>
                        </div>
                        {unread > 0 && (
                            <button onClick={markAllRead}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-purple-400 transition-colors"
                                style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', cursor: 'pointer', fontFamily: "'Sora', sans-serif" }}>
                                Mark all read
                            </button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="text-center text-zinc-500 py-12">Loading...</div>
                ) : notifications.length === 0 ? (
                    <div className="rounded-2xl p-12 text-center"
                         style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div className="text-4xl mb-3">🔔</div>
                        <p className="text-zinc-500 text-sm">No notifications yet.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {notifications.map(n => {
                            const colors = typeColor(n.Type);
                            return (
                                <div key={n.NotificationID}
                                     className="rounded-2xl px-5 py-4 flex items-start gap-4 transition-all"
                                     style={{
                                         background: n.IsRead ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)',
                                         border: `1px solid ${n.IsRead ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.12)'}`,
                                     }}>
                                    {/* Icon */}
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                                         style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
                                        {typeIcon(n.Type)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                                  style={{ background: colors.bg, color: colors.color, border: `1px solid ${colors.border}` }}>
                                                {n.Type}
                                            </span>
                                            {!n.IsRead && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                                            )}
                                        </div>
                                        <p className="text-sm text-zinc-300">{n.Message}</p>
                                        <p className="text-xs text-zinc-600 mt-1">
                                            {new Date(n.CreatedAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Notifications;