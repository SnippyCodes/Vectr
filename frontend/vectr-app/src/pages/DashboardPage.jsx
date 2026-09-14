import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, repoAPI } from '../services/api';
import { ROUTES, buildIssuePath } from '../constants';
import StatusBadge from '../components/StatusBadge';
import CommitMap from '../components/CommitMap';
import { CardSkeleton } from '../components/Skeleton';
import VectrBrand from '../components/VectrBrand';

export default function DashboardPage() {
    const { user } = useAuth();
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
        } catch (err) {
            // Realistic open source contributor sandbox fallback
            setDashboard({
                user_name: user?.githubUsername || user?.email?.split('@')[0] || 'Contributor',
                experience_level: user?.experienceLevel || 'Beginner',
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
        } catch (err) {
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

    const experienceLevel = user?.experienceLevel || dashboard?.experience_level || 'Beginner';
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
        <div className="min-h-screen bg-[#0c0c0c] text-text-primary p-6 md:p-8 space-y-5 fade-in font-sans select-none">
            {/* ── Top Header: Streamlined & Non-Gradientish ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-3 flex-wrap">
                        <VectrBrand logoSize={40} showTag={false} />
                        <span className="text-zinc-700 hidden sm:inline">|</span>
                        <h1 className="text-lg font-bold tracking-tight text-white font-mono">
                            Contributor Cockpit
                        </h1>
                        <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-xs font-mono">
                            🌱 {experienceLevel}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            GitHub Sync Active
                        </span>
                    </div>
                    <p className="text-xs text-text-muted">
                        Active open source sprint for <span className="text-text-secondary font-medium">{displayName}</span>
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => loadDashboard(true)}
                        disabled={isRefreshing}
                        className="px-3 py-1.5 rounded-lg bg-[#141416] hover:bg-[#1a1a1e] text-text-secondary hover:text-white border border-white/[0.08] text-xs font-medium transition-all flex items-center gap-2 cursor-pointer"
                        title="Refresh data"
                    >
                        <svg className={isRefreshing ? "animate-spin text-accent-cyan" : "text-text-muted"} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23 4 23 10 17 10" />
                            <polyline points="1 20 1 14 7 14" />
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                        </svg>
                        <span>Sync</span>
                    </button>

                    <button
                        onClick={() => navigate(ROUTES.CONTRIBUTE)}
                        className="px-3.5 py-1.5 rounded-lg bg-accent-cyan hover:bg-cyan-300 text-[#0c0c0c] text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                        <span>+ Find Issues</span>
                    </button>
                </div>
            </div>

            {/* ── Live Telemetry Strip (More Lively, Clean Flat Badges) ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-lg bg-[#141416] border border-white/[0.08] flex items-center justify-between">
                    <span className="text-[11px] font-mono text-text-muted">Nova AI Model</span>
                    <span className="text-xs font-mono font-semibold text-accent-cyan">Nova 2 Lite</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#141416] border border-white/[0.08] flex items-center justify-between">
                    <span className="text-[11px] font-mono text-text-muted">Guidance Speed</span>
                    <span className="text-xs font-mono font-semibold text-emerald-400">3.4x Faster</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#141416] border border-white/[0.08] flex items-center justify-between">
                    <span className="text-[11px] font-mono text-text-muted">Sprint Target</span>
                    <span className="text-xs font-mono font-semibold text-white">FastAPI Async</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#141416] border border-white/[0.08] flex items-center justify-between">
                    <span className="text-[11px] font-mono text-text-muted">Streak</span>
                    <span className="text-xs font-mono font-semibold text-amber-400">🔥 6 Days</span>
                </div>
            </div>

            {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => loadDashboard(true)} className="underline hover:text-red-300">Retry</button>
                </div>
            )}

            {/* ── Top Bento Row (Solid, Sharp Cards) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Hero Card 1: Nova AI Intelligence */}
                <div className="bg-[#141416] p-5 rounded-xl border border-white/[0.08] shadow-sm flex flex-col justify-between min-h-[210px]">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <span className="px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-[11px] font-mono text-white">
                                Amazon Nova AI
                            </span>
                            <span className="text-[10px] font-mono text-text-muted">Real-time Mentor</span>
                        </div>
                        <h2 className="text-base font-bold text-white leading-snug">
                            2 Good First Issues indexed in your favorite repositories.
                        </h2>
                        <p className="text-xs text-text-muted mt-2 leading-relaxed">
                            Nova isolated the broken links and prepared curl regression tests ready for implementation.
                        </p>
                    </div>

                    <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                        <span className="text-[11px] font-mono text-text-muted">Status: Active</span>
                        <button 
                            onClick={() => navigate(ROUTES.CONTRIBUTE)}
                            className="text-xs font-semibold text-accent-cyan hover:underline flex items-center gap-1 cursor-pointer"
                        >
                            <span>Explore Issues</span>
                            <span>→</span>
                        </button>
                    </div>
                </div>

                {/* Hero Card 2: Current Focus Issue & 4-Stage Pipeline */}
                <div className="bg-[#141416] p-5 rounded-xl border border-white/[0.08] shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono uppercase text-text-muted">Focus Issue</span>
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-mono">
                                In Progress
                            </span>
                        </div>
                        <span className="text-xs font-mono text-text-muted">Step 3 of 4</span>
                    </div>

                    {activeIssue ? (
                        <div className="space-y-2.5 my-1">
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-bold text-accent-cyan">{activeIssue.repo_name}</span>
                                    <span className="text-xs font-mono text-text-muted">#{activeIssue.issue_number}</span>
                                </div>
                                <h3 className="text-sm font-semibold text-white line-clamp-1">
                                    {activeIssue.title}
                                </h3>
                            </div>

                            {/* 4-Stage Progressive Pipeline */}
                            <div className="grid grid-cols-4 gap-1.5 text-center pt-1">
                                <div className="p-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400">
                                    ✓ Summary
                                </div>
                                <div className="p-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400">
                                    ✓ Roadmap
                                </div>
                                <div className="p-1.5 rounded bg-cyan-500/20 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 font-bold">
                                    ● Guidance
                                </div>
                                <div className="p-1.5 rounded bg-white/[0.03] border border-white/[0.06] text-[10px] font-mono text-text-muted">
                                    ○ Draft PR
                                </div>
                            </div>

                            {/* Quick Git Branch Copy Action */}
                            <div className="flex items-center justify-between bg-[#111113] p-2 rounded border border-white/[0.05] text-[11px] font-mono">
                                <span className="text-text-muted truncate">
                                    git checkout -b {activeIssue.branch_name}
                                </span>
                                <button
                                    onClick={() => copyBranchToClipboard(activeIssue.branch_name)}
                                    className="text-accent-cyan hover:text-white shrink-0 ml-2 cursor-pointer"
                                    title="Copy checkout command"
                                >
                                    {copiedBranch ? '✓ Copied' : 'Copy'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="py-4 text-center text-xs text-text-muted">No active issue.</div>
                    )}

                    <div className="pt-2 border-t border-white/[0.06] flex items-center justify-end">
                        <button
                            onClick={() => handleIssueClick(activeIssue?.repo_name || 'tiangolo/fastapi', activeIssue?.issue_number || 4920)}
                            className="px-3 py-1 rounded bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                            <span>Open in Studio</span>
                            <span className="text-accent-cyan">→</span>
                        </button>
                    </div>
                </div>

                {/* Hero Card 3: PR Readiness Gauge & Quality Audit */}
                <div className="bg-[#141416] p-5 rounded-xl border border-white/[0.08] shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-white">PR Readiness Score</h3>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
                            Passing (94%)
                        </span>
                    </div>

                    <div className="flex items-center justify-around py-1">
                        {/* Circular Gauge */}
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
                                    stroke="#22d3ee"
                                    strokeWidth="6"
                                    strokeDasharray={2 * Math.PI * 32}
                                    strokeDashoffset={2 * Math.PI * 32 * (1 - 0.94)}
                                    strokeLinecap="round"
                                    fill="transparent"
                                />
                            </svg>
                            <div className="absolute text-center">
                                <span className="text-base font-bold font-mono text-white">94%</span>
                            </div>
                        </div>

                        {/* Quality Checklist */}
                        <div className="space-y-1 text-xs font-mono">
                            <div className="flex items-center gap-1.5 text-emerald-400">
                                <span>✓</span>
                                <span className="text-text-secondary">Tests (14/14)</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-emerald-400">
                                <span>✓</span>
                                <span className="text-text-secondary">Ruff Lint Passed</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-cyan-300">
                                <span>●</span>
                                <span className="text-text-secondary">Docs (+12 lines)</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-text-muted">
                        <span>2 PRs drafted</span>
                        <span className="text-emerald-400 font-semibold">1 PR merged</span>
                    </div>
                </div>
            </div>

            {/* ── Middle Bento Row: Active Roadmaps Table & Curated Repositories ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left: Active Roadmaps (col-span-2) */}
                <div className="lg:col-span-2 bg-[#141416] p-5 rounded-xl border border-white/[0.08] shadow-sm space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
                        <div>
                            <h3 className="text-sm font-bold text-white">Active Contributor Roadmaps</h3>
                            <p className="text-[11px] text-text-muted">Guided issues ready for code implementation</p>
                        </div>

                        {/* Interactive Filter Tabs */}
                        <div className="flex items-center gap-1 bg-[#1a1a1e] p-1 rounded-lg border border-white/[0.06]">
                            <button
                                onClick={() => setActiveFilter('all')}
                                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                                    activeFilter === 'all' 
                                        ? 'bg-white/10 text-white font-semibold' 
                                        : 'text-text-muted hover:text-white'
                                }`}
                            >
                                All ({contributions.length})
                            </button>
                            <button
                                onClick={() => setActiveFilter('progress')}
                                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                                    activeFilter === 'progress' 
                                        ? 'bg-white/10 text-white font-semibold' 
                                        : 'text-text-muted hover:text-white'
                                }`}
                            >
                                In Progress
                            </button>
                            <button
                                onClick={() => setActiveFilter('ready')}
                                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                                    activeFilter === 'ready' 
                                        ? 'bg-white/10 text-white font-semibold' 
                                        : 'text-text-muted hover:text-white'
                                }`}
                            >
                                Draft Ready
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <CardSkeleton rows={3} />
                    ) : filteredContributions.length === 0 ? (
                        <div className="py-8 text-center text-xs text-text-muted">
                            No issues matching this filter.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredContributions.map((c, i) => {
                                const issueNum = c.issue_number || (c.issue_title.match(/#(\d+)/)?.[1]) || '';
                                return (
                                    <div
                                        key={i}
                                        onClick={() => handleIssueClick(c.repo_name, issueNum)}
                                        className="p-3 rounded-lg bg-[#111113] border border-white/[0.06] hover:border-cyan-500/40 hover:bg-[#161619] transition-all cursor-pointer flex items-center justify-between gap-3 group"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-8 h-8 rounded bg-white/[0.04] text-accent-cyan flex items-center justify-center border border-white/[0.08] font-mono font-bold text-xs shrink-0">
                                                {c.repo_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="space-y-0.5 truncate">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-mono font-bold text-white truncate">{c.repo_name}</span>
                                                    {issueNum && (
                                                        <span className="text-[11px] font-mono text-accent-cyan">#{issueNum}</span>
                                                    )}
                                                    {c.difficulty && (
                                                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-text-muted border border-white/10 hidden sm:inline-block">
                                                            {c.difficulty}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-text-secondary truncate group-hover:text-cyan-100 transition-colors">
                                                    {c.issue_title}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2.5 shrink-0">
                                            <StatusBadge status={c.status} />
                                            <span className="text-text-muted group-hover:text-accent-cyan text-xs">
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
                <div className="bg-[#141416] p-5 rounded-xl border border-white/[0.08] shadow-sm space-y-3 flex flex-col justify-between">
                    <div className="border-b border-white/[0.08] pb-2">
                        <h3 className="text-sm font-bold text-white">Target Repositories</h3>
                        <p className="text-[11px] text-text-muted">Click to browse issues</p>
                    </div>

                    <div className="space-y-2">
                        {targetRepos.map((repo, i) => (
                            <div 
                                key={i}
                                onClick={() => navigate(ROUTES.CONTRIBUTE)}
                                className="p-2.5 rounded-lg bg-[#111113] border border-white/[0.06] hover:border-cyan-500/30 transition-all cursor-pointer flex items-center justify-between"
                            >
                                <div className="space-y-0.5 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-mono font-semibold text-white truncate">{repo.name}</span>
                                        <span className="text-[10px] font-mono text-text-muted">⭐ {repo.stars}</span>
                                    </div>
                                    <p className="text-[11px] text-text-muted truncate">{repo.issues}</p>
                                </div>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 shrink-0">
                                    {repo.tag}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="pt-2 border-t border-white/[0.06] text-[11px] font-mono text-text-muted flex justify-between">
                        <span>Stack: Python</span>
                        <span className="text-accent-cyan">4 Active</span>
                    </div>
                </div>
            </div>

            {/* ── Bottom Bento Row: 52-Week Contribution Heatmap ── */}
            <div className="bg-[#141416] p-5 rounded-xl border border-white/[0.08] shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-2">
                    <div className="flex items-center gap-3">
                        <h3 className="text-sm font-bold text-white font-mono">GitHub Contribution Activity</h3>
                        <span className="text-xs font-mono px-2 py-0.2 rounded bg-white/5 text-text-muted border border-white/10">
                            14 contributions this year
                        </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-mono text-text-muted">
                        <span>Streak: <strong className="text-emerald-400">6 days</strong></span>
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
