import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES, APP } from '../constants';
import VectrLogo from './VectrLogo';

/**
 * Cortex AI inspired Matte Dark Sidebar navigation.
 * Features soft purple accents, quick launch actions, search shortcuts, and clean section grouping.
 */
export default function Sidebar({ collapsed, setCollapsed }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [openSections, setOpenSections] = useState({
        contribute: true,
        settings: true,
    });

    const initials = user?.githubUsername?.charAt(0)?.toUpperCase()
        || user?.email?.charAt(0)?.toUpperCase()
        || 'V';

    const toggleSection = (key) => {
        setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleLogout = () => {
        logout();
        navigate(ROUTES.LOGIN);
    };

    const navLinkClass = (isActive) =>
        `sidebar-nav-item ${isActive ? 'sidebar-nav-active !bg-purple-500/15 !text-purple-300 !border-purple-500/30' : ''}`;

    return (
        <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} bg-[#0e1017] border-r border-white/10`}>
            {/* ─── Header: Logo + Collapse Toggle ─────────────── */}
            <div className="sidebar-header">
                <div className="sidebar-logo-group cursor-pointer" onClick={() => navigate(ROUTES.DASHBOARD)}>
                    <VectrLogo size={30} />
                    {!collapsed && (
                        <div className="flex items-center gap-2">
                            <span className="sidebar-brand text-white font-bold font-mono tracking-tight">{APP.NAME}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                AI
                            </span>
                        </div>
                    )}
                </div>
                <button
                    className="sidebar-collapse-btn hover:text-white"
                    onClick={() => setCollapsed(!collapsed)}
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {collapsed ? (
                            <polyline points="9 18 15 12 9 6" />
                        ) : (
                            <polyline points="15 18 9 12 15 6" />
                        )}
                    </svg>
                </button>
            </div>

            {/* ─── Cortex Style Quick Action Button ───────────── */}
            {!collapsed && (
                <div className="px-3 my-2">
                    <button
                        onClick={() => navigate(ROUTES.CONTRIBUTE)}
                        className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs tracking-wide shadow-md shadow-purple-950/40 transition-all flex items-center justify-center gap-2 border border-purple-400/20 cursor-pointer"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        + Find Issues
                    </button>
                </div>
            )}

            {/* ─── Search Shortcut Bar ───────────── */}
            {!collapsed && (
                <div className="px-3 mb-3">
                    <div 
                        onClick={() => navigate(ROUTES.CONTRIBUTE)}
                        className="w-full py-2 px-3 rounded-lg bg-[#141620] border border-white/10 hover:border-purple-500/30 text-text-muted text-xs flex items-center justify-between cursor-pointer transition-all"
                    >
                        <div className="flex items-center gap-2">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <span>Search issues...</span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-text-muted border border-white/10">
                            ⌘ K
                        </span>
                    </div>
                </div>
            )}

            {/* ─── Primary Navigation ─────────────────────────── */}
            <nav className="sidebar-nav">
                <NavLink
                    to={ROUTES.DASHBOARD}
                    className={({ isActive }) => navLinkClass(isActive)}
                    title="Dashboard"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                        <rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                    {!collapsed && <span>Dashboard</span>}
                </NavLink>

                <NavLink
                    to={ROUTES.CONTRIBUTE}
                    className={({ isActive }) => navLinkClass(isActive)}
                    title="Explore Issues"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    {!collapsed && (
                        <div className="flex items-center justify-between w-full">
                            <span>Explore Catalog</span>
                            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300">
                                24
                            </span>
                        </div>
                    )}
                </NavLink>
            </nav>

            {/* ─── Divider ────────────────────────────────────── */}
            <div className="sidebar-divider border-white/10" />

            {/* ─── Contribute Section ─────────────────────────── */}
            {!collapsed && (
                <div className="sidebar-section">
                    <button className="sidebar-section-header text-text-muted hover:text-white" onClick={() => toggleSection('contribute')}>
                        <div className="sidebar-section-title-group">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                                <path d="M9 18c-4.51 2-5-2-7-2" />
                            </svg>
                            <span>Pipelines</span>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            style={{ transform: openSections.contribute ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform 0.2s ease' }}>
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </button>
                    {openSections.contribute && (
                        <div className="sidebar-section-items">
                            <NavLink
                                to={ROUTES.CONTRIBUTE}
                                className={({ isActive }) => `sidebar-sub-item ${isActive ? 'sidebar-sub-active !text-purple-300' : ''}`}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                                <span>Find Issues</span>
                            </NavLink>
                            <NavLink
                                to={ROUTES.DASHBOARD}
                                end
                                className={({ isActive }) => `sidebar-sub-item ${location.pathname === ROUTES.DASHBOARD ? 'sidebar-sub-active !text-purple-300' : ''}`}
                                onClick={(e) => { e.preventDefault(); navigate(ROUTES.DASHBOARD); }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                </svg>
                                <span>My Contributions</span>
                            </NavLink>
                            <NavLink
                                to={ROUTES.DRAFT_PR}
                                className={({ isActive }) => `sidebar-sub-item ${isActive ? 'sidebar-sub-active !text-purple-300' : ''}`}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                    <polyline points="15 3 21 3 21 9" />
                                </svg>
                                <span>Nova PR Drafts</span>
                            </NavLink>
                        </div>
                    )}
                </div>
            )}

            {/* ─── Settings Section ───────────────────────────── */}
            {!collapsed && (
                <div className="sidebar-section">
                    <button className="sidebar-section-header text-text-muted hover:text-white" onClick={() => toggleSection('settings')}>
                        <div className="sidebar-section-title-group">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                            <span>Settings</span>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            style={{ transform: openSections.settings ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform 0.2s ease' }}>
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </button>
                    {openSections.settings && (
                        <div className="sidebar-section-items">
                            <NavLink
                                to={ROUTES.SETTINGS}
                                className={({ isActive }) => `sidebar-sub-item ${isActive ? 'sidebar-sub-active !text-purple-300' : ''}`}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                                <span>Account & Settings</span>
                            </NavLink>
                            <NavLink
                                to={ROUTES.PAT}
                                className={({ isActive }) => `sidebar-sub-item ${isActive ? 'sidebar-sub-active !text-purple-300' : ''}`}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <span>GitHub PAT Token</span>
                            </NavLink>
                        </div>
                    )}
                </div>
            )}

            {/* Collapsed icons for settings */}
            {collapsed && (
                <div className="sidebar-nav" style={{ marginTop: 0 }}>
                    <NavLink
                        to={ROUTES.SETTINGS}
                        className={({ isActive }) => navLinkClass(isActive)}
                        title="Settings"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                    </NavLink>
                </div>
            )}

            {/* ─── Spacer ─────────────────────────────────────── */}
            <div className="sidebar-spacer" />

            {/* ─── User Profile + Logout ──────────────────────── */}
            <div className="sidebar-footer border-t border-white/10">
                <div className="sidebar-user">
                    <div className="sidebar-avatar !bg-purple-600 !text-white font-bold font-mono" title={user?.githubUsername || user?.email || 'Profile'}>
                        {initials}
                    </div>
                    {!collapsed && (
                        <div className="sidebar-user-info">
                            <span className="sidebar-user-name text-white">
                                {user?.githubUsername || user?.email?.split('@')[0] || 'Alex'}
                            </span>
                            <span className="sidebar-user-email text-text-muted">
                                {user?.email || ''}
                            </span>
                        </div>
                    )}
                </div>
                <button
                    className="sidebar-logout-btn hover:text-red-400"
                    onClick={handleLogout}
                    title="Logout"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                </button>
            </div>
        </aside>
    );
}
