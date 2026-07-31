import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { patAPI } from '../services/api';
import { ROUTES, APP } from '../constants';
import { useToast } from '../components/Toast';
import VectrLogo from '../components/VectrLogo';

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
        desc: 'Click the button below to navigate to GitHub token creation pre-configured with requested scopes.',
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

export default function PATPage() {
    const [pat, setPat] = useState('');
    const [showPat, setShowPat] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [copiedScope, setCopiedScope] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const { user, updateUser, logout } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const isPatFormatValid = pat.trim().startsWith('ghp_') || pat.trim().startsWith('github_pat_');

    const handleCopyScope = (scopeName) => {
        navigator.clipboard.writeText(scopeName);
        setCopiedScope(scopeName);
        showToast(`Copied scope '${scopeName}' to clipboard`, 'info');
        setTimeout(() => setCopiedScope(''), 2000);
    };

    const handleSubmit = async () => {
        const trimmed = pat.trim();
        if (!trimmed) {
            setError('Please enter your GitHub Personal Access Token');
            return;
        }
        if (!isPatFormatValid) {
            setError('Invalid PAT format. GitHub PATs start with ghp_ or github_pat_');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const emailToUse = user?.email || 'user@vectr.ai';
            const data = await patAPI.validate(emailToUse, trimmed);
            updateUser({ hasPat: true, githubUsername: data.github_username });
            showToast(`PAT validated! Connected as ${data.github_username}`, 'success');
            setTimeout(() => navigate(ROUTES.DASHBOARD), 600);
        } catch (err) {
            setError(err.message || 'Failed to validate PAT. Please check your token and try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        showToast('Entering in read-only mode. You can set up your PAT anytime in Settings.', 'info');
        navigate(ROUTES.DASHBOARD);
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#051424] text-text-primary font-sans relative overflow-x-hidden">
            {/* ── Background Mesh Gradients ── */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-cyan-500/10 via-blue-600/10 to-purple-600/10 blur-[120px] rounded-full" />
                <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-cyan-500/5 blur-[140px] rounded-full" />
                <div className="absolute bottom-10 -right-40 w-[500px] h-[500px] bg-blue-500/5 blur-[140px] rounded-full" />
            </div>

            {/* ── Top AppBar Header ── */}
            <header className="w-full border-b border-white/10 bg-[#051424]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <VectrLogo size={32} />
                    <span className="text-xl font-bold tracking-tight text-white font-mono">{APP.NAME.toLowerCase()}</span>
                    <span className="ml-3 px-3 py-1 text-xs font-medium rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        Step 1 of 2: Connect GitHub PAT
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    {user?.email && (
                        <div className="flex items-center gap-2 text-xs text-text-secondary bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span>{user.email}</span>
                            {user.experienceLevel && (
                                <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-text-muted uppercase tracking-wider font-mono">
                                    {user.experienceLevel}
                                </span>
                            )}
                        </div>
                    )}
                    <button
                        onClick={logout}
                        className="text-xs text-text-muted hover:text-white transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-white/5"
                        title="Sign Out"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Sign Out
                    </button>
                </div>
            </header>

            {/* ── Main Setup Container ── */}
            <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-10 z-10 flex flex-col gap-8">
                {/* Hero Header */}
                <div className="text-center max-w-2xl mx-auto space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono tracking-wide">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                        Visual Step-by-Step GitHub Setup
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                        Connect Your GitHub Account
                    </h1>
                    <p className="text-text-secondary text-sm md:text-base leading-relaxed">
                        Follow the visual screenshots below to create your GitHub Personal Access Token (PAT) and grant Vectr AI permission to scan issues & generate pull requests.
                    </p>
                </div>

                {/* ── Visual Screenshot 4-Step Cards ── */}
                <div className="space-y-4">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted font-mono flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        GitHub Visual Setup Screenshots (Click Image to Enlarge)
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {TUTORIAL_STEPS.map((step) => (
                            <div
                                key={step.num}
                                className="glass-card p-5 relative group border border-white/10 hover:border-cyan-500/40 transition-all duration-300 flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-2xl font-bold font-mono text-cyan-400/90">{step.num}</span>
                                        <span className="px-2.5 py-0.5 text-[11px] font-mono rounded bg-white/5 text-text-muted border border-white/10">
                                            {step.badge}
                                        </span>
                                    </div>
                                    <h3 className="text-base font-semibold text-white mb-1">{step.title}</h3>
                                    <p className="text-xs text-text-secondary leading-relaxed mb-3">{step.desc}</p>

                                    {/* Visual Screenshot Thumbnail */}
                                    <div
                                        onClick={() => setSelectedImage(step.image)}
                                        className="relative rounded-lg overflow-hidden border border-white/10 bg-black/40 group-hover:border-cyan-500/50 cursor-pointer transition-all shadow-md my-2"
                                    >
                                        <img
                                            src={step.image}
                                            alt={step.title}
                                            className="w-full h-44 object-cover object-top hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                                            <span className="text-[11px] text-cyan-300 font-mono flex items-center gap-1">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="11" cy="11" r="8" />
                                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                                    <line x1="11" y1="8" x2="11" y2="14" />
                                                    <line x1="8" y1="11" x2="14" y2="11" />
                                                </svg>
                                                Click to enlarge screenshot
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
                    <div className="glass-card p-5 border border-white/10 space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                Scope Quick Reference (Click any scope tag to copy)
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

                {/* ── PAT Input Form Section ── */}
                <div className="glass-card-accent p-6 md:p-8 space-y-6 relative overflow-hidden border border-cyan-500/20 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Enter Personal Access Token</h3>
                                <p className="text-xs text-text-muted">Encrypted securely with Fernet symmetric encryption before storing.</p>
                            </div>
                        </div>

                        {/* Validation Status Indicator */}
                        {pat.trim() && (
                            <span className={`text-xs px-2.5 py-1 rounded-full font-mono flex items-center gap-1.5 ${
                                isPatFormatValid 
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isPatFormatValid ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                                {isPatFormatValid ? 'Format Valid' : 'Invalid Prefix'}
                            </span>
                        )}
                    </div>

                    {error && (
                        <div className="p-3.5 rounded-lg text-xs bg-red-500/10 border border-red-500/30 text-red-400 flex items-start gap-2 animate-shake">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="pat-input" className="block text-xs font-mono uppercase tracking-wider text-text-secondary">
                            GitHub Personal Access Token (PAT)
                        </label>
                        <div className="relative">
                            <input
                                id="pat-input"
                                type={showPat ? 'text' : 'password'}
                                value={pat}
                                onChange={e => {
                                    setPat(e.target.value);
                                    if (error) setError('');
                                }}
                                onKeyDown={e => e.key === 'Enter' && !loading && handleSubmit()}
                                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx or github_pat_..."
                                className="w-full bg-[#050b14] border border-white/15 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-lg px-4 py-3 text-sm font-mono text-white placeholder:text-text-muted/50 outline-none transition-all pr-12"
                                autoComplete="off"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPat(!showPat)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
                                title={showPat ? 'Hide Token' : 'Show Token'}
                                tabIndex={-1}
                            >
                                {showPat ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleSkip}
                            disabled={loading}
                            className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs font-semibold text-text-muted hover:text-white hover:bg-white/5 border border-transparent transition-all"
                        >
                            Explore Dashboard (Read-Only)
                        </button>

                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading || !pat.trim()}
                            id="pat-submit-btn"
                            className={`w-full sm:w-auto px-6 py-2.5 rounded-lg text-xs font-bold font-mono tracking-wide uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
                                !pat.trim() 
                                    ? 'bg-white/10 text-text-muted cursor-not-allowed border border-white/5' 
                                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.4)] cursor-pointer'
                            }`}
                        >
                            {loading ? (
                                <>
                                    <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                                    Validating Token...
                                </>
                            ) : (
                                <>
                                    Validate & Connect PAT
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                        <polyline points="12 5 19 12 12 19" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </main>

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
