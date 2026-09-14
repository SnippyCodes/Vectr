---
# gstack: design-md-format=spec
name: Vectr
description: "The AI-Powered Mentor for Open Source Contributors in a sleek obsidian stealth developer cockpit"
colors:
  primary: "#22d3ee"
  on-primary: "#0c0c0c"
  surface: "#141416"
  surface-elevated: "#1a1a1e"
  canvas: "#0c0c0c"
  text: "#f4f4f5"
  text-muted: "#71717a"
  text-secondary: "#a1a1aa"
  border: "#26262a"
  border-subtle: "rgba(255, 255, 255, 0.08)"
  accent: "#22d3ee"
  accent-hover: "#06b6d4"
  nova-pink: "#ec4899"
  nova-violet: "#a855f7"
  success: "#4ade80"
  warning: "#facc15"
  error: "#f87171"
  info: "#38bdf8"
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
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    letterSpacing: "0.04em"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontFeature: "tnum"
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
  xl: "24px"
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
    border: "1px solid {colors.border-subtle}"
  input:
    backgroundColor: "{colors.surface-elevated}"
    borderColor: "{colors.border}"
    rounded: "{rounded.md}"
  nav-link:
    textColor: "{colors.text-secondary}"
---

# Vectr Design System

## Overview

**Creative North Star:** A sleek, high-precision obsidian developer cockpit that transforms complex open-source issue threads into structured, beginner-friendly contributions with Amazon Nova AI.

**Product Context:** Vectr bridges the gap between aspiring developers and major open source projects (FastAPI, Django, Flask, etc.) by analyzing GitHub issues, generating technical roadmaps, assisting with draft PRs, and providing persistent conversational mentorship.

**Mode per surface:**
- **Auth & Onboarding (Persuade):** High-impact split-screen with obsidian pitch-black canvas, Aceternity-inspired interactive showcase, and frictionless OAuth.
- **Dashboard (Operate):** Mission-control bento grid featuring active issue roadmaps, PR readiness, 52-week activity heatmap, and Nova AI mentorship velocity.
- **Issue Studio & Code Guidance (Read/Operate):** Split-pane workbench with file trees, diff viewers, and conversational AI co-pilot.

## Colors

**Strategy:** Restrained & Committed Obsidian.
- **Canvas:** `#0c0c0c` (Pure Obsidian, matching the login screen).
- **Surfaces:** `#121214` (Panels) and `#161618` (Cards).
- **Hairline Borders:** `rgba(255, 255, 255, 0.08)` and `#26262a`.
- **Primary Interaction Accent:** `#22d3ee` (Electric Cyan) providing high legibility and focus against dark backgrounds without visual fatigue.
- **Nova AI Signature:** Multi-stop gradient `#ec4899` → `#a855f7` → `#22d3ee` reserved exclusively for Amazon Nova intelligence elements.
- **No Muddy Blues:** Never use saturated navy backgrounds (`#080b1c`, `#0f1729`) or large blue blur orbs that wash out high-contrast UI.

## Typography

- **Headings & Display:** `Inter` (700/600, -0.02em letter-spacing) in `#f4f4f5`.
- **Body & Captions:** `Inter` (400/500) in neutral zinc `#a1a1aa` and `#71717a`.
- **Telemetry, Code & Metrics:** `JetBrains Mono` with `font-variant-numeric: tabular-nums` for issue numbers (`#4920`), commit SHAs, line numbers, and percentage counters.

## Layout & Elevation

- **Bento Grid Architecture:** Modular, scannable cards with consistent gaps (`gap-6` or `gap-4`).
- **Elevation:** Depth is achieved through border contrast (`border-white/[0.08]`) and subtle backdrop blur (`backdrop-blur-xl`), never through zero-offset colored glow halos.
- **Inner Padding:** Generous interior padding (`p-6` for hero cards, `p-4` for compact list items).

## Components & Experience

1. **Contributor Profile & Status:** Clear visual indicator of GitHub Personal Access Token (PAT) validity, GitHub identity, and experience tier (`Beginner`, `Intermediate`, `Expert`).
2. **Issue Roadmap Pipeline:** 4-step progressive state indicator:
   `[1. Summarize]` → `[2. Roadmap]` → `[3. Code Guidance]` → `[4. Draft PR]`.
3. **52-Week GitHub Heatmap:** Authentic developer activity visualizer demonstrating contributor consistency.
4. **Authentic Data:** No fake financial metrics, credit card numbers, or transaction logs. All items represent real GitHub issues, pull requests, repository stars, and language breakdowns.

## Do's and Don'ts

- **Do:** Keep background pitch-black `#0c0c0c` across all logged-in views to ensure seamless transition from login.
- **Do:** Use status-specific semantics (Emerald for merged, Amber for review, Cyan for working, Rose for rejected).
- **Don't:** Introduce blue or indigo cosmic orbs or radial background blobs.
- **Don't:** Mix fintech/banking terms (transactions, balances, accounts) into an open-source developer tool.
