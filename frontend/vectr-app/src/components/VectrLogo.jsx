import React from 'react';

/**
 * VectrLogo — Core faceted directional shield emblem.
 */
export default function VectrLogo({ size = 46, className = '' }) {
    return (
        <img
            src="/vectr-logo.png"
            alt="Vectr Directional Emblem"
            width={size}
            height={size}
            draggable={false}
            className={`flex-shrink-0 select-none transition-transform duration-200 ${className}`}
            style={{
                width: size,
                height: size,
                objectFit: "contain",
                display: "block",
                filter: "drop-shadow(0 2px 8px rgba(0, 0, 0, 0.4))",
            }}
        />
    );
}
