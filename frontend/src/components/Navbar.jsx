import React, { useState, useEffect, useCallback } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, ClipboardList, Search, Wallet, Plus, Car, Star, Bell, LayoutDashboard } from 'lucide-react';
import { NOTIFICATIONS_CHANGED_EVENT } from '../constants/events';

const navLinkClass = ({ isActive }) =>
    `flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl transition-all border no-underline ${
        isActive
            ? 'bg-[rgba(124,58,237,0.32)] text-purple-300 border-purple-500/50 font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
            : 'text-zinc-400 border-transparent hover:text-purple-300 hover:bg-purple-900/25'
    }`;

function getNavAvatar(user) {
    const role = (user.role || '').toLowerCase();
    const gender = (user.gender || '').toLowerCase();
    const isDriver = role === 'driver' || role === 'both';
    const isFemale = gender === 'f' || gender === 'female' || gender === 'woman';

    if (isDriver && isFemale) {
        return {
            bg: 'from-violet-600 to-purple-800',
            svg: (
                <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <circle cx="60" cy="60" r="60" fill="#1e1a2e" />
                    <path d="M26 120 Q28 90 42 84 Q48 94 60 94 Q72 94 78 84 Q92 90 94 120Z" fill="#1c1917" />
                    <path d="M50 84 Q60 92 70 84 L66 76 Q60 82 54 76Z" fill="#292524" />
                    <path d="M57 76 L60 84 L63 76 Z" fill="#e7e5e4" />
                    <rect x="55" y="72" width="10" height="13" rx="5" fill="#fcd5b0" />
                    <circle cx="60" cy="52" r="22" fill="#fcd5b0" />
                    <path d="M38 50 Q36 72 40 88 Q44 76 42 64 Q40 56 38 50Z" fill="#1c1917" />
                    <path d="M82 50 Q84 72 80 88 Q76 76 78 64 Q80 56 82 50Z" fill="#1c1917" />
                    <rect x="30" y="40" width="60" height="5" rx="2.5" fill="#111" />
                    <rect x="36" y="20" width="48" height="22" rx="5" fill="#1a1a1a" />
                    <rect x="36" y="36" width="48" height="5" fill="#111" />
                    <rect x="36" y="37.5" width="48" height="2" fill="#d4a017" />
                    <rect x="38" y="22" width="44" height="3" rx="2" fill="#2a2a2a" />
                    <circle cx="60" cy="29" r="4" fill="#d4a017" />
                    <circle cx="60" cy="29" r="2.5" fill="#111" />
                    <circle cx="60" cy="29" r="1" fill="#d4a017" />
                    <path d="M36 44 Q34 50 36 56" stroke="#1c1917" strokeWidth="4" fill="none" strokeLinecap="round" />
                    <path d="M84 44 Q86 50 84 56" stroke="#1c1917" strokeWidth="4" fill="none" strokeLinecap="round" />
                    <ellipse cx="52" cy="57" rx="3" ry="3.5" fill="#1c1917" />
                    <ellipse cx="68" cy="57" rx="3" ry="3.5" fill="#1c1917" />
                    <circle cx="53" cy="55.5" r="1" fill="white" />
                    <circle cx="69" cy="55.5" r="1" fill="white" />
                    <path d="M49 54 L47 52M52 53 L51 51M55 54 L55 52" stroke="#1c1917" strokeWidth="1" strokeLinecap="round" />
                    <path d="M65 54 L63 52M68 53 L67 51M71 54 L71 52" stroke="#1c1917" strokeWidth="1" strokeLinecap="round" />
                    <path d="M53 65 Q60 71 67 65" stroke="#c2855a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    <circle cx="38" cy="60" r="2" fill="#d4a017" />
                    <circle cx="82" cy="60" r="2" fill="#d4a017" />
                </svg>
            ),
        };
    }

    if (isDriver) {
        return {
            bg: 'from-violet-600 to-purple-800',
            svg: (
                <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <circle cx="60" cy="60" r="60" fill="#1e1a2e" />
                    <path d="M26 120 Q28 90 42 84 Q48 94 60 94 Q72 94 78 84 Q92 90 94 120Z" fill="#1c1917" />
                    <path d="M50 84 Q60 92 70 84 L66 76 Q60 82 54 76Z" fill="#292524" />
                    <path d="M57 76 L60 84 L63 76 Z" fill="#e7e5e4" />
                    <rect x="55" y="72" width="10" height="13" rx="5" fill="#fcd5b0" />
                    <circle cx="60" cy="52" r="22" fill="#fcd5b0" />
                    <ellipse cx="38" cy="53" rx="3" ry="4" fill="#f5c49a" />
                    <ellipse cx="82" cy="53" rx="3" ry="4" fill="#f5c49a" />
                    <path d="M39 47 Q39 42 44 40" stroke="#1c1917" strokeWidth="3" fill="none" strokeLinecap="round" />
                    <path d="M81 47 Q81 42 76 40" stroke="#1c1917" strokeWidth="3" fill="none" strokeLinecap="round" />
                    <rect x="30" y="40" width="60" height="5" rx="2.5" fill="#111" />
                    <rect x="36" y="20" width="48" height="22" rx="5" fill="#1a1a1a" />
                    <rect x="36" y="36" width="48" height="5" fill="#111" />
                    <rect x="36" y="37.5" width="48" height="2" fill="#d4a017" />
                    <rect x="38" y="22" width="44" height="3" rx="2" fill="#2a2a2a" />
                    <circle cx="60" cy="29" r="4" fill="#d4a017" />
                    <circle cx="60" cy="29" r="2.5" fill="#111" />
                    <circle cx="60" cy="29" r="1" fill="#d4a017" />
                    <ellipse cx="52" cy="57" rx="3" ry="3.5" fill="#1c1917" />
                    <ellipse cx="68" cy="57" rx="3" ry="3.5" fill="#1c1917" />
                    <circle cx="53" cy="55.5" r="1" fill="white" />
                    <circle cx="69" cy="55.5" r="1" fill="white" />
                    <path d="M49 52 Q52 50.5 55 52" stroke="#1c1917" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                    <path d="M65 52 Q68 50.5 71 52" stroke="#1c1917" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                    <path d="M53 65 Q60 71 67 65" stroke="#c2855a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </svg>
            ),
        };
    }

    if (isFemale) {
        return {
            bg: 'from-pink-600 to-rose-800',
            svg: (
                <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <circle cx="60" cy="60" r="60" fill="#1e1a2e" />
                    <path d="M26 120 Q30 88 42 82 Q50 96 60 96 Q70 96 78 82 Q90 88 94 120Z" fill="#be185d" />
                    <ellipse cx="42" cy="82" rx="10" ry="6" fill="#fcd5b0" />
                    <ellipse cx="78" cy="82" rx="10" ry="6" fill="#fcd5b0" />
                    <rect x="55" y="72" width="10" height="14" rx="5" fill="#fcd5b0" />
                    <circle cx="60" cy="52" r="22" fill="#fcd5b0" />
                    <path d="M38 50 Q36 72 40 88 Q44 76 42 64 Q40 56 38 50Z" fill="#7c2d12" />
                    <path d="M82 50 Q84 72 80 88 Q76 76 78 64 Q80 56 82 50Z" fill="#7c2d12" />
                    <path d="M38 46 Q38 26 60 24 Q82 26 82 46 Q78 34 60 34 Q42 34 38 46Z" fill="#7c2d12" />
                    <ellipse cx="52" cy="52" rx="3" ry="3.5" fill="#1c1917" />
                    <ellipse cx="68" cy="52" rx="3" ry="3.5" fill="#1c1917" />
                    <circle cx="53" cy="50.5" r="1" fill="white" />
                    <circle cx="69" cy="50.5" r="1" fill="white" />
                    <path d="M49 49 L47 47M52 48 L51 46M55 49 L55 47" stroke="#1c1917" strokeWidth="1" strokeLinecap="round" />
                    <path d="M65 49 L63 47M68 48 L67 46M71 49 L71 47" stroke="#1c1917" strokeWidth="1" strokeLinecap="round" />
                    <path d="M53 61 Q60 67 67 61" stroke="#c2855a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    <circle cx="38" cy="56" r="2.5" fill="#f472b6" />
                    <circle cx="82" cy="56" r="2.5" fill="#f472b6" />
                </svg>
            ),
        };
    }

    // Default male
    return {
        bg: 'from-blue-600 to-indigo-800',
        svg: (
            <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <circle cx="60" cy="60" r="60" fill="#1e1a2e" />
                <path d="M26 120 Q28 90 42 84 Q48 94 60 94 Q72 94 78 84 Q92 90 94 120Z" fill="#1d4ed8" />
                <path d="M50 84 Q60 92 70 84 L66 76 Q60 82 54 76Z" fill="#1e3a8a" />
                <rect x="55" y="72" width="10" height="13" rx="5" fill="#fcd5b0" />
                <circle cx="60" cy="52" r="22" fill="#fcd5b0" />
                <path d="M38 46 Q38 26 60 24 Q82 26 82 46 Q80 38 72 35 Q66 32 60 32 Q54 32 48 35 Q40 38 38 46Z" fill="#1c1917" />
                <rect x="38" y="44" width="4" height="10" rx="2" fill="#1c1917" />
                <rect x="78" y="44" width="4" height="10" rx="2" fill="#1c1917" />
                <ellipse cx="52" cy="53" rx="3" ry="3.5" fill="#1c1917" />
                <ellipse cx="68" cy="53" rx="3" ry="3.5" fill="#1c1917" />
                <circle cx="53" cy="51.5" r="1" fill="white" />
                <circle cx="69" cy="51.5" r="1" fill="white" />
                <path d="M53 63 Q60 69 67 63" stroke="#c2855a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </svg>
        ),
    };
}
function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = user.role || 'Passenger';
    const isDriver = role === 'Driver' || role === 'Both';
    const isPassenger = role === 'Passenger' || role === 'Both';

    const [unreadNotifications, setUnreadNotifications] = useState(0);

    const refreshUnreadCount = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch('http://localhost:5001/api/notifications/unread-count', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setUnreadNotifications(Number(data.unreadCount) || 0);
        } catch {
            /* ignore — badge is best-effort */
        }
    }, [token]);

    useEffect(() => {
        refreshUnreadCount();
    }, [location.pathname, refreshUnreadCount]);

    useEffect(() => {
        const handler = () => refreshUnreadCount();
        window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, handler);
        window.addEventListener('focus', handler);
        return () => {
            window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, handler);
            window.removeEventListener('focus', handler);
        };
    }, [refreshUnreadCount]);

    if (!token) return null;

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    return (
        <>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');`}</style>
            <nav style={{ fontFamily: "'Sora', sans-serif" }}
                className="bg-[#110d1e]/80 backdrop-blur-xl border-b border-white/10 text-white px-8 py-3.5 flex justify-between items-center sticky top-0 z-50">

                {/* Logo */}
                <Link to="/dashboard" className="flex items-center gap-2.5 no-underline">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-widest text-purple-400 bg-purple-900/20 border border-purple-700/40">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        CAMPUSRIDE
                    </div>
                </Link>

                {/* Center nav — role based */}
                <div className="flex items-center gap-1">
                    <NavLink to="/dashboard" end className={navLinkClass}>
                        <LayoutDashboard size={14} className="shrink-0 opacity-90" />
                        Dashboard
                    </NavLink>

                    {isDriver && (
                        <>
                            <NavLink to="/create-ride" className={navLinkClass}>
                                <Plus size={14} className="shrink-0 opacity-90" />
                                Create Ride
                            </NavLink>
                            <NavLink to="/my-rides" className={navLinkClass}>
                                <Car size={14} className="shrink-0 opacity-90" />
                                My Rides
                            </NavLink>
                        </>
                    )}

                    {isPassenger && (
                        <>
                            <NavLink to="/rides" className={navLinkClass}>
                                <Search size={14} className="shrink-0 opacity-90" />
                                Find Rides
                            </NavLink>
                            <NavLink to="/my-bookings" className={navLinkClass}>
                                <ClipboardList size={14} className="shrink-0 opacity-90" />
                                My Bookings
                            </NavLink>
                        </>
                    )}

                    <NavLink to="/wallet" className={navLinkClass}>
                        <Wallet size={14} className="shrink-0 opacity-90" />
                        Wallet
                    </NavLink>
                    <NavLink to="/reviews" className={navLinkClass}>
                        <Star size={14} className="shrink-0 opacity-90" />
                        Reviews
                    </NavLink>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-3">
                    {/* Notification Bell */}
                    <NavLink to="/notifications"
                        className={({ isActive }) =>
                            `relative flex items-center justify-center w-8 h-8 rounded-xl transition-colors border ${
                                isActive
                                    ? 'text-purple-200 bg-[rgba(124,58,237,0.32)] border-purple-500/45'
                                    : 'text-zinc-400 border-transparent hover:text-purple-300 hover:bg-purple-900/25'
                            }`
                        }>
                        <Bell size={16} />
                        {unreadNotifications > 0 && (
                            <span
                                className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 border border-[#110d1e]"
                                title={`${unreadNotifications} unread`}
                            />
                        )}
                    </NavLink>

                    <div className="w-px h-4 bg-white/10" />
<div className="flex items-center gap-2">
    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getNavAvatar(user).bg} overflow-hidden border border-white/10 flex-shrink-0`}>
        {getNavAvatar(user).svg}
    </div>
    <span className="text-sm text-zinc-400 font-light">
        Hello, <span className="text-purple-300 font-medium">{user.name}</span>
    </span>
</div>

                    <div className="w-px h-4 bg-white/10" />

                    <NavLink to="/profile" className={({ isActive }) =>
                        `flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl transition-all border no-underline ${
                            isActive
                                ? 'text-purple-200 bg-[rgba(124,58,237,0.28)] border-purple-500/45 font-medium'
                                : 'text-zinc-400 border-transparent hover:text-purple-300 hover:bg-purple-900/25 hover:border-purple-700/30'
                        }`
                    }>
                        <User size={14} className="shrink-0 opacity-90" />
                        Profile
                    </NavLink>

                    <button onClick={handleLogout}
                        className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-red-400 transition-colors px-3 py-1.5 rounded-xl hover:bg-red-900/10 border border-transparent hover:border-red-700/20">
                        <LogOut size={14} />
                        Logout
                    </button>
                </div>
            </nav>
        </>
    );
}

export default Navbar;