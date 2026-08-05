import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, repoAPI } from '../services/api';
import { ROUTES, buildIssuePath, STATUS, STATUS_COLORS } from '../constants';
import StatusBadge from '../components/StatusBadge';
import CommitMap from '../components/CommitMap';
import { CardSkeleton } from '../components/Skeleton';

export default function DashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [navigatingTo, setNavigatingTo] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('This Month');

    const loadDashboard = async (showRefresh = false) => {
        if (!user?.email) return;
        if (showRefresh) setIsRefreshing(true);
        
        try {
            const data = await dashboardAPI.get(user.email);
            setDashboard(data);
            setError('');
        } catch (err) {
            setError(err.message || 'Failed to load dashboard');
        } finally {
            if (showRefresh) setIsRefreshing(false);
            else setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, [user?.email]);

    const handleIssueClick = async (repoName, issueNum, blockType) => {
        if (!issueNum) return;
        
        const navId = `${blockType}-${repoName}#${issueNum}`;
        setNavigatingTo(navId);

        try {
            const org = repoName.split('/')[0];
            const repo = repoName.split('/')[1] || '';
            
            const data = await repoAPI.getRepoIssues(org, repo, user.email);
            const targetIssue = data.issues?.find(i => i.number.toString() === issueNum.toString());
            
            navigate(buildIssuePath(org, repo, issueNum), { 
                state: { 
                    issue: targetIssue || { title: `Issue #${issueNum}` }, 
                    repoName, 
                    issues: data.issues || [] 
                } 
            });
        } catch (err) {
            console.error("Failed to fetch issue details for navigation:", err);
            const org = repoName.split('/')[0];
            const repo = repoName.split('/')[1] || '';
            navigate(buildIssuePath(org, repo, issueNum), { state: { repoName }});
        } finally {
            setNavigatingTo(null);
        }
    };

    const displayName = dashboard?.user_name
        || user?.githubUsername
        || user?.email?.split('@')[0]
        || 'George';
    const contributions = dashboard?.my_contributions || [];
    const workingIssues = dashboard?.working_issues || [];
    const commitData = dashboard?.commit_map || [];
    const pullRequests = dashboard?.pull_requests || [];

    return (
        <div className="min-h-screen bg-[#080b1c] text-text-primary p-6 md:p-8 space-y-6 fade-in font-sans relative overflow-x-hidden">
            {/* ── Background Cosmic Orbs ── */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-10 right-20 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px]" />
                <div className="absolute bottom-10 left-20 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px]" />
            </div>

            {/* ── Header Toolbar ── */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="px-3.5 py-1.5 rounded-full bg-[#12162e] border border-white/10 text-xs font-mono text-text-secondary flex items-center gap-2">
                        <span>🗓️</span>
                        <span>This Month</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => loadDashboard(true)}
                        disabled={isRefreshing}
                        className="px-4 py-2 rounded-2xl bg-[#12162e] hover:bg-[#181d3d] text-white border border-white/10 text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-md"
                    >
                        <svg className={isRefreshing ? "animate-spin text-blue-400" : "text-text-muted"} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                        Manage Widgets
                    </button>

                    <button
                        onClick={() => navigate(ROUTES.CONTRIBUTE)}
                        className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-900/40 border border-blue-400/30 transition-all flex items-center gap-2 cursor-pointer"
                    >
                        <span className="text-sm">+</span>
                        Add new Widget / Issue
                    </button>
                </div>
            </div>

            {error && (
                <div className="relative z-10 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => loadDashboard(true)} className="underline hover:text-red-300">Retry</button>
                </div>
            )}

            {/* ── Top Bento Row (3 Hero Metric Cards) ── */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Hero Card 1: AI Insights */}
                <div className="bg-gradient-to-br from-blue-950/80 via-[#101638]/90 to-[#080b1c] p-6 rounded-3xl border border-blue-500/30 backdrop-blur-2xl shadow-2xl relative overflow-hidden flex flex-col justify-between group min-h-[220px]">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/30 transition-all" />
                    
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-mono text-white mb-4">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                            AI Insights
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white leading-snug">
                            Your Contribution Volume<br />
                            Has increased by <span className="text-blue-400">18%</span><br />
                            <span className="text-text-muted text-base font-normal">Since last Month</span>
                        </h2>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button 
                            onClick={() => navigate(ROUTES.CONTRIBUTE)}
                            className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-blue-600 text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-lg"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="7" y1="17" x2="17" y2="7" />
                                <polyline points="7 7 17 7 17 17" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Hero Card 2: Contribution Overview */}
                <div className="bg-[#0f1430]/90 p-6 rounded-3xl border border-white/10 backdrop-blur-2xl shadow-xl flex flex-col justify-between relative group">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-white tracking-tight">Balance & Contribution Overview</h3>
                        <button className="text-text-muted hover:text-white">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="7" y1="17" x2="17" y2="7" />
                                <polyline points="7 7 17 7 17 17" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-bold font-mono text-white tracking-tight">$82,053</span>
                            <span className="text-xs font-mono font-semibold text-emerald-400 flex items-center gap-1">
                                <span>↑ 12%</span> From last month
                            </span>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                            <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-text-muted">
                                44 transactions
                            </span>
                            <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-text-muted">
                                12 categories
                            </span>
                        </div>
                    </div>

                    {/* Glowing Blue Sparkline SVG */}
                    <div className="pt-4">
                        <svg viewBox="0 0 300 60" className="w-full h-14 overflow-visible">
                            <defs>
                                <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path
                                d="M 0 45 Q 40 15, 80 35 T 160 20 T 240 40 T 300 10 L 300 60 L 0 60 Z"
                                fill="url(#sparklineGrad)"
                            />
                            <path
                                d="M 0 45 Q 40 15, 80 35 T 160 20 T 240 40 T 300 10"
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>
                </div>

                {/* Hero Card 3: Match Rate & Accuracy Gauge */}
                <div className="bg-[#0f1430]/90 p-6 rounded-3xl border border-white/10 backdrop-blur-2xl shadow-xl flex flex-col justify-between relative">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-white tracking-tight">Match Rate & Accuracy</h3>
                        <button className="text-text-muted hover:text-white">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="7" y1="17" x2="17" y2="7" />
                                <polyline points="7 7 17 7 17 17" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-bold font-mono text-white tracking-tight">98.7%</span>
                        <span className="text-xs font-mono font-semibold text-emerald-400 flex items-center gap-1">
                            <span>↑ 7%</span> From last month
                        </span>
                    </div>

                    {/* Radial Semi-Circle Arc Gauge */}
                    <div className="relative flex items-center justify-center my-2">
                        <svg viewBox="0 0 200 110" className="w-48 h-24">
                            {/* Track Arc */}
                            <path
                                d="M 20 100 A 80 80 0 0 1 180 100"
                                fill="none"
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth="16"
                                strokeLinecap="round"
                            />
                            {/* Progress Arc */}
                            <path
                                d="M 20 100 A 80 80 0 0 1 155 45"
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="16"
                                strokeLinecap="round"
                                className="filter drop-shadow-[0_0_10px_rgba(59,130,246,0.6)]"
                            />
                        </svg>
                        <div className="absolute text-center mt-6">
                            <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider block">Percentage</span>
                            <span className="text-xl font-bold font-mono text-white">98.7%</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-4 text-[11px] font-mono text-text-muted">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            Current
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-slate-600" />
                            Month goal
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Bottom Bento Row (2 Data Cards) ── */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Card: Recent Contributions Table (col-span-2) */}
                <div className="lg:col-span-2 bg-[#0f1430]/90 p-6 rounded-3xl border border-white/10 backdrop-blur-2xl shadow-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <h3 className="text-base font-bold text-white tracking-tight">Recent Contributions & Transactions</h3>
                        <div className="flex items-center gap-2">
                            <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-muted hover:text-white border border-white/10 text-xs">
                                ≡ Filter
                            </button>
                            <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-muted hover:text-white border border-white/10 text-xs">
                                ↗
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <CardSkeleton rows={4} />
                    ) : contributions.length === 0 ? (
                        <div className="py-12 text-center space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/20 text-xl">
                                🚀
                            </div>
                            <h4 className="text-sm font-semibold text-white">No active contributions</h4>
                            <p className="text-xs text-text-muted max-w-sm mx-auto">
                                Explore GitHub issues matched to your skills to populate your contribution dashboard.
                            </p>
                            <button 
                                onClick={() => navigate(ROUTES.CONTRIBUTE)}
                                className="px-5 py-2.5 text-xs font-bold rounded-2xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40"
                            >
                                Find an Issue
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {contributions.map((c, i) => {
                                const match = c.issue_title.match(/#(\d+)/);
                                const issueNum = match ? match[1] : '';
                                return (
                                    <div
                                        key={i}
                                        onClick={() => handleIssueClick(c.repo_name, issueNum, 'contributions')}
                                        className="p-4 rounded-2xl bg-[#080b1c]/80 border border-white/10 hover:border-blue-500/40 transition-all cursor-pointer flex items-center justify-between gap-4 group"
                                    >
                                        <div className="flex items-center gap-3.5 min-w-0">
                                            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 font-bold shrink-0">
                                                {c.repo_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="space-y-0.5 truncate">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-mono font-bold text-white truncate">{c.repo_name}</span>
                                                    <span className="text-[10px] font-mono text-text-muted">•••• {1000 + i}</span>
                                                </div>
                                                <p className="text-xs text-text-secondary truncate group-hover:text-blue-200 transition-colors">
                                                    {c.issue_title}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 shrink-0">
                                            <span className="text-[11px] font-mono text-text-muted hidden sm:inline-block">
                                                31 Mar, 3:20 PM
                                            </span>
                                            <StatusBadge status={c.status} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right Card: Language & Skill Breakdown Bar Chart (col-span-1) */}
                <div className="bg-[#0f1430]/90 p-6 rounded-3xl border border-white/10 backdrop-blur-2xl shadow-xl space-y-5 flex flex-col justify-between">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <h3 className="text-base font-bold text-white tracking-tight">Language & Skill Breakdown</h3>
                        <button className="text-text-muted hover:text-white">↗</button>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-bold font-mono text-white tracking-tight">92,803</span>
                            <span className="text-xs font-mono text-red-400 flex items-center gap-1">
                                <span>↓ 2</span> From last month
                            </span>
                        </div>
                        <span className="text-xs text-text-muted font-mono block">Lines of code analyzed across repos</span>
                    </div>

                    {/* Vertical Bar Chart */}
                    <div className="grid grid-cols-4 gap-3 items-end h-44 pt-4 border-b border-white/10 pb-4">
                        {/* Bar 1: Python */}
                        <div className="flex flex-col items-center gap-2 h-full justify-end group">
                            <span className="text-[10px] font-mono text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity">34</span>
                            <div className="w-full bg-blue-600 rounded-t-xl h-[85%] group-hover:bg-blue-500 transition-all shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                            <span className="text-[11px] font-mono text-text-muted">Python</span>
                        </div>

                        {/* Bar 2: JavaScript */}
                        <div className="flex flex-col items-center gap-2 h-full justify-end group">
                            <span className="text-[10px] font-mono text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity">16</span>
                            <div className="w-full bg-blue-600/60 rounded-t-xl h-[45%] group-hover:bg-blue-500 transition-all" />
                            <span className="text-[11px] font-mono text-text-muted">JS</span>
                        </div>

                        {/* Bar 3: C++ */}
                        <div className="flex flex-col items-center gap-2 h-full justify-end group">
                            <span className="text-[10px] font-mono text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity">8</span>
                            <div className="w-full bg-blue-600/40 rounded-t-xl h-[25%] group-hover:bg-blue-500 transition-all" />
                            <span className="text-[11px] font-mono text-text-muted">C++</span>
                        </div>

                        {/* Bar 4: Rust */}
                        <div className="flex flex-col items-center gap-2 h-full justify-end group">
                            <span className="text-[10px] font-mono text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity">6</span>
                            <div className="w-full bg-blue-600/30 rounded-t-xl h-[18%] group-hover:bg-blue-500 transition-all" />
                            <span className="text-[11px] font-mono text-text-muted">Rust</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-text-muted">
                        <span>Active stack: 4 languages</span>
                        <button onClick={() => navigate(ROUTES.CONTRIBUTE)} className="text-blue-400 hover:underline">
                            Explore +
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
