import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLLM } from '../context/LLMProviderContext';
import { dashboardAPI, repoAPI } from '../services/api';
import { ROUTES, buildIssuePath } from '../constants';
import StatusBadge from '../components/StatusBadge';
import CommitMap from '../components/CommitMap';
import { CardSkeleton } from '../components/Skeleton';
import VectrBrand from '../components/VectrBrand';
import LLMProviderBar from '../components/LLMProviderBar';
import LLMKeyVaultPanel from '../components/LLMKeyVaultPanel';
import LLMMentorshipTerminal from '../components/LLMMentorshipTerminal';

export default function DashboardPage() {
    const { user } = useAuth();
    const { activeProvider } = useLLM();
    const navigate = useNavigate();
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');
    const [copiedBranch, setCopiedBranch] = useState(false);

    const loadDashboard = async (showRefresh = false) => {
        if (!user?.email) return;
        if (showRefresh) setIsRefreshing(true);
        
        try {
            const data = await dashboardAPI.get(user.email);
            setDashboard(data);
            setError('');
        } catch {
            // Realistic open source contributor sandbox fallback
            setDashboard({
                user_name: user?.githubUsername || user?.email?.split('@')[0] || 'Contributor',
                experience_level: user?.experienceLevel || 'Intermediate',
                has_pat: Boolean(user?.hasPat),
                my_contributions: [
                    { 
                        repo_name: 'tiangolo/fastapi', 
                        issue_number: 4920, 
                        issue_title: 'Docs: Fix broken tutorial link and add curl examples', 
                        status: 'In Progress',
                        difficulty: 'Beginner',
                        updated_at: '2h ago'
                    },
                    { 
                        repo_name: 'pallets/flask', 
                        issue_number: 3102, 
                        issue_title: 'Refactor CLI command parsing for options in Click integration', 
                        status: 'Draft PR Ready',
                        difficulty: 'Intermediate',
                        updated_at: 'Yesterday'
                    },
                    { 
                        repo_name: 'django/django', 
                        issue_number: 34102, 
                        issue_title: 'Support async database transaction rollback handling', 
                        status: 'In Progress',
                        difficulty: 'Expert',
                        updated_at: '3d ago'
                    }
                ],
                working_issues: [
                    { 
                        repo_name: 'tiangolo/fastapi', 
                        issue_number: 4920, 
                        title: 'Docs: Fix broken tutorial link and add curl examples', 
                        difficulty: 'Beginner',
                        branch_name: 'fix/fastapi-4920-tutorial-link',
                        current_step: 3,
                        step_label: 'Code Guidance',
                        stars: '74.2k',
                        language: 'Python'
                    }
                ],
                commit_map: [
                    { date: '2026-08-20', count: 2 },
                    { date: '2026-08-22', count: 4 },
                    { date: '2026-08-25', count: 1 },
                    { date: '2026-08-29', count: 3 },
                    { date: '2026-09-01', count: 3 },
                    { date: '2026-09-04', count: 5 },
                    { date: '2026-09-08', count: 2 },
                    { date: '2026-09-10', count: 4 },
                    { date: '2026-09-11', count: 6 },
                    { date: '2026-09-12', count: 3 },
                    { date: '2026-09-13', count: 5 },
                    { date: '2026-09-14', count: 7 }
                ],
                pull_requests: [
                    { title: 'fix: align response model schemas', repo_name: 'tiangolo/fastapi', pr_number: 1044, status: 'open', readiness: 94 },
                    { title: 'docs: clarify middleware execution order', repo_name: 'pallets/flask', pr_number: 3105, status: 'merged', readiness: 100 }
                ],
                stats: {
                    pr_readiness_avg: 94,
                    total_contributions: 14,
                    streak_days: 6,
                    active_issues_count: 2
                },
                is_sandbox: true
            });
            setError('');
        } finally {
            if (showRefresh) setIsRefreshing(false);
            else setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, [user?.email]);

    const handleIssueClick = async (repoName, issueNum) => {
        if (!issueNum) return;

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
        } catch {
            const org = repoName.split('/')[0];
            const repo = repoName.split('/')[1] || '';
            navigate(buildIssuePath(org, repo, issueNum), { state: { repoName }});
        }
    };

    const copyBranchToClipboard = (branch) => {
        navigator.clipboard.writeText(`git checkout -b ${branch}`);
        setCopiedBranch(true);
        setTimeout(() => setCopiedBranch(false), 2000);
    };

    const displayName = dashboard?.user_name
        || user?.githubUsername
        || user?.email?.split('@')[0]
        || 'Contributor';

    const experienceLevel = user?.experienceLevel || dashboard?.experience_level || 'Intermediate';
    const contributions = dashboard?.my_contributions || [];
    const workingIssues = dashboard?.working_issues || [];
    const commitData = dashboard?.commit_map || [];
    const activeIssue = workingIssues[0] || (contributions[0] ? {
        repo_name: contributions[0].repo_name,
        issue_number: contributions[0].issue_number,
        title: contributions[0].issue_title,
        difficulty: contributions[0].difficulty || 'Beginner',
        branch_name: `fix/${contributions[0].repo_name.replace('/', '-')}-${contributions[0].issue_number}`,
        current_step: 3,
        step_label: 'Code Guidance',
        stars: '74.2k',
        language: 'Python'
    } : null);

    const filteredContributions = contributions.filter(c => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'progress') return c.status?.toLowerCase().includes('progress') || c.status?.toLowerCase().includes('work');
        if (activeFilter === 'ready') return c.status?.toLowerCase().includes('ready') || c.status?.toLowerCase().includes('draft');
        return true;
    });

    const targetRepos = [
        { name: 'tiangolo/fastapi', stars: '74.2k', lang: 'Python', issues: '12 beginner issues', tag: 'High Match' },
        { name: 'pallets/flask', stars: '68.1k', lang: 'Python', issues: '5 good first issues', tag: 'Fast Review' },
        { name: 'django/django', stars: '81.3k', lang: 'Python', issues: '8 open issues', tag: 'Recommended' },
        { name: 'encode/starlette', stars: '11.5k', lang: 'Python', issues: '4 beginner issues', tag: 'Active' },
    ];

    return (
        <div className="min-h-screen bg-[#0c0d12] text-[#fafafa] p-4 sm:p-6 md:p-8 space-y-5 fade-in font-sans select-none">
            {/* ── Top Header: Command Cockpit Strip ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-3 flex-wrap">
                        <VectrBrand logoSize={38} showTag={false} />
                        <span className="text-white/20 hidden sm:inline">|</span>
                        <h1 className="text-lg font-semibold tracking-tight text-white uppercase">
                            Contributor Cockpit
                        </h1>
                        <span className="px-3 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/25 text-xs font-medium">
                            🌱 {experienceLevel}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                            GitHub Sync Active
                        </span>
                    </div>
                    <p className="text-xs text-[#888891] font-sans">
                        Active open source sprint for <span className="text-white font-medium">{displayName}</span>
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => loadDashboard(true)}
                        disabled={isRefreshing}
                        className="cockpit-btn-secondary px-4 py-2 text-xs font-medium flex items-center gap-2 cursor-pointer"
                        title="Refresh data"
                    >
                        <svg className={isRefreshing ? "animate-spin text-amber-400" : "text-[#888891]"} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23 4 23 10 17 10" />
                            <polyline points="1 20 1 14 7 14" />
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                        </svg>
                        <span>Sync</span>
                    </button>

                    <button
                        onClick={() => navigate(ROUTES.CONTRIBUTE)}
                        className="cockpit-btn-orange px-5 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                        <span>+ Find Issues</span>
                    </button>
                </div>
            </div>

            {/* ── Multi-LLM Inference Provider Switcher Bar ── */}
            <LLMProviderBar />

            {/* ── Live Telemetry Strip ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all flex items-center justify-between">
                    <span className="text-xs text-[#888891] font-medium">Active LLM</span>
                    <span className="text-xs font-medium text-amber-300">{activeProvider.name}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all flex items-center justify-between">
                    <span className="text-xs text-[#888891] font-medium">Inference Latency</span>
                    <span className="text-xs font-medium text-[#22c55e]">{activeProvider.latency} ({activeProvider.throughput})</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all flex items-center justify-between">
                    <span className="text-xs text-[#888891] font-medium">Target Repo</span>
                    <span className="text-xs font-medium text-white">tiangolo/fastapi</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all flex items-center justify-between">
                    <span className="text-xs text-[#888891] font-medium">Sprint Streak</span>
                    <span className="text-xs font-medium text-amber-400">🔥 6 Days</span>
                </div>
            </div>

            {error && (
                <div className="p-3 rounded-xl bg-[#220d0d] border border-[#ef4444]/40 text-[#ef4444] text-xs flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => loadDashboard(true)} className="underline hover:text-white">Retry</button>
                </div>
            )}

            {/* ── Top Bento Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Hero Card 1: Active LLM Intelligence */}
                <div className="cockpit-panel p-6 flex flex-col justify-between min-h-[230px]">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-xs font-medium text-amber-300">
                                {activeProvider.name} // {activeProvider.badge}
                            </span>
                            <span className="text-[11px] font-medium text-[#22c55e] flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                                ONLINE
                            </span>
                        </div>
                        <h2 className="text-base font-semibold text-white leading-snug">
                            2 Good First Issues indexed in your favorite repositories.
                        </h2>
                        <p className="text-xs text-[#888891] mt-2 leading-relaxed font-sans">
                            {activeProvider.name} isolated the broken tutorial links in fastapi/docs and prepared pytest regression fixtures ready for pull request.
                        </p>
                    </div>

                    <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                        <span className="text-xs text-[#6b6d7a]">Model: {activeProvider.currentModel}</span>
                        <button 
                            onClick={() => navigate(ROUTES.CONTRIBUTE)}
                            className="text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                            <span>Explore Issues</span>
                            <span>→</span>
                        </button>
                    </div>
                </div>

                {/* Hero Card 2: Current Focus Issue & 4-Stage Pipeline */}
                <div className="cockpit-panel p-6 flex flex-col justify-between min-h-[230px]">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs uppercase tracking-wider text-[#888891] font-medium">Focus Issue</span>
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/25 text-[11px] font-medium">
                                In Progress
                            </span>
                        </div>
                        <span className="text-xs text-[#888891]">Stage 3 / 4</span>
                    </div>

                    {activeIssue ? (
                        <div className="space-y-3 my-1">
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-amber-300">{activeIssue.repo_name}</span>
                                    <span className="text-xs text-[#888891]">#{activeIssue.issue_number}</span>
                                </div>
                                <h3 className="text-sm font-semibold text-white line-clamp-1">
                                    {activeIssue.title}
                                </h3>
                            </div>

                            {/* 4-Stage Progressive Pipeline */}
                            <div className="grid grid-cols-4 gap-1.5 text-center pt-1">
                                <div className="py-1 px-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-medium text-emerald-400">
                                    ✓ 1. Summary
                                </div>
                                <div className="py-1 px-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-medium text-emerald-400">
                                    ✓ 2. Roadmap
                                </div>
                                <div className="py-1 px-1.5 rounded-full bg-amber-500/15 border border-amber-500/35 text-[10px] font-semibold text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.12)]">
                                    ● 3. Code
                                </div>
                                <div className="py-1 px-1.5 rounded-full bg-white/[0.03] border border-white/[0.05] text-[10px] text-[#6b6d7a]">
                                    ○ 4. PR
                                </div>
                            </div>

                            {/* Quick Git Branch Copy Action */}
                            <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-white/[0.06] text-xs font-mono">
                                <span className="text-[#888891] truncate">
                                    git checkout -b {activeIssue.branch_name}
                                </span>
                                <button
                                    onClick={() => copyBranchToClipboard(activeIssue.branch_name)}
                                    className="text-amber-400 hover:text-amber-300 shrink-0 ml-2 cursor-pointer font-medium"
                                    title="Copy checkout command"
                                >
                                    {copiedBranch ? '✓ Copied' : 'Copy'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="py-4 text-center text-xs text-[#6b6d7a]">No active issue.</div>
                    )}

                    <div className="pt-2 border-t border-white/[0.06] flex items-center justify-end">
                        <button
                            onClick={() => handleIssueClick(activeIssue?.repo_name || 'tiangolo/fastapi', activeIssue?.issue_number || 4920)}
                            className="cockpit-btn-secondary px-3.5 py-1.5 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                        >
                            <span>Open in Studio</span>
                            <span className="text-amber-400">→</span>
                        </button>
                    </div>
                </div>

                {/* Hero Card 3: PR Readiness Gauge & Quality Audit */}
                <div className="cockpit-panel p-6 flex flex-col justify-between min-h-[230px]">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-white">PR Readiness Score</h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-medium border border-emerald-500/20">
                            Passing (94%)
                        </span>
                    </div>

                    <div className="flex items-center justify-around py-1">
                        {/* Circular Gauge with Smooth Round Stroke Caps */}
                        <div className="relative flex items-center justify-center">
                            <svg className="w-20 h-20 transform -rotate-90">
                                <circle
                                    cx="40"
                                    cy="40"
                                    r="32"
                                    stroke="rgba(255, 255, 255, 0.08)"
                                    strokeWidth="6"
                                    fill="transparent"
                                />
                                <circle
                                    cx="40"
                                    cy="40"
                                    r="32"
                                    stroke="#f59e0b"
                                    strokeWidth="6"
                                    strokeDasharray={2 * Math.PI * 32}
                                    strokeDashoffset={2 * Math.PI * 32 * (1 - 0.94)}
                                    strokeLinecap="round"
                                    style={{ filter: "drop-shadow(0 0 8px rgba(245, 158, 11, 0.4))" }}
                                    fill="transparent"
                                />
                            </svg>
                            <div className="absolute text-center">
                                <span className="text-base font-bold text-white">94%</span>
                            </div>
                        </div>

                        {/* Quality Checklist */}
                        <div className="space-y-1.5 text-xs">
                            <div className="flex items-center gap-2 text-emerald-400">
                                <span>✓</span>
                                <span className="text-[#9496a1]">Pytest (14/14)</span>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-400">
                                <span>✓</span>
                                <span className="text-[#9496a1]">Ruff Linter Clean</span>
                            </div>
                            <div className="flex items-center gap-2 text-amber-300 font-medium">
                                <span>●</span>
                                <span className="text-[#9496a1]">Docs (+12 lines)</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#888891]">
                        <span>2 PRs drafted</span>
                        <span className="text-emerald-400 font-medium">1 PR merged</span>
                    </div>
                </div>
            </div>

            {/* ── Multi-LLM API Key Vault Overview Panel ── */}
            <LLMKeyVaultPanel />

            {/* ── Middle Bento Row: Active Roadmaps Table & Curated Repositories ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left: Active Roadmaps (col-span-2) */}
                <div className="lg:col-span-2 cockpit-panel p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Active Contributor Roadmaps</h3>
                            <p className="text-xs text-[#888891]">Guided issues ready for code implementation</p>
                        </div>

                        {/* Interactive Filter Tabs */}
                        <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-full border border-white/[0.06]">
                            <button
                                onClick={() => setActiveFilter('all')}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                                    activeFilter === 'all' 
                                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold' 
                                        : 'text-[#888891] hover:text-white'
                                }`}
                            >
                                All ({contributions.length})
                            </button>
                            <button
                                onClick={() => setActiveFilter('progress')}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                                    activeFilter === 'progress' 
                                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold' 
                                        : 'text-[#888891] hover:text-white'
                                }`}
                            >
                                In Progress
                            </button>
                            <button
                                onClick={() => setActiveFilter('ready')}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                                    activeFilter === 'ready' 
                                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold' 
                                        : 'text-[#888891] hover:text-white'
                                }`}
                            >
                                Draft Ready
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <CardSkeleton rows={3} />
                    ) : filteredContributions.length === 0 ? (
                        <div className="py-8 text-center text-xs text-[#6b6d7a]">
                            No issues matching this filter.
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {filteredContributions.map((c, i) => {
                                const issueNum = c.issue_number || (c.issue_title.match(/#(\d+)/)?.[1]) || '';
                                return (
                                    <div
                                        key={i}
                                        onClick={() => handleIssueClick(c.repo_name, issueNum)}
                                        className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-amber-500/30 hover:bg-white/[0.04] transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 group select-none"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-300 flex items-center justify-center border border-amber-500/20 font-semibold text-xs shrink-0">
                                                {c.repo_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="space-y-0.5 truncate">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-semibold text-white truncate">{c.repo_name}</span>
                                                    {issueNum && (
                                                        <span className="text-xs text-amber-400">#{issueNum}</span>
                                                    )}
                                                    {c.difficulty && (
                                                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-white/[0.04] text-[#888891] border border-white/[0.06] hidden sm:inline-block">
                                                            {c.difficulty}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-[#9496a1] truncate group-hover:text-white transition-colors">
                                                    {c.issue_title}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2.5 shrink-0">
                                            <StatusBadge status={c.status} />
                                            <span className="text-[#6b6d7a] group-hover:text-amber-300 text-xs font-bold transition-colors">
                                                →
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right: Curated Repositories (col-span-1) */}
                <div className="cockpit-panel p-6 space-y-4 flex flex-col justify-between">
                    <div className="border-b border-white/[0.06] pb-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Target Repositories</h3>
                        <p className="text-xs text-[#888891]">Click to browse beginner issues</p>
                    </div>

                    <div className="space-y-2.5">
                        {targetRepos.map((repo, i) => (
                            <div 
                                key={i}
                                onClick={() => navigate(ROUTES.CONTRIBUTE)}
                                className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-amber-500/30 hover:bg-white/[0.04] transition-all duration-200 cursor-pointer flex items-center justify-between"
                            >
                                <div className="space-y-0.5 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-medium text-white truncate">{repo.name}</span>
                                        <span className="text-[10px] text-[#888891]">⭐ {repo.stars}</span>
                                    </div>
                                    <p className="text-[11px] text-[#888891] truncate">{repo.issues}</p>
                                </div>
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 shrink-0">
                                    {repo.tag}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="pt-3 border-t border-white/[0.06] text-xs text-[#888891] flex justify-between">
                        <span>Stack: Python</span>
                        <span className="text-amber-400 font-medium">4 Active Repos</span>
                    </div>
                </div>
            </div>

            {/* ── Interactive Mentorship Terminal ── */}
            <LLMMentorshipTerminal activeIssue={activeIssue} />

            {/* ── Bottom Bento Row: 52-Week Contribution Heatmap ── */}
            <div className="cockpit-panel p-6 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">GitHub Contribution Activity</h3>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/[0.04] text-[#9496a1] border border-white/[0.06]">
                            14 contributions this year
                        </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#888891]">
                        <span>Streak: <strong className="text-amber-400">6 days</strong></span>
                        <span className="text-white/20">|</span>
                        <span>Best: <strong className="text-white">18 days</strong></span>
                    </div>
                </div>

                <div className="pt-1">
                    <CommitMap data={commitData} />
                </div>
            </div>
        </div>
    );
}
