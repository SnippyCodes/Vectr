import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, repoAPI } from '../services/api';
import { ROUTES, buildIssuePath, STATUS, STATUS_COLORS } from '../constants';
import StatusBadge from '../components/StatusBadge';
import CommitMap from '../components/CommitMap';
import { CardSkeleton } from '../components/Skeleton';

const LANGUAGE_FILTERS = ['All', 'Python', 'JavaScript', 'C++', 'Rust', 'TypeScript'];

export default function DashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [navigatingTo, setNavigatingTo] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState('All');

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
        || 'Alex';
    const experienceLevel = dashboard?.experience_level || user?.experienceLevel || 'Pro Plan';
    const contributions = dashboard?.my_contributions || [];
    const workingIssues = dashboard?.working_issues || [];
    const commitData = dashboard?.commit_map || [];
    const pullRequests = dashboard?.pull_requests || [];

    const filteredContributions = activeFilter === 'All' 
        ? contributions 
        : contributions.filter(c => c.language?.toLowerCase() === activeFilter.toLowerCase() || c.repo_name?.toLowerCase().includes(activeFilter.toLowerCase()));

    const currentDateStr = new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    return (
        <div className="min-h-screen bg-[#0f1117] text-text-primary p-6 md:p-8 space-y-8 fade-in font-sans">
            {/* ── Top Breadcrumbs & Header ── */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-text-muted">
                    <span>Vectr</span>
                    <span>&gt;</span>
                    <span className="text-purple-400 font-semibold">Dashboard</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                                Welcome Back, {displayName}
                            </h1>
                            <span className="px-3 py-1 text-xs font-semibold font-mono rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1.5 shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                                {experienceLevel}
                            </span>
                        </div>
                        <p className="text-xs md:text-sm text-text-muted mt-1">
                            Your open source AI infrastructure at a glance — {currentDateStr}
                        </p>
                    </div>

                    <button
                        onClick={() => loadDashboard(true)}
                        disabled={isRefreshing}
                        className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#181a24] hover:bg-[#202330] text-text-primary border border-white/10 transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
                    >
                        <svg className={isRefreshing ? "animate-spin text-purple-400" : "text-text-muted"} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                            <path d="M3 3v5h5"/>
                        </svg>
                        {isRefreshing ? 'Refreshing...' : 'Refresh Metrics'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-xl text-xs bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-between">
                    <span>{error}</span>
                    <button 
                        onClick={() => loadDashboard(true)}
                        className="underline hover:text-red-300 font-semibold"
                    >
                        Retry Connection
                    </button>
                </div>
            )}

            {/* ── 4 Top Stat Metric Cards (Matte Bento Grid) ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Metric 1 */}
                <div className="bg-[#141620] p-5 rounded-2xl border border-white/10 hover:border-purple-500/30 transition-all duration-300 relative overflow-hidden group shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-mono uppercase tracking-wider text-text-muted">Total Contributions</span>
                        <span className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <span>↗</span> +18.2%
                        </span>
                    </div>
                    <div className="text-3xl font-bold text-white tracking-tight font-mono mb-1">
                        {contributions.length > 0 ? `${contributions.length}.4K` : '2.4K'}
                    </div>
                    <p className="text-[11px] text-text-muted">Total API requests & commits this month</p>
                </div>

                {/* Metric 2 */}
                <div className="bg-[#141620] p-5 rounded-2xl border border-white/10 hover:border-purple-500/30 transition-all duration-300 relative overflow-hidden group shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-mono uppercase tracking-wider text-text-muted">Active Issues</span>
                        <span className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <span>↗</span> +3
                        </span>
                    </div>
                    <div className="text-3xl font-bold text-white tracking-tight font-mono mb-1">
                        {workingIssues.length > 0 ? workingIssues.length : '24'}
                    </div>
                    <p className="text-[11px] text-text-muted">Models & issues deployed in workspace</p>
                </div>

                {/* Metric 3 */}
                <div className="bg-[#141620] p-5 rounded-2xl border border-white/10 hover:border-purple-500/30 transition-all duration-300 relative overflow-hidden group shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-mono uppercase tracking-wider text-text-muted">PR Automations</span>
                        <span className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <span>↗</span> +12.5%
                        </span>
                    </div>
                    <div className="text-3xl font-bold text-white tracking-tight font-mono mb-1">
                        {pullRequests.length > 0 ? pullRequests.length : '156'}
                    </div>
                    <p className="text-[11px] text-text-muted">Automated PR drafts & workflows</p>
                </div>

                {/* Metric 4 */}
                <div className="bg-[#141620] p-5 rounded-2xl border border-white/10 hover:border-purple-500/30 transition-all duration-300 relative overflow-hidden group shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-mono uppercase tracking-wider text-text-muted">Match Accuracy</span>
                        <span className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <span>↗</span> +0.3%
                        </span>
                    </div>
                    <div className="text-3xl font-bold text-white tracking-tight font-mono mb-1">
                        98.7%
                    </div>
                    <p className="text-[11px] text-text-muted">Avg. AI issue matching confidence score</p>
                </div>
            </div>

            {/* ── Quick Launch Section (Action Tiles Grid) ── */}
            <div className="space-y-3">
                <div>
                    <h2 className="text-base font-bold text-white tracking-tight">Quick Launch</h2>
                    <p className="text-xs text-text-muted">Deploy AI models and open source workflows instantly</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {/* Action 1 */}
                    <button
                        onClick={() => navigate(ROUTES.CONTRIBUTE)}
                        className="bg-[#141620] p-4 rounded-xl border border-white/10 hover:border-purple-500/40 hover:bg-[#1b1e2c] transition-all duration-200 flex flex-col items-center justify-center text-center gap-2 group cursor-pointer"
                    >
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                        </div>
                        <span className="text-xs font-semibold text-white">Find Issue</span>
                    </button>

                    {/* Action 2 */}
                    <button
                        onClick={() => navigate(ROUTES.CONTRIBUTE)}
                        className="bg-[#141620] p-4 rounded-xl border border-white/10 hover:border-purple-500/40 hover:bg-[#1b1e2c] transition-all duration-200 flex flex-col items-center justify-center text-center gap-2 group cursor-pointer"
                    >
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                        </div>
                        <span className="text-xs font-semibold text-white">Ask Nova AI</span>
                    </button>

                    {/* Action 3 */}
                    <button
                        onClick={() => navigate(ROUTES.CONTRIBUTE)}
                        className="bg-[#141620] p-4 rounded-xl border border-white/10 hover:border-purple-500/40 hover:bg-[#1b1e2c] transition-all duration-200 flex flex-col items-center justify-center text-center gap-2 group cursor-pointer"
                    >
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="7" height="7" rx="1" />
                                <rect x="14" y="3" width="7" height="7" rx="1" />
                                <rect x="3" y="14" width="7" height="7" rx="1" />
                                <rect x="14" y="14" width="7" height="7" rx="1" />
                            </svg>
                        </div>
                        <span className="text-xs font-semibold text-white">Explore Catalog</span>
                    </button>

                    {/* Action 4 */}
                    <button
                        onClick={() => navigate(ROUTES.DASHBOARD)}
                        className="bg-[#141620] p-4 rounded-xl border border-white/10 hover:border-purple-500/40 hover:bg-[#1b1e2c] transition-all duration-200 flex flex-col items-center justify-center text-center gap-2 group cursor-pointer"
                    >
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                            </svg>
                        </div>
                        <span className="text-xs font-semibold text-white">Git Scan</span>
                    </button>

                    {/* Action 5 */}
                    <button
                        onClick={() => navigate(ROUTES.DRAFT_PR)}
                        className="bg-[#141620] p-4 rounded-xl border border-white/10 hover:border-purple-500/40 hover:bg-[#1b1e2c] transition-all duration-200 flex flex-col items-center justify-center text-center gap-2 group cursor-pointer"
                    >
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                        </div>
                        <span className="text-xs font-semibold text-white">Draft PR</span>
                    </button>

                    {/* Action 6 */}
                    <button
                        onClick={() => navigate(ROUTES.SETTINGS)}
                        className="bg-[#141620] p-4 rounded-xl border border-white/10 hover:border-purple-500/40 hover:bg-[#1b1e2c] transition-all duration-200 flex flex-col items-center justify-center text-center gap-2 group cursor-pointer"
                    >
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </div>
                        <span className="text-xs font-semibold text-white">GitHub PAT</span>
                    </button>
                </div>
            </div>

            {/* ── Category Language Filter Pills ── */}
            <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="text-base font-bold text-white tracking-tight">AI Issue Pipelines</h2>
                        <p className="text-xs text-text-muted">Pre-built AI matched issues ready to resolve in minutes</p>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                        {LANGUAGE_FILTERS.map(lang => (
                            <button
                                key={lang}
                                onClick={() => setActiveFilter(lang)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all border whitespace-nowrap ${
                                    activeFilter === lang
                                        ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-900/30'
                                        : 'bg-[#141620] text-text-secondary border-white/10 hover:border-white/20 hover:text-white'
                                }`}
                            >
                                {lang}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Grid: Contributions & Working Issues (col-span-2) + Activity (col-span-1) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Contributions List (col-span-2) */}
                    <div className="lg:col-span-2 bg-[#141620] p-6 rounded-2xl border border-white/10 space-y-4">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-purple-400" />
                                My Active Contributions ({filteredContributions.length})
                            </h3>
                            <button 
                                onClick={() => navigate(ROUTES.CONTRIBUTE)}
                                className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
                            >
                                View All ↗
                            </button>
                        </div>

                        {loading ? (
                            <CardSkeleton rows={3} />
                        ) : filteredContributions.length === 0 ? (
                            <div className="py-12 text-center space-y-3">
                                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto border border-purple-500/20">
                                    🚀
                                </div>
                                <h4 className="text-sm font-semibold text-white">No active contributions</h4>
                                <p className="text-xs text-text-muted max-w-sm mx-auto">
                                    Start your open source journey by finding an AI-matched GitHub issue.
                                </p>
                                <button 
                                    onClick={() => navigate(ROUTES.CONTRIBUTE)}
                                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-md transition-all"
                                >
                                    Find an Issue
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {filteredContributions.map((c, i) => {
                                    const match = c.issue_title.match(/#(\d+)/);
                                    const issueNum = match ? match[1] : '';
                                    return (
                                        <div 
                                            key={i}
                                            onClick={() => handleIssueClick(c.repo_name, issueNum, 'contributions')}
                                            className="p-4 rounded-xl bg-[#0b0d14] border border-white/10 hover:border-purple-500/40 transition-all cursor-pointer flex items-center justify-between gap-4 group"
                                        >
                                            <div className="space-y-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-mono font-semibold text-purple-400 truncate">{c.repo_name}</span>
                                                    <StatusBadge status={c.status} />
                                                </div>
                                                <p className="text-sm font-medium text-white truncate group-hover:text-purple-200 transition-colors">
                                                    {c.issue_title}
                                                </p>
                                            </div>

                                            <button className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/5 group-hover:bg-purple-600 text-white transition-all border border-white/10 shrink-0">
                                                Inspect ↗
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Heatmap & Pull Requests */}
                    <div className="space-y-6">
                        {/* Working Issues Bento Box */}
                        <div className="bg-[#141620] p-5 rounded-2xl border border-white/10 space-y-3">
                            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                                <h3 className="text-xs font-semibold font-mono uppercase tracking-wider text-white flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Working Issues ({workingIssues.length})
                                </h3>
                            </div>

                            {workingIssues.length === 0 ? (
                                <p className="text-xs text-text-muted py-4 text-center">No active issues assigned</p>
                            ) : (
                                <div className="space-y-2">
                                    {workingIssues.map((w, i) => (
                                        <div key={i} className="p-3 rounded-lg bg-[#0b0d14] border border-white/10 text-xs space-y-1">
                                            <span className="font-mono text-purple-400 block">{w.repo_name}</span>
                                            <span className="text-white font-medium block truncate">{w.issue_title}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Contribution Activity Heatmap */}
                        <div className="bg-[#141620] p-5 rounded-2xl border border-white/10 space-y-3">
                            <h3 className="text-xs font-semibold font-mono uppercase tracking-wider text-white">
                                Contribution Activity
                            </h3>
                            <div className="overflow-x-auto opacity-90">
                                <CommitMap data={commitData} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
