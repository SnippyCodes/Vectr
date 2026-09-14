import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { contributionAPI, repoAPI } from '../services/api';
import { ROUTES, FLOW_STEPS, SUPPORTED_LANGUAGES, buildIssuePath } from '../constants';
import { useToast } from '../components/Toast';
import NovaChat from '../components/NovaChat';
import { ListSkeleton } from '../components/Skeleton';
import { Button as StatefulButton } from '../components/ui/stateful-button';
import LanguageIcon from '../components/LanguageIcon';
import VectrBrand from '../components/VectrBrand';

export default function ContributePage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [step, setStep] = useState(FLOW_STEPS.SELECT_LANGUAGE);
    const [languages, setLanguages] = useState([]);
    const [selectedLang, setSelectedLang] = useState(null);
    const [orgs, setOrgs] = useState([]);
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [repos, setRepos] = useState([]);
    const [selectedRepo, setSelectedRepo] = useState(null);
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showLangModal, setShowLangModal] = useState(false);
    const [showOrgModal, setShowOrgModal] = useState(false);
    
    // Search states
    const [langSearch, setLangSearch] = useState('');
    const [orgSearch, setOrgSearch] = useState('');
    const [repoSort, setRepoSort] = useState('opportunity'); // 'opportunity' | 'stars'
    const [issueFilter, setIssueFilter] = useState('all'); // 'all' | 'beginner'

    useEffect(() => { initFlow(); }, []);

    const initFlow = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await contributionAPI.start(user.email);
            if (data.next_step === FLOW_STEPS.SELECT_LANGUAGE) {
                setLanguages(data.languages?.length ? data.languages : SUPPORTED_LANGUAGES);
                setShowLangModal(true);
                setStep(FLOW_STEPS.SELECT_LANGUAGE);
            } else {
                setOrgs(data.organizations || []);
                setShowOrgModal(true);
                setStep(FLOW_STEPS.SELECT_ORG);
            }
        } catch (err) {
            if (err.message && err.message.toLowerCase().includes('pat is missing')) {
                showToast('Please set your GitHub Personal Access Token to continue.', 'error');
                navigate(ROUTES.PAT);
                return;
            }
            // If backend not ready, show language selection with defaults
            setLanguages(SUPPORTED_LANGUAGES);
            setShowLangModal(true);
            setStep(FLOW_STEPS.SELECT_LANGUAGE);
        } finally {
            setLoading(false);
        }
    };

    const handleLangSelect = async (lang) => {
        setSelectedLang(lang);
        setError('');
        try {
            const data = await contributionAPI.start(user.email, lang === 'All' ? null : lang);
            setOrgs(data.organizations || []);
            
            // Wait for the button success animation to show before transitioning
            await new Promise(resolve => setTimeout(resolve, 600));
            
            setShowLangModal(false);
            setShowOrgModal(true);
            setStep(FLOW_STEPS.SELECT_ORG);
        } catch (err) {
            if (err.message && err.message.toLowerCase().includes('pat is missing')) {
                showToast('Please set your GitHub Personal Access Token to continue.', 'error');
                navigate(ROUTES.PAT);
                return;
            }
            setError(err.message || 'Failed to fetch organizations');
            throw err;
        }
    };

    const handleOrgSelect = async (org) => {
        setSelectedOrg(org);
        setError('');
        try {
            const data = await repoAPI.getOrgRepos(org.name, user.email, selectedLang === 'All' ? null : selectedLang);
            setRepos(data.repos || []);
            
            // Wait for the button success animation to show before transitioning
            await new Promise(resolve => setTimeout(resolve, 600));
            
            setShowOrgModal(false);
            setStep(FLOW_STEPS.BROWSE);
            showToast(`Browsing ${org.name} repos`, 'info');
        } catch (err) {
            setError(err.message || 'Failed to fetch repositories');
            setTimeout(() => {
                setShowOrgModal(false);
                setStep(FLOW_STEPS.BROWSE);
            }, 1500);
            throw err;
        }
    };

    const handleRepoClick = async (repo) => {
        setSelectedRepo(repo);
        setIssues([]);
        setLoading(true);
        try {
            const data = await repoAPI.getRepoIssues(selectedOrg.name, repo.name, user.email);
            setIssues(data.issues || []);
        } catch (err) {
            setError(err.message || 'Failed to fetch issues');
        } finally {
            setLoading(false);
        }
    };

    const handleFallbackOrgSearch = async (orgName) => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`https://api.github.com/users/${encodeURIComponent(orgName.trim())}`);
            if (!res.ok) {
                if (res.status === 404) throw new Error('Organization or user not found on GitHub');
                throw new Error('Failed to fetch from GitHub');
            }
            const data = await res.json();
            
            const newOrg = {
                name: data.login,
                description: data.description || '',
                avatar_url: data.avatar_url,
                url: data.html_url,
                language: selectedLang
            };
            
            setOrgs([newOrg, ...orgs]);
            setSelectedOrg(newOrg);
            setOrgSearch('');
        } catch (err) {
            setError(err.message || 'Error fetching from GitHub');
        } finally {
            setLoading(false);
        }
    };

    const handleIssueSelect = (issue) => {
        navigate(buildIssuePath(selectedOrg.name, selectedRepo.name, issue.number), {
            state: { issue, repoName: `${selectedOrg.name}/${selectedRepo.name}`, issues }
        });
    };

    const condensedIssues = issues.map(i => ({
        number: i.number, title: i.title, state: i.state, labels: i.labels
    }));

    const currentOrgName = selectedOrg?.name || 'Select an Organization';

    const filteredLanguages = (languages.length > 0 ? languages : SUPPORTED_LANGUAGES).filter(lang =>
        lang.toLowerCase().includes(langSearch.toLowerCase().trim())
    );

    const filteredOrgs = orgs.filter(org => 
        org.name.toLowerCase().includes(orgSearch.toLowerCase().trim())
    );

    return (
        <>
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-3.5 border-b border-white/[0.08] bg-[#0c0c0c]">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(ROUTES.DASHBOARD)} 
                        className="text-zinc-400 hover:text-zinc-100 p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors" 
                        aria-label="Back to dashboard"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <VectrBrand logoSize={38} showTag={false} onClick={() => navigate(ROUTES.DASHBOARD)} />
                    <span className="text-zinc-700 hidden sm:inline">|</span>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-base font-semibold text-zinc-200">{currentOrgName}</h1>
                        {selectedLang && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-[#22d3ee]/10 text-[#22d3ee] border border-[#22d3ee]/20">
                                <LanguageIcon name={selectedLang} size={14} />
                                {selectedLang}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex-1" />
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => { setShowLangModal(true); setSelectedOrg(null); setRepos([]); setIssues([]); }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white bg-[#141416] border border-white/[0.08] hover:border-white/[0.18] transition-all flex items-center gap-1.5"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                        </svg>
                        Change Filter
                    </button>
                </div>
            </header>

            {error && (
                <div className="mx-6 mt-4 p-3 rounded-lg text-sm bg-red-500/10 border border-red-500/30 text-red-400">
                    {error}
                </div>
            )}

            {/* 3-Column Cockpit Layout */}
            <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4" style={{ height: 'calc(100vh - 73px)' }}>
                
                {/* Repositories Column */}
                <div className="lg:col-span-3 bg-[#141416] border border-white/[0.08] rounded-xl p-4 flex flex-col min-h-0 overflow-hidden">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/[0.06]">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-semibold text-zinc-200">Repositories</h2>
                            <span className="text-[11px] font-mono text-zinc-500 bg-white/[0.05] px-1.5 py-0.2 rounded border border-white/[0.05]">
                                {repos.length}
                            </span>
                        </div>
                        {selectedOrg && (
                            <span className="text-[11px] font-mono text-zinc-500 truncate max-w-[120px]">
                                {selectedOrg.name}
                            </span>
                        )}
                    </div>

                    {loading && repos.length === 0 ? (
                        <ListSkeleton rows={4} />
                    ) : (
                        <div className="space-y-2 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                            {repos.length === 0 && (
                                <div className="text-center py-12 px-4">
                                    <div className="w-10 h-10 rounded-xl bg-[#1a1a1e] border border-white/[0.08] flex items-center justify-center mx-auto mb-3 text-zinc-500">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                        </svg>
                                    </div>
                                    <p className="text-zinc-400 text-xs font-medium">No repositories loaded</p>
                                    <p className="text-zinc-600 text-[11px] mt-1">Select an organization to browse its projects</p>
                                </div>
                            )}
                            {repos.map((repo, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => handleRepoClick(repo)}
                                    className={`w-full text-left p-3 rounded-lg border transition-all select-none ${
                                        selectedRepo?.name === repo.name 
                                            ? 'border-[#22d3ee] bg-[#1a1a1e] shadow-sm' 
                                            : 'border-white/[0.06] bg-[#121214] hover:border-white/[0.14] hover:bg-[#161619]'
                                    }`}
                                >
                                    <div className="flex items-start gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-[#18181c] border border-white/[0.08] flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <LanguageIcon name={repo.language} size={15} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-zinc-100 text-xs font-semibold truncate">{repo.name}</p>
                                            <p className="text-zinc-400 text-[11px] mt-0.5 line-clamp-1">{repo.description || 'No description provided'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 mt-2 text-[11px] text-zinc-400 font-mono">
                                        {repo.language && (
                                            <span className="flex items-center gap-1 text-zinc-300">
                                                <LanguageIcon name={repo.language} size={11} />
                                                {repo.language}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-0.5">⭐ {repo.stars ?? 0}</span>
                                        <span className="flex items-center gap-0.5">🔧 {repo.open_issues_count ?? 0}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Issues Column */}
                <div className="lg:col-span-5 bg-[#141416] border border-white/[0.08] rounded-xl p-4 flex flex-col min-h-0 overflow-hidden">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/[0.06]">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-semibold text-zinc-200">Issues</h2>
                            <span className="text-[11px] font-mono text-zinc-500 bg-white/[0.05] px-1.5 py-0.2 rounded border border-white/[0.05]">
                                {issues.length}
                            </span>
                        </div>
                        {selectedRepo && (
                            <span className="text-[11px] font-mono text-zinc-400 truncate max-w-[180px]">
                                {selectedRepo.name}
                            </span>
                        )}
                    </div>

                    {loading && selectedRepo && issues.length === 0 ? (
                        <ListSkeleton rows={5} />
                    ) : (
                        <div className="space-y-2.5 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                            {issues.length === 0 && !loading && (
                                <div className="text-center py-14 px-4">
                                    <div className="w-10 h-10 rounded-xl bg-[#1a1a1e] border border-white/[0.08] flex items-center justify-center mx-auto mb-3 text-zinc-500">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="12" y1="8" x2="12" y2="12" />
                                            <line x1="12" y1="16" x2="12.01" y2="16" />
                                        </svg>
                                    </div>
                                    <p className="text-zinc-400 text-xs font-medium">
                                        {selectedRepo ? 'No open issues found in this repository' : 'Select a repository to explore open issues'}
                                    </p>
                                </div>
                            )}
                            {issues.map((issue, i) => (
                                <div 
                                    key={i} 
                                    className="p-3.5 rounded-lg border border-white/[0.06] bg-[#121214] hover:border-[#22d3ee]/40 hover:bg-[#161619] transition-all cursor-pointer group select-none"
                                    onClick={() => handleIssueSelect(issue)}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-zinc-200 text-xs font-medium group-hover:text-[#22d3ee] transition-colors line-clamp-2">
                                            <span className="font-mono text-zinc-500 mr-1.5">#{issue.number}</span>
                                            {issue.title}
                                        </p>
                                        <span className="text-[#22d3ee] text-xs opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                            View →
                                        </span>
                                    </div>
                                    <p className="text-zinc-400 text-[11px] mt-1.5 line-clamp-2 leading-relaxed">
                                        {issue.body || 'No description provided.'}
                                    </p>
                                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/[0.04]">
                                        <div className="flex gap-1.5 flex-wrap">
                                            {(issue.labels || []).slice(0, 3).map((l, j) => (
                                                <span key={j} className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1a1a1e] text-zinc-300 border border-white/[0.06]">
                                                    {typeof l === 'string' ? l : l.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Nova AI Assist Column */}
                <div className="lg:col-span-4 min-h-0 h-full">
                    <NovaChat
                        repoName={selectedRepo ? `${selectedOrg?.name}/${selectedRepo.name}` : ''}
                        issuesContext={condensedIssues}
                    />
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                LANGUAGE SELECTION MODAL — Pure Obsidian Stealth
                ═══════════════════════════════════════════════════════════════════ */}
            {showLangModal && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4" 
                    style={{ background: 'rgba(0, 0, 0, 0.82)', backdropFilter: 'blur(10px)' }}
                >
                    <div 
                        className="bg-[#141416] border border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-4xl p-6 md:p-8 m-4 slide-up flex flex-col max-h-[88vh] select-none" 
                        role="dialog" 
                        aria-label="Select Language"
                    >
                        {/* Modal Header */}
                        <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/[0.06]">
                            <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium uppercase bg-[#22d3ee]/10 text-[#22d3ee] border border-[#22d3ee]/25">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#22d3ee] animate-pulse"></span>
                                        Filter Workspace
                                    </span>
                                    <span className="text-xs font-mono text-zinc-500">Step 1 of 2</span>
                                </div>
                                <h3 className="text-xl font-bold text-zinc-100 tracking-tight">Select Language</h3>
                                <p className="text-xs text-zinc-400 mt-0.5">Choose a language to filter relevant organizations and open-source repositories</p>
                            </div>
                            <button 
                                onClick={() => { setShowLangModal(false); navigate(ROUTES.DASHBOARD); }}
                                className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors" 
                                title="Close modal"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="my-4 relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                            </span>
                            <input 
                                type="text"
                                placeholder="Search languages (e.g. Python, TypeScript, Rust, Go)..."
                                value={langSearch}
                                onChange={(e) => setLangSearch(e.target.value)}
                                className="modal-search-input pl-10 pr-10"
                                autoFocus
                            />
                            {langSearch && (
                                <button 
                                    onClick={() => setLangSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 text-xs p-1"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Language Cards Responsive Grid */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-0 mb-5">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                                {/* All Languages Card */}
                                <StatefulButton 
                                    onClick={() => handleLangSelect('All')}
                                    className={`modal-lang-card ${selectedLang === 'All' ? 'modal-lang-selected' : ''}`}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-[#18181c] border border-white/[0.08] flex items-center justify-center p-1.5 flex-shrink-0">
                                        <LanguageIcon name="All" size={20} />
                                    </div>
                                    <span className="text-xs font-semibold text-zinc-100 truncate flex-1 text-left">All Languages</span>
                                    {selectedLang === 'All' && (
                                        <span className="w-4 h-4 rounded-full bg-[#22d3ee] flex items-center justify-center text-[#0c0c0c] flex-shrink-0">
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </span>
                                    )}
                                </StatefulButton>

                                {filteredLanguages.map((lang, i) => (
                                    <StatefulButton 
                                        key={i} 
                                        onClick={() => handleLangSelect(lang)}
                                        className={`modal-lang-card ${selectedLang === lang ? 'modal-lang-selected' : ''}`}
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-[#18181c] border border-white/[0.08] flex items-center justify-center p-1.5 flex-shrink-0">
                                            <LanguageIcon name={lang} size={20} />
                                        </div>
                                        <span className="text-xs font-medium text-zinc-200 truncate flex-1 text-left">{lang}</span>
                                        {selectedLang === lang && (
                                            <span className="w-4 h-4 rounded-full bg-[#22d3ee] flex items-center justify-center text-[#0c0c0c] flex-shrink-0">
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            </span>
                                        )}
                                    </StatefulButton>
                                ))}
                            </div>

                            {filteredLanguages.length === 0 && (
                                <div className="text-center py-10">
                                    <p className="text-zinc-500 text-xs">No language matching "{langSearch}"</p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                            <span className="text-[11px] font-mono text-zinc-500">
                                {filteredLanguages.length} ecosystems available
                            </span>
                            <button 
                                onClick={() => { setShowLangModal(false); navigate(ROUTES.DASHBOARD); }} 
                                className="modal-btn-cancel"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                ORGANIZATION SELECTION MODAL — Pure Obsidian Stealth
                ═══════════════════════════════════════════════════════════════════ */}
            {showOrgModal && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4" 
                    style={{ background: 'rgba(0, 0, 0, 0.82)', backdropFilter: 'blur(10px)' }}
                >
                    <div 
                        className="bg-[#141416] border border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-3xl p-6 md:p-8 m-4 slide-up flex flex-col max-h-[88vh] select-none" 
                        role="dialog" 
                        aria-label="Select Organization"
                    >
                        {/* Modal Header */}
                        <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/[0.06]">
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => { setShowOrgModal(false); setShowLangModal(true); }} 
                                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05] transition-colors" 
                                    aria-label="Back to languages"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M19 12H5M12 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium uppercase bg-[#22d3ee]/10 text-[#22d3ee] border border-[#22d3ee]/25">
                                            Step 2 of 2
                                        </span>
                                        {selectedLang && (
                                            <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
                                                <LanguageIcon name={selectedLang} size={12} />
                                                {selectedLang}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold text-zinc-100 tracking-tight">Select Organisation</h3>
                                    <p className="text-xs text-zinc-400 mt-0.5">Choose an open-source engineering team to explore repositories</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => { setShowOrgModal(false); navigate(ROUTES.DASHBOARD); }}
                                className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors" 
                                title="Close modal"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="my-4 relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                            </span>
                            <input 
                                type="text"
                                placeholder="Search organizations (or type a GitHub username)..."
                                value={orgSearch}
                                onChange={(e) => setOrgSearch(e.target.value)}
                                className="modal-search-input pl-10 pr-10"
                                autoFocus
                            />
                            {orgSearch && (
                                <button 
                                    onClick={() => setOrgSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 text-xs p-1"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Org List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2.5 mb-5 pr-1 min-h-0">
                            {filteredOrgs.length === 0 ? (
                                orgSearch.trim() !== '' ? (
                                    <div className="text-center py-8 px-4 bg-[#161619] border border-white/[0.06] rounded-xl">
                                        <p className="text-zinc-300 text-xs mb-3">Organization '{orgSearch}' not found in cached list.</p>
                                        <button 
                                            onClick={() => handleFallbackOrgSearch(orgSearch)}
                                            className="modal-btn-next"
                                            disabled={loading}
                                        >
                                            {loading ? 'Fetching from GitHub...' : `Fetch '${orgSearch}' from GitHub`}
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-zinc-500 text-center py-10 text-xs">No organizations found for the selected criteria</p>
                                )
                            ) : (
                                filteredOrgs.map((org, i) => (
                                    <StatefulButton 
                                        key={i} 
                                        onClick={() => handleOrgSelect(org)}
                                        className={`modal-org-card w-full text-left justify-start !p-3 ${
                                            selectedOrg?.name === org.name ? 'modal-org-selected' : ''
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 w-full text-left">
                                            <div className="relative w-9 h-9 flex-shrink-0">
                                                <img 
                                                    src={org.avatar_url || `https://github.com/${org.name}.png?size=64`} 
                                                    alt={org.name} 
                                                    className="w-9 h-9 rounded-lg border border-white/[0.08] bg-[#1a1a1e] object-cover" 
                                                    loading="lazy"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        if (e.currentTarget.nextSibling) {
                                                            e.currentTarget.nextSibling.style.display = 'flex';
                                                        }
                                                    }}
                                                />
                                                <div className="w-9 h-9 rounded-lg bg-[#1a1a1e] border border-white/[0.08] hidden items-center justify-center text-xs font-mono font-bold text-zinc-300">
                                                    {org.name.slice(0, 2).toUpperCase()}
                                                </div>
                                            </div>
                                            <div className="flex flex-col flex-1 overflow-hidden items-start">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-zinc-100 font-semibold text-xs">{org.name}</span>
                                                    <span className="text-[#22d3ee] text-xs" title="Verified GitHub Entity">✓</span>
                                                </div>
                                                <span className="text-zinc-400 text-[11px] truncate w-full text-left mt-0.5">
                                                    {org.description || 'Open source engineering organization'}
                                                </span>
                                            </div>
                                            {(org.language || selectedLang) && (
                                                <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[11px] text-zinc-300 font-mono flex-shrink-0">
                                                    <LanguageIcon name={org.language || selectedLang} size={13} />
                                                    <span>{org.language || selectedLang}</span>
                                                </span>
                                            )}
                                        </div>
                                    </StatefulButton>
                                ))
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                            <button 
                                onClick={() => { setShowOrgModal(false); setShowLangModal(true); }} 
                                className="modal-btn-cancel flex items-center gap-1.5"
                            >
                                ← Back to Languages
                            </button>
                            <span className="text-[11px] font-mono text-zinc-500">
                                {filteredOrgs.length} organizations
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading Overlay */}
            {loading && step !== FLOW_STEPS.BROWSE && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="text-center p-6 rounded-2xl bg-[#141416] border border-white/[0.08] shadow-2xl">
                        <div className="mx-auto w-8 h-8 border-2 border-[#22d3ee] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-zinc-400 mt-3 animate-pulse text-xs font-mono">Syncing repositories...</p>
                    </div>
                </div>
            )}
        </>
    );
}
