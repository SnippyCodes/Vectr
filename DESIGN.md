---
# gstack: design-md-format=spec
name: Vectr
description: "High-precision open-source contributor cockpit in an uncompromising Obsidian Kinetic Black and Orange theme with zero gradients"
colors:
  primary: "#e0681a"
  on-primary: "#080808"
  surface: "#0d0d0d"
  surface-elevated: "#141414"
  canvas: "#080808"
  text: "#fafafa"
  text-muted: "#666666"
  text-secondary: "#a3a3a3"
  border: "#262626"
  border-subtle: "#1f1f1f"
  accent: "#e0681a"
  accent-hover: "#f97316"
  success: "#22c55e"
  warning: "#f59e0b"
  error: "#ef4444"
  info: "#e0681a"
typography:
  display:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontWeight: 700
    fontSize: "clamp(1.5rem, 3vw, 2.25rem)"
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    lineHeight: 1.5
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    letterSpacing: "0.04em"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontFeature: "tnum"
rounded:
  sm: "3px"
  md: "4px"
  lg: "6px"
  xl: "8px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    border: "1px solid {colors.border}"
  input:
    backgroundColor: "{colors.surface-elevated}"
    borderColor: "{colors.border}"
    rounded: "{rounded.sm}"
  nav-link:
    textColor: "{colors.text-secondary}"
---

# Vectr Design System (Obsidian Kinetic)

## Overview

**Creative North Star:** An industrial, mission-control developer cockpit strictly following a **Black and Orange** aesthetic with **ZERO GRADIENTS**. Surfaces are opaque, flat, and absolute—drawing directly from avionics flight computers, hardware test benches, and modular inference racks.

**Product Context:** Vectr bridges the gap between aspiring developers and major open source repositories (FastAPI, Django, Flask, etc.) by analyzing GitHub issues, generating AST technical roadmaps, and providing multi-LLM co-pilot guidance powered by **Groq LPU**, **OpenRouter**, **Amazon Nova**, **OpenAI**, **Anthropic**, and **Google Gemini**.

## Visual Tenets & Design Rules

1. **Zero Decorative Noise (STRICT RULE):** Strictly no linear-gradient, no radial-gradient, no ambient outer glows, drop shadows, or blurred glassmorphism. Surfaces are opaque, flat, and absolute.
2. **Structural Orthogonality:** Clean 1px solid borders (`#262626`) demarcate structural panels. Information hierarchy is enforced via precision placement, spatial alignment, and rigid lines.
3. **High-Stakes Radiance:** Pitch obsidian backdrops are pierced exclusively by high-contrast kinetic orange/amber (`#e0681a`, `#f97316`), signaling real-time status, active routes, and performance telemetry without visual bloom.
4. **Information Density as Power:** Compact layouts maximize metric throughput (Groq LPU token speeds, Nova context windows, OpenRouter latency) while maintaining immediate readability through distinct typographical contrast.

## Colors

- **Canvas Base:** `#080808` (Deep obsidian ground plane).
- **Surface Level 1:** `#0d0d0d` (Primary cards, navigation, and module shells).
- **Surface Level 2:** `#141414` (Nested containers, inputs, table rows).
- **Surface Level 3:** `#1a1a1a` (Active selections, raised command fills).
- **Borders:** `#262626` (Default structural borders), `#e0681a` (Active focus/route).
- **Primary Accent:** `#e0681a` (Electric International Orange).
- **Secondary Accent:** `#f97316` (Amber Orange).
- **Text:** `#fafafa` (High emphasis), `#a3a3a3` (Medium emphasis), `#666666` (Muted labels).
- **Status Indicators:** `#22c55e` (Operational / Live), `#ef4444` (Halt / Alert), `#f59e0b` (Warning / Unset).

## Multi-LLM Provider Architecture

Vectr supports instant switching between 6 frontier and high-throughput inference engines:
- **Groq LPU:** Ultra-low latency inference (14ms, 820 t/s) running Llama 3.3 70B and DeepSeek R1.
- **OpenRouter Gateway:** Unified API gateway with access to 200+ models with multi-model fallback.
- **Amazon Nova (Bedrock):** AWS Bedrock models (Nova 2 Lite, Nova Pro, Nova Micro) for deep reasoning.
- **OpenAI:** GPT-4o and o3-mini for industry-standard code synthesis.
- **Anthropic Claude:** Claude 3.5 Sonnet for architectural diff reasoning.
- **Google Gemini:** Gemini 2.0 Flash with 2M token context window for full-repo indexation.

## Typography

- **Headings & Scaffolding:** `Inter` / `Geist` (600/700, -0.02em letter-spacing) in `#fafafa`.
- **Telemetry, Code & Metrics:** `JetBrains Mono` with `font-variant-numeric: tabular-nums` for issue numbers, latency figures (ms), throughput (t/s), and commit hashes.
