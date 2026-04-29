import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, repoAPI } from '../services/api';
import { ROUTES, buildIssuePath, STATUS, STATUS_COLORS } from '../constants';
import StatusBadge from '../components/StatusBadge';
import CommitMap from '../components/CommitMap';
import { CardSkeleton } from '../components/Skeleton';
import { HoverBorderGradient } from '../components/ui/hover-border-gradient';

export default function DashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [navigatingTo, setNavigatingTo] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

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
            
            // We need to fetch the issue details before navigating because IssueDashboardPage expects it in state
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
            // Fallback navigate
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
        || 'Contributor';
    const experienceLevel = dashboard?.experience_level || user?.experienceLevel || 'Intermediate';
    const contributions = dashboard?.my_contributions || [];
    const workingIssues = dashboard?.working_issues || [];
    const commitData = dashboard?.commit_map || [];
    const pullRequests = dashboard?.pull_requests || [];

    return (
        <div className="dashboard-page fade-in">
            <div className="dashboard-topbar">
                <div>
                    <h1 className="dashboard-greeting">Welcome back, {displayName}</h1>
                    <p className="dashboard-subtitle">Here's what's happening with your contributions</p>
                </div>
                <div className="dashboard-topbar-actions">
                    <StatusBadge status={experienceLevel} />
                </div>
            </div>

            {error && (
                <div className="dashboard-error">
                    <span>{error}</span>
                    <button onClick={() => { setError(''); setLoading(true); dashboardAPI.get(user.email).then(setDashboard).catch(e => setError(e.message)).finally(() => setLoading(false)); }}
                        className="dashboard-error-retry">Retry</button>
                </div>
            )}

            {/* ─── Bento Grid Redesign ──────────────────────────────── */}
            <div className="bento-grid">
                
                {/* 1. My Contributions (col-span-2, row-span-2) */}
                <div className="bento-card bento-col-span-2 bento-row-span-2">
                    <div className="bento-bg-gradient-1"></div>
                    <div className="bento-card-header">
                        <h2 className="bento-card-title">
                            My Contributions
                            <button 
                                onClick={(e) => { e.stopPropagation(); loadDashboard(true); }}
                                disabled={isRefreshing}
                                className="dashboard-refresh-btn"
                                title="Refresh status"
                            >
                                <svg className={isRefreshing ? "animate-reverse-spin" : ""} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                                    <path d="M3 3v5h5"/>
                                </svg>
                            </button>
                        </h2>
                        <span className="dashboard-card-count">
                            {isRefreshing ? (
                                <span className="dot-wave text-text-muted">
                                    <span></span><span></span><span></span>
                                </span>
                            ) : (
                                `${contributions.length} total`
                            )}
                        </span>
                    </div>
                    <div className="bento-card-body">
                        {loading ? <CardSkeleton rows={3} /> : contributions.length === 0 ? (
                            <div className="dashboard-empty">
                                <div className="dashboard-empty-icon">🚀</div>
                                <p className="dashboard-empty-title">No contributions yet</p>
                                <p className="dashboard-empty-desc">Start your open source journey today</p>
                                <button onClick={() => navigate(ROUTES.CONTRIBUTE)} className="btn-primary text-sm">
                                    Find an Issue
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {contributions.map((c, i) => {
                                    const match = c.issue_title.match(/#(\d+)/);
                                    const issueNum = match ? match[1] : '';
                                    return (
                                        <div 
                                            key={i} 
                                            onClick={() => handleIssueClick(c.repo_name, issueNum, 'contributions')}
                                            className={`dashboard-issue-card ${issueNum ? 'clickable' : ''}`}
                                        >
                                            {navigatingTo === `contributions-${c.repo_name}#${issueNum}` && (
                                                <div className="dashboard-issue-loading">
                                                    <span className="spinner"></span>
                                                </div>
                                            )}
                                            <div className="dashboard-issue-top">
                                                <p className="dashboard-issue-repo">{c.repo_name}</p>
                                                <StatusBadge status={c.status} />
                                            </div>
                                            <p className="dashboard-issue-title">{c.issue_title}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Quick Stats (col-span-1) */}
                <div className="bento-card bento-col-span-1">
                    <div className="bento-bg-gradient-2" style={{ opacity: 0.5 }}></div>
                    <div className="bento-card-header">
                        <h2 className="bento-card-title">Quick Stats</h2>
                    </div>
                    <div className="bento-card-body flex items-center justify-center p-4">
                        <div className="grid grid-cols-2 gap-3 w-full">
                            <div className="dashboard-stat-card !p-4 !gap-2 flex-col items-start justify-center">
                                <div className="dashboard-stat-icon !w-8 !h-8" style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                                </div>
                                <div>
                                    <span className="dashboard-stat-value text-lg">{contributions.length}</span>
                                    <span className="dashboard-stat-label text-xs">Contributions</span>
                                </div>
                            </div>
                            <div className="dashboard-stat-card !p-4 !gap-2 flex-col items-start justify-center">
                                <div className="dashboard-stat-icon !w-8 !h-8" style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                </div>
                                <div>
                                    <span className="dashboard-stat-value text-lg">{workingIssues.length}</span>
                                    <span className="dashboard-stat-label text-xs">In Progress</span>
                                </div>
                            </div>
                            <div className="dashboard-stat-card !p-4 !gap-2 flex-col items-start justify-center">
                                <div className="dashboard-stat-icon !w-8 !h-8" style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
                                </div>
                                <div>
                                    <span className="dashboard-stat-value text-lg">{pullRequests.length}</span>
                                    <span className="dashboard-stat-label text-xs">Pull Requests</span>
                                </div>
                            </div>
                            <div className="dashboard-stat-card !p-4 !gap-2 flex-col items-start justify-center">
                                <div className="dashboard-stat-icon !w-8 !h-8" style={{ background: 'rgba(250,204,21,0.1)', color: '#facc15' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                                </div>
                                <div>
                                    <span className="dashboard-stat-value text-lg">{contributions.filter(c => c.status === STATUS.ACCEPTED).length}</span>
                                    <span className="dashboard-stat-label text-xs">Accepted</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Working Issues (col-span-1) */}
                <div className="bento-card bento-col-span-1">
                    <div className="bento-bg-gradient-3"></div>
                    <div className="bento-card-header">
                        <h2 className="bento-card-title">Working Issues</h2>
                        <span className="dashboard-card-count">{workingIssues.length}</span>
                    </div>
                    <div className="bento-card-body">
                        {loading ? <CardSkeleton rows={2} /> : workingIssues.length === 0 ? (
                            <p className="dashboard-empty-small">No active issues</p>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {workingIssues.map((w, i) => {
                                    const match = w.issue_title.match(/#(\d+)/);
                                    const issueNum = match ? match[1] : '';
                                    return (
                                        <div 
                                            key={i} 
                                            onClick={() => handleIssueClick(w.repo_name, issueNum, 'working')}
                                            className={`dashboard-issue-card ${issueNum ? 'clickable' : ''}`}
                                        >
                                            {navigatingTo === `working-${w.repo_name}#${issueNum}` && (
                                                <div className="dashboard-issue-loading">
                                                    <span className="spinner"></span>
                                                </div>
                                            )}
                                            <p className="dashboard-issue-repo">{w.repo_name}</p>
                                            <p className="dashboard-issue-title">{w.issue_title}</p>
                                            {w.language && (
                                                <span className="dashboard-issue-lang">{w.language}</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. Commit Map & Start Contributing (col-span-2) */}
                <div className="bento-card bento-col-span-2 relative group overflow-hidden border-[#1e1e1e] hover:border-[#3a205e] transition-all duration-500">
                    {/* Deep space glow for the commit map card */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent pointer-events-none"></div>
                    
                    <div className="bento-card-header border-none pb-2 relative z-10">
                        <h2 className="bento-card-title flex items-center gap-2 text-purple-100/90">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400">
                                <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3 3 3 0 0 0-3 3v-12a3 3 0 0 0-3-3z"></path>
                                <path d="M6 3a3 3 0 0 1 3 3 3 3 0 0 1-3 3 3 3 0 0 1-3-3 3 3 0 0 1 3-3z"></path>
                                <path d="M9 6h3a2 2 0 0 1 2 2v8"></path>
                            </svg>
                            Contribution Activity
                        </h2>
                    </div>

                    <div className="bento-card-body p-6 pt-2 relative z-10 flex flex-col items-center justify-between gap-6">
                        <div className="w-full flex justify-start opacity-80 group-hover:opacity-100 transition-opacity duration-500 overflow-x-auto">
                            <CommitMap data={commitData} />
                        </div>
                        
                        <div className="w-full border-t border-purple-500/10 pt-5 flex justify-between items-center">
                            <span className="text-xs text-purple-200/50 hidden sm:inline-block tracking-wide">
                                Your open source footprint over the last year
                            </span>
                            <HoverBorderGradient
                                containerClassName="rounded-full shadow-[0_0_20px_rgba(168,85,247,0.1)] hover:shadow-[0_0_30px_rgba(168,85,247,0.25)] transition-all duration-300"
                                className="bg-[#09090b] px-6 py-2 flex items-center gap-2.5 text-purple-100 border border-purple-500/20"
                                as="button"
                                onClick={() => navigate(ROUTES.CONTRIBUTE)}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                <span className="font-semibold tracking-wide text-sm whitespace-nowrap">Start Contributing</span>
                            </HoverBorderGradient>
                        </div>
                    </div>
                </div>

                {/* 5. Pull Requests (col-span-1) */}
                <div className="bento-card bento-col-span-1">
                    <div className="bento-bg-gradient-1" style={{ opacity: 0.5 }}></div>
                    <div className="bento-card-header">
                        <h2 className="bento-card-title">Pull Requests</h2>
                        <span className="dashboard-card-count">{pullRequests.length}</span>
                    </div>
                    <div className="bento-card-body">
                        {loading ? <CardSkeleton rows={2} /> : pullRequests.length === 0 ? (
                            <p className="dashboard-empty-small">No pull requests yet</p>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {pullRequests.map((pr, i) => {
                                    const match = pr.issue_title.match(/#(\d+)/);
                                    const issueNum = match ? match[1] : '';
                                    return (
                                        <div 
                                            key={i} 
                                            onClick={() => handleIssueClick(pr.repo_name, issueNum, 'pr')}
                                            className={`dashboard-issue-card pr-card ${issueNum ? 'clickable' : ''}`}
                                        >
                                            {navigatingTo === `pr-${pr.repo_name}#${issueNum}` && (
                                                <div className="dashboard-issue-loading">
                                                    <span className="spinner"></span>
                                                </div>
                                            )}
                                            <div className="dashboard-pr-row">
                                                <div>
                                                    <p className="dashboard-issue-repo">{pr.repo_name} • {pr.date_of_submission}</p>
                                                    <p className="dashboard-issue-title" title={pr.issue_title}>{pr.issue_title}</p>
                                                </div>
                                                <span className="dashboard-pr-status"
                                                    style={{
                                                        background: STATUS_COLORS[pr.status]?.bg || STATUS_COLORS[STATUS.UNKNOWN].bg,
                                                        color: STATUS_COLORS[pr.status]?.text || STATUS_COLORS[STATUS.UNKNOWN].text,
                                                        borderColor: STATUS_COLORS[pr.status]?.border || STATUS_COLORS[STATUS.UNKNOWN].border
                                                    }}>
                                                    {pr.status}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
