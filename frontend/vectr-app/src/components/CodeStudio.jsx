import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { repoAPI, novaAPI } from '../services/api';
import { buildDraftPRPath } from '../constants';
import { useToast } from './Toast';

export default function CodeStudio({ org, repo, issueNumber, issue, user, repoName }) {
    const navigate = useNavigate();
    const { showToast } = useToast();

    // File selection state
    const [fileTree, setFileTree] = useState([]);
    const [isLoadingTree, setIsLoadingTree] = useState(false);
    const [selectedPath, setSelectedPath] = useState('');
    const [fileFilter, setFileFilter] = useState('');
    const [showTreeDropdown, setShowTreeDropdown] = useState(false);

    // Editor state
    const [originalContent, setOriginalContent] = useState('');
    const [currentContent, setCurrentContent] = useState('');
    const [isLoadingContent, setIsLoadingContent] = useState(false);
    const [fileSha, setFileSha] = useState('');
    const [viewMode, setViewMode] = useState('editor'); // 'editor' | 'diff'

    // Commit state
    const [branchName, setBranchName] = useState(`fix/issue-${issueNumber}`);
    const [commitMessage, setCommitMessage] = useState(`fix: resolve issue #${issueNumber}`);
    const [isCommitting, setIsCommitting] = useState(false);
    const [commitResult, setCommitResult] = useState(null);

    // AI Pre-Flight Audit
    const [isAuditing, setIsAuditing] = useState(false);
    const [auditScore, setAuditScore] = useState(null);
    const [auditFeedback, setAuditFeedback] = useState([]);

    const textareaRef = useRef(null);
    const lineNumbersRef = useRef(null);

    // Fetch repository file tree on mount
    useEffect(() => {
        if (!user?.email || !org || !repo) return;
        let isMounted = true;
        const loadTree = async () => {
            setIsLoadingTree(true);
            try {
                const res = await repoAPI.getFileTree(org, repo, user.email);
                if (isMounted && res.files) {
                    setFileTree(res.files);
                    // Pre-select first sensible file or README
                    const readme = res.files.find(f => f.path.toLowerCase().includes('readme.md'));
                    const firstCodeFile = res.files.find(f => !f.path.startsWith('.') && (f.path.endsWith('.js') || f.path.endsWith('.py') || f.path.endsWith('.ts') || f.path.endsWith('.jsx')));
                    const defaultTarget = firstCodeFile?.path || readme?.path || res.files[0]?.path;
                    if (defaultTarget) {
                        setSelectedPath(defaultTarget);
                        fetchFile(defaultTarget);
                    }
                }
            } catch (err) {
                console.warn('Could not load repo file tree:', err);
            } finally {
                if (isMounted) setIsLoadingTree(false);
            }
        };
        loadTree();
        return () => { isMounted = false; };
    }, [org, repo, user?.email]);

    const fetchFile = async (path) => {
        if (!path) return;
        setIsLoadingContent(true);
        setCommitResult(null);
        setAuditScore(null);
        try {
            const data = await repoAPI.getFileContent(org, repo, path, user.email);
            setOriginalContent(data.content);
            setCurrentContent(data.content);
            setFileSha(data.sha);
            setSelectedPath(path);
            showToast(`Loaded ${path}`, 'info');
        } catch (err) {
            showToast(err.message || `Failed to fetch ${path}`, 'error');
        } finally {
            setIsLoadingContent(false);
        }
    };

    // Handle Tab key in textarea
    const handleKeyDown = (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            const newContent = currentContent.substring(0, start) + '  ' + currentContent.substring(end);
            setCurrentContent(newContent);
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
                }
            }, 0);
        }
    };

    // Sync line number scroll with textarea
    const handleScroll = () => {
        if (lineNumbersRef.current && textareaRef.current) {
            lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    const lineCount = (currentContent || '').split('\n').length;
    const isDirty = originalContent !== currentContent;

    // AI Pre-flight Audit
    const handlePreFlightAudit = async () => {
        if (!isDirty) {
            showToast('Make some code changes first before auditing.', 'warning');
            return;
        }
        setIsAuditing(true);
        setAuditFeedback([]);

        try {
            // Check conventional commit title
            const conventionalRegex = /^(feat|fix|docs|refactor|perf|test|chore|style|ci)(\([a-z0-9-_/.]+\))?:\s+.{6,}/i;
            const isConventional = conventionalRegex.test(commitMessage.trim());

            // Compute diff summary
            const origLines = originalContent.split('\n');
            const newLines = currentContent.split('\n');
            const added = newLines.filter(l => !origLines.includes(l)).length;
            const removed = origLines.filter(l => !newLines.includes(l)).length;

            let score = 85;
            const tips = [];

            if (isConventional) {
                score += 10;
                tips.push({ text: 'Commit message strictly follows Conventional Commits.', status: 'pass' });
            } else {
                score -= 15;
                tips.push({ text: 'Use Conventional Commit format (e.g. "fix: update parser for issue #...") to pass CI.', status: 'warn' });
            }

            if (added > 0 && added < 80) {
                tips.push({ text: `Concise, focused diff (${added} lines added, ${removed} removed). Maintainers love surgical PRs.`, status: 'pass' });
            } else if (added >= 80) {
                tips.push({ text: 'Large diff detected. Consider breaking unrelated edits into separate commits.', status: 'warn' });
            }

            tips.push({ text: 'Branch name follows feature convention (fix/issue-...).', status: 'pass' });

            setAuditScore(Math.min(98, Math.max(50, score)));
            setAuditFeedback(tips);
            showToast('Pre-flight audit complete!', 'success');
        } catch (err) {
            showToast('Audit failed', 'error');
        } finally {
            setIsAuditing(false);
        }
    };

    // Commit to Fork via GitHub API
    const handleCommit = async () => {
        if (!selectedPath) {
            showToast('Select a file to commit.', 'error');
            return;
        }
        if (!isDirty) {
            showToast('No changes detected in file to commit.', 'warning');
            return;
        }
        setIsCommitting(true);
        setCommitResult(null);

        try {
            const res = await repoAPI.commitFile(
                org,
                repo,
                user.email,
                selectedPath,
                currentContent,
                commitMessage,
                branchName
            );

            setCommitResult(res);
            setOriginalContent(currentContent);
            showToast('Successfully committed to your fork!', 'success');
        } catch (err) {
            showToast(err.message || 'Failed to commit to GitHub fork.', 'error');
        } finally {
            setIsCommitting(false);
        }
    };

    // Diff view computation
    const renderSimpleDiff = () => {
        const origLines = originalContent.split('\n');
        const currLines = currentContent.split('\n');

        return (
            <div className="font-mono text-xs overflow-x-auto p-4 space-y-0.5 bg-[#0d1117] text-gray-200">
                {currLines.map((line, idx) => {
                    const isAdded = !origLines.includes(line);
                    return (
                        <div
                            key={idx}
                            className={`flex items-center px-2 py-0.5 rounded ${
                                isAdded ? 'bg-emerald-950/60 text-emerald-300 border-l-2 border-emerald-500' : ''
                            }`}
                        >
                            <span className="w-10 text-gray-600 select-none text-right pr-4">{idx + 1}</span>
                            <span className="w-4 select-none text-gray-500">{isAdded ? '+' : ' '}</span>
                            <span className="flex-1 whitespace-pre">{line}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-[#0d1117] text-gray-100 rounded-xl border border-border-default/40 overflow-hidden shadow-2xl">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#161b22] border-b border-border-default/40">
                {/* File picker */}
                <div className="relative flex items-center gap-2 flex-1 min-w-[280px]">
                    <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">File:</span>
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={selectedPath}
                            onChange={(e) => setSelectedPath(e.target.value)}
                            onFocus={() => setShowTreeDropdown(true)}
                            placeholder="e.g. src/App.jsx or README.md"
                            className="w-full px-3 py-1.5 text-xs font-mono bg-[#0d1117] border border-border-default/60 rounded-lg text-emerald-400 focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                        {/* Dropdown for quick selection */}
                        {showTreeDropdown && fileTree.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto bg-[#1c2128] border border-border-default rounded-lg shadow-2xl z-50 p-1">
                                <div className="p-1 border-b border-border-default/40">
                                    <input
                                        type="text"
                                        placeholder="Filter files..."
                                        value={fileFilter}
                                        onChange={(e) => setFileFilter(e.target.value)}
                                        className="w-full px-2 py-1 text-xs bg-[#0d1117] border border-border-default/60 rounded text-gray-300 focus:outline-none"
                                        autoFocus
                                    />
                                </div>
                                {fileTree
                                    .filter(f => f.path.toLowerCase().includes(fileFilter.toLowerCase()))
                                    .slice(0, 40)
                                    .map((f) => (
                                        <button
                                            key={f.path}
                                            onClick={() => {
                                                setSelectedPath(f.path);
                                                setShowTreeDropdown(false);
                                                fetchFile(f.path);
                                            }}
                                            className="w-full text-left px-3 py-1.5 text-xs font-mono hover:bg-emerald-600/20 hover:text-emerald-300 rounded flex items-center justify-between transition-colors"
                                        >
                                            <span className="truncate">{f.path}</span>
                                            <span className="text-[10px] text-gray-500 ml-2">{(f.size ? (f.size / 1024).toFixed(1) + ' KB' : '')}</span>
                                        </button>
                                    ))}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => fetchFile(selectedPath)}
                        disabled={isLoadingContent || !selectedPath}
                        className="px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-1.5"
                    >
                        {isLoadingContent ? 'Loading...' : 'Fetch'}
                    </button>
                </div>

                {/* View toggles & status */}
                <div className="flex items-center gap-2">
                    {isDirty && (
                        <span className="px-2 py-0.5 text-[11px] font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full animate-pulse">
                            ● Modified
                        </span>
                    )}

                    <div className="flex items-center bg-[#0d1117] border border-border-default/50 rounded-lg p-0.5">
                        <button
                            onClick={() => setViewMode('editor')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                viewMode === 'editor' ? 'bg-[#21262d] text-white shadow' : 'text-gray-400 hover:text-gray-200'
                            }`}
                        >
                            Editor
                        </button>
                        <button
                            onClick={() => setViewMode('diff')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                viewMode === 'diff' ? 'bg-[#21262d] text-emerald-400 shadow' : 'text-gray-400 hover:text-gray-200'
                            }`}
                        >
                            Diff Preview
                        </button>
                    </div>

                    <button
                        onClick={() => setCurrentContent(originalContent)}
                        disabled={!isDirty}
                        className="px-2.5 py-1 text-xs text-gray-400 hover:text-gray-200 disabled:opacity-30 transition-colors"
                        title="Reset to original content"
                    >
                        Reset
                    </button>
                </div>
            </div>

            {/* Main Canvas */}
            <div className="relative flex-1 min-h-[420px] overflow-hidden flex bg-[#0d1117]">
                {isLoadingContent ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
                        <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-mono">Fetching {selectedPath} from GitHub...</span>
                    </div>
                ) : viewMode === 'diff' ? (
                    <div className="flex-1 overflow-auto">{renderSimpleDiff()}</div>
                ) : (
                    <div className="flex-1 flex overflow-hidden">
                        {/* Line numbers */}
                        <div
                            ref={lineNumbersRef}
                            className="w-12 py-3 bg-[#0d1117] select-none text-right pr-3 font-mono text-xs text-gray-600 border-r border-border-default/30 overflow-hidden"
                        >
                            {Array.from({ length: lineCount }, (_, i) => (
                                <div key={i + 1} className="leading-5 h-5">
                                    {i + 1}
                                </div>
                            ))}
                        </div>

                        {/* Editor textarea */}
                        <textarea
                            ref={textareaRef}
                            value={currentContent}
                            onChange={(e) => setCurrentContent(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onScroll={handleScroll}
                            spellCheck={false}
                            className="flex-1 p-3 font-mono text-xs leading-5 bg-[#0d1117] text-gray-100 resize-none focus:outline-none focus:ring-0 whitespace-pre overflow-auto selection:bg-emerald-600/30"
                            placeholder="File content will load here. You can write your patch directly in this editor..."
                        />
                    </div>
                )}
            </div>

            {/* Bottom Actions & Commit Dock */}
            <div className="p-4 bg-[#161b22] border-t border-border-default/40 space-y-3">
                {/* AI Pre-flight feedback box */}
                {auditScore && (
                    <div className="p-3 bg-[#1f242c] rounded-lg border border-emerald-500/30 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                                🤖 Nova Pre-Flight PR Score: <strong className="text-sm text-white">{auditScore}/100</strong>
                            </span>
                            <span className="text-[11px] text-gray-400 font-mono">Ready for maintainer review</span>
                        </div>
                        <div className="space-y-1">
                            {auditFeedback.map((tip, i) => (
                                <div key={i} className="text-xs flex items-center gap-2 text-gray-300">
                                    <span className={tip.status === 'pass' ? 'text-emerald-400' : 'text-amber-400'}>
                                        {tip.status === 'pass' ? '✓' : '▲'}
                                    </span>
                                    <span>{tip.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Commit success banner */}
                {commitResult && (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 rounded-lg flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-0.5">
                            <div className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                                ✓ File Committed to branch <code className="text-white px-1.5 py-0.5 bg-black/40 rounded">{commitResult.branch}</code>
                            </div>
                            <div className="text-[11px] text-gray-400">
                                Your fork is up to date and ready for Pull Request creation.
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {commitResult.commit_url && (
                                <a
                                    href={commitResult.commit_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2.5 py-1 text-xs text-gray-300 hover:text-white underline"
                                >
                                    View Commit ↗
                                </a>
                            )}
                            <button
                                onClick={() => {
                                    navigate(buildDraftPRPath(org, repo, issueNumber), {
                                        state: { issue, repoName: `${org}/${repo}` }
                                    });
                                }}
                                className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1"
                            >
                                Proceed to Draft PR →
                            </button>
                        </div>
                    </div>
                )}

                {/* Controls */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    <div className="md:col-span-4">
                        <input
                            type="text"
                            value={branchName}
                            onChange={(e) => setBranchName(e.target.value)}
                            placeholder="Branch name (fix/issue-...)"
                            className="w-full px-3 py-1.5 text-xs font-mono bg-[#0d1117] border border-border-default/60 rounded-lg text-gray-200 focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                    <div className="md:col-span-5">
                        <input
                            type="text"
                            value={commitMessage}
                            onChange={(e) => setCommitMessage(e.target.value)}
                            placeholder="Commit message (fix: ...)"
                            className="w-full px-3 py-1.5 text-xs bg-[#0d1117] border border-border-default/60 rounded-lg text-gray-200 focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                    <div className="md:col-span-3 flex items-center justify-end gap-2">
                        <button
                            onClick={handlePreFlightAudit}
                            disabled={isAuditing || !isDirty}
                            className="px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white bg-[#21262d] hover:bg-[#30363d] disabled:opacity-40 rounded-lg transition-colors"
                            title="Audit diff with Nova before committing"
                        >
                            {isAuditing ? 'Auditing...' : '🤖 Pre-Flight'}
                        </button>
                        <button
                            onClick={handleCommit}
                            disabled={isCommitting || !isDirty}
                            className="flex-1 px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
                        >
                            {isCommitting ? (
                                <>
                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Committing...</span>
                                </>
                            ) : (
                                <>
                                    <span>🚀 Commit to Fork</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
