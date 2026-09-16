import { useState } from 'react';
import { useLLM } from '../context/LLMProviderContext';

const SAMPLE_RESPONSES = {
    'Explain Issue AST & Files': `[AST Analysis // tiangolo/fastapi #4920]
Identified target file: docs/en/docs/tutorial/background-tasks.md
Line 42: Broken hyperlink targeting legacy tutorial anchor '#background-tasks-with-yield'.
Recommendation: Replace anchor with current documentation section '#using-backgroundtasks'.

Patch diff:
--- a/docs/en/docs/tutorial/background-tasks.md
+++ b/docs/en/docs/tutorial/background-tasks.md
@@ -42,3 +42,3 @@
-See also [Background Tasks with Yield](#background-tasks-with-yield)
+See also [Using Background Tasks](#using-backgroundtasks)
`,
    'Generate Pytest Fixture': `import pytest
from fastapi.testclient import TestClient
from main import app

@pytest.fixture(name="client")
def client_fixture():
    """Client fixture for validating tutorial endpoint responses."""
    with TestClient(app) as test_client:
        yield test_client

def test_background_task_docs_link(client):
    response = client.get("/docs")
    assert response.status_code == 200
    assert b"using-backgroundtasks" in response.content
`,
    'Draft PR Description': `### Summary of Changes
- Fixes broken anchor link in background tasks tutorial documentation (#4920).
- Adds curl execution examples for beginner contributors testing task queues.
- Verified local mkdocs build passes without linkcheck warnings.

### Testing Checklist
- [x] Ran \`pytest tests/test_docs.py\`
- [x] Verified link in browser at http://localhost:8000/tutorial/background-tasks
`,
    'Ruff Lint Check': `[Ruff 0.4.8 Linter // Clean Pass]
All checks passed!
12 files analyzed in 0.04s.
0 violations found. Formatting complies with Black & Flake8 specifications.
`
};

export default function LLMMentorshipTerminal({ activeIssue }) {
    const { activeProvider } = useLLM();
    const [query, setQuery] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamOutput, setStreamOutput] = useState(SAMPLE_RESPONSES['Explain Issue AST & Files']);
    const [copied, setCopied] = useState(false);

    const handlePrompt = async (text) => {
        setIsStreaming(true);
        setStreamOutput('');
        
        const targetOutput = SAMPLE_RESPONSES[text] || `[Inference from ${activeProvider.name} // ${activeProvider.currentModel}]
Processing request for repository '${activeIssue?.repo_name || 'tiangolo/fastapi'}' on issue #${activeIssue?.issue_number || '4920'}...

Step 1: Inspecting current git branch '${activeIssue?.branch_name || 'fix/docs-4920'}'.
Step 2: Synthesizing maintainer conventions from CONTRIBUTING.md.
Step 3: Guidance ready: Ensure docstring formatting adheres to Google Python Style Guide before pushing commit.`;

        // Stream character by character
        let current = '';
        for (let i = 0; i < targetOutput.length; i += 8) {
            current += targetOutput.slice(i, i + 8);
            setStreamOutput(current);
            await new Promise(r => setTimeout(r, 12));
        }
        setIsStreaming(false);
    };

    const handleSend = (e) => {
        e.preventDefault();
        if (!query.trim() || isStreaming) return;
        const promptText = query;
        setQuery('');
        handlePrompt(promptText);
    };

    const copyOutput = () => {
        navigator.clipboard.writeText(streamOutput);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="cockpit-panel p-5 space-y-3.5">
            {/* Terminal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
                        AI Contributor Mentorship Terminal
                    </h3>
                    <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ● Live via {activeProvider.name} ({activeProvider.latency})
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={copyOutput}
                        disabled={!streamOutput}
                        className="cockpit-btn-secondary px-3 py-1 text-xs font-medium cursor-pointer"
                    >
                        {copied ? '✓ Copied' : 'Copy Output'}
                    </button>
                </div>
            </div>

            {/* Quick Action Chips */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-[#888891]">Quick Actions:</span>
                {Object.keys(SAMPLE_RESPONSES).map((action) => (
                    <button
                        key={action}
                        onClick={() => handlePrompt(action)}
                        disabled={isStreaming}
                        className="px-3 py-1 text-xs font-sans rounded-full bg-white/[0.04] hover:bg-amber-500/10 text-[#9496a1] hover:text-amber-300 border border-white/[0.06] hover:border-amber-500/30 transition-all duration-150 cursor-pointer"
                    >
                        {action}
                    </button>
                ))}
            </div>

            {/* Terminal Output Well */}
            <div className="bg-[#0a0b10] border border-white/[0.06] rounded-xl p-4 font-mono text-xs text-[#e4e4e7] overflow-x-auto min-h-[130px] max-h-[220px] block-scroll leading-relaxed whitespace-pre-wrap shadow-inner">
                {streamOutput || (
                    <span className="text-[#6b6d7a] italic">
                        Ready. Click an action chip or type a prompt below to query {activeProvider.name}...
                    </span>
                )}
                {isStreaming && <span className="inline-block w-2 h-4 ml-1 bg-amber-400 animate-pulse align-middle" />}
            </div>

            {/* Prompt Input Form */}
            <form onSubmit={handleSend} className="flex items-center gap-2.5">
                <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-amber-400">
                        &gt;
                    </span>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={`Ask ${activeProvider.name} (${activeProvider.currentModel}) for advice on ${activeIssue?.repo_name || 'fastapi'}...`}
                        disabled={isStreaming}
                        className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-amber-500/40 rounded-full pl-8 pr-4 py-2 text-xs font-sans text-white placeholder-[#6b6d7a] focus:outline-none transition-colors"
                    />
                </div>
                <button
                    type="submit"
                    disabled={isStreaming || !query.trim()}
                    className="cockpit-btn-orange px-5 py-2 text-xs font-semibold cursor-pointer disabled:opacity-50 shrink-0"
                >
                    {isStreaming ? 'Thinking...' : 'Run Query'}
                </button>
            </form>
        </div>
    );
}
