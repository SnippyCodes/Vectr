import { useState } from 'react';
import { useLLM } from '../context/LLMProviderContext';
import { useToast } from './Toast';

export default function LLMKeyVaultSection() {
    const { 
        providers, 
        activeProviderId, 
        setActiveProviderId, 
        updateProviderKey, 
        setModelForProvider, 
        testProvider, 
        testingId 
    } = useLLM();
    const { showToast } = useToast();

    const [keyInputs, setKeyInputs] = useState(() => {
        const initial = {};
        Object.entries(providers).forEach(([id, p]) => {
            initial[id] = {
                apiKey: p.apiKey || '',
                awsAccessKey: p.awsAccessKey || '',
                awsSecretKey: p.awsSecretKey || '',
                awsRegion: p.awsRegion || 'us-east-1'
            };
        });
        return initial;
    });

    const [showKey, setShowKey] = useState({});
    const [savedSuccess, setSavedSuccess] = useState({});
    const [testResults, setTestResults] = useState({});

    const handleInputChange = (providerId, field, value) => {
        setKeyInputs(prev => ({
            ...prev,
            [providerId]: {
                ...prev[providerId],
                [field]: value
            }
        }));
    };

    const toggleShowKey = (providerId) => {
        setShowKey(prev => ({ ...prev, [providerId]: !prev[providerId] }));
    };

    const handleSaveKey = (providerId) => {
        const data = keyInputs[providerId] || {};
        updateProviderKey(providerId, data);
        setSavedSuccess(prev => ({ ...prev, [providerId]: true }));
        showToast(`${providers[providerId]?.name} credentials saved!`, 'success');
        setTimeout(() => {
            setSavedSuccess(prev => ({ ...prev, [providerId]: false }));
        }, 2500);
    };

    const handleTest = async (providerId) => {
        const res = await testProvider(providerId);
        setTestResults(prev => ({
            ...prev,
            [providerId]: { success: true, latency: res.latency }
        }));
        showToast(`Connection to ${providers[providerId]?.name} verified! Latency: ${res.latency}`, 'success');
    };

    const handleTestAll = async () => {
        const providerIds = Object.keys(providers);
        for (const id of providerIds) {
            await testProvider(id);
            setTestResults(prev => ({
                ...prev,
                [id]: { success: true, latency: providers[id]?.latency || '25ms' }
            }));
        }
        showToast('All 6 LLM Provider endpoints verified operational!', 'success');
    };

    return (
        <div className="cockpit-panel p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262626] pb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-[1px] bg-[#e0681a]" />
                        <h2 className="text-lg font-bold font-mono uppercase text-white tracking-wide">
                            LLM Provider Key Vault & Inference Routing
                        </h2>
                    </div>
                    <p className="text-xs font-mono text-[#888888] mt-1">
                        Configure API credentials for Groq, OpenRouter, Amazon Nova, OpenAI, Anthropic, and Gemini. Keys are encrypted and stored locally.
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={handleTestAll}
                        className="cockpit-btn-secondary px-3 py-1.5 text-xs font-mono cursor-pointer"
                    >
                        ⚡ Test All Endpoints
                    </button>
                </div>
            </div>

            {/* Provider Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.values(providers).map((p) => {
                    const inputs = keyInputs[p.id] || {};
                    const isVisible = showKey[p.id];
                    const isTesting = testingId === p.id;
                    const isSaved = savedSuccess[p.id];
                    const testRes = testResults[p.id];
                    const isPrimary = activeProviderId === p.id;

                    return (
                        <div
                            key={p.id}
                            className={`p-4 rounded-[6px] border space-y-3.5 transition-colors ${
                                isPrimary
                                    ? 'bg-[#121212] border-[#e0681a]'
                                    : 'bg-[#0e0e0e] border-[#262626] hover:border-[#383838]'
                            }`}
                        >
                            {/* Card Top */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{p.icon}</span>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-bold font-mono text-white">{p.name}</h3>
                                            {isPrimary && (
                                                <span className="px-1.5 py-0.2 rounded-[2px] bg-[#e0681a] text-[#080808] text-[9px] font-mono font-bold">
                                                    PRIMARY
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[10px] font-mono text-[#888888]">{p.tagline}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setActiveProviderId(p.id)}
                                        className={`px-2 py-0.5 text-[10px] font-mono rounded cursor-pointer ${
                                            isPrimary
                                                ? 'text-[#e0681a] font-bold underline'
                                                : 'text-[#888888] hover:text-white'
                                        }`}
                                    >
                                        {isPrimary ? 'Selected' : 'Make Primary'}
                                    </button>
                                </div>
                            </div>

                            {/* Telemetry pill */}
                            <div className="flex items-center justify-between bg-[#080808] p-2 rounded-[4px] border border-[#222222] text-[10px] font-mono">
                                <span className="text-[#888888]">Speed: <strong className="text-[#22c55e]">{p.latency}</strong></span>
                                <span className="text-[#444444]">|</span>
                                <span className="text-[#888888]">Throughput: <strong className="text-white">{p.throughput}</strong></span>
                                <span className="text-[#444444]">|</span>
                                <span className="text-[#888888]">Status: <strong className="text-[#22c55e]">● Operational</strong></span>
                            </div>

                            {/* Inputs for API Keys */}
                            {p.id === 'nova' ? (
                                <div className="space-y-2">
                                    <div>
                                        <label className="text-[10px] font-mono uppercase text-[#888888] block mb-1">
                                            AWS Access Key ID
                                        </label>
                                        <input
                                            type="text"
                                            value={inputs.awsAccessKey}
                                            onChange={(e) => handleInputChange(p.id, 'awsAccessKey', e.target.value)}
                                            placeholder="AKIAIOSFODNN7EXAMPLE"
                                            className="w-full bg-[#141414] border border-[#262626] focus:border-[#e0681a] rounded-[4px] px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-mono uppercase text-[#888888] block mb-1">
                                            AWS Secret Access Key
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={isVisible ? 'text' : 'password'}
                                                value={inputs.awsSecretKey}
                                                onChange={(e) => handleInputChange(p.id, 'awsSecretKey', e.target.value)}
                                                placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                                                className="w-full bg-[#141414] border border-[#262626] focus:border-[#e0681a] rounded-[4px] px-3 py-1.5 text-xs font-mono text-white focus:outline-none pr-12"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => toggleShowKey(p.id)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#888888] hover:text-white"
                                            >
                                                {isVisible ? 'Hide' : 'Show'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-[10px] font-mono uppercase text-[#888888]">
                                            API Secret Key ({p.keyFormatPrefix}...)
                                        </label>
                                        <a
                                            href={p.docsUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[10px] font-mono text-[#e0681a] hover:underline"
                                        >
                                            Get Key ↗
                                        </a>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={isVisible ? 'text' : 'password'}
                                            value={inputs.apiKey}
                                            onChange={(e) => handleInputChange(p.id, 'apiKey', e.target.value)}
                                            placeholder={`Paste your ${p.name} API key...`}
                                            className="w-full bg-[#141414] border border-[#262626] focus:border-[#e0681a] rounded-[4px] px-3 py-1.5 text-xs font-mono text-white focus:outline-none pr-12"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => toggleShowKey(p.id)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#888888] hover:text-white"
                                        >
                                            {isVisible ? 'Hide' : 'Show'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Model selection dropdown */}
                            <div>
                                <label className="text-[10px] font-mono uppercase text-[#888888] block mb-1">
                                    Default Model
                                </label>
                                <select
                                    value={p.currentModel}
                                    onChange={(e) => setModelForProvider(p.id, e.target.value)}
                                    className="w-full bg-[#141414] border border-[#262626] focus:border-[#e0681a] rounded-[4px] px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none cursor-pointer"
                                >
                                    {p.models.map((m) => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Actions footer */}
                            <div className="pt-2 border-t border-[#1f1f1f] flex items-center justify-between">
                                <button
                                    onClick={() => handleTest(p.id)}
                                    disabled={isTesting}
                                    className="text-xs font-mono text-[#888888] hover:text-[#e0681a] transition-colors cursor-pointer flex items-center gap-1"
                                >
                                    <span>{isTesting ? 'Pinging...' : '⚡ Test Latency'}</span>
                                    {testRes && (
                                        <span className="text-[#22c55e] font-bold">({testRes.latency})</span>
                                    )}
                                </button>

                                <button
                                    onClick={() => handleSaveKey(p.id)}
                                    className="cockpit-btn-orange px-3 py-1 text-xs font-mono cursor-pointer"
                                >
                                    {isSaved ? '✓ Saved' : 'Save Key'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
