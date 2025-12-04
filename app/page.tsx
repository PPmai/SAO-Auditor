'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import LoadingPopup from './components/LoadingPopup';

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
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Starting analysis...');

  // Simulate progress during scan
  useEffect(() => {
    if (!loading) {
      setProgress(0);
      return;
    }

    // Start at 1%
    setProgress(1);
    setStatusMessage('Starting analysis...');

    // Simulate progress through 25 metrics (1 metric = 4%)
    const progressSteps = [
      { progress: 4, message: 'Fetching cloud data...' },
      { progress: 8, message: 'Scraping website content...' },
      { progress: 12, message: 'Analyzing HTML structure...' },
      { progress: 16, message: 'Checking schema markup...' },
      { progress: 20, message: 'Evaluating headings...' },
      { progress: 24, message: 'Counting images and videos...' },
      { progress: 28, message: 'Measuring Core Web Vitals...' },
      { progress: 32, message: 'Analyzing page speed...' },
      { progress: 36, message: 'Checking mobile performance...' },
      { progress: 40, message: 'Verifying SSL certificate...' },
      { progress: 44, message: 'Checking sitemap...' },
      { progress: 48, message: 'Chasing search spiders...' },
      { progress: 52, message: 'Fetching backlink data...' },
      { progress: 56, message: 'Counting backlinks...' },
      { progress: 60, message: 'Analyzing keyword rankings...' },
      { progress: 64, message: 'Detecting keywords...' },
      { progress: 68, message: 'Calculating positions...' },
      { progress: 72, message: 'Matching search intent...' },
      { progress: 76, message: 'Evaluating E-E-A-T signals...' },
      { progress: 80, message: 'Checking brand sentiment...' },
      { progress: 84, message: 'Purring at algorithms...' },
      { progress: 88, message: 'Calculating scores...' },
      { progress: 92, message: 'Generating insights...' },
      { progress: 96, message: 'Preparing recommendations...' },
      { progress: 100, message: 'Audit Complete! Meow!' },
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < progressSteps.length) {
        const step = progressSteps[currentStep];
        setProgress(step.progress);
        setStatusMessage(step.message);
        currentStep++;
      } else {
        clearInterval(interval);
      }
    }, 800); // Update every 800ms

    return () => clearInterval(interval);
  }, [loading]);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    setProgress(0);

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setResult(data);
      setProgress(100);
      setStatusMessage('Audit Complete! Meow!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      // Small delay to show 100% before closing
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  };

  const togglePillar = (pillar: string) => {
    setExpandedPillar(expandedPillar === pillar ? null : pillar);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#e0f2fe' }}>
      {/* Loading Popup */}
      {loading && <LoadingPopup progress={progress} statusMessage={statusMessage} />}
      
      {/* Header */}
      <header className="border-b border-slate-300/30 bg-white/50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-[#38bdf8] to-[#60a5fa] rounded-xl flex items-center justify-center">
              <span className="text-xl">🔍</span>
            </div>
            <div>
              <div className="text-xl font-bold text-slate-800">SAO Auditor</div>
              <div className="text-xs text-slate-600">Search & AI Optimization</div>
            </div>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/pricing" className="text-slate-600 hover:text-slate-800 transition">
              Pricing
            </Link>
            <Link href="/admin/login" className="text-slate-600 hover:text-slate-800 transition">
              Admin
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-gradient-to-r from-[#38bdf8] to-[#60a5fa] hover:from-[#60a5fa] hover:to-[#38bdf8] text-white rounded-lg transition shadow-md"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-slate-800 mb-6">
          Is Your Website Ready for
          <span className="bg-gradient-to-r from-[#38bdf8] to-[#60a5fa] bg-clip-text text-transparent"> AI Search</span>?
        </h1>
        <p className="text-xl text-slate-700 max-w-2xl mx-auto mb-4">
          <strong className="text-slate-800">SAO Auditor</strong> - Search & AI Optimization Analyzer
        </p>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-12">
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
              className="flex-1 px-6 py-4 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#38bdf8] shadow-sm"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-[#38bdf8] to-[#60a5fa] hover:from-[#60a5fa] hover:to-[#38bdf8] disabled:opacity-50 text-white font-semibold rounded-xl transition flex items-center gap-2 shadow-md"
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
            <div className="mt-4 p-4 bg-red-50 border border-red-300 rounded-lg text-red-700">
              {error}
            </div>
          )}
        </div>
      </section>

      {/* Detailed Result - Ahrefs Style */}
      {result && (
        <section className="max-w-7xl mx-auto px-4 pb-20">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-slate-800">Site Audit: {new URL(result.url).hostname}</h2>
              <span className="text-slate-600 text-sm">Last updated: {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>
            <p className="text-slate-600 text-sm">{result.url}</p>
          </div>

          {/* Top Cards Row - Site Health + Errors/Warnings/Notices */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            {/* Site Health Card */}
            <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: '#79B4EE' }}>
              <div className="text-sm text-slate-600 mb-4">Site Health</div>
              <div className="relative flex items-center justify-center mb-4">
                {/* Semi-circular progress bar */}
                <svg className="w-32 h-16 transform -rotate-90" viewBox="0 0 100 50">
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke={result.score >= 70 ? '#10b981' : result.score >= 50 ? '#eab308' : '#ef4444'}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(result.score / 100) * 251.2} 251.2`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-slate-800">{result.score}%</div>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-slate-600">Your site</span>
                  <span className="font-semibold text-slate-800">{result.score}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-slate-600">Top-10% websites</span>
                  <span className="font-semibold text-slate-800">92%</span>
                </div>
              </div>
            </div>

            {/* Errors Card */}
            <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: '#79B4EE' }}>
              <div className="text-sm text-slate-700 mb-2">Errors</div>
              <div className="text-3xl font-bold text-red-600 mb-1">
                {result.recommendations?.filter((r: any) => r.priority === 'HIGH').length || 0}
              </div>
              <div className="text-xs text-slate-600">Critical issues found</div>
            </div>

            {/* Warnings Card */}
            <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: '#79B4EE' }}>
              <div className="text-sm text-slate-700 mb-2">Warnings</div>
              <div className="text-3xl font-bold text-orange-600 mb-1">
                {result.recommendations?.filter((r: any) => r.priority === 'MEDIUM').length || 0}
              </div>
              <div className="text-xs text-slate-600">Needs attention</div>
            </div>

            {/* Notices Card */}
            <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: '#79B4EE' }}>
              <div className="text-sm text-slate-700 mb-2">Notices</div>
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {result.recommendations?.filter((r: any) => r.priority === 'LOW').length || 0}
              </div>
              <div className="text-xs text-slate-600">Optimization tips</div>
            </div>
          </div>

          {/* Warning card when data sources are missing or APIs failed */}
          {Array.isArray(result.warnings) && result.warnings.length > 0 && (
            <div className="mb-6 rounded-xl border border-red-400 bg-red-50 px-4 py-3 flex items-start gap-3 text-left">
              <div className="mt-0.5 text-red-600 text-xl">⚠️</div>
              <div>
                <p className="font-semibold text-red-800 mb-1">Pay attention!</p>
                <ul className="text-sm text-red-700 space-y-1">
                  {result.warnings.map((msg: string, idx: number) => (
                    <li key={idx}>{msg}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Thematic Reports Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {/* Content Structure Card */}
            <ThematicReportCard
              title="Content Structure"
              score={result.scores.contentStructure}
              maxScore={30}
              breakdown={result.scores.breakdown?.contentStructure}
              breakdownLabels={{
                schema: { label: 'Schema Markup', max: 8 },
                headings: { label: 'Heading Structure', max: 6 },
                multimodal: { label: 'Multimodal Content', max: 5 },
                imageAlt: { label: 'Image ALT Tags', max: 3 },
                tableLists: { label: 'Tables & Lists', max: 2 },
                directAnswer: { label: 'Direct Answer', max: 5 },
                contentGap: { label: 'Content Depth', max: 3 },
              }}
              definitions={METRIC_DEFINITIONS}
            />

            {/* Brand Ranking Card */}
            <ThematicReportCard
              title="Brand Ranking"
              score={result.scores.brandRanking}
              maxScore={10}
              breakdown={result.scores.breakdown?.brandRanking}
              breakdownLabels={{
                brandSearch: { label: 'Branded Search Rank', max: 5 },
                brandSentiment: { label: 'Brand Sentiment', max: 5 },
              }}
              definitions={METRIC_DEFINITIONS}
            />

            {/* Website Technical Card */}
            <ThematicReportCard
              title="Website Technical"
              score={result.scores.websiteTechnical || 0}
              maxScore={18}
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
            />

            {/* Keyword Visibility Card */}
            <ThematicReportCard
              title="Keyword Visibility"
              score={result.scores.keywordVisibility}
              maxScore={25}
              breakdown={result.scores.breakdown?.keywordVisibility}
              breakdownLabels={{
                keywords: { label: 'Organic Keywords', max: 10 },
                positions: { label: 'Average Position', max: 7.5 },
                intentMatch: { label: 'Search Intent Match', max: 7.5 },
              }}
              definitions={METRIC_DEFINITIONS}
            />

            {/* AI Trust Card */}
            <ThematicReportCard
              title="AI Trust"
              score={result.scores.aiTrust}
              maxScore={25}
              breakdown={result.scores.breakdown?.aiTrust}
              breakdownLabels={{
                backlinks: { label: 'Backlink Quality', max: 7.5 },
                referringDomains: { label: 'Referring Domains', max: 5 },
                sentiment: { label: 'AI Sentiment Score', max: 5 },
                eeat: { label: 'E-E-A-T Signals', max: 5 },
                local: { label: 'Local/GEO Signals', max: 2.5 },
              }}
              definitions={METRIC_DEFINITIONS}
            />
          </div>

          {/* What This Site Can Improve */}
          <div className="rounded-xl p-6 shadow-sm mb-6" style={{ backgroundColor: '#79B4EE' }}>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">What This Site Can Improve</h3>
            <div className="space-y-4">
              {result.recommendations && result.recommendations.length > 0 ? (
                result.recommendations.map((rec: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-l-4 ${
                      rec.priority === 'HIGH' ? 'bg-red-50 border-red-500' :
                      rec.priority === 'MEDIUM' ? 'bg-yellow-50 border-yellow-500' :
                      'bg-green-50 border-green-500'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg">{rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🟢'}</span>
                      <div className="flex-1">
                        {rec.metricName && rec.currentScore !== undefined && rec.maxScore !== undefined && (
                          <div className="text-sm font-semibold text-slate-700 mb-1">
                            {rec.metricName} {rec.currentScore.toFixed(1)}/{rec.maxScore} pts
                            {rec.pointsLost !== undefined && rec.pointsLost > 0 && (
                              <span className="text-red-600 ml-2">- Lost {rec.pointsLost.toFixed(1)} points</span>
                            )}
                          </div>
                        )}
                        <div className="text-slate-800 font-semibold mb-1">{rec.title}</div>
                        <div className="text-sm text-slate-700 mb-2">{rec.description}</div>
                        {rec.impact && (
                          <div className="text-xs text-slate-600 font-medium">{rec.impact}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-600 text-sm">No specific recommendations available. Your site is performing well!</div>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8 text-center">
            <Link
              href="/pricing"
              className="inline-block px-8 py-3 bg-gradient-to-r from-[#38bdf8] to-[#60a5fa] hover:from-[#60a5fa] hover:to-[#38bdf8] text-white font-semibold rounded-lg transition shadow-md"
            >
              Get Full Report with Competitors →
            </Link>
          </div>
        </section>
      )}

      {/* Features */}
      {!result && (
        <section className="max-w-7xl mx-auto px-4 py-20 border-t border-slate-300">
          <h2 className="text-3xl font-bold text-slate-800 text-center mb-12">
            5 Pillars of Search & AI Optimization
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <FeatureCard
              icon="📝"
              title="Content Structure"
              description="Schema markup, headings hierarchy, tables, and multimodal content analysis"
            />
            <FeatureCard
              icon="🏢"
              title="Brand Ranking"
              description="Branded search rank and community sentiment analysis"
            />
            <FeatureCard
              icon="⚙️"
              title="Website Technical"
              description="Core Web Vitals, mobile performance, SSL, and AI crawler compatibility"
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
      <footer className="border-t border-slate-300 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-[#38bdf8] to-[#60a5fa] rounded-lg flex items-center justify-center">
              <span className="text-sm">🔍</span>
            </div>
            <div>
              <span className="text-slate-800 font-semibold">SAO Auditor</span>
              <span className="text-slate-600 text-sm ml-2">by Conductor</span>
            </div>
          </div>
          <div className="text-slate-600 text-sm">
            © 2025 SAO Auditor. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm">
            <Link href="/pricing" className="text-slate-600 hover:text-slate-800">Pricing</Link>
            <Link href="/admin/login" className="text-slate-600 hover:text-slate-800">Admin</Link>
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
    <div className="rounded-xl border border-slate-300 overflow-hidden shadow-sm" style={{ backgroundColor: '#79B4EE' }}>
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-white/20 transition"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl text-slate-800">{title}</span>
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
          <span className="text-2xl font-bold text-slate-800">
            {score}<span className="text-sm text-slate-600">/{maxScore}</span>
          </span>
          <svg
            className={`w-5 h-5 text-slate-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
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
        <div className="w-full bg-white/40 rounded-full h-2">
          <div
            className={`${colorClasses.bg} h-2 rounded-full transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Expanded Breakdown */}
      {isExpanded && breakdown && (
        <div className="px-4 pb-4 space-y-6 border-t border-slate-300 mt-2 pt-4">
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
                  <span className="text-slate-700 flex items-center gap-2">
                    {label}
                    <InfoTooltip
                      metricKey={key}
                      definitions={definitions}
                      isActive={activeTooltip === key}
                      onToggle={() => setActiveTooltip(activeTooltip === key ? null : key)}
                    />
                  </span>
                  <div className="text-right">
                    <span className={`font-medium ${value >= max * 0.7 ? 'text-green-600' : value >= max * 0.4 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {value.toFixed(1)} / {max} pts
                    </span>
                    {item.value && (
                      <div className="text-xs text-slate-600 font-mono mt-0.5">
                        {item.value}
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-full bg-white/50 rounded-full h-1.5">
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
                  <div className="mt-2 text-xs bg-white/60 rounded-lg p-3 border border-slate-300">
                    {item.insight && (
                      <div className="flex gap-2 mb-1">
                        <span className="text-blue-700 font-semibold">Insight:</span>
                        <span className="text-slate-700">{item.insight}</span>
                      </div>
                    )}
                    {item.recommendation && (
                      <div className="flex gap-2">
                        <span className="text-emerald-700 font-semibold">Rec:</span>
                        <span className="text-slate-700">{item.recommendation}</span>
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

// Thematic Report Card Component (Ahrefs-style)
function ThematicReportCard({
  title,
  score,
  maxScore,
  breakdown,
  breakdownLabels,
  definitions,
}: {
  title: string;
  score: number;
  maxScore: number;
  breakdown?: Record<string, { score: number; value?: string | number; insight?: string; recommendation?: string }>;
  breakdownLabels: Record<string, { label: string; max: number }>;
  definitions: Record<string, { title: string; description: string; tips: string }>;
}) {
  const percentage = Math.round((score / maxScore) * 100);
  const colorClass = percentage >= 70 ? 'text-blue-600' : percentage >= 50 ? 'text-yellow-600' : 'text-red-600';
  const bgColorClass = percentage >= 70 ? 'bg-blue-50' : percentage >= 50 ? 'bg-yellow-50' : 'bg-red-50';

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-slate-800 text-sm">{title}</h4>
        <div className={`text-2xl font-bold ${colorClass}`}>{percentage}%</div>
      </div>
      
      {/* Circular Progress */}
      <div className="flex justify-center mb-4">
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20 transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="32"
              stroke="#e5e7eb"
              strokeWidth="6"
              fill="none"
            />
            <circle
              cx="40"
              cy="40"
              r="32"
              stroke={percentage >= 70 ? '#3b82f6' : percentage >= 50 ? '#eab308' : '#ef4444'}
              strokeWidth="6"
              fill="none"
              strokeDasharray={`${(percentage / 100) * 201} 201`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-lg font-bold ${colorClass}`}>{percentage}%</span>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown with Explanations */}
      {breakdown && (
        <div className="mt-4 space-y-4 border-t border-slate-200 pt-4">
          {Object.entries(breakdownLabels).map(([key, { label, max }]) => {
            const item = breakdown[key];
            if (!item) return null;
            
            const itemScore = typeof item === 'number' ? item : (item.score ?? 0);
            const itemPercentage = Math.round((itemScore / max) * 100);
            const itemValue = typeof item === 'object' ? item.value : undefined;
            const insight = typeof item === 'object' ? item.insight : undefined;
            const recommendation = typeof item === 'object' ? item.recommendation : undefined;

            return (
              <div key={key} className="space-y-2">
                {/* Metric Header */}
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-800">{label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {itemScore.toFixed(1)}/{max} pts ({itemPercentage}%)
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-semibold ${
                    itemPercentage >= 70 ? 'bg-green-100 text-green-700' :
                    itemPercentage >= 40 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {itemPercentage >= 70 ? 'Good' : itemPercentage >= 40 ? 'Fair' : 'Poor'}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      itemPercentage >= 70 ? 'bg-green-500' :
                      itemPercentage >= 40 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(itemPercentage, 100)}%` }}
                  ></div>
                </div>

                {/* WHY Explanation */}
                <div className="bg-white/60 rounded-lg p-3 text-xs border border-slate-300">
                  <div className="font-semibold text-slate-800 mb-1">Result:</div>
                  <div className="text-slate-700 leading-relaxed">
                    {insight ? (
                      <span>{insight}</span>
                    ) : itemValue ? (
                      <span>
                        {typeof itemValue === 'string' ? itemValue : `${label}: ${itemValue}`}
                      </span>
                    ) : (
                      <span>
                        {label} scored {itemScore.toFixed(1)}/{max} points.
                      </span>
                    )}
                  </div>
                  
                  {/* Recommendation if available */}
                  {recommendation && (
                    <div className="mt-2 pt-2 border-t border-slate-300">
                      <div className="font-semibold text-emerald-700 mb-1">💡 How to Improve:</div>
                      <div className="text-slate-700">{recommendation}</div>
                    </div>
                  )}
                </div>
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
    <div className="rounded-xl p-6 border border-slate-300 hover:border-[#38bdf8] transition shadow-sm" style={{ backgroundColor: '#79B4EE' }}>
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-700 text-sm">{description}</p>
    </div>
  );
}
