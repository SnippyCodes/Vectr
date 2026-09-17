import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../constants';
import VectrLogo from './VectrLogo';
import VectrBrand from './VectrBrand';

/**
 * Vectr Obsidian Stealth Sidebar.
 * Clean, solid, non-gradientish developer navigation with essential functions only.
 */
export default function Sidebar({ collapsed, setCollapsed }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const initials = user?.githubUsername?.charAt(0)?.toUpperCase()
        || user?.email?.charAt(0)?.toUpperCase()
        || 'C';

    const displayName = user?.githubUsername || user?.email?.split('@')[0] || 'Contributor';
    const experienceLevel = user?.experienceLevel || 'Beginner';

    const handleLogout = () => {
        logout();
        navigate(ROUTES.LOGIN);
    };

    const navLinkClass = (isActive) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all duration-150 ${
            isActive 
                ? 'bg-amber-500/[0.08] text-white border border-amber-500/25 font-semibold' 
                : 'text-text-secondary hover:text-white hover:bg-white/[0.04]'
        }`;

    return (
        <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} bg-[#0c0c0c] border-r border-[#1e1e1e] p-3 flex flex-col justify-between select-none`}>
            <div className="space-y-3">
                {/* ─── Header: Brand Logo & Collapse ─── */}
                <div className="flex items-center justify-between px-2 pt-1 pb-2">
                    {!collapsed ? (
                        <VectrBrand logoSize={42} showTag={true} showSubtitle={false} onClick={() => navigate(ROUTES.DASHBOARD)} />
                    ) : (
                        <div className="flex justify-center w-full cursor-pointer py-1" onClick={() => navigate(ROUTES.DASHBOARD)}>
                            <VectrLogo size={36} />
                        </div>
                    )}
                    <button
                        className="text-text-muted hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => setCollapsed(!collapsed)}
                        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {collapsed ? <polyline points="9 18 15 12 9 6" /> : <polyline points="15 18 9 12 15 6" />}
                        </svg>
                    </button>
                </div>

                {/* ─── User Profile Welcome Card ─── */}
                {!collapsed && (
                    <div className="bg-[#131316] border border-[#222226] rounded-xl p-3.5 space-y-2">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-xs font-semibold text-amber-300 shrink-0">
                                {initials}
                            </div>
                            <div className="min-w-0">
                                <div className="text-xs font-semibold text-white truncate">
                                    {displayName}
                                </div>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.05] text-[#d4d4d8] border border-white/[0.08] text-[10px] font-medium">
                                    <span className="w-1 h-1 rounded-full bg-amber-400" />
                                    {experienceLevel}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Navigation Links (Essential Routes Only) ─── */}
                <div className={`${!collapsed ? 'bg-[#131316] border border-[#222226] rounded-xl p-1.5' : ''} space-y-1`}>
                    <NavLink to={ROUTES.DASHBOARD} className={({ isActive }) => navLinkClass(isActive)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7" rx="1" />
                            <rect x="14" y="3" width="7" height="7" rx="1" />
                            <rect x="3" y="14" width="7" height="7" rx="1" />
                            <rect x="14" y="14" width="7" height="7" rx="1" />
                        </svg>
                        {!collapsed && <span>Dashboard</span>}
                    </NavLink>

                    <NavLink to={ROUTES.CONTRIBUTE} className={({ isActive }) => navLinkClass(isActive)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                        {!collapsed && (
                            <div className="flex items-center justify-between w-full">
                                <span>Find Issues</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                                    Nova
                                </span>
                            </div>
                        )}
                    </NavLink>

                    <NavLink to={ROUTES.PAT} className={({ isActive }) => navLinkClass(isActive)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 2l-2 2m-1.5 1.5L12 11l-4-4-5 5 1.5 1.5L8 10l4 4 1.5-1.5" />
                            <circle cx="7.5" cy="16.5" r="4.5" />
                        </svg>
                        {!collapsed && (
                            <div className="flex items-center justify-between w-full">
                                <span>GitHub Token</span>
                                <span className={`w-1.5 h-1.5 rounded-full ${user?.hasPat ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                            </div>
                        )}
                    </NavLink>

                    <NavLink to={ROUTES.SETTINGS} className={({ isActive }) => navLinkClass(isActive)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                        {!collapsed && <span>Settings</span>}
                    </NavLink>
                </div>
            </div>

            {/* ─── Bottom Status & Sign Out ─── */}
            <div className="pt-2 border-t border-white/[0.08] px-1">
                <div className="flex items-center justify-between">
                    {!collapsed && (
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                            <span className="text-[11px] text-text-muted font-mono truncate">{user?.email}</span>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Sign Out"
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
