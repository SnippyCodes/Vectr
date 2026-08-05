import React from "react";
import { cn } from "../lib/utils";
import { motion } from "motion/react";
import WorldMap from "./ui/world-map";

/**
 * Features section adapted from Aceternity UI, customized for Vectr.
 * Shows on the right side of the login page.
 */
export default function FeaturesSection() {
    const features = [
        {
            title: "AI-Powered Issue Discovery",
            description:
                "Find the perfect open source issues matched to your skill level using Amazon Nova AI.",
            skeleton: <SkeletonOne />,
            className:
                "col-span-1 lg:col-span-4 border-b lg:border-r border-[#1e1e1e]",
        },
        {
            title: "Smart Code Guidance",
            description:
                "Get AI-driven walkthroughs, summaries, and testing steps for every issue.",
            skeleton: <SkeletonTwo />,
            className: "border-b col-span-1 lg:col-span-2 border-[#1e1e1e]",
        },
        {
            title: "Auto Draft PRs",
            description:
                "Generate pull request drafts with AI-assisted diffs and commit analysis.",
            skeleton: <SkeletonThree />,
            className:
                "col-span-1 lg:col-span-3 lg:border-r border-[#1e1e1e]",
        },
        {
            title: "Global Open Source Impact",
            description:
                "Join thousands of developers contributing to projects around the world with Vectr.",
            skeleton: <SkeletonFour />,
            className: "col-span-1 lg:col-span-3 border-b lg:border-none",
        },
    ];

    return (
        <div className="login-right">
            <div className="login-features-wrapper">
                <div className="features-section">
                    <div className="features-header">
                        <h4 className="features-title">
                            Everything you need to contribute
                        </h4>
                        <p className="features-subtitle">
                            From AI-powered issue matching to automated PR drafts, Vectr
                            streamlines your open source journey end-to-end.
                        </p>
                    </div>
                    <div className="features-grid-wrapper">
                        <div className="features-grid">
                            {features.map((feature) => (
                                <FeatureCard key={feature.title} className={feature.className}>
                                    <FeatureTitle>{feature.title}</FeatureTitle>
                                    <FeatureDescription>{feature.description}</FeatureDescription>
                                    <div className="feature-skeleton-wrapper">{feature.skeleton}</div>
                                </FeatureCard>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const FeatureCard = ({ children, className }) => {
    return (
        <div className={cn("feature-card", className)}>
            {children}
        </div>
    );
};

const FeatureTitle = ({ children }) => {
    return <p className="feature-title">{children}</p>;
};

const FeatureDescription = ({ children }) => {
    return <p className="feature-description">{children}</p>;
};

/* ─── Skeleton One: Dashboard Preview ─────────────────────────────── */
const SkeletonOne = () => {
    return (
        <div className="skeleton-one">
            <div className="skeleton-one-card">
                <div className="skeleton-one-inner">
                    <img
                        src="/feature-dashboard.png"
                        alt="Vectr dashboard preview"
                        width={800}
                        height={800}
                        className="skeleton-one-img"
                    />
                </div>
            </div>
        </div>
    );
};

/* ─── Skeleton Two: Language Chips ────────────────────────────────── */
const SkeletonTwo = () => {
    const languagesRow1 = [
        { name: "Python", color: "#3572A5" },
        { name: "JavaScript", color: "#f1e05a" },
        { name: "TypeScript", color: "#3178c6" },
        { name: "Rust", color: "#dea584" },
        { name: "Go", color: "#00ADD8" },
    ];
    const languagesRow2 = [
        { name: "C++", color: "#f34b7d" },
        { name: "Ruby", color: "#701516" },
        { name: "Java", color: "#b07219" },
        { name: "Kotlin", color: "#A97BFF" },
        { name: "Swift", color: "#F05138" },
    ];

    return (
        <div className="skeleton-two">
            <div className="skeleton-two-fade-left"></div>
            <div className="skeleton-two-fade-right"></div>
            <div className="skeleton-two-row">
                {languagesRow1.map((lang, idx) => (
                    <motion.div
                        key={"row1-" + idx}
                        whileHover={{
                            scale: 1.05,
                            rotate: (Math.random() - 0.5) * 6,
                            zIndex: 20,
                        }}
                        className="skeleton-two-card"
                    >
                        <div className="skeleton-two-card-inner">
                            <span
                                className="skeleton-two-dot"
                                style={{ backgroundColor: lang.color }}
                            />
                            <span className="skeleton-two-name">{lang.name}</span>
                        </div>
                    </motion.div>
                ))}
            </div>
            <div className="skeleton-two-row" style={{ marginLeft: "20px" }}>
                {languagesRow2.map((lang, idx) => (
                    <motion.div
                        key={"row2-" + idx}
                        whileHover={{
                            scale: 1.05,
                            rotate: (Math.random() - 0.5) * 6,
                            zIndex: 20,
                        }}
                        className="skeleton-two-card"
                    >
                        <div className="skeleton-two-card-inner">
                            <span
                                className="skeleton-two-dot"
                                style={{ backgroundColor: lang.color }}
                            />
                            <span className="skeleton-two-name">{lang.name}</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

/* ─── Skeleton Three: Diff Preview ───────────────────────────────── */
const SkeletonThree = () => {
    return (
        <div className="skeleton-three">
            <div className="skeleton-three-inner">
                <div className="skeleton-diff">
                    <div className="skeleton-diff-header">
                        <span className="skeleton-diff-filename">
                            src/core/matching.py
                        </span>
                        <span className="skeleton-diff-badge">+12 -3</span>
                    </div>
                    <div className="skeleton-diff-body">
                        <div className="skeleton-diff-line skeleton-diff-context">
                            <span className="skeleton-diff-ln">14</span>
                            <span>def match_issues_to_user(user_profile):</span>
                        </div>
                        <div className="skeleton-diff-line skeleton-diff-remove">
                            <span className="skeleton-diff-ln">15</span>
                            <span>- score = simple_skill_match(user_profile)</span>
                        </div>
                        <div className="skeleton-diff-line skeleton-diff-add">
                            <span className="skeleton-diff-ln">15</span>
                            <span>+ score = nova_ai.calculate_embeddings(user_profile)</span>
                        </div>
                        <div className="skeleton-diff-line skeleton-diff-add">
                            <span className="skeleton-diff-ln">16</span>
                            <span>+ ranking = rank_by_difficulty_preference(score)</span>
                        </div>
                        <div className="skeleton-diff-line skeleton-diff-context">
                            <span className="skeleton-diff-ln">17</span>
                            <span> return ranking</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ─── Skeleton Four: World Map ──────────────────────────────────── */
const SkeletonFour = () => {
    return (
        <div className="skeleton-four">
            <WorldMap
                dots={[
                    {
                        start: { lat: 37.7749, lng: -122.4194 }, // SF
                        end: { lat: 51.5074, lng: -0.1278 }, // London
                    },
                    {
                        start: { lat: 51.5074, lng: -0.1278 }, // London
                        end: { lat: 28.6139, lng: 77.209 }, // New Delhi
                    },
                    {
                        start: { lat: 28.6139, lng: 77.209 }, // New Delhi
                        end: { lat: 35.6762, lng: 139.6503 }, // Tokyo
                    },
                    {
                        start: { lat: -33.8688, lng: 151.2093 }, // Sydney
                        end: { lat: 37.7749, lng: -122.4194 }, // SF
                    },
                ]}
            />
        </div>
    );
};
