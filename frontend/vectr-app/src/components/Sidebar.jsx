import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES, APP } from '../constants';
import VectrLogo from './VectrLogo';

/**
 * NeuroBank inspired Royal Blue & Indigo Glassmorphism Sidebar.
 * Features a profile header card, theme toggle, rounded navigation container, and cobalt CTA buttons.
 */
export default function Sidebar({ collapsed, setCollapsed }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isDarkMode, setIsDarkMode] = useState(true);

    const initials = user?.githubUsername?.charAt(0)?.toUpperCase()
        || user?.email?.charAt(0)?.toUpperCase()
        || 'A';

    const displayName = user?.githubUsername || user?.email?.split('@')[0] || 'George';

    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    }).toUpperCase();

    const handleLogout = () => {
        logout();
        navigate(ROUTES.LOGIN);
    };

    const navLinkClass = (isActive) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 ${
            isActive 
                ? 'bg-[#3b82f6] text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] font-semibold' 
                : 'text-text-secondary hover:text-white hover:bg-white/5'
        }`;

    return (
        <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} bg-[#080b1c] border-r border-white/10 p-3 flex flex-col justify-between select-none`}>
            <div className="space-y-4">
                {/* ─── Header: Brand Logo & Collapse ─── */}
                <div className="flex items-center justify-between px-2 pt-1 pb-2">
                    <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate(ROUTES.DASHBOARD)}>
                        <VectrLogo size={30} />
                        {!collapsed && (
                            <span className="text-lg font-bold tracking-tight text-white font-mono">
                                {APP.NAME}
                                <span className="text-xs text-blue-400 font-sans ml-1 font-normal">AI</span>
                            </span>
                        )}
                    </div>
                    <button
                        className="text-text-muted hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
                        onClick={() => setCollapsed(!collapsed)}
                        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {collapsed ? <polyline points="9 18 15 12 9 6" /> : <polyline points="15 18 9 12 15 6" />}
                        </svg>
                    </button>
                </div>

                {/* ─── User Profile Welcome Card ─── */}
                {!collapsed && (
                    <div className="bg-[#12162e]/90 border border-white/10 rounded-2xl p-4 relative overflow-hidden backdrop-blur-xl group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
                        
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-md">
                                <div className="w-full h-full rounded-full bg-[#0c1024] flex items-center justify-center text-xs font-bold text-white">
                                    {initials}
                                </div>
                            </div>

                            {/* Sun/Moon Theme Toggle Pill */}
                            <button
                                onClick={() => setIsDarkMode(!isDarkMode)}
                                className="w-12 h-6 rounded-full bg-[#080b1c] border border-white/10 p-0.5 flex items-center justify-between text-[10px] cursor-pointer transition-colors relative"
                                title="Toggle Mode"
                            >
                                <span className="z-10 pl-1">🌙</span>
                                <span className="z-10 pr-1">☀️</span>
                                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-blue-500 transition-transform duration-300 ${isDarkMode ? 'left-0.5' : 'left-6.5'}`} />
                            </button>
                        </div>

                        <div className="space-y-0.5">
                            <span className="text-[10px] font-mono text-text-muted tracking-wider block">
                                {currentDate}
                            </span>
                            <h3 className="text-sm font-bold text-white tracking-tight">
                                Welcome back,<br />
                                <span className="text-blue-400">{displayName}!</span>
                            </h3>
                        </div>
                    </div>
                )}

                {/* ─── Navigation Options Box ─── */}
                <div className={`${!collapsed ? 'bg-[#0e122b]/80 border border-white/10 rounded-2xl p-2' : ''} space-y-1`}>
                    <NavLink to={ROUTES.DASHBOARD} className={({ isActive }) => navLinkClass(isActive)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7" rx="1" />
                            <rect x="14" y="3" width="7" height="7" rx="1" />
                            <rect x="3" y="14" width="7" height="7" rx="1" />
                            <rect x="14" y="14" width="7" height="7" rx="1" />
                        </svg>
                        {!collapsed && <span>Dashboard</span>}
                    </NavLink>

                    <NavLink to={ROUTES.CONTRIBUTE} className={({ isActive }) => navLinkClass(isActive)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                        {!collapsed && (
                            <div className="flex items-center justify-between w-full">
                                <span>Nova AI / Issues</span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300">24</span>
                            </div>
                        )}
                    </NavLink>

                    <NavLink to={ROUTES.CONTRIBUTE} className={({ isActive }) => navLinkClass(isActive)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                        {!collapsed && <span>Accounts & Repos</span>}
                    </NavLink>

                    <NavLink to={ROUTES.DASHBOARD} className={({ isActive }) => navLinkClass(location.pathname === ROUTES.DASHBOARD && false)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                        </svg>
                        {!collapsed && <span>Contributions</span>}
                    </NavLink>

                    <NavLink to={ROUTES.DRAFT_PR} className={({ isActive }) => navLinkClass(isActive)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                        </svg>
                        {!collapsed && <span>Reports / Draft PRs</span>}
                    </NavLink>

                    <NavLink to={ROUTES.SETTINGS} className={({ isActive }) => navLinkClass(isActive)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                        {!collapsed && <span>Settings</span>}
                    </NavLink>
                </div>
            </div>

            {/* ─── Bottom Actions ─── */}
            <div className="space-y-3 pt-2">
                {!collapsed && (
                    <button
                        onClick={() => navigate(ROUTES.CONTRIBUTE)}
                        className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-blue-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer border border-blue-400/30"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        + Find New Issue
                    </button>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-white/10 px-1">
                    {!collapsed && (
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[11px] text-text-muted font-mono truncate">{user?.email}</span>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Sign Out"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                    </button>
                </div>
            </div>
        </aside>
    );
}
