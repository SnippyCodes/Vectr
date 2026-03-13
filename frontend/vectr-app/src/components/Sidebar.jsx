import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES, APP } from '../constants';

/**
 * Persistent sidebar navigation. Expandable left rail with icon and text nav.
 * Includes logout button and profile avatar.
 */
export default function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isExpanded, setIsExpanded] = useState(false);

    const handleLogout = () => {
        logout();
        navigate(ROUTES.LOGIN);
    };

    const initials = user?.githubUsername?.charAt(0)?.toUpperCase()
        || user?.email?.charAt(0)?.toUpperCase()
        || 'V';

    return (
        <aside className={`fixed left-0 top-0 h-full flex flex-col items-center py-4 z-50 transition-all duration-300 ${isExpanded ? 'w-64 px-4' : 'w-14 items-center'}`}
            style={{ background: 'linear-gradient(180deg, #0c1220, #0a0e1a)', borderRight: '1px solid rgba(30,58,95,0.5)' }}>

            <div className={`w-full flex ${isExpanded ? 'justify-between' : 'justify-center'} items-center mb-6`}>
                {isExpanded && <span className="text-xl font-light tracking-wider text-text-primary ml-2">{APP.NAME.toLowerCase()}</span>}
                <button onClick={() => setIsExpanded(!isExpanded)} className="text-text-secondary hover:text-text-primary transition-colors" aria-label="Menu">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>
            </div>

            <NavLink
                to={ROUTES.DASHBOARD}
                className={({ isActive }) =>
                    `mb-2 w-full flex items-center p-2 rounded-lg transition-all ${isActive ? 'text-accent-cyan bg-bg-panel' : 'text-text-secondary hover:text-text-primary'} ${!isExpanded && 'justify-center'}`
                }
                aria-label="Dashboard"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                {isExpanded && <span className="ml-3 font-medium">Dashboard</span>}
            </NavLink>

            <div className="flex-1" />

            <a
                href="https://github.com/vectr-app"
                target="_blank"
                rel="noreferrer"
                className={`mb-2 w-full flex items-center p-2 rounded-lg text-text-secondary hover:text-text-primary transition-colors ${!isExpanded && 'justify-center'}`}
                aria-label="Documentation"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                {isExpanded && <span className="ml-3 font-medium">Documentation</span>}
            </a>

            <NavLink
                to={ROUTES.SETTINGS}
                className={({ isActive }) =>
                    `mb-2 w-full flex items-center p-2 rounded-lg transition-all ${isActive ? 'text-accent-cyan bg-bg-panel' : 'text-text-secondary hover:text-text-primary'} ${!isExpanded && 'justify-center'}`
                }
                aria-label="Settings"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                    <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                {isExpanded && <span className="ml-3 font-medium">Settings</span>}
            </NavLink>

            {/* Logout */}
            <button
                onClick={handleLogout}
                className={`mb-4 w-full flex items-center p-2 rounded-lg text-text-secondary hover:text-status-rejected transition-colors ${!isExpanded && 'justify-center'}`}
                aria-label="Logout"
                title={!isExpanded ? "Logout" : ""}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                {isExpanded && <span className="ml-3 font-medium">Logout</span>}
            </button>

            <div
                className={`w-8 h-8 rounded-full bg-gradient-to-br from-accent-cyan to-accent-blue flex items-center justify-center text-xs font-bold text-bg-primary ${isExpanded && 'mb-2 self-start ml-2 ml-0'}`}
                title={user?.githubUsername || user?.email || 'Profile'}
                aria-label="Profile"
            >
                {initials}
            </div>
            {isExpanded && (
                <div className="w-full truncate text-xs text-text-muted mt-2 ml-2 text-left px-2">
                    {user?.githubUsername || user?.email}
                </div>
            )}
        </aside>
    );
}
