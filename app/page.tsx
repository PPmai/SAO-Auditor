'use client';

import { useState } from 'react';
import Link from 'next/link';

// Metric definitions/explanations
const METRIC_DEFINITIONS: Record<string, { title: string; description: string; tips: string }> = {
  // Content Structure
  schema: {
    title: 'Schema Markup',
    description: 'Structured data (JSON-LD) that helps search engines and AI understand your content.',
    tips: 'Add FAQ, HowTo, Article, or Product schema to earn maximum points. Use Google\'s Structured Data Testing Tool to validate.',
  },
  tableLists: {
    title: 'Tables & Lists',
    description: 'Structured content formats that AI can easily parse and extract information from.',
    tips: 'Include comparison tables, feature lists, and bullet points. AI assistants often pull data directly from tables.',
  },
  headings: {
    title: 'Heading Structure',
    description: 'Proper HTML heading hierarchy (H1 → H2 → H3) that creates a clear content outline.',
    tips: 'Use exactly one H1 per page. Follow with H2s for main sections and H3s for subsections. Never skip heading levels.',
  },
  multimodal: {
    title: 'Multimodal Content',
    description: 'Different content types (images, videos, infographics) that enhance understanding.',
    tips: 'Add images with descriptive alt text, embed relevant videos, and include infographics. This signals comprehensive content to AI.',
  },
  directAnswer: {
    title: 'Direct Answer (TL;DR)',
    description: 'Clear, concise answers at the beginning of content that AI can easily extract.',
    tips: 'Start your content with a brief summary or direct answer to the main question. This increases chances of being featured in AI responses.',
  },
  contentGap: {
    title: 'Content Depth',
    description: 'Comprehensive coverage of a topic compared to competitors.',
    tips: 'Cover all aspects of your topic thoroughly. Use tools like "People Also Ask" to find related questions to answer.',
  },

  // Website Technical (moved from Brand Ranking)
  lcp: {
    title: 'LCP (Largest Contentful Paint)',
    description: 'Time it takes for the largest visible element to load.',
    tips: 'Target: < 5 seconds for full score. Optimize images, use CDN.',
  },
  inp: {
    title: 'INP (Interaction to Next Paint)',
    description: 'Time from user interaction to browser response.',
    tips: 'Target: ≤ 200ms. Minimize JavaScript, break up long tasks.',
  },
  cls: {
    title: 'CLS (Cumulative Layout Shift)',
    description: 'Measures visual stability - how much elements shift during page load.',
    tips: 'Target: 0 for full score. Set explicit dimensions for images/videos.',
  },
  mobile: {
    title: 'Mobile Performance',
    description: 'How well your site performs on mobile devices.',
    tips: 'Use responsive design, optimize touch targets (48px minimum).',
  },
  ssl: {
    title: 'SSL/HTTPS Security',
    description: 'Secure connection that encrypts data between users and your website.',
    tips: 'HTTPS required for full score. Install SSL certificate (free via Let\'s Encrypt).',
  },
  brokenLinks: {
    title: 'Link Health',
    description: 'Quality of internal and external links - no broken links.',
    tips: 'Regularly audit links. Fix 404 errors and minimize redirect chains.',
  },
  llmsTxt: {
    title: 'LLMs.txt',
    description: 'AI-friendly file that helps LLM crawlers understand your site.',
    tips: 'Create /llms.txt or /llms-full.txt at your domain root.',
  },
  sitemap: {
    title: 'Sitemap.xml',
    description: 'XML sitemap with all required elements for proper indexing.',
    tips: 'Must include: urlset, loc, lastmod, changefreq, priority.',
  },

  // Brand Ranking
  brandSearch: {
    title: 'Branded Search Rank',
    description: 'Your ranking for your brand name keyword.',
    tips: 'Rank #1 for your brand name. Build brand awareness through PR and social.',
  },
  brandSentiment: {
    title: 'Brand Sentiment',
    description: 'Public sentiment about your brand from community sources.',
    tips: 'Monitor Pantip, Reddit, reviews. Community sentiment overrides PR.',
  },

  // Keyword Visibility
  keywords: {
    title: 'Organic Keywords Count',
    description: 'Number of keywords your site ranks for in search results.',
    tips: 'Create content targeting relevant keywords.',
  },
  positions: {
    title: 'Average Position',
    description: 'Average ranking position across all your keywords.',
    tips: 'Lower is better (position 1 = top). Focus on top 10 positions.',
  },
  intentMatch: {
    title: 'Search Intent Match',
    description: 'How well your content matches user search intent.',
    tips: 'Align content with: Informational, Commercial, Transactional, or Navigational intent.',
  },

  // AI Trust
  backlinks: {
    title: 'Backlink Quality',
    description: 'Links from other websites pointing to yours.',
    tips: 'Focus on earning links from authoritative, relevant sites.',
  },
  referringDomains: {
    title: 'Referring Domains',
    description: 'Number of unique websites linking to you.',
    tips: 'Aim for links from many different domains.',
  },
  sentiment: {
    title: 'Content Sentiment',
    description: 'How professional and positive your content tone is.',
    tips: 'Use professional language. Avoid aggressive sales tactics.',
  },
  eeat: {
    title: 'E-E-A-T Signals',
    description: 'Experience, Expertise, Authoritativeness, Trustworthiness.',
    tips: 'Show author, bio, credentials, citations, and dates.',
  },
  local: {
    title: 'Local/GEO Signals',
    description: 'Signals for local search and location-based AI results.',
    tips: 'Add LocalBusiness OR Organization schema, Google Maps, NAP.',
  },

  // Content Structure
  imageAlt: {
    title: 'Image ALT Tags',
    description: 'Alt text on images larger than 200x200px.',
    tips: 'Add descriptive ALT text to ≥2 images (>200px). Excludes logos/icons.',
  },
};

