import React, { useMemo, useState } from 'react';

/**
 * PRReadinessGrader — Evaluates pull request quality against real-world
 * open source maintainer standards (Conventional Commits, issue linking,
 * testing proof, and diff hygiene).
 */
export default function PRReadinessGrader({
    prTitle = '',
    prBody = '',
    codeDiff = '',
    issueNumber = '',
    repoName = '',
    onApplyPolish,
    disabled = false
}) {
    const [isPolishing, setIsPolishing] = useState(false);
    const [showBreakdown, setShowBreakdown] = useState(false);

    // ─── Real-time criteria evaluations ─────────────────────────────
    const analysis = useMemo(() => {
        let score = 0;
        const checks = [];

        // 1. Issue Linking (25 pts)
        const issueRegex = new RegExp(`(?:fixes|closes|resolves)\\s+#${issueNumber || '\\d+'}`, 'i');
        const hasIssueLink = issueRegex.test(prBody) || issueRegex.test(prTitle);
        if (hasIssueLink) {
            score += 25;
            checks.push({
                id: 'issue-link',
                label: `Properly links issue #${issueNumber || 'target'}`,
                status: 'pass',
                points: 25,
                hint: 'Open-source maintainers require closing keywords (Fixes #...) so GitHub automatically closes issues upon merge.'
            });
        } else {
            checks.push({
                id: 'issue-link',
                label: `Missing issue closing tag (e.g. Fixes #${issueNumber || '123'})`,
                status: 'fail',
                points: 0,
                hint: 'Add "Fixes #' + (issueNumber || '123') + '" in your PR description to link the issue.'
            });
        }

        // 2. Conventional Commit Title (25 pts)
        const conventionalRegex = /^(feat|fix|docs|refactor|perf|test|chore|style|ci)(\([a-z0-9-_/.]+\))?:\s+.{6,}/i;
        const isConventional = conventionalRegex.test(prTitle.trim());
        if (isConventional) {
            score += 25;
            checks.push({
                id: 'title-spec',
                label: 'Follows Conventional Commits standard',
                status: 'pass',
                points: 25,
                hint: 'Clean Conventional Commit format (feat:, fix:, docs:) makes automated changelog generation work.'
            });
        } else {
            const hasPrefix = /^(feat|fix|docs|refactor|chore):/i.test(prTitle.trim());
            const points = hasPrefix ? 10 : 0;
            score += points;
            checks.push({
                id: 'title-spec',
                label: 'Title does not follow Conventional Commits format',
                status: points > 0 ? 'warn' : 'fail',
                points,
                hint: 'Use standard prefix like "fix: resolve memory leak in parser" or "feat: add oauth callback".'
            });
        }

        // 3. Testing & Verification Proof (25 pts)
        const hasChecklist = /-\s*\[[ x]\]/i.test(prBody);
        const mentionsTests = /(test|verified|reproduced|checked|unit test|pytest|npm test|spec)/i.test(prBody);
        if (hasChecklist && mentionsTests) {
            score += 25;
            checks.push({
                id: 'testing-proof',
                label: 'Includes test checklist and verification steps',
                status: 'pass',
                points: 25,
                hint: 'Reviewers prioritize PRs that prove tests have run and passed.'
            });
        } else if (hasChecklist || mentionsTests) {
            score += 12;
            checks.push({
                id: 'testing-proof',
                label: 'Partial testing notes provided',
                status: 'warn',
                points: 12,
                hint: 'Add markdown checkboxes (`- [x] Unit tests pass`) to confirm full verification.'
            });
        } else {
            checks.push({
                id: 'testing-proof',
                label: 'No testing checklist or proof detected',
                status: 'fail',
                points: 0,
                hint: 'Maintainers often reject PRs lacking verification proof or test cases.'
            });
        }

        // 4. Description Detail & Diff Hygiene (25 pts)
        const bodyLength = prBody.trim().length;
        const hasSensitiveTerms = /(api[_-]?key|secret|password|token|\.env|node_modules)/i.test(codeDiff + prBody);
        
        if (hasSensitiveTerms) {
            checks.push({
                id: 'diff-hygiene',
                label: 'Potential sensitive data or unwanted artifacts flagged',
                status: 'fail',
                points: 0,
                hint: 'Ensure secrets, .env files, or temporary artifacts are excluded from the pull request.'
            });
        } else if (bodyLength > 120 && prBody.includes('##')) {
            score += 25;
            checks.push({
                id: 'diff-hygiene',
                label: 'Thorough description with structured markdown headers',
                status: 'pass',
                points: 25,
                hint: 'Well-structured descriptions reduce reviewer friction and speed up approvals.'
            });
        } else if (bodyLength > 40) {
            score += 15;
            checks.push({
                id: 'diff-hygiene',
                label: 'Basic description provided (could be more detailed)',
                status: 'warn',
                points: 15,
                hint: 'Break down your changes with "## Description" and "## Changes Made" headers.'
            });
        } else {
            checks.push({
                id: 'diff-hygiene',
                label: 'Description is too brief or empty',
                status: 'fail',
                points: 0,
                hint: 'Provide context on WHY the change was made, not just WHAT was changed.'
            });
        }

        return { score: Math.min(100, Math.max(0, score)), checks };
    }, [prTitle, prBody, codeDiff, issueNumber]);

    // Color & status badge resolution
    const getGradeInfo = (score) => {
        if (score >= 85) return {
            color: '#10b981',
            bg: 'rgba(16, 185, 129, 0.12)',
            border: 'rgba(16, 185, 129, 0.3)',
            label: 'Ready to Merge',
            desc: 'High maintainer confidence. Exceeds standard open-source review criteria.'
        };
        if (score >= 60) return {
            color: '#f59e0b',
            bg: 'rgba(245, 158, 11, 0.12)',
            border: 'rgba(245, 158, 11, 0.3)',
            label: 'Needs Polish',
            desc: 'Solid foundation, but missing key maintainer checklists or commit conventions.'
        };
        return {
            color: '#ef4444',
            bg: 'rgba(239, 68, 68, 0.12)',
            border: 'rgba(239, 68, 68, 0.3)',
            label: 'Changes Required',
            desc: 'PR is likely to be rejected or stalled by maintainers in its current state.'
        };
    };

    const grade = getGradeInfo(analysis.score);

    // ─── 1-Click AI Polish Generator ─────────────────────────────────
    const handlePolish = () => {
        if (!onApplyPolish || disabled) return;
        setIsPolishing(true);

        setTimeout(() => {
            // Clean title extraction
            let cleanSummary = prTitle
                .replace(/^Fix\s*#\d+:\s*/i, '')
                .replace(/^(feat|fix|docs|refactor|chore):\s*/i, '')
                .trim() || 'resolve contribution issue';

            // Conventional title
            const polishedTitle = `fix: ${cleanSummary.toLowerCase()}`;

            // Gold-standard PR Body
            const polishedBody = `## Summary of Changes
Addresses and resolves the problem reported in **Issue #${issueNumber || '1'}**. 

### Motivation & Context
This PR updates the implementation to ensure proper error handling and prevent unexpected regressions during runtime execution.

---

## Key Modifications
- Corrected logic handling in target files
- Aligned function signatures and schema expectations
- Cleaned up unneeded debug statements and temporary artifacts

---

## Testing & Verification
- [x] Local unit tests passed cleanly
- [x] Manual reproduction and end-to-end flow verified
- [x] No sensitive environment variables or uncommitted secrets included

---

## Related Issue
Fixes #${issueNumber || '1'}
Closes #${issueNumber || '1'}`;

            onApplyPolish(polishedTitle, polishedBody);
            setIsPolishing(false);
        }, 300);
    };

    return (
        <div className="rounded-xl border p-4 mb-4 transition-all duration-300"
             style={{
                 background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)',
                 borderColor: grade.border,
                 boxShadow: `0 8px 24px -6px ${grade.bg}`
             }}>
            
            {/* Header row: Score, Grade Badge, AI Polish Action */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    {/* Radial/circular score indicator */}
                    <div className="relative flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0"
                         style={{ background: grade.bg, border: `1.5px solid ${grade.border}` }}>
                        <span className="text-base font-bold font-mono tracking-tight" style={{ color: grade.color }}>
                            {analysis.score}
                        </span>
                    </div>

                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                                PR Readiness Score
                            </h4>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                                  style={{ background: grade.bg, color: grade.color, border: `1px solid ${grade.border}` }}>
                                {grade.label}
                            </span>
                        </div>
                        <p className="text-[11px] text-text-secondary mt-0.5 max-w-sm">
                            {grade.desc}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setShowBreakdown(!showBreakdown)}
                        className="text-xs px-2.5 py-1.5 rounded-lg border border-border-default/60 text-text-muted hover:text-text-primary hover:border-text-muted transition-colors"
                    >
                        {showBreakdown ? 'Hide Criteria' : 'View Breakdown'}
                    </button>

                    <button
                        type="button"
                        onClick={handlePolish}
                        disabled={disabled || isPolishing || analysis.score === 100}
                        className="text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                        style={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                            color: '#ffffff',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                        title="Rewrite title and description to match high-standard open source maintainer guidelines"
                    >
                        {isPolishing ? (
                            <span className="inline-block animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                            </svg>
                        )}
                        <span>AI Polish PR</span>
                    </button>
                </div>
            </div>

            {/* Score Progress Bar */}
            <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden mt-3 border border-white/5">
                <div 
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                        width: `${analysis.score}%`,
                        backgroundColor: grade.color,
                        boxShadow: `0 0 8px ${grade.color}`
                    }}
                />
            </div>

            {/* Expandable Criteria Breakdown */}
            {showBreakdown && (
                <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {analysis.checks.map((check) => (
                        <div key={check.id} className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5 flex items-start gap-2.5">
                            <span className="mt-0.5 flex-shrink-0 text-sm">
                                {check.status === 'pass' && '✅'}
                                {check.status === 'warn' && '⚠️'}
                                {check.status === 'fail' && '❌'}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <span className={`font-medium ${check.status === 'pass' ? 'text-emerald-400' : check.status === 'warn' ? 'text-amber-400' : 'text-rose-400'}`}>
                                        {check.label}
                                    </span>
                                    <span className="font-mono text-[10px] text-text-muted">
                                        +{check.points}/25
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                                    {check.hint}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
