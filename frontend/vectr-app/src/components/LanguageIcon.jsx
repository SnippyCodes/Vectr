import React, { useState } from 'react';

/**
 * Exact official vector URLs from Devicon (official organization/foundation brand assets).
 */
const OFFICIAL_URLS = {
    python: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg',
    javascript: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg',
    js: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg',
    typescript: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg',
    ts: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg',
    rust: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/rust/rust-original.svg',
    go: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/go/go-original.svg',
    golang: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/go/go-original.svg',
    java: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg',
    'c++': 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/cplusplus/cplusplus-original.svg',
    cpp: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/cplusplus/cplusplus-original.svg',
    c: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/c/c-original.svg',
    'c#': 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/csharp/csharp-original.svg',
    csharp: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/csharp/csharp-original.svg',
    'html/css': 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg',
    html: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg',
    css: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/css3/css3-original.svg',
    ruby: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/ruby/ruby-original.svg',
    swift: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/swift/swift-original.svg',
    kotlin: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/kotlin/kotlin-original.svg',
    php: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/php/php-original.svg',
    dart: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/dart/dart-original.svg',
    scala: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/scala/scala-original.svg',
    shell: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/bash/bash-original.svg',
    bash: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/bash/bash-original.svg',
    'objective-c': 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/objectivec/objectivec-plain.svg',
    objc: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/objectivec/objectivec-plain.svg',
    r: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/r/r-original.svg',
    lua: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/lua/lua-original.svg',
    perl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/perl/perl-original.svg',
    haskell: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/haskell/haskell-original.svg',
    elixir: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/elixir/elixir-original.svg',
    clojure: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/clojure/clojure-original.svg',
    groovy: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/groovy/groovy-original.svg',
    matlab: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/matlab/matlab-original.svg',
    vue: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vuejs/vuejs-original.svg',
    react: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg',
    svelte: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/svelte/svelte-original.svg',
    angular: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/angular/angular-original.svg',
    sql: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg',
    nosql: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mongodb/mongodb-original.svg',
    solidity: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/solidity/solidity-original.svg',
    webassembly: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/wasm/wasm-original.svg',
    wasm: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/wasm/wasm-original.svg',
};

/**
 * Exact official brand vector logos for all supported programming languages and ecosystems.
 * Renders the authentic official organization SVG with an embedded vector fallback.
 */
