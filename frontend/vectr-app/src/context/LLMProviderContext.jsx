import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'vectr_llm_provider_config_v1';

export const DEFAULT_PROVIDERS = {
    groq: {
        id: 'groq',
        name: 'Groq LPU',
        tagline: 'Ultra-low latency inference',
        models: ['llama-3.3-70b-versatile', 'deepseek-r1-distill-llama-70b', 'mixtral-8x7b-32768'],
        currentModel: 'llama-3.3-70b-versatile',
        apiKey: '',
        latency: '14ms',
        throughput: '820 t/s',
        status: 'online',
        badge: 'Turbo LPU',
        color: '#e0681a',
        icon: '⚡',
        keyFormatPrefix: 'gsk_',
        docsUrl: 'https://console.groq.com/keys',
        description: 'Blazing-fast inference on specialized LPU hardware for instant PR reviews.'
    },
    openrouter: {
        id: 'openrouter',
        name: 'OpenRouter Gateway',
        tagline: 'Universal multi-model fallback',
        models: ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'meta-llama/llama-3.3-70b-instruct', 'deepseek/deepseek-r1'],
        currentModel: 'anthropic/claude-3.5-sonnet',
        apiKey: '',
        latency: '42ms',
        throughput: '210 t/s',
        status: 'online',
        badge: '200+ Models',
        color: '#d97706',
        icon: '🌐',
        keyFormatPrefix: 'sk-or-v1-',
        docsUrl: 'https://openrouter.ai/keys',
        description: 'Single unified API gateway aggregating Claude, GPT-4o, Llama, and Mistral.'
    },
    nova: {
        id: 'nova',
        name: 'Amazon Nova (Bedrock)',
        tagline: 'AWS enterprise intelligence',
        models: ['amazon.nova-lite-v1:0', 'amazon.nova-pro-v1:0', 'amazon.nova-micro-v1:0'],
        currentModel: 'amazon.nova-lite-v1:0',
        apiKey: '',
        awsAccessKey: '',
        awsSecretKey: '',
        awsRegion: 'us-east-1',
        latency: '31ms',
        throughput: '240 t/s',
        status: 'online',
        badge: 'Bedrock AWS',
        color: '#e0681a',
        icon: '🪐',
        keyFormatPrefix: 'AKIA',
        docsUrl: 'https://aws.amazon.com/bedrock/nova/',
        description: 'Stateful AWS Bedrock models with deep reasoning for open-source issue graphs.'
    },
    openai: {
        id: 'openai',
        name: 'OpenAI',
        tagline: 'State-of-the-art coding logic',
        models: ['gpt-4o', 'gpt-4o-mini', 'o3-mini'],
        currentModel: 'gpt-4o',
        apiKey: '',
        latency: '88ms',
        throughput: '120 t/s',
        status: 'configured',
        badge: 'GPT-4o',
        color: '#f97316',
        icon: '🧠',
        keyFormatPrefix: 'sk-',
        docsUrl: 'https://platform.openai.com/api-keys',
        description: 'Industry-standard frontier model with unmatched AST & code comprehension.'
    },
    anthropic: {
        id: 'anthropic',
        name: 'Anthropic Claude',
        tagline: 'Precise code refactoring & docstrings',
        models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
        currentModel: 'claude-3-5-sonnet-20241022',
        apiKey: '',
        latency: '62ms',
        throughput: '150 t/s',
        status: 'configured',
        badge: 'Claude 3.5',
        color: '#ea580c',
        icon: '✨',
        keyFormatPrefix: 'sk-ant-',
        docsUrl: 'https://console.anthropic.com/settings/keys',
        description: 'World-class reasoning for complex architectural diffs and git resolutions.'
    },
    gemini: {
        id: 'gemini',
        name: 'Google Gemini',
        tagline: 'Massive 2M token context window',
        models: ['gemini-2.0-flash', 'gemini-1.5-pro'],
        currentModel: 'gemini-2.0-flash',
        apiKey: '',
        latency: '24ms',
        throughput: '340 t/s',
        status: 'configured',
        badge: 'Gemini 2.0',
        color: '#fb923c',
        icon: '💎',
        keyFormatPrefix: 'AIza',
        docsUrl: 'https://aistudio.google.com/app/apikey',
        description: 'Ultra-low latency with massive context windows for full-repo indexation.'
    }
};

const LLMProviderContext = createContext(null);

export function LLMProvider({ children }) {
    const [providers, setProviders] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                return { ...DEFAULT_PROVIDERS, ...parsed.providers };
            }
        } catch {
            // fallback
        }
        return DEFAULT_PROVIDERS;
    });

    const [activeProviderId, setActiveProviderId] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.activeProviderId && DEFAULT_PROVIDERS[parsed.activeProviderId]) {
                    return parsed.activeProviderId;
                }
            }
        } catch {
            // fallback
        }
        return 'groq';
    });

    const [testingId, setTestingId] = useState(null);

    // Save to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                providers,
                activeProviderId,
                updatedAt: new Date().toISOString()
            }));
        } catch (e) {
            console.error('Failed to save LLM config to localStorage', e);
        }
    }, [providers, activeProviderId]);

    const updateProviderKey = useCallback((providerId, keyUpdates) => {
        setProviders(prev => {
            if (!prev[providerId]) return prev;
            return {
                ...prev,
                [providerId]: {
                    ...prev[providerId],
                    ...keyUpdates,
                    isConfigured: Boolean(keyUpdates.apiKey || keyUpdates.awsSecretKey)
                }
            };
        });
    }, []);

    const setModelForProvider = useCallback((providerId, model) => {
        setProviders(prev => {
            if (!prev[providerId]) return prev;
            return {
                ...prev,
                [providerId]: {
                    ...prev[providerId],
                    currentModel: model
                }
            };
        });
    }, []);

    const testProvider = useCallback(async (providerId) => {
        setTestingId(providerId);
        // Simulate real latency ping & validation test
        await new Promise(r => setTimeout(r, 650));
        setTestingId(null);
        return {
            success: true,
            latency: providers[providerId]?.latency || '28ms',
            provider: providers[providerId]?.name
        };
    }, [providers]);

    const activeProvider = providers[activeProviderId] || providers.groq;

    const value = {
        providers,
        activeProviderId,
        activeProvider,
        setActiveProviderId,
        updateProviderKey,
        setModelForProvider,
        testProvider,
        testingId,
        isConfigured: (id) => Boolean(providers[id]?.apiKey || providers[id]?.awsSecretKey)
    };

    return (
        <LLMProviderContext.Provider value={value}>
            {children}
        </LLMProviderContext.Provider>
    );
}

export function useLLM() {
    const ctx = useContext(LLMProviderContext);
    if (!ctx) throw new Error('useLLM must be used within an LLMProvider');
    return ctx;
}
