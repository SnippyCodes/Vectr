import React from 'react';
import VectrLogo from './VectrLogo';

/**
 * VectrBrand — Directional, sleek brand mark embodying mathematical vector magnitude & direction.
 */
export default function VectrBrand({ 
    logoSize = 44, 
    showTag = true, 
    showSubtitle = false, 
    className = '',
    onClick = undefined 
}) {
    return (
        <div 
            onClick={onClick}
            className={`group flex items-center gap-3 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
        >
            {/* Enlarged Directional Shield Logo */}
            <div className="relative flex items-center justify-center flex-shrink-0">
                <VectrLogo size={logoSize} />
                <div 
                    className="absolute inset-0 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                        boxShadow: '0 0 20px rgba(34, 211, 238, 0.25)',
                    }}
                />
            </div>

            {/* Sleek Directional Typography */}
            <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                    <span 
                        className="text-white font-extrabold uppercase text-lg sm:text-xl font-mono flex items-center leading-none"
                        style={{ letterSpacing: '0.22em' }}
                    >
                        VECTR
                        {/* Directional Vector Arrow (Magnitude + Direction) */}
                        <span className="text-[#22d3ee] font-black text-base ml-1.5 inline-block transform transition-transform duration-200 group-hover:translate-x-1">
                            ❯
                        </span>
                    </span>

                    {showTag && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#22d3ee]/10 text-[#22d3ee] border border-[#22d3ee]/30 tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#22d3ee] animate-pulse"></span>
                            AI
                        </span>
                    )}
                </div>

                {showSubtitle && (
                    <span 
                        className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1"
                        style={{ letterSpacing: '0.15em' }}
                    >
                        Open Source Contributor Cockpit
                    </span>
                )}
            </div>
        </div>
    );
}
