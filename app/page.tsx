'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import LoadingPopup from './components/LoadingPopup';
import SiteHealth from './components/SiteHealth';
import PillarScores from './components/PillarScores';

// Metric definitions/explanations
const METRIC_DEFINITIONS: Record<string, { title: string; description: string; tips: string }> = {
  // Content Structure
  schema: {
    title: 'Schema Markup',
    description: 'Structured data (JSON-LD) that helps search engines and AI understand your content. Critical for AI Overviews citations and rich results.',
    tips: 'Add FAQ, HowTo, Article, or Product schema to earn maximum points. Use Google\'s Structured Data Testing Tool to validate.',
  },
  tableLists: {
    title: 'Tables & Lists',
    description: 'Structured content formats that AI can easily parse and extract information from. AI assistants often pull data directly from tables.',
    tips: 'Include comparison tables, feature lists, and bullet points. Tables increase chances of being cited in AI responses.',
  },
  headings: {
    title: 'Heading Structure',
    description: 'Proper HTML heading hierarchy (H1 → H2 → H3) that creates a clear content outline. Helps AI understand content structure and extract key information.',
    tips: 'Use exactly one H1 per page. Follow with H2s for main sections and H3s for subsections. Never skip heading levels.',
  },
  multimodal: {
    title: 'Multimodal Content',
    description: 'Different content types (images, videos, infographics) that enhance understanding. AI systems use images (via alt text) and videos (via transcripts) to understand content better.',
    tips: 'Add images with descriptive alt text, embed relevant videos with transcripts, and include infographics. Multimodal content increases AI citation probability by 25%+.',
  },
  directAnswer: {
    title: 'Direct Answer (TL;DR)',
    description: 'Clear, concise answers at the beginning of content that AI can easily extract. AI systems prioritize content that answers queries in the first 50-100 words.',
    tips: 'Start your content with a brief summary or direct answer to the main question. Use the "inverted pyramid" approach (answer first, details later).',
  },
  contentGap: {
    title: 'Content Depth',
    description: 'Comprehensive coverage of a topic compared to competitors. More thorough content signals authority and increases chances of being cited by AI.',
    tips: 'Cover all aspects of your topic thoroughly. Use tools like "People Also Ask" to find related questions to answer. Aim for 2,000+ words for comprehensive topics.',
  },
  imageAlt: {
    title: 'Image ALT Tags',
    description: 'Descriptive text for images that helps accessibility and AI understanding. AI can extract information from images via alt text, enabling visual content citations.',
    tips: 'Add descriptive alt text to all images >200px. Describe what the image shows in detail (not just "image" or "photo"). Aim for 80%+ coverage.',
  },

  // Website Technical
  lcp: {
    title: 'LCP (Largest Contentful Paint)',
    description: 'Time it takes for the largest visible element to load. Measures loading performance - when main content becomes visible. Critical Core Web Vitals metric.',
    tips: 'Target: < 2.5 seconds for full score. Optimize images (WebP/AVIF), use CDN, preload LCP image, minimize server response time (TTFB < 800ms).',
  },
  inp: {
    title: 'INP (Interaction to Next Paint)',
    description: 'Time from user interaction to browser response. Measures responsiveness - how quickly the page responds to clicks, taps, or keyboard input. Replaces FID in 2024.',
    tips: 'Target: ≤ 200ms for full score. Minimize JavaScript, break up long tasks (>50ms), defer non-critical scripts, use web workers for heavy computations.',
  },
  cls: {
    title: 'CLS (Cumulative Layout Shift)',
    description: 'Measures visual stability - how much elements shift during page load. Prevents unexpected layout jumps that hurt user experience.',
    tips: 'Target: < 0.1 for full score. Set explicit width/height on images/videos, reserve space for ads/embeds, use font-display: swap for web fonts.',
  },
  mobile: {
    title: 'Mobile Performance',
    description: 'How well your site performs on mobile devices. Most searches happen on mobile - poor mobile experience hurts rankings and user satisfaction.',
    tips: 'Use responsive design, optimize touch targets (48px minimum), test on real devices, minimize mobile-specific JavaScript.',
  },
  ssl: {
    title: 'SSL/HTTPS Security',
    description: 'Secure connection that encrypts data between users and your website. Required for rankings and user trust. Google penalizes non-HTTPS sites.',
    tips: 'HTTPS required for full score. Install SSL certificate (free via Let\'s Encrypt). Ensure all resources load over HTTPS (no mixed content).',
  },
  brokenLinks: {
    title: 'Link Health',
    description: 'Quality of internal and external links - no broken links. Broken links hurt user experience, crawlability, and can reduce trust signals.',
    tips: 'Regularly audit links. Fix 404 errors and minimize redirect chains. Use tools like Screaming Frog or Ahrefs to find broken links.',
  },
  llmsTxt: {
    title: 'LLMs.txt',
    description: 'AI-friendly file that helps LLM crawlers understand your site. Similar to robots.txt but for AI systems. Helps AI discover and understand your content structure.',
    tips: 'Create /llms.txt or /llms-full.txt at your domain root. Include sitemap URLs, important pages, and content guidelines. This helps AI systems discover your content.',
  },
  sitemap: {
    title: 'Sitemap.xml',
    description: 'XML sitemap with all required elements for proper indexing. Helps search engines and AI crawlers discover all your important pages efficiently.',
    tips: 'Must include: urlset, loc, lastmod, changefreq, priority. Submit to Google Search Console. Keep sitemap updated when pages change.',
  },

  // Brand Ranking
  brandSearch: {
    title: 'Branded Search Rank',
    description: 'Your ranking for your brand name keyword. Ranking #1 for your brand signals strong brand authority and trust. Critical for brand recognition.',
    tips: 'Rank #1 for your brand name. Build brand awareness through PR, social media, and consistent branding. Monitor brand search volume monthly.',
  },
  brandSentiment: {
    title: 'Brand Sentiment',
    description: 'Public sentiment about your brand from community sources (Pantip, Reddit, reviews). Community sentiment overrides PR - real user opinions matter more.',
    tips: 'Monitor Pantip, Reddit, review sites. Respond to negative sentiment professionally. Build positive community presence through authentic engagement.',
  },

  // Keyword Visibility
  keywords: {
    title: 'Organic Keywords Count',
    description: 'Number of keywords your site ranks for in search results. More keywords = more opportunities to rank and drive traffic. Keyword diversity reduces dependency on single rankings.',
    tips: 'Create comprehensive content targeting multiple related keywords. Build topic clusters. Target long-tail keywords (3-5 word phrases) for easier wins. Aim for 100+ keywords.',
  },
  positions: {
    title: 'Average Position',
    description: 'Average ranking position across all your keywords. Lower is better (position 1 = top). Top 10 positions drive 90%+ of organic traffic.',
    tips: 'Aim for positions 1-10. Improve content quality, relevance, and E-E-A-T signals. Monitor position changes monthly and optimize pages losing positions.',
  },
  intentMatch: {
    title: 'Search Intent Match',
    description: 'How well your content matches user search intent (Informational, Commercial, Transactional, Navigational). Matching intent increases click-through rates and conversions.',
    tips: 'Align content with search intent: Informational (guides, how-tos), Commercial (comparisons, reviews), Transactional (buy, sign up), Navigational (find website).',
  },

  // AI Trust
  backlinks: {
    title: 'Backlink Quality',
    description: 'Links from other websites pointing to yours. Quality backlinks from authoritative, relevant sites signal trust and authority to search engines and AI systems.',
    tips: 'Focus on earning links from authoritative, relevant sites. Avoid spam links. Quality over quantity - 10 quality links beat 1000 spam links.',
  },
  referringDomains: {
    title: 'Referring Domains',
    description: 'Number of unique websites linking to you. More diverse referring domains signal broader authority and trust. Better than many links from few domains.',
    tips: 'Aim for links from many different domains. Build relationships, create linkable assets, engage in digital PR. Target 50+ referring domains for competitive keywords.',
  },
  sentiment: {
    title: 'AI Sentiment Score',
    description: 'How professional and positive your content tone is. AI systems evaluate sentiment when deciding whether to cite content. Professional, helpful tone performs better.',
    tips: 'Use professional, helpful language. Avoid aggressive sales tactics. Focus on providing value and solving problems. Positive sentiment increases AI citation chances.',
  },
  eeat: {
    title: 'E-E-A-T Signals',
    description: 'Experience, Expertise, Authoritativeness, Trustworthiness. Critical for YMYL (Your Money Your Life) topics. Shows Google and AI that your content is credible and trustworthy.',
    tips: 'Show author bio with credentials, include publication dates, cite authoritative sources, add author photos. For YMYL topics, require expert authors with verifiable credentials.',
  },
  local: {
    title: 'Local/GEO Signals',
    description: 'Signals for local search and location-based AI results. Important for businesses serving specific geographic areas. Helps AI understand your location and service area.',
    tips: 'Add LocalBusiness OR Organization schema with address, add Google Maps embed, include NAP (Name, Address, Phone) consistently across site, create location-specific pages.',
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
  const [expandedMetrics, setExpandedMetrics] = useState<Record<string, boolean>>({});
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Starting analysis...');
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCompleteRef = useRef(false);

  // Simulate progress during scan
  useEffect(() => {
    if (!loading) {
      setProgress(0);
      isCompleteRef.current = false;
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      return;
    }

    // Reset completion flag
    isCompleteRef.current = false;

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
    progressIntervalRef.current = setInterval(() => {
      // Stop if API response is complete
      if (isCompleteRef.current) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        return;
      }

      if (currentStep < progressSteps.length) {
        const step = progressSteps[currentStep];
        setProgress(step.progress);
        setStatusMessage(step.message);
        currentStep++;
      } else {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      }
    }, 800); // Update every 800ms

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
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
            <Link
              href="/login"
              className="px-4 py-2 bg-gradient-to-r from-[#38bdf8] to-[#60a5fa] hover:from-[#60a5fa] hover:to-[#38bdf8] text-white rounded-lg transition shadow-md"
            >
              Log In
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

          {/* Site Health and Summary - Side by side on desktop, stacked on mobile */}
          <div className="mb-6 flex flex-col lg:flex-row gap-6">
            <SiteHealth
              score={result.score}
              errors={result.recommendations?.filter((r: any) => r.priority === 'HIGH' || !r.priority).length || 0}
              warnings={result.recommendations?.filter((r: any) => r.priority === 'MEDIUM').length || 0}
              notices={result.recommendations?.filter((r: any) => r.priority === 'LOW').length || 0}
            />
            <PillarScores
              totalScore={result.score}
              contentStructure={result.scores?.contentStructure || 0}
              brandRanking={result.scores?.brandRanking || 0}
              websiteTechnical={result.scores?.websiteTechnical || 0}
              keywordVisibility={result.scores?.keywordVisibility || 0}
              aiTrust={result.scores?.aiTrust || 0}
            />
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

          {/* Pillars - Full Width */}
          <div className="space-y-6 mb-8">
            {/* Content Structure Pillar */}
            <PillarSection
              title="Content Structure"
              score={result.scores.contentStructure}
              maxScore={25}
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
              activeTooltip={activeTooltip}
              setActiveTooltip={setActiveTooltip}
              pillarKey="contentStructure"
              expandedMetrics={expandedMetrics}
              setExpandedMetrics={setExpandedMetrics}
            />

            {/* Brand Ranking Pillar */}
            <PillarSection
              title="Brand Ranking"
              score={result.scores.brandRanking}
              maxScore={9}
              breakdown={result.scores.breakdown?.brandRanking}
              breakdownLabels={{
                brandSearch: { label: 'Branded Search Rank', max: 5 },
                brandSentiment: { label: 'Brand Sentiment', max: 5 },
              }}
              definitions={METRIC_DEFINITIONS}
              activeTooltip={activeTooltip}
              setActiveTooltip={setActiveTooltip}
              pillarKey="brandRanking"
              expandedMetrics={expandedMetrics}
              setExpandedMetrics={setExpandedMetrics}
            />

            {/* Website Technical Pillar */}
            <PillarSection
              title="Website Technical"
              score={result.scores.websiteTechnical || 0}
              maxScore={17}
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
              activeTooltip={activeTooltip}
              setActiveTooltip={setActiveTooltip}
              pillarKey="websiteTechnical"
              expandedMetrics={expandedMetrics}
              setExpandedMetrics={setExpandedMetrics}
            />

            {/* Keyword Visibility Pillar */}
            <PillarSection
              title="Keyword Visibility"
              score={result.scores.keywordVisibility}
              maxScore={23}
              breakdown={result.scores.breakdown?.keywordVisibility}
              breakdownLabels={{
                keywords: { label: 'Organic Keywords', max: 10 },
                positions: { label: 'Average Position', max: 7.5 },
                intentMatch: { label: 'Search Intent Match', max: 7.5 },
              }}
              definitions={METRIC_DEFINITIONS}
              activeTooltip={activeTooltip}
              setActiveTooltip={setActiveTooltip}
              pillarKey="keywordVisibility"
              expandedMetrics={expandedMetrics}
              setExpandedMetrics={setExpandedMetrics}
            />

            {/* AI Trust Pillar */}
            <PillarSection
              title="AI Trust"
              score={result.scores.aiTrust}
              maxScore={22}
              breakdown={result.scores.breakdown?.aiTrust}
              breakdownLabels={{
                backlinks: { label: 'Backlink Quality', max: 7.5 },
                referringDomains: { label: 'Referring Domains', max: 5 },
                sentiment: { label: 'AI Sentiment Score', max: 5 },
                eeat: { label: 'E-E-A-T Signals', max: 5 },
                local: { label: 'Local/GEO Signals', max: 2.5 },
              }}
              definitions={METRIC_DEFINITIONS}
              activeTooltip={activeTooltip}
              setActiveTooltip={setActiveTooltip}
              pillarKey="aiTrust"
              expandedMetrics={expandedMetrics}
              setExpandedMetrics={setExpandedMetrics}
            />
          </div>

          {/* What This Site Can Improve */}
          <div className="rounded-xl p-6 shadow-sm mb-6" style={{ backgroundColor: '#79B4EE' }}>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">What This Site Can Improve</h3>
            <div className="space-y-4">
              {result.recommendations && result.recommendations.length > 0 ? (
                result.recommendations
                  .filter((rec: any) => rec.priority === 'HIGH' || rec.priority === 'MEDIUM' || rec.priority === 'LOW')
                  .map((rec: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border-l-4 ${
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
            <Link href="/login" className="text-slate-600 hover:text-slate-800">Log In</Link>
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
    <div 
      className={`bg-white overflow-hidden transition-all duration-300 ${
        isExpanded ? 'rounded-2xl shadow-lg' : 'rounded-full shadow-sm'
      }`}
      style={{ 
        boxShadow: isExpanded 
          ? '0 15px 40px -5px rgba(0,0,0,0.1)' 
          : '0 2px 8px rgba(0,0,0,0.05)'
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-8 py-5 hover:bg-gray-50 transition cursor-pointer"
        style={{ userSelect: 'none' }}
      >
        <div className="flex items-center gap-4">
          <div 
            className="w-6 h-6 rounded-full border-2 border-gray-900 flex items-center justify-center flex-shrink-0 font-bold text-sm"
          >
            ?
          </div>
          <div className="flex items-center gap-3">
            <span className="text-base font-semibold text-gray-900">{title}</span>
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
        </div>
        <div className="flex items-center gap-4">
          <div 
            className="px-4 py-1.5 rounded-full text-xs font-semibold"
            style={{ 
              background: '#EEF2FF', 
              color: '#0062FF' 
            }}
          >
            {Math.round(percentage)}%
          </div>
          <svg
            className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            style={{ color: isExpanded ? '#0062FF' : '#9CA3AF' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Breakdown */}
      <div 
        className={`overflow-hidden transition-all duration-300 ${
          isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {isExpanded && breakdown && (
          <div className="px-8 pb-8 pt-0 space-y-6" style={{ paddingLeft: '72px' }}>
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
    </div>
  );
}

// Pillar Section Component - Full Width with Individual Metric Dropdowns
function PillarSection({
  title,
  score,
  maxScore,
  breakdown,
  breakdownLabels,
  definitions,
  activeTooltip,
  setActiveTooltip,
  pillarKey,
  expandedMetrics,
  setExpandedMetrics,
}: {
  title: string;
  score: number;
  maxScore: number;
  breakdown?: Record<string, { score: number; value?: string | number; insight?: string; recommendation?: string }>;
  breakdownLabels: Record<string, { label: string; max: number }>;
  definitions: Record<string, { title: string; description: string; tips: string }>;
  activeTooltip: string | null;
  setActiveTooltip: (key: string | null) => void;
  pillarKey: string;
  expandedMetrics: Record<string, boolean>;
  setExpandedMetrics: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  const percentage = Math.round((score / maxScore) * 100);

  return (
    <div className="w-full rounded-xl overflow-hidden" style={{ backgroundColor: '#365069' }}>
      {/* Pillar Header */}
      <div className="px-8 py-6 text-center">
        <h3 className="text-3xl font-bold text-white">{title}</h3>
      </div>

      {/* Metrics Dropdowns */}
      <div className="px-6 pb-6 space-y-3">
        {breakdown && Object.entries(breakdownLabels).map(([key, { label, max }]) => {
          const item = breakdown[key];
          if (!item) return null;
          
          const itemScore = typeof item === 'number' ? item : (item.score ?? 0);
          const cappedScore = Math.min(itemScore, max); // Cap score at max
          const itemPercentage = Math.round((cappedScore / max) * 100);
          const itemValue = typeof item === 'object' ? item.value : undefined;
          const insight = typeof item === 'object' ? item.insight : undefined;
          const recommendation = typeof item === 'object' ? item.recommendation : undefined;
          const metricKey = `${pillarKey}-${key}`;
          const isExpanded = expandedMetrics[metricKey] || false;

          return (
            <MetricDropdown
              key={key}
              label={label}
              score={cappedScore}
              max={max}
              percentage={itemPercentage}
              value={itemValue}
              insight={insight}
              recommendation={recommendation}
              definition={definitions[key]}
              metricKey={key}
              activeTooltip={activeTooltip}
              setActiveTooltip={setActiveTooltip}
              isExpanded={isExpanded}
              onToggle={() => setExpandedMetrics(prev => ({ ...prev, [metricKey]: !prev[metricKey] }))}
            />
          );
        })}
      </div>
    </div>
  );
}

// Individual Metric Dropdown Component
function MetricDropdown({
  label,
  score,
  max,
  percentage,
  value,
  insight,
  recommendation,
  definition,
  metricKey,
  activeTooltip,
  setActiveTooltip,
  isExpanded,
  onToggle,
  breakdown,
}: {
  label: string;
  score: number;
  max: number;
  percentage: number;
  value?: string | number;
  insight?: string;
  recommendation?: string;
  definition?: { title: string; description: string; tips: string };
  metricKey: string;
  activeTooltip: string | null;
  setActiveTooltip: (key: string | null) => void;
  isExpanded: boolean;
  onToggle: () => void;
  breakdown?: Record<string, { score: number; value?: string | number; insight?: string; recommendation?: string; isEstimation?: boolean }>;
}) {
  return (
    <div className="w-full">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4 rounded-lg transition-all duration-300 hover:opacity-90"
        style={{ 
          backgroundColor: '#42a5f5',
          border: '1px solid #365069'
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-white font-medium">{label}</span>
          {definition && (
            <InfoTooltip
              metricKey={metricKey}
              definitions={{ [metricKey]: definition }}
              isActive={activeTooltip === metricKey}
              onToggle={() => setActiveTooltip(activeTooltip === metricKey ? null : metricKey)}
            />
          )}
          {/* Show estimation badge if this metric uses estimation */}
          {breakdown?.[metricKey]?.isEstimation && (
            <span className="px-2 py-0.5 rounded text-xs font-semibold text-red-600 bg-white border border-red-600">
              estimation
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-white transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded Content */}
      <div 
        className={`overflow-hidden transition-all duration-300 ${
          isExpanded ? 'max-h-[5000px] opacity-100 mt-3' : 'max-h-0 opacity-0'
        }`}
      >
        {isExpanded && (
          <div 
            className="px-6 py-4 rounded-lg"
            style={{ 
              backgroundColor: '#42a5f5',
              border: '1px solid #365069'
            }}
          >
            <div className="space-y-4">
              {/* Score Display */}
              <div className="flex items-center justify-between">
                <span className="text-white text-sm font-medium">
                  {Math.min(score, max).toFixed(1)}/{max} pts ({Math.min(Math.round((score / max) * 100), 100)}%)
                </span>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  percentage >= 70 ? 'bg-green-100 text-green-700' :
                  percentage >= 40 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {percentage >= 70 ? 'Good' : percentage >= 40 ? 'Fair' : 'Poor'}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white/30 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    percentage >= 70 ? 'bg-green-500' :
                    percentage >= 40 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
              </div>

              {/* Result & Recommendations */}
              <div className="bg-white/20 rounded-lg p-4 text-sm text-white">
                <div className="font-semibold mb-2">Result:</div>
                <div className="text-white/90 leading-relaxed mb-3">
                  {insight || (value ? `${label}: ${value}` : `${label} scored ${score.toFixed(1)}/${max} points.`)}
                </div>
                
                {recommendation && (
                  <div className="mt-3 pt-3 border-t border-white/30">
                    <div className="font-semibold mb-2">💡 How to Improve:</div>
                    <div className="text-white/90 leading-relaxed">{recommendation}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Thematic Report Card Component (Accordion-style) - Keep for backward compatibility
function ThematicReportCard({
  title,
  score,
  maxScore,
  breakdown,
  breakdownLabels,
  definitions,
  activeTooltip,
  setActiveTooltip,
  metricKey,
  isExpanded,
  onToggle,
}: {
  title: string;
  score: number;
  maxScore: number;
  breakdown?: Record<string, { score: number; value?: string | number; insight?: string; recommendation?: string }>;
  breakdownLabels: Record<string, { label: string; max: number }>;
  definitions: Record<string, { title: string; description: string; tips: string }>;
  activeTooltip: string | null;
  setActiveTooltip: (key: string | null) => void;
  metricKey: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const percentage = Math.round((score / maxScore) * 100);
  const colorClass = percentage >= 70 ? 'text-blue-600' : percentage >= 50 ? 'text-yellow-600' : 'text-red-600';
  const bgColorClass = percentage >= 70 ? 'bg-blue-50' : percentage >= 50 ? 'bg-yellow-50' : 'bg-red-50';

  return (
    <div 
      className={`bg-white overflow-hidden transition-all duration-300 ${
        isExpanded ? 'rounded-2xl shadow-lg' : 'rounded-full shadow-sm'
      }`}
      style={{ 
        boxShadow: isExpanded 
          ? '0 15px 40px -5px rgba(0,0,0,0.1)' 
          : '0 2px 8px rgba(0,0,0,0.05)'
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-8 py-5 hover:bg-gray-50 transition cursor-pointer"
        style={{ userSelect: 'none' }}
      >
        <div className="flex items-center gap-4">
          <div 
            className="w-6 h-6 rounded-full border-2 border-gray-900 flex items-center justify-center flex-shrink-0 font-bold text-sm"
          >
            ?
          </div>
          <div className="flex items-center gap-3">
            <span className="text-base font-semibold text-gray-900">{title}</span>
            <InfoTooltip
              metricKey={metricKey}
              definitions={definitions}
              isActive={activeTooltip === metricKey}
              onToggle={() => setActiveTooltip(activeTooltip === metricKey ? null : metricKey)}
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div 
            className="px-4 py-1.5 rounded-full text-xs font-semibold"
            style={{ 
              background: '#EEF2FF', 
              color: '#0062FF' 
            }}
          >
            {percentage}%
          </div>
          <svg
            className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            style={{ color: isExpanded ? '#0062FF' : '#9CA3AF' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      <div 
        className={`overflow-hidden transition-all duration-300 ${
          isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {isExpanded && (
          <div className="px-8 pb-8 pt-0" style={{ paddingLeft: '72px' }}>
            {/* Detailed Breakdown with Explanations */}
            {breakdown && (
              <div className="mt-4 space-y-4">
          {Object.entries(breakdownLabels).map(([key, { label, max }]) => {
            const item = breakdown[key];
            if (!item) return null;
            
            const itemScore = typeof item === 'number' ? item : (item.score ?? 0);
            const itemPercentage = Math.round((itemScore / max) * 100);
            const itemValue = typeof item === 'object' ? item.value : undefined;
            const insight = typeof item === 'object' ? item.insight : undefined;
            const recommendation = typeof item === 'object' ? item.recommendation : undefined;

            const def = definitions[key];
            
            return (
              <div key={key} className="space-y-2">
                {/* Metric Header */}
                <div className="flex justify-between items-start">
                  <div className="flex-1 flex items-center gap-2">
                    <div className="text-sm font-medium text-slate-800">{label}</div>
                    {def && (
                      <InfoTooltip
                        metricKey={key}
                        definitions={definitions}
                        isActive={activeTooltip === key}
                        onToggle={() => setActiveTooltip(activeTooltip === key ? null : key)}
                      />
                    )}
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
        )}
      </div>
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
