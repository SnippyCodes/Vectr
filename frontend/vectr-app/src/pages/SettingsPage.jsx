import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { useToast } from '../components/Toast';
import { ROUTES, EXPERIENCE_LEVELS } from '../constants';
import VectrBrand from '../components/VectrBrand';
import LLMKeyVaultSection from '../components/LLMKeyVaultSection';

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
        <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto fade-in space-y-6 bg-[#080808] min-h-screen text-[#fafafa] select-none">
            {/* Page Header */}
            <div>
                <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                    <VectrBrand logoSize={38} showTag={false} />
                    <span className="text-[#333333] hidden sm:inline">|</span>
                    <h1 className="text-xl font-bold text-white tracking-tight font-mono uppercase">
                        Cockpit Settings & Vault
                    </h1>
                </div>
                <p className="text-xs font-mono text-[#888888]">
                    Manage your multi-LLM API keys, contributor experience tier, and GitHub personal access tokens.
                </p>
            </div>

            {/* ── 1. Multi-LLM API Key & Inference Vault (Groq, OpenRouter, Nova, OpenAI, Anthropic, Gemini) ── */}
            <LLMKeyVaultSection />

            {/* ── 2. Account Details Card ── */}
            <div className="cockpit-panel p-6 space-y-6">
                <h2 className="text-sm font-bold font-mono uppercase text-white flex items-center gap-2 border-b border-[#262626] pb-3">
                    <span className="w-2 h-2 rounded-[1px] bg-[#e0681a]" />
                    Contributor Profile
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <p className="text-xs text-[#888888] mb-1 font-mono uppercase">Email Address</p>
                        <p className="text-white font-mono font-medium text-sm">{user?.email || 'contributor@vectr.ai'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-[#888888] mb-1 font-mono uppercase">GitHub Username</p>
                        <p className="text-white font-medium text-sm flex items-center gap-2">
                            {user?.githubUsername ? (
                                <span className="px-2.5 py-0.5 rounded-[3px] bg-[#141414] text-[#e0681a] border border-[#e0681a]/30 font-mono text-xs font-bold">
                                    @{user.githubUsername}
                                </span>
                            ) : (
                                <span className="text-[#666666] font-mono italic text-xs">Not connected</span>
                            )}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-[#888888] mb-1 font-mono uppercase">Experience Level</p>
                        <div className="flex items-center gap-2">
                            <select 
                                value={user?.experienceLevel || 'Intermediate'} 
                                onChange={handleExperienceChange}
                                disabled={updatingExp}
                                className="bg-[#121212] border border-[#262626] focus:border-[#e0681a] rounded-[4px] px-3 py-1.5 text-white text-xs font-mono focus:outline-none cursor-pointer w-full"
                            >
                                {EXPERIENCE_LEVELS.map(level => (
                                    <option key={level.value} value={level.value}>{level.label}</option>
                                ))}
                            </select>
                            {updatingExp && <span className="w-3.5 h-3.5 border-2 border-[#e0681a] border-t-transparent rounded-full animate-spin shrink-0" />}
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-[#1f1f1f] flex items-center justify-between">
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono font-semibold rounded-[4px] text-[#ef4444] bg-[#220d0d] hover:bg-[#2d1111] border border-[#ef4444]/30 transition-all cursor-pointer"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Sign Out
                    </button>
                    <span className="text-xs text-[#666666] font-mono">Vectr AI v2.4.0 (Obsidian Kinetic)</span>
                </div>
            </div>

            {/* ── 3. Visual GitHub PAT Tutorial & Generation Guide ── */}
            <div className="cockpit-panel p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262626] pb-4">
                    <div>
                        <h2 className="text-sm font-bold font-mono uppercase text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-[1px] bg-[#e0681a]" />
                            GitHub PAT Generation & Scopes Guide
                        </h2>
                        <p className="text-xs text-[#888888] font-mono mt-0.5">
                            Follow the screenshot instructions below to generate a new GitHub Personal Access Token (PAT).
                        </p>
                    </div>

                    <button
                        onClick={() => navigate(ROUTES.PAT)}
                        className="cockpit-btn-orange px-4 py-2 text-xs font-mono uppercase tracking-wide cursor-pointer flex items-center justify-center gap-2 shrink-0"
                    >
                        Connect / Re-Validate PAT
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                        </svg>
                    </button>
                </div>

                {/* 4-Step Tutorial Grid with Visual Screenshots */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {TUTORIAL_STEPS.map((step) => (
                        <div
                            key={step.num}
                            className="bg-[#0e0e0e] p-4 rounded-[4px] border border-[#222222] hover:border-[#e0681a] transition-colors flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xl font-bold font-mono text-[#e0681a]">{step.num}</span>
                                    <span className="px-2 py-0.5 text-[10px] font-mono rounded-[2px] bg-[#141414] text-[#888888] border border-[#262626]">
                                        {step.badge}
                                    </span>
                                </div>
                                <h3 className="text-sm font-semibold font-mono text-white mb-1">{step.title}</h3>
                                <p className="text-xs text-[#888888] font-mono leading-relaxed mb-3">{step.desc}</p>

                                {/* Visual Screenshot Thumbnail */}
                                <div
                                    onClick={() => setSelectedImage(step.image)}
                                    className="relative rounded-[4px] overflow-hidden border border-[#262626] bg-black cursor-pointer hover:border-[#e0681a] transition-all my-1 group"
                                >
                                    <img
                                        src={step.image}
                                        alt={step.title}
                                        className="w-full h-36 object-cover object-top group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="text-[11px] text-[#e0681a] font-mono flex items-center gap-1 bg-[#111111] px-2.5 py-1 rounded-[3px] border border-[#e0681a]/40">
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
                                    className="mt-3 w-full py-1.5 px-3 text-xs font-mono font-bold text-center rounded-[3px] bg-[#141414] hover:bg-[#1a1a1a] text-[#e0681a] border border-[#262626] hover:border-[#e0681a] transition-colors flex items-center justify-center gap-1.5"
                                >
                                    {step.actionLabel}
                                </a>
                            )}
                        </div>
                    ))}
                </div>

                {/* Scope Copy Quick Reference */}
                <div className="bg-[#0e0e0e] p-4 rounded-[4px] border border-[#222222] space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#e0681a]" />
                            Required GitHub Scopes (Click to Copy)
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                        {PAT_SCOPES.map((s) => (
                            <button
                                key={s.name}
                                onClick={() => handleCopyScope(s.name)}
                                className={`p-2.5 rounded-[3px] border text-left transition-all cursor-pointer ${
                                    copiedScope === s.name
                                        ? 'bg-[#0e1f13] border-[#22c55e] text-[#22c55e]'
                                        : 'bg-[#111111] border-[#222222] hover:border-[#e0681a] text-white'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-xs font-bold text-[#e0681a]">{s.name}</span>
                                    <span className="text-[10px] font-mono text-[#888888]">{copiedScope === s.name ? 'Copied!' : 'Copy'}</span>
                                </div>
                                <div className="text-[10px] font-mono text-[#888888] mt-1 truncate">{s.desc}</div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Image Lightbox Modal ── */}
            {selectedImage && (
                <div
                    onClick={() => setSelectedImage(null)}
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fade-in"
                >
                    <div className="relative max-w-4xl w-full bg-[#0d0d0d] border border-[#e0681a]/40 rounded-[6px] overflow-hidden p-2" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-4 py-2 border-b border-[#262626]">
                            <span className="text-xs font-mono text-[#e0681a]">GitHub Setup Screenshot Preview</span>
                            <button
                                onClick={() => setSelectedImage(null)}
                                className="text-[#888888] hover:text-white p-1 rounded hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>
                        <img
                            src={selectedImage}
                            alt="Enlarged GitHub Setup Screenshot"
                            className="w-full h-auto max-h-[80vh] object-contain"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
