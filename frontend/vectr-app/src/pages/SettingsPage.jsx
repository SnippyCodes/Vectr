import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { useToast } from '../components/Toast';
import { ROUTES, EXPERIENCE_LEVELS } from '../constants';

const PAT_SCOPES = [
    { name: 'repo', desc: 'Full control of private & public repositories' },
    { name: 'read:org', desc: 'Read organization membership & team data' },
    { name: 'user', desc: 'Access user email and profile information' },
    { name: 'workflow', desc: 'Update GitHub Actions workflows' },
];

const TUTORIAL_STEPS = [
    {
        num: '01',
        title: 'Open GitHub Developer Settings',
        desc: 'Click below to launch GitHub token settings pre-configured for Vectr.',
        image: '/pat-step1.png',
        badge: 'Developer Settings',
        actionLabel: 'Create Token on GitHub ↗',
        actionUrl: 'https://github.com/settings/tokens/new?description=Vectr%20AI%20Access&scopes=repo,read:org,user,workflow',
    },
    {
        num: '02',
        title: 'Set Token Name & Expiration',
        desc: 'Fill the Note field with "Vectr AI Access" and pick your desired expiration timeframe.',
        image: '/pat-step2.png',
        badge: 'Note: Vectr AI Access',
    },
    {
        num: '03',
        title: 'Select Required Scopes',
        desc: 'Verify that repo, read:org, user, and workflow permissions are enabled.',
        image: '/pat-step3.png',
        badge: 'Permissions & Scopes',
    },
    {
        num: '04',
        title: 'Generate & Copy Token',
        desc: 'Click Generate token, then copy the generated secret string starting with ghp_ or github_pat_.',
        image: '/pat-step4.png',
        badge: 'Format: ghp_...',
    },
];

