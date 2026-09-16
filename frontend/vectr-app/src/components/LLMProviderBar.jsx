import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLLM } from '../context/LLMProviderContext';
import { ROUTES } from '../constants';

export default function LLMProviderBar() {
    const { providers, activeProviderId, setActiveProviderId, testProvider, testingId, isConfigured } = useLLM();
    const navigate = useNavigate();
    const [testResult, setTestResult] = useState(null);

    const providerList = Object.values(providers);

    const handleTest = async (e, id) => {
        e.stopPropagation();
        const res = await testProvider(id);
        setTestResult({ id, ...res });
        setTimeout(() => setTestResult(null), 3500);
    };

    return (
        <div className="cockpit-panel p-4 space-y-3">
            {/* Header / Sub-strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-white">
                        Multi-LLM Inference Gateway
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-sans font-medium rounded-full bg-white/[0.05] text-[#9496a1] border border-white/[0.06]">
                        Zero-Latency Switcher
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs text-[#888891]">Active:</span>
                    <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/25">
                        {providers[activeProviderId]?.name} ({providers[activeProviderId]?.currentModel})
                    </span>
                    <button
                        onClick={() => navigate(ROUTES.SETTINGS)}
                        className="cockpit-btn-secondary px-3 py-1 text-xs font-medium cursor-pointer"
                    >
                        ⚙ Manage Keys
                    </button>
                </div>
            </div>

            {/* Provider Switcher Horizontal Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {providerList.map((p) => {
                    const isActive = p.id === activeProviderId;
                    const hasKey = isConfigured(p.id);
                    const isTesting = testingId === p.id;

                    return (
                        <div
                            key={p.id}
                            onClick={() => setActiveProviderId(p.id)}
                            className={`p-3 rounded-xl cursor-pointer transition-all duration-200 select-none flex flex-col justify-between min-h-[102px] ${
                                isActive 
                                    ? 'bg-amber-500/[0.08] border border-amber-500/40 shadow-[0_4px_20px_rgba(245,158,11,0.08)]' 
                                    : 'bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.14] hover:bg-white/[0.04]'
                            }`}
                        >
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-base">{p.icon}</span>
                                        <span className={`text-xs font-semibold truncate ${isActive ? 'text-amber-300 font-bold' : 'text-[#f5f5f5]'}`}>
                                            {p.name.split(' ')[0]}
                                        </span>
                                    </div>
                                    <span className="flex h-2 w-2 relative">
                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${hasKey || p.status === 'online' ? 'bg-[#22c55e]' : 'bg-amber-500'}`} />
                                        <span className={`relative inline-flex rounded-full h-2 w-2 ${hasKey || p.status === 'online' ? 'bg-[#22c55e]' : 'bg-amber-500'}`} />
                                    </span>
                                </div>

                                <div className="space-y-0.5">
                                    <p className="text-[11px] font-sans text-[#888891] truncate">
                                        {p.currentModel.split('/')[1] || p.currentModel}
                                    </p>
                                    <div className="flex items-center gap-1.5 text-[10px] font-mono">
                                        <span className="text-[#22c55e] font-semibold">{p.latency}</span>
                                        <span className="text-white/20">|</span>
                                        <span className="text-[#888891]">{p.throughput}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-2 pt-2 border-t border-white/[0.06] flex items-center justify-between">
                                <span className={`text-[10px] font-medium uppercase px-2 py-0.5 rounded-full ${
                                    isActive 
                                        ? 'bg-amber-500 text-black font-semibold' 
                                        : 'bg-white/[0.05] text-[#888891]'
                                }`}>
                                    {isActive ? 'ACTIVE' : 'SELECT'}
                                </span>

                                <button
                                    onClick={(e) => handleTest(e, p.id)}
                                    disabled={isTesting}
                                    title="Ping provider latency"
                                    className="text-[10px] font-sans text-[#888891] hover:text-amber-300 transition-colors"
                                >
                                    {isTesting ? 'pinging...' : 'ping'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Test result toast banner if present */}
            {testResult && (
                <div className="bg-[#141414] border border-[#22c55e] p-2 rounded-[4px] flex items-center justify-between text-xs font-mono text-[#22c55e]">
                    <span>✓ Connection verified for {testResult.provider} — Roundtrip Latency: {testResult.latency}</span>
                    <span className="text-[#a3a3a3] text-[10px]">Vault hardware active</span>
                </div>
            )}
        </div>
    );
}