export default function LanguageIcon({ name, size = 18, className = '' }) {
    const key = (name || '').toLowerCase().trim();
    const [imgFailed, setImgFailed] = useState(false);

    const officialUrl = OFFICIAL_URLS[key];

    // Priority: Official Organization SVG from verified repository
    if (officialUrl && !imgFailed && key !== 'all' && key !== 'all languages') {
        return (
            <img
                src={officialUrl}
                alt={name}
                width={size}
                height={size}
                className={`object-contain flex-shrink-0 select-none ${className}`}
                style={{ width: size, height: size }}
                loading="lazy"
                onError={() => setImgFailed(true)}
            />
        );
    }

    // High-fidelity inline SVG fallback
    switch (key) {
        case 'python':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
                    <path fill="#3776AB" d="M11.9 1.5c-3.1 0-5 .6-5 2.8v2.1h5.2v.7H4.3C2 7.1 1 8.5 1 11.5s1.7 4.2 4.1 4.2h1.6v-2.3c0-2.4 2-4.4 4.5-4.4h5.2c.4 0 .7-.3.7-.7V4.3c0-2.2-2.7-2.8-5.2-2.8zM9 3.5a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8z" />
                    <path fill="#FFD43B" d="M12.1 22.5c3.1 0 5-.6 5-2.8v-2.1h-5.2v-.7h7.8c2.3 0 3.3-1.4 3.3-4.4s-1.7-4.2-4.1-4.2h-1.6v2.3c0 2.4-2 4.4-4.5 4.4H7.6c-.4 0-.7.3-.7.7v4.2c0 2.2 2.7 2.8 5.2 2.8zm2.9-2a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8z" />
                </svg>
            );
        case 'javascript':
        case 'js':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
                    <rect width="24" height="24" rx="4" fill="#F7DF1E" />
                    <path fill="#000" d="M7 17.5c.8 1 2 1.5 3.3 1.5 2 0 3.2-1.1 3.2-2.8v-6.7h-2.1v6.7c0 .7-.4 1.1-1.1 1.1-.7 0-1.1-.4-1.5-.9l-1.8 1.1zm8.3-.3c1 1.2 2.6 1.8 4.2 1.8 2.5 0 4.1-1.4 4.1-3.6 0-2-1.3-3-3.1-3.8-.9-.4-1.6-.7-1.6-1.3s.5-1 1.3-1c.9 0 1.6.4 2.1 1.1l1.7-1.3c-.9-1.2-2.1-1.7-3.8-1.7-2.4 0-3.9 1.4-3.9 3.4 0 2 1.3 2.9 3 3.7.9.4 1.7.8 1.7 1.4 0 .6-.6 1.1-1.5 1.1-1.1 0-1.9-.5-2.5-1.5l-1.7 1.2z" />
                </svg>
            );
        case 'typescript':
        case 'ts':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
                    <rect width="24" height="24" rx="4" fill="#3178C6" />
                    <path fill="#FFF" d="M12.2 11.2h-3v8H7.3v-8h-3V9.5h7.9v1.7zm3.1 8c-1.1 0-2.1-.3-2.9-1l1.1-1.4c.5.5 1.2.7 1.8.7.6 0 1-.3 1-.7 0-.4-.4-.6-1.1-.9l-.6-.2c-1.2-.5-1.9-1.1-1.9-2.2 0-1.4 1.1-2.4 2.7-2.4 1 0 1.8.3 2.4.7l-1 1.4c-.4-.3-1-.5-1.5-.5-.5 0-.8.2-.8.5 0 .3.3.5.9.8l.5.2c1.3.5 2.1 1.2 2.1 2.4 0 1.5-1.1 2.6-2.7 2.6z" />
                </svg>
            );
        case 'rust':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
                    <path fill="#DEA584" d="M12 2a10 10 0 0 0-4.6 1.1l.9 1.8a8 8 0 0 1 7.4 0l.9-1.8A10 10 0 0 0 12 2zm-6 3.2L4.2 6.8a10 10 0 0 0-2 4.3l2 .4A8 8 0 0 1 6 7.6L6 5.2zm12 0l-.1 2.4a8 8 0 0 1 1.8 3.9l2-.4a10 10 0 0 0-2-4.3l-1.7-1.6zM2 13.5a10 10 0 0 0 2.1 4.3l1.8-1a8 8 0 0 1-1.9-3.3H2zm18 0h-2a8 8 0 0 1-1.9 3.3l1.8 1A10 10 0 0 0 22 13.5zM8.3 19.1l-.9 1.8a10 10 0 0 0 4.6 1.1 10 10 0 0 0 4.6-1.1l-.9-1.8a8 8 0 0 1-7.4 0z" />
                    <circle cx="12" cy="12" r="5" fill="#CE422B" />
                    <text x="12" y="15" textAnchor="middle" fill="#FFF" fontSize="9" fontWeight="bold" fontFamily="monospace">R</text>
                </svg>
            );
        case 'go':
        case 'golang':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
                    <path fill="#00ADD8" d="M1.5 10.5c.8 0 1.4-.4 1.7-1 .3-.7.1-1.5-.5-2-.6-.5-1.4-.5-2 0-.6.5-.8 1.3-.5 2 .3.6.8 1 1.3 1zm21 0c.8 0 1.4-.4 1.7-1 .3-.7.1-1.5-.5-2-.6-.5-1.4-.5-2 0-.6.5-.8 1.3-.5 2 .3.6.8 1 1.3 1zM7 15.5c0 2.2 1.8 4 4 4s4-1.8 4-4v-2h-4v1.5h2.2c-.4.8-1.2 1.3-2.2 1.3-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5c.8 0 1.5.4 1.9 1h1.7C16 9.4 14.2 8 12 8c-2.8 0-5 2.2-5 5v2.5z" />
                    <path fill="#00ADD8" d="M19.5 13.5c-.8 0-1.5.7-1.5 1.5s.7 1.5 1.5 1.5 1.5-.7 1.5-1.5-.7-1.5-1.5-1.5z" />
                </svg>
            );
        case 'java':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
                    <path fill="#EA2D2E" d="M8.5 17.5c2.5.2 4.5.3 6.9-.5.7-.2 1.4-.6 1.4-.6s-.7.3-1.4.5c-2.6.8-5.3.7-6.9.6z" />
                    <path fill="#5382A1" d="M11 1.5c.4 1.8-.7 3.3-1.3 4.6-.6 1.3-.7 2.3-.3 3.3.4-1.6 1.2-2.8 1.8-4.2.7-1.5.5-2.6-.2-3.7z" />
                    <path fill="#EA2D2E" d="M5.5 19.5c3.2.3 6.5.3 10.3-.5.9-.2 1.9-.6 1.9-.6s-.9.3-1.9.5c-3.7.8-7.3.7-10.3.6z" />
                    <path fill="#5382A1" d="M14.5 5.5c.4 1.5-.3 2.7-.9 3.8-.5 1-.6 1.9-.3 2.7.3-1.3 1-2.3 1.5-3.5.5-1.2.4-2.1-.3-3z" />
                </svg>
            );
        case 'c++':
        case 'cpp':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
                    <path fill="#00599C" d="M12 2L2 7.8v11.4L12 25l10-5.8V7.8L12 2zm-1.8 14.5c-2.5 0-4.2-1.7-4.2-4.2s1.7-4.2 4.2-4.2c1.4 0 2.6.6 3.3 1.6l-1.3 1.1c-.5-.6-1.2-1-2-1-1.4 0-2.4 1-2.4 2.5s1 2.5 2.4 2.5c.8 0 1.5-.4 2-1l1.3 1.1c-.7 1-1.9 1.7-3.3 1.7zm6-3.2h-1v1.5h-.8v-1.5h-1v-.8h1v-1.5h.8v1.5h1v.8zm3.5 0h-1v1.5h-.8v-1.5h-1v-.8h1v-1.5h.8v1.5h1v.8z" />
                </svg>
            );
        case 'c#':
        case 'csharp':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
                    <path fill="#239120" d="M12 2L2 7.8v11.4L12 25l10-5.8V7.8L12 2zm-2 14.5c-2.5 0-4.2-1.7-4.2-4.2s1.7-4.2 4.2-4.2c1.4 0 2.6.6 3.3 1.6l-1.3 1.1c-.5-.6-1.2-1-2-1-1.4 0-2.4 1-2.4 2.5s1 2.5 2.4 2.5c.8 0 1.5-.4 2-1l1.3 1.1c-.7 1-1.9 1.7-3.3 1.7zm7.5-2.2v1.5h-.8v-1.5h-1.2v1.5h-.8v-1.5h-.8v-.8h.8v-1.2h-.8v-.8h.8v-1.5h.8v1.5h1.2v-1.5h.8v1.5h.8v.8h-.8v1.2h.8v.8h-.8zm-2-.8v-1.2h-1.2v1.2h1.2z" />
                </svg>
            );
        case 'c':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
                    <path fill="#A8B9CC" d="M12 2L2 7.8v11.4L12 25l10-5.8V7.8L12 2zm0 15.5c-3 0-5.2-2.2-5.2-5.2s2.2-5.2 5.2-5.2c1.8 0 3.3.8 4.2 2.1l-1.8 1.4c-.6-.9-1.4-1.4-2.4-1.4-1.7 0-3 1.3-3 3.1s1.3 3.1 3 3.1c1 0 1.8-.5 2.4-1.4l1.8 1.4c-.9 1.3-2.4 2.2-4.2 2.2z" />
                </svg>
            );
        case 'html/css':
        case 'html':
        case 'css':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
                    <path fill="#E34F26" d="M2.5 2h19l-1.8 19.5L12 24l-7.7-2.5L2.5 2z" />
                    <path fill="#EF652A" d="M12 3.8v18.2l6.2-2 1.4-16.2H12z" />
                    <path fill="#FFF" d="M12 8.5H7.2l.3 3.2h4.5v-3.2zm0 5.8h-2.3l-.2-2h-2.5l.4 4.5h4.6v-2.5zm4.8-5.8H12v3.2h4.5l-.4 4.5-4.1 1.3v2.6l6.6-2.1.8-9.5z" />
                </svg>
            );
        case 'ruby':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
                    <path fill="#CC342D" d="M17.5 2l5 6-10.5 14L1.5 8l5-6h11z" />
                    <path fill="#E85D56" d="M12 22l10.5-14H17l-5 14z" />
                    <path fill="#FFF" opacity="0.3" d="M6.5 2L1.5 8h6l4.5-6H6.5z" />
                </svg>
            );
        case 'swift':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
                    <path fill="#F05138" d="M21.5 13.5c-2.5 3-6.5 5.5-11 5.5 4.5-2 6-5.5 6-7.5-3 2-6.5 2-9 0 5-1.5 8-4.5 9-8-3 2.5-6.5 3-10 2 2.5-2 4-4.5 4.5-5.5C5 3 2 8.5 2 13.5c0 5 4 9 9 9 6.5 0 10.5-4.5 10.5-9z" />
                </svg>
            );
        case 'kotlin':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
                    <path fill="#7F52FF" d="M1.5 1.5h21L12 12l10.5 10.5h-21z" />
                    <path fill="#C711E1" d="M1.5 1.5l10.5 10.5L1.5 22.5z" />
                </svg>
            );
        case 'php':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
                    <ellipse cx="12" cy="12" rx="10" ry="6" fill="#777BB4" />
                    <text x="12" y="14" textAnchor="middle" fill="#FFF" fontSize="6.5" fontWeight="bold" fontFamily="sans-serif">PHP</text>
                </svg>
            );
        case 'dart':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
                    <path fill="#0175C2" d="M12 2L2 12l4 4 12-12L12 2z" />
                    <path fill="#02569B" d="M6 16l6 6 10-10-4-4L6 16z" />
                    <path fill="#40C4FF" d="M12 22l6-6-6-6-6 6 6 6z" />
                </svg>
            );
        case 'scala':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
                    <path fill="#DC322F" d="M4 2c6 2 12 1 16 0v5c-4 1-10 2-16 0V2zm0 8c6 2 12 1 16 0v5c-4 1-10 2-16 0v-5zm0 8c6 2 12 1 16 0v5c-4 1-10 2-16 0v-5z" />
                </svg>
            );
        case 'shell':
        case 'bash':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
                    <rect width="22" height="18" x="1" y="3" rx="3" fill="#2E3440" />
                    <path stroke="#A3BE8C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" d="M5 8l4 3.5L5 15M11 15h6" />
                </svg>
            );
        case 'r':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
                    <ellipse cx="12" cy="12" rx="10" ry="8" fill="#276DC3" />
                    <text x="12" y="15" textAnchor="middle" fill="#FFF" fontSize="10" fontWeight="bold" fontFamily="sans-serif">R</text>
                </svg>
            );
        case 'lua':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
                    <circle cx="12" cy="12" r="8" fill="#000080" />
                    <circle cx="15" cy="9" r="2.5" fill="#FFF" />
                    <circle cx="18" cy="6" r="1" fill="#FFF" />
                </svg>
            );
        case 'elixir':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
                    <path fill="#4B275F" d="M12 2C8 9 5 13 5 17a7 7 0 0 0 14 0c0-4-3-8-7-15z" />
                    <circle cx="12" cy="17" r="3" fill="#A174C7" />
                </svg>
            );
        case 'haskell':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
                    <path fill="#5D4F85" d="M2 3l6 9-6 9h3.5l4.5-6.8L14.5 21H18l-6-9 6-9h-3.5L10 9.8 5.5 3H2z" />
                    <path fill="#8F4E8B" d="M15.5 10.5l-2 3h8.5v-3h-6.5zm-1.5 5l-2 3h10v-3h-8z" />
                </svg>
            );
        case 'clojure':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
                    <circle cx="12" cy="12" r="9.5" fill="#5881D8" />
                    <path fill="#63B132" d="M12 2.5a9.5 9.5 0 0 0 0 19c2.6 0 5-1 6.7-2.8L12 12V2.5z" />
                </svg>
            );
        case 'objective-c':
        case 'objc':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
                    <rect width="24" height="24" rx="4" fill="#0B5A9D" />
                    <text x="12" y="16" textAnchor="middle" fill="#FFF" fontSize="9" fontWeight="bold" fontFamily="monospace">ObjC</text>
                </svg>
            );
        case 'perl':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
                    <ellipse cx="12" cy="12" rx="10" ry="7" fill="#0073A1" />
                    <text x="12" y="15" textAnchor="middle" fill="#FFF" fontSize="8" fontWeight="bold" fontFamily="sans-serif">Perl</text>
                </svg>
            );
        case 'groovy':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
                    <circle cx="12" cy="12" r="10" fill="#4298B8" />
                    <path fill="#FFF" d="M12 5l2 4 4.5.5-3.3 3.2.8 4.3L12 15l-4 2 1-4.3L5.5 9.5 10 9z" />
                </svg>
            );
        case 'matlab':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
                    <rect width="24" height="24" rx="4" fill="#E16728" />
                    <text x="12" y="16" textAnchor="middle" fill="#FFF" fontSize="10" fontWeight="bold" fontFamily="sans-serif">M</text>
                </svg>
            );
        case 'assembly':
        case 'asm':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
                    <rect width="20" height="20" x="2" y="2" rx="3" fill="#26262a" stroke="#444" strokeWidth="1" />
                    <rect width="8" height="8" x="8" y="8" fill="#22d3ee" rx="1" />
                    <line x1="12" y1="2" x2="12" y2="6" stroke="#888" strokeWidth="1.5" />
                    <line x1="12" y1="18" x2="12" y2="22" stroke="#888" strokeWidth="1.5" />
                    <line x1="2" y1="12" x2="6" y2="12" stroke="#888" strokeWidth="1.5" />
                    <line x1="18" y1="12" x2="22" y2="12" stroke="#888" strokeWidth="1.5" />
                </svg>
            );
        case 'vue':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
                    <path fill="#42B883" d="M12 18.5L2 3.5h4.5L12 12.5l5.5-9H22L12 18.5z" />
                    <path fill="#35495E" d="M12 12.5L7.5 5h3L12 7.5 13.5 5h3L12 12.5z" />
                </svg>
            );
        case 'react':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
                    <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="#61DAFB" strokeWidth="1.4" />
                    <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="#61DAFB" strokeWidth="1.4" transform="rotate(60 12 12)" />
                    <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="#61DAFB" strokeWidth="1.4" transform="rotate(120 12 12)" />
                    <circle cx="12" cy="12" r="1.8" fill="#61DAFB" />
                </svg>
            );
        case 'svelte':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
                    <rect width="24" height="24" rx="4" fill="#FF3E00" />
                    <text x="12" y="16.5" textAnchor="middle" fill="#FFF" fontSize="13" fontWeight="900" fontFamily="sans-serif">S</text>
                </svg>
            );
        case 'angular':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
                    <path fill="#DD0031" d="M12 2.5L2 6l1.6 13L12 22.5 20.4 19 22 6 12 2.5z" />
                    <path fill="#C3002F" d="M12 2.5v20l8.4-3.5L22 6 12 2.5z" />
                    <path fill="#FFF" d="M12 5.5l-5 11.5h2.2l1-2.5h3.6l1 2.5H17L12 5.5zm1.2 7h-2.4L12 8.8l1.2 3.7z" />
                </svg>
            );
        case 'sql':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
                    <rect width="24" height="24" rx="4" fill="#336791" />
                    <text x="12" y="16" textAnchor="middle" fill="#FFF" fontSize="9" fontWeight="bold" fontFamily="monospace">SQL</text>
                </svg>
            );
        case 'nosql':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
                    <rect width="24" height="24" rx="4" fill="#13aa52" />
                    <text x="12" y="15" textAnchor="middle" fill="#FFF" fontSize="7.5" fontWeight="bold" fontFamily="monospace">NoSQL</text>
                </svg>
            );
        case 'solidity':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
                    <path fill="#62688F" d="M12 2L4.5 12 12 15l7.5-3L12 2z" />
                    <path fill="#363636" d="M12 15.8L4.5 13 12 22.5 19.5 13 12 15.8z" />
                    <path fill="#8588A6" d="M12 2v13l7.5-3L12 2z" />
                </svg>
            );
        case 'webassembly':
        case 'wasm':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
                    <rect width="24" height="24" rx="4" fill="#654FF0" />
                    <text x="12" y="15" textAnchor="middle" fill="#FFF" fontSize="7.5" fontWeight="bold" fontFamily="monospace">WASM</text>
                </svg>
            );
        case 'all':
        case 'all languages':
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none" stroke="#22d3ee" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
            );
        default:
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none" stroke="#22d3ee" strokeWidth="2">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                </svg>
            );
    }
}