export default function SettingsPage() {
    const { user, updateUser, logout } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();
    
    const [updatingExp, setUpdatingExp] = useState(false);
    const [copiedScope, setCopiedScope] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);

    const handleExperienceChange = async (e) => {
        const newLevel = e.target.value;
        setUpdatingExp(true);
        try {
            await authAPI.updateExperience(user.email, newLevel);
            updateUser({ experienceLevel: newLevel });
            showToast('Experience level updated successfully!', 'success');
        } catch (err) {
            showToast(err.message || 'Failed to update experience level.', 'error');
        } finally {
            setUpdatingExp(false);
        }
    };

    const handleCopyScope = (scopeName) => {
        navigator.clipboard.writeText(scopeName);
        setCopiedScope(scopeName);
        showToast(`Copied scope '${scopeName}' to clipboard`, 'info');
        setTimeout(() => setCopiedScope(''), 2000);
    };

    const handleLogout = () => {
        logout();
        navigate(ROUTES.LOGIN);
    };

    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto fade-in space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
                <p className="text-xs text-text-muted mt-1">Manage your account preferences, experience level, and GitHub integrations.</p>
            </div>

            {/* Account Details Card */}
            <div className="glass-card p-6 border border-white/10 space-y-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                    Account Profile
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <p className="text-xs text-text-muted mb-1 font-mono uppercase">Email Address</p>
                        <p className="text-text-primary font-medium text-sm">{user?.email}</p>
                    </div>
                    <div>
                        <p className="text-xs text-text-muted mb-1 font-mono uppercase">GitHub Username</p>
                        <p className="text-text-primary font-medium text-sm flex items-center gap-2">
                            {user?.githubUsername ? (
                                <span className="px-2.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono text-xs">
                                    @{user.githubUsername}
                                </span>
                            ) : (
                                <span className="text-text-muted italic text-xs">Not connected</span>
                            )}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-text-muted mb-1 font-mono uppercase">Experience Level</p>
                        <div className="flex items-center gap-2">
                            <select 
                                value={user?.experienceLevel || ''} 
                                onChange={handleExperienceChange}
                                disabled={updatingExp}
                                className="bg-[#050b14] border border-white/15 rounded-lg px-3 py-1.5 text-text-primary text-xs focus:outline-none focus:border-cyan-400 cursor-pointer w-full"
                            >
                                <option value="" disabled>Select Level</option>
                                {EXPERIENCE_LEVELS.map(level => (
                                    <option key={level.value} value={level.value}>{level.label}</option>
                                ))}
                            </select>
                            {updatingExp && <span className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin shrink-0" />}
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-all"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Sign Out
                    </button>
                    <span className="text-xs text-text-muted font-mono">Vectr AI v1.0.0</span>
                </div>
            </div>

            {/* ── Visual GitHub PAT Tutorial & Generation Guide ── */}
            <div className="glass-card p-6 border border-white/10 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <div>
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            GitHub PAT Generation & Tutorial
                        </h2>
                        <p className="text-xs text-text-muted mt-0.5">
                            Follow the screenshot instructions below to generate a new GitHub Personal Access Token (PAT).
                        </p>
                    </div>

                    <button
                        onClick={() => navigate(ROUTES.PAT)}
                        className="px-4 py-2 text-xs font-bold font-mono tracking-wide uppercase rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all flex items-center justify-center gap-2 shrink-0"
                    >
                        Connect / Re-Validate PAT
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                        </svg>
                    </button>
                </div>

                {/* 4-Step Tutorial Grid with Visual Screenshots */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {TUTORIAL_STEPS.map((step) => (
                        <div
                            key={step.num}
                            className="bg-[#050b14] p-4 rounded-xl border border-white/10 hover:border-cyan-500/40 transition-all duration-300 flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xl font-bold font-mono text-cyan-400">{step.num}</span>
                                    <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-white/5 text-text-muted border border-white/10">
                                        {step.badge}
                                    </span>
                                </div>
                                <h3 className="text-sm font-semibold text-white mb-1">{step.title}</h3>
                                <p className="text-xs text-text-secondary leading-relaxed mb-3">{step.desc}</p>

                                {/* Visual Screenshot Thumbnail */}
                                <div
                                    onClick={() => setSelectedImage(step.image)}
                                    className="relative rounded-lg overflow-hidden border border-white/10 bg-black/50 cursor-pointer hover:border-cyan-500/50 transition-all my-1 group"
                                >
                                    <img
                                        src={step.image}
                                        alt={step.title}
                                        className="w-full h-36 object-cover object-top group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="text-[11px] text-cyan-300 font-mono flex items-center gap-1 bg-black/80 px-2.5 py-1 rounded-full border border-cyan-500/30">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="11" cy="11" r="8" />
                                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                            </svg>
                                            Click to enlarge
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {step.actionUrl && (
                                <a
                                    href={step.actionUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-3 w-full py-2 px-3 text-xs font-semibold text-center rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                                >
                                    {step.actionLabel}
                                </a>
                            )}
                        </div>
                    ))}
                </div>

                {/* Scope Copy Quick Reference */}
                <div className="bg-[#050b14] p-4 rounded-xl border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-semibold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                            Required GitHub Scopes (Click to Copy)
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                        {PAT_SCOPES.map((s) => (
                            <button
                                key={s.name}
                                onClick={() => handleCopyScope(s.name)}
                                className={`p-2.5 rounded-lg border text-left transition-all ${
                                    copiedScope === s.name
                                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400'
                                        : 'bg-black/40 border-white/10 hover:border-cyan-500/30 text-white'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-xs font-semibold text-cyan-400">{s.name}</span>
                                    <span className="text-[10px] text-text-muted">{copiedScope === s.name ? 'Copied!' : 'Copy'}</span>
                                </div>
                                <div className="text-[10px] text-text-muted mt-1 truncate">{s.desc}</div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Image Lightbox Modal ── */}
            {selectedImage && (
                <div
                    onClick={() => setSelectedImage(null)}
                    className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in"
                >
                    <div className="relative max-w-4xl w-full bg-[#0a1120] border border-cyan-500/30 rounded-xl overflow-hidden shadow-2xl p-2" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
                            <span className="text-xs font-mono text-cyan-400">GitHub Setup Screenshot Preview</span>
                            <button
                                onClick={() => setSelectedImage(null)}
                                className="text-text-muted hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <img
                            src={selectedImage}
                            alt="Enlarged GitHub Setup Screenshot"
                            className="w-full h-auto max-h-[80vh] object-contain rounded-b-lg"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
