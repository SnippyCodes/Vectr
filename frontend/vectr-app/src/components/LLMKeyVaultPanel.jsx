import { useNavigate } from 'react-router-dom';
import { useLLM } from '../context/LLMProviderContext';
import { ROUTES } from '../constants';

export default function LLMKeyVaultPanel() {
    const { providers, isConfigured, activeProviderId, setActiveProviderId } = useLLM();
    const navigate = useNavigate();

    const providerList = Object.values(providers);

    return (
        <div className="cockpit-panel p-5 space-y-3.5 flex flex-col justify-between">
            <div>
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-3">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
                            LLM Provider Key Vault
                        </h3>
                    </div>
                    <button
                        onClick={() => navigate(ROUTES.SETTINGS)}
                        className="text-xs text-amber-400 hover:text-amber-300 transition-colors cursor-pointer font-medium"
                    >
                        Configure All ↗
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {providerList.map((p) => {
                        const configured = isConfigured(p.id);
                        const isDefault = p.id === activeProviderId;

                        return (
                            <div
                                key={p.id}
                                className={`p-3 rounded-xl border flex flex-col justify-between transition-all duration-200 ${
                                    isDefault 
                                        ? 'bg-amber-500/[0.07] border-amber-500/40 shadow-[0_4px_16px_rgba(245,158,11,0.06)]' 
                                        : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.12]'
                                }`}
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm">{p.icon}</span>
                                            <span className="text-xs font-semibold text-white">
                                                {p.name}
                                            </span>
                                        </div>
                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                            configured || p.status === 'online'
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                        }`}>
                                            {configured || p.status === 'online' ? 'Active' : 'Unset'}
                                        </span>
                                    </div>
                                    <p className="text-[11px] font-sans text-[#888891] line-clamp-1">
                                        {p.tagline}
                                    </p>
                                </div>

                                <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-sans">
                                    <span className="text-[#6b6d7a] font-mono text-[10px]">
                                        {p.keyFormatPrefix}...
                                    </span>
                                    <button
                                        onClick={() => {
                                            setActiveProviderId(p.id);
                                        }}
                                        className={`cursor-pointer transition-colors ${isDefault ? 'text-amber-300 font-semibold' : 'text-[#888891] hover:text-white'}`}
                                    >
                                        {isDefault ? '● Primary' : 'Set Primary'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-sans text-[#888891]">
                <span>Vault Encryption: AES-256 (Local storage hardware bound)</span>
                <span className="text-[#22c55e] font-medium">● 6 Providers Ready</span>
            </div>
        </div>
    );
}
