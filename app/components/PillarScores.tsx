'use client';

import { useState } from 'react';

interface PillarScoresProps {
  totalScore: number;
  contentStructure: number;
  brandRanking: number;
  websiteTechnical: number;
  keywordVisibility: number;
  aiTrust: number;
}

// Pillar definitions for tooltips
const PILLAR_DEFINITIONS: Record<string, { title: string; description: string; tips: string }> = {
  contentStructure: {
    title: 'Content Structure',
    description: 'How well your content is organized for AI comprehension: schema markup, headings hierarchy, multimodal content, tables/lists, direct answers, and content depth. Critical for AI Overviews citations.',
    tips: 'Add FAQ/HowTo/Article schema, use proper H1→H2→H3 hierarchy, include images with alt text, add comparison tables, start with direct answers, and cover topics comprehensively.',
  },
  brandRanking: {
    title: 'Brand Ranking',
    description: 'Brand signals: your ranking for brand keyword and community sentiment about your brand. Ranking #1 for your brand signals strong authority. Community sentiment (Pantip, Reddit, reviews) overrides PR.',
    tips: 'Rank #1 for your brand name. Build brand awareness through PR and social media. Monitor and respond to community sentiment on Pantip, Reddit, and review sites.',
  },
  websiteTechnical: {
    title: 'Website Technical',
    description: 'Core Web Vitals (LCP, INP, CLS), mobile performance, security (SSL/HTTPS), and AI crawler compatibility (LLMs.txt, sitemap). Fast, accessible sites rank better and provide better user experience.',
    tips: 'Optimize Core Web Vitals (LCP <2.5s, INP ≤200ms, CLS <0.1), ensure mobile responsiveness, use HTTPS, create /llms.txt, and submit valid sitemap.xml to Google Search Console.',
  },
  keywordVisibility: {
    title: 'Keyword Visibility',
    description: 'Your presence in search results: number of keywords ranking, average position, and search intent match. More keywords = more opportunities. Top 10 positions drive 90%+ of organic traffic.',
    tips: 'Create comprehensive content targeting multiple keywords. Build topic clusters. Aim for positions 1-10. Align content with search intent (Informational, Commercial, Transactional, Navigational).',
  },
  aiTrust: {
    title: 'AI Trust',
    description: 'Trustworthiness signals: backlink quality, referring domains, content sentiment, E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness), and local/GEO signals. Critical for YMYL topics.',
    tips: 'Earn quality backlinks from authoritative sites. Show author credentials and citations. Use professional, helpful tone. Add LocalBusiness schema for local businesses. Build E-E-A-T signals.',
  },
};

// Tooltip Component
function InfoTooltip({
  metricKey,
  definitions,
  isActive,
  onToggle,
}: {
  metricKey: string;
  definitions: Record<string, { title: string; description: string; tips: string }>;
  isActive: boolean;
  onToggle: () => void;
}) {
  const def = definitions[metricKey];
  if (!def) return null;

  return (
    <div className="relative inline-block">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="ml-1 w-4 h-4 rounded-full bg-gray-400 hover:bg-gray-500 text-white text-xs flex items-center justify-center transition"
        title="Click for more info"
      >
        ?
      </button>

      {isActive && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          />

          {/* Tooltip */}
          <div className="absolute z-50 left-0 top-6 w-72 p-4 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-white text-sm">{def.title}</h4>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle();
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-slate-300 text-xs mb-3">{def.description}</p>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2">
              <div className="text-emerald-400 text-xs font-medium mb-1">💡 Tips</div>
              <p className="text-slate-400 text-xs">{def.tips}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const PILLAR_CONFIG = [
  {
    name: 'Content Structure',
    key: 'contentStructure' as const,
    color: '#14b8a6',
    icon: '📝',
    max: 25,
  },
  {
    name: 'Brand Ranking',
    key: 'brandRanking' as const,
    color: '#84cc16',
    icon: '⭐',
    max: 9,
  },
  {
    name: 'Website Technical',
    key: 'websiteTechnical' as const,
    color: '#06b6d4',
    icon: '⚙️',
    max: 17,
  },
  {
    name: 'Keyword Visibility',
    key: 'keywordVisibility' as const,
    color: '#ec4899',
    icon: '🔍',
    max: 23,
  },
  {
    name: 'AI Trust',
    key: 'aiTrust' as const,
    color: '#3b82f6',
    icon: '🤖',
    max: 22,
  },
];

export default function PillarScores({
  totalScore,
  contentStructure,
  brandRanking,
  websiteTechnical,
  keywordVisibility,
  aiTrust,
}: PillarScoresProps) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 70) return 'Great';
    if (score >= 60) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Needs Improvement';
  };

  const getPercentage = (score: number, max: number) => {
    return Math.round((score / max) * 100);
  };

  const scores = {
    contentStructure,
    brandRanking,
    websiteTechnical,
    keywordVisibility,
    aiTrust,
  };

  return (
    <div className="rounded-3xl shadow-lg overflow-hidden bg-white w-full lg:w-1/3">
      {/* Summary Section */}
      <div className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Summary</h3>
        <div className="space-y-3">
          {PILLAR_CONFIG.map((pillar) => {
            const score = scores[pillar.key];
            const percentage = getPercentage(score, pillar.max);
            const pillarDef = PILLAR_DEFINITIONS[pillar.key];

            return (
              <div key={pillar.key} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{pillar.icon}</div>
                  <div className="flex items-center gap-1">
                    <div className="font-semibold text-gray-900">{pillar.name}</div>
                    {pillarDef && (
                      <InfoTooltip
                        metricKey={pillar.key}
                        definitions={PILLAR_DEFINITIONS}
                        isActive={activeTooltip === pillar.key}
                        onToggle={() => setActiveTooltip(activeTooltip === pillar.key ? null : pillar.key)}
                      />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <div
                    className="text-lg font-bold"
                    style={{ color: pillar.color }}
                  >
                    {percentage}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