// Pillar definitions
const PILLAR_DEFINITIONS: Record<string, { title: string; description: string }> = {
  content: {
    title: 'Content Structure',
    description: 'How well your content is organized for AI comprehension: schema, headings, multimodal, tables/lists.',
  },
  brand: {
    title: 'Brand Ranking',
    description: 'Brand signals: your ranking for brand keyword and community sentiment about your brand.',
  },
  technical: {
    title: 'Website Technical',
    description: 'Core Web Vitals (LCP, INP, CLS), mobile performance, security, and AI crawler compatibility.',
  },
  keyword: {
    title: 'Keyword Visibility',
    description: 'Your presence in search results: keywords count, average positions, and intent match.',
  },
  trust: {
    title: 'AI Trust',
    description: 'Trustworthiness signals: backlinks, referring domains, content sentiment, E-E-A-T, and local signals.',
  },
};

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePillar = (pillar: string) => {
    setExpandedPillar(expandedPillar === pillar ? null : pillar);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
              <span className="text-xl">🔍</span>
            </div>
            <div>
              <div className="text-xl font-bold text-white">SAO Auditor</div>
              <div className="text-xs text-emerald-400">Search & AI Optimization</div>
            </div>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/pricing" className="text-slate-400 hover:text-white transition">
              Pricing
            </Link>
            <Link href="/admin/login" className="text-slate-400 hover:text-white transition">
              Admin
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
          Is Your Website Ready for
          <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent"> AI Search</span>?
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-4">
          <strong className="text-emerald-400">SAO Auditor</strong> - Search & AI Optimization Analyzer
        </p>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-12">
          Analyze your website's readiness for modern SEO, GEO, and AI-powered search engines.
          Get actionable insights to outrank your competitors.
        </p>

        {/* Quick Scan Form */}
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleScan} className="flex gap-4">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter your website URL"
              className="flex-1 px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white font-semibold rounded-xl transition flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Analyzing...
                </>
              ) : (
                <>🔍 Analyze</>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
              {error}
            </div>
          )}
        </div>
      </section>

      {/* Detailed Result */}
      {result && (
        <section className="max-w-5xl mx-auto px-4 pb-20">
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Analysis Results</h2>
                <p className="text-slate-400 text-sm mt-1 truncate max-w-md">{result.url}</p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${result.score >= 70 ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                result.score >= 50 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                  'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                {result.scoreLabel.label}
              </span>
            </div>

            {/* Total Score Circle */}
            <div className="flex items-center justify-center mb-8">
              <div className="relative">
                <div className={`w-40 h-40 rounded-full flex items-center justify-center ${result.score >= 70 ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                  result.score >= 50 ? 'bg-gradient-to-br from-yellow-500 to-orange-600' :
                    'bg-gradient-to-br from-red-500 to-rose-600'
                  }`}>
                  <div className="w-36 h-36 rounded-full bg-slate-900 flex flex-col items-center justify-center">
                    <span className="text-5xl font-bold text-white">{result.score}</span>
                    <span className="text-slate-400 text-sm">/100</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pillar Scores with Breakdowns */}
            <div className="space-y-4">
              {/* Content Structure */}
              <PillarCard
                pillarKey="content"
                title="📝 Content Structure"
                score={result.scores.contentStructure}
                maxScore={28}
                isExpanded={expandedPillar === 'content'}
                onToggle={() => togglePillar('content')}
                color="emerald"
                breakdown={result.scores.breakdown?.contentStructure}
                breakdownLabels={{
                  schema: { label: 'Schema Markup', max: 8 },
                  headings: { label: 'Heading Structure', max: 5 },
                  multimodal: { label: 'Multimodal Content', max: 4 },
                  imageAlt: { label: 'Image ALT Tags', max: 3 },
                  tableLists: { label: 'Tables & Lists', max: 2 },
                  directAnswer: { label: 'Direct Answer (TL;DR)', max: 5 },
                  contentGap: { label: 'Content Depth', max: 3 },
                }}
                definitions={METRIC_DEFINITIONS}
                pillarDefinition={PILLAR_DEFINITIONS.content}
                activeTooltip={activeTooltip}
                setActiveTooltip={setActiveTooltip}
              />

              {/* Brand Ranking - NEW (10 pts) */}
              <PillarCard
                pillarKey="brand"
                title="🏢 Brand Ranking"
                score={result.scores.brandRanking}
                maxScore={9}
                isExpanded={expandedPillar === 'brand'}
                onToggle={() => togglePillar('brand')}
                color="teal"
                breakdown={result.scores.breakdown?.brandRanking}
                breakdownLabels={{
                  brandSearch: { label: 'Branded Search Rank', max: 5 },
                  brandSentiment: { label: 'Brand Sentiment', max: 5 },
                }}
                definitions={METRIC_DEFINITIONS}
                pillarDefinition={PILLAR_DEFINITIONS.brand}
                activeTooltip={activeTooltip}
                setActiveTooltip={setActiveTooltip}
              />

              {/* Website Technical - NEW (18 pts) */}
              <PillarCard
                pillarKey="technical"
                title="⚙️ Website Technical"
                score={result.scores.websiteTechnical || 0}
                maxScore={17}
                isExpanded={expandedPillar === 'technical'}
                onToggle={() => togglePillar('technical')}
                color="sky"
                breakdown={result.scores.breakdown?.websiteTechnical}
                breakdownLabels={{
                  lcp: { label: 'LCP (Load Speed)', max: 3 },
                  inp: { label: 'INP (Interactivity)', max: 2 },
                  cls: { label: 'CLS (Visual Stability)', max: 2 },
                  mobile: { label: 'Mobile Performance', max: 3 },
                  ssl: { label: 'SSL/HTTPS Security', max: 3 },
                  brokenLinks: { label: 'Link Health', max: 2 },
                  llmsTxt: { label: 'LLMs.txt', max: 1.5 },
                  sitemap: { label: 'Sitemap.xml', max: 1.5 },
                }}
                definitions={METRIC_DEFINITIONS}
                pillarDefinition={{ title: 'Website Technical', description: 'Evaluates Core Web Vitals, security, and AI crawler compatibility.' }}
                activeTooltip={activeTooltip}
                setActiveTooltip={setActiveTooltip}
              />

              {/* Keyword Visibility */}
              <PillarCard
                pillarKey="keyword"
                title="🔍 Keyword Visibility"
                score={result.scores.keywordVisibility}
                maxScore={23}
                isExpanded={expandedPillar === 'keyword'}
                onToggle={() => togglePillar('keyword')}
                color="cyan"
                breakdown={result.scores.breakdown?.keywordVisibility}
                breakdownLabels={{
                  keywords: { label: 'Organic Keywords (vs SERP)', max: 10 },
                  positions: { label: 'Average Position', max: 7.5 },
                  intentMatch: { label: 'Search Intent Match', max: 7.5 },
                }}
                definitions={METRIC_DEFINITIONS}
                pillarDefinition={PILLAR_DEFINITIONS.keyword}
                activeTooltip={activeTooltip}
                setActiveTooltip={setActiveTooltip}
              />

              {/* AI Trust */}
              <PillarCard
                pillarKey="trust"
                title="🤖 AI Trust"
                score={result.scores.aiTrust}
                maxScore={23}
                isExpanded={expandedPillar === 'trust'}
                onToggle={() => togglePillar('trust')}
                color="sky"
                breakdown={result.scores.breakdown?.aiTrust}
                breakdownLabels={{
                  backlinks: { label: 'Backlink Quality', max: 7.5 },
                  referringDomains: { label: 'Referring Domains', max: 5 },
                  sentiment: { label: 'AI Sentiment Score', max: 5 },
                  eeat: { label: 'E-E-A-T Signals', max: 5 },
                  local: { label: 'Local/GEO Signals', max: 2.5 },
                }}
                definitions={METRIC_DEFINITIONS}
                pillarDefinition={PILLAR_DEFINITIONS.trust}
                activeTooltip={activeTooltip}
                setActiveTooltip={setActiveTooltip}
              />
            </div>

            {/* Recommendations */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-white mb-4">🎯 Top Recommendations</h3>
              <div className="space-y-3">
                {result.recommendations.slice(0, 5).map((rec: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-l-4 ${rec.priority === 'HIGH' ? 'bg-red-500/10 border-red-500' :
                      rec.priority === 'MEDIUM' ? 'bg-yellow-500/10 border-yellow-500' :
                        'bg-green-500/10 border-green-500'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg">{rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🟢'}</span>
                      <div className="flex-1">
                        <div className="text-white font-medium">{rec.title}</div>
                        <div className="text-sm text-slate-400 mt-1">{rec.description}</div>
                        <div className="text-xs text-slate-500 mt-2">{rec.impact}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="mt-8 text-center">
              <Link
                href="/pricing"
                className="inline-block px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition"
              >
                Get Full Report with Competitors →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      {!result && (
        <section className="max-w-7xl mx-auto px-4 py-20 border-t border-white/10">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            4 Pillars of Search & AI Optimization
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon="📝"
              title="Content Structure"
              description="Schema markup, headings hierarchy, tables, and multimodal content analysis"
            />
            <FeatureCard
              icon="🏢"
              title="Brand Ranking"
              description="Core Web Vitals, mobile-friendliness, SSL, and technical SEO signals"
            />
            <FeatureCard
              icon="🔍"
              title="Keyword Visibility"
              description="Organic keywords, traffic estimates, and search position tracking"
            />
            <FeatureCard
              icon="🤖"
              title="AI Trust"
              description="E-E-A-T signals, backlink quality, and sentiment analysis"
            />
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-sm">🔍</span>
            </div>
            <div>
              <span className="text-white font-semibold">SAO Auditor</span>
              <span className="text-slate-500 text-sm ml-2">by Conductor</span>
            </div>
          </div>
          <div className="text-slate-400 text-sm">
            © 2025 SAO Auditor. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm">
            <Link href="/pricing" className="text-slate-400 hover:text-white">Pricing</Link>
            <Link href="/admin/login" className="text-slate-400 hover:text-white">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

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
        className="ml-1 w-4 h-4 rounded-full bg-slate-600 hover:bg-slate-500 text-white text-xs flex items-center justify-center transition"
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

// Pillar Card Component with expandable breakdown
function PillarCard({
  pillarKey,
  title,
  score,
  maxScore,
  isExpanded,
  onToggle,
  color,
  breakdown,
  breakdownLabels,
  definitions,
  pillarDefinition,
  activeTooltip,
  setActiveTooltip,
}: {
  pillarKey: string;
  title: string;
  score: number;
  maxScore: number;
  isExpanded: boolean;
  onToggle: () => void;
  color: string;
  breakdown?: Record<string, { score: number; value?: string | number; insight?: string; recommendation?: string }>;
  breakdownLabels: Record<string, { label: string; max: number }>;
  definitions: Record<string, { title: string; description: string; tips: string }>;
  pillarDefinition: { title: string; description: string };
  activeTooltip: string | null;
  setActiveTooltip: (key: string | null) => void;
}) {
  const percentage = (score / maxScore) * 100;
  const colorClasses = {
    emerald: { bg: 'bg-emerald-500', border: 'border-emerald-500/30', text: 'text-emerald-400' },
    teal: { bg: 'bg-teal-500', border: 'border-teal-500/30', text: 'text-teal-400' },
    cyan: { bg: 'bg-cyan-500', border: 'border-cyan-500/30', text: 'text-cyan-400' },
    sky: { bg: 'bg-sky-500', border: 'border-sky-500/30', text: 'text-sky-400' },
    blue: { bg: 'bg-blue-500', border: 'border-blue-500/30', text: 'text-blue-400' },
    green: { bg: 'bg-green-500', border: 'border-green-500/30', text: 'text-green-400' },
    yellow: { bg: 'bg-yellow-500', border: 'border-yellow-500/30', text: 'text-yellow-400' },
    purple: { bg: 'bg-purple-500', border: 'border-purple-500/30', text: 'text-purple-400' },
  }[color] || { bg: 'bg-emerald-500', border: 'border-emerald-500/30', text: 'text-emerald-400' };

  return (
    <div className={`bg-white/5 rounded-xl border ${colorClasses.border} overflow-hidden`}>
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{title}</span>
          <InfoTooltip
            metricKey={pillarKey}
            definitions={{
              [pillarKey]: {
                title: pillarDefinition.title,
                description: pillarDefinition.description,
                tips: 'Expand this section to see detailed breakdown and tips for each metric.',
              },
            }}
            isActive={activeTooltip === `pillar-${pillarKey}`}
            onToggle={() => setActiveTooltip(activeTooltip === `pillar-${pillarKey}` ? null : `pillar-${pillarKey}`)}
          />
        </div>
        <div className="flex items-center gap-4">
          <span className={`text-2xl font-bold ${colorClasses.text}`}>
            {score}<span className="text-sm text-slate-500">/{maxScore}</span>
          </span>
          <svg
            className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Progress Bar */}
      <div className="px-4 pb-2">
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className={`${colorClasses.bg} h-2 rounded-full transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Expanded Breakdown */}
      {isExpanded && breakdown && (
        <div className="px-4 pb-4 space-y-6 border-t border-white/10 mt-2 pt-4">
          {Object.entries(breakdownLabels).map(([key, { label, max }]) => {
            // Handle both old format (number) and new format (object)
            const rawItem = breakdown[key];
            const item = typeof rawItem === 'number'
              ? { score: rawItem }
              : (rawItem || { score: 0 });
            const value = item.score ?? 0;
            const itemPercentage = (value / max) * 100;


            return (
              <div key={key} className="space-y-2">
                <div className="flex justify-between text-sm items-center">
                  <span className="text-slate-300 flex items-center gap-2">
                    {label}
                    <InfoTooltip
                      metricKey={key}
                      definitions={definitions}
                      isActive={activeTooltip === key}
                      onToggle={() => setActiveTooltip(activeTooltip === key ? null : key)}
                    />
                  </span>
                  <div className="text-right">
                    <span className={`font-medium ${value >= max * 0.7 ? 'text-green-400' : value >= max * 0.4 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {value.toFixed(1)} / {max} pts
                    </span>
                    {item.value && (
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        {item.value}
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-full bg-white/10 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${value >= max * 0.7 ? 'bg-green-500' :
                      value >= max * 0.4 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                    style={{ width: `${Math.min(itemPercentage, 100)}%` }}
                  ></div>
                </div>

                {/* Insights & Recommendations */}
                {(item.insight || item.recommendation) && (
                  <div className="mt-2 text-xs bg-white/5 rounded-lg p-3 border border-white/5">
                    {item.insight && (
                      <div className="flex gap-2 mb-1">
                        <span className="text-blue-400 font-semibold">Insight:</span>
                        <span className="text-slate-300">{item.insight}</span>
                      </div>
                    )}
                    {item.recommendation && (
                      <div className="flex gap-2">
                        <span className="text-emerald-400 font-semibold">Rec:</span>
                        <span className="text-slate-300">{item.recommendation}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-emerald-500/30 transition">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm">{description}</p>
    </div>
  );
}
