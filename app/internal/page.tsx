'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LoadingPopup from '../components/LoadingPopup';
import SiteHealth from '../components/SiteHealth';
import PillarScores from '../components/PillarScores';

interface DomainResult {
  name: string;
  urls: string[];
  averageScore: {
    total: number;
    contentStructure: number;
    brandRanking: number;
    websiteTechnical: number;
    keywordVisibility: number;
    aiTrust: number;
    breakdown?: any;
  };
  urlResults: {
    url: string;
    score: number;
    scores?: any;
  }[];
  recommendations?: any[];
  warnings?: string[];
}

// Pillar definitions - Direct 100-point system
const PILLAR_INFO = {
  contentStructure: {
    name: 'Content Structure',
    color: '#14b8a6',
    max: 25,
    tips: ['Add schema markup', 'Improve heading hierarchy', 'Add image ALT tags']
  },
  brandRanking: {
    name: 'Brand Ranking',
    color: '#84cc16',
    max: 9,
    tips: ['Rank #1 for brand keyword', 'Monitor community sentiment']
  },
  websiteTechnical: {
    name: 'Website Technical',
    color: '#06b6d4',
    max: 17,
    tips: ['Optimize Core Web Vitals', 'Add LLMs.txt', 'Ensure valid sitemap']
  },
  keywordVisibility: {
    name: 'Keyword Visibility',
    color: '#ec4899',
    max: 23,
    tips: ['Add targeted keywords', 'Improve average position', 'Match search intent']
  },
  aiTrust: {
    name: 'AI Trust',
    color: '#3b82f6',
    max: 22,
    tips: ['Add author info (E-E-A-T)', 'Include citations', 'Build quality backlinks']
  }
};

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

// Metric definitions/explanations from SKILL.md
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

export default function InternalDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [expandedDomain, setExpandedDomain] = useState<number | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const [mainDomainName, setMainDomainName] = useState('');
  const [mainUrls, setMainUrls] = useState('');
  const [competitors, setCompetitors] = useState([
    { name: '', urls: '' },
    { name: '', urls: '' },
    { name: '', urls: '' },
    { name: '', urls: '' },
  ]);

  const [results, setResults] = useState<DomainResult[] | null>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Starting analysis...');
  const progressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCompleteRef = useRef(false);

  useEffect(() => { checkAuth(); }, []);

  // Simulate progress during scan based on URL completion
  useEffect(() => {
    if (!analyzing) {
      setProgress(0);
      isCompleteRef.current = false;
      if (progressTimeoutRef.current) {
        clearTimeout(progressTimeoutRef.current);
        progressTimeoutRef.current = null;
      }
      return;
    }

    // Reset completion flag
    isCompleteRef.current = false;

    // Calculate total URLs to analyze
    const mainUrlList = parseUrls(mainUrls).slice(0, 30);
    const competitorDomains = competitors
      .filter(c => c.name.trim() && c.urls.trim())
      .map(c => parseUrls(c.urls).slice(0, 10))
      .slice(0, 4);
    const competitorUrls = competitorDomains.reduce((sum, urls) => sum + urls.length, 0);
    const totalUrls = mainUrlList.length + competitorUrls;

    if (totalUrls === 0) {
      setProgress(1);
      setStatusMessage('Starting analysis...');
      return;
    }

    // Start at 1%
    setProgress(1);
    setStatusMessage('Starting analysis...');

    // Calculate progress based on URL completion
    // 1% = starting, 50% = half URLs done, 100% = all URLs done
    // Progress formula: 1% + (completedUrls / totalUrls) * 99%
    let completedUrls = 0;
    
    const updateProgress = () => {
      // Stop if API response is complete
      if (isCompleteRef.current) {
        if (progressTimeoutRef.current) {
          clearTimeout(progressTimeoutRef.current);
          progressTimeoutRef.current = null;
        }
        return;
      }

      if (completedUrls < totalUrls) {
        // Calculate progress: 1% start + (completed/total) * 99%
        const progressPercent = 1 + Math.floor((completedUrls / totalUrls) * 99);
        setProgress(Math.min(progressPercent, 100));
        
        if (completedUrls === 0) {
          setStatusMessage('Starting analysis...');
        } else if (completedUrls < totalUrls) {
          setStatusMessage(`Analyzing URL ${completedUrls + 1} of ${totalUrls}...`);
        } else {
          setStatusMessage('Audit Complete! Meow!');
        }
        
        completedUrls++;
        
        // Update every 500ms to simulate URL analysis
        if (completedUrls <= totalUrls && !isCompleteRef.current) {
          progressTimeoutRef.current = setTimeout(updateProgress, 500);
        }
      } else {
        setProgress(100);
        setStatusMessage('Audit Complete! Meow!');
      }
    };

    // Start progress updates after a short delay
    progressTimeoutRef.current = setTimeout(updateProgress, 500);

    return () => {
      if (progressTimeoutRef.current) {
        clearTimeout(progressTimeoutRef.current);
        progressTimeoutRef.current = null;
      }
    };
  }, [analyzing, mainUrls, competitors]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/admin/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user && (data.user.role === 'staff' || data.user.role === 'super_admin')) {
          setUser(data.user);
        } else {
          router.push('/admin/login');
        }
      } else {
        router.push('/admin/login');
      }
    } catch {
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const parseUrls = (text: string): string[] => {
    return text.split('\n').map(url => url.trim()).filter(url => url.length > 0);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError('');
    setResults(null);
    isCompleteRef.current = false;

    try {
      const mainUrlList = parseUrls(mainUrls).slice(0, 30);
      if (mainUrlList.length === 0) throw new Error('Please enter at least one URL');

      const competitorDomains = competitors
        .filter(c => c.name.trim() && c.urls.trim())
        .map(c => ({ name: c.name.trim(), urls: parseUrls(c.urls).slice(0, 10) }))
        .slice(0, 4);

      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: mainUrlList, competitorDomains }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Analysis failed');

      // Mark as complete and stop progress simulation
      isCompleteRef.current = true;
      if (progressTimeoutRef.current) {
        clearTimeout(progressTimeoutRef.current);
        progressTimeoutRef.current = null;
      }

      const formattedResults: DomainResult[] = [
        {
          name: mainDomainName || 'Your Domain',
          urls: mainUrlList,
          averageScore: data.scores,
          urlResults: data.urlResults || [{ url: data.url, score: data.score, scores: data.scores }],
          recommendations: data.recommendations || [],
          warnings: data.warnings || []
        },
        ...(data.competitors || []).map((comp: any) => ({
          name: comp.name,
          urls: comp.urls,
          averageScore: comp.averageScore,
          urlResults: comp.urlResults || [],
          recommendations: comp.recommendations || [],
          warnings: comp.warnings || []
        }))
      ];

      setResults(formattedResults.slice(0, 5));
      setExpandedDomain(0);
      // Set progress to 100% immediately when results are ready
      setProgress(100);
      setStatusMessage('Audit Complete! Meow!');
      
      // Close popup immediately after a very short delay for smooth transition
      setTimeout(() => {
        setAnalyzing(false);
      }, 200);
    } catch (err: any) {
      isCompleteRef.current = true;
      if (progressTimeoutRef.current) {
        clearTimeout(progressTimeoutRef.current);
        progressTimeoutRef.current = null;
      }
      setError(err.message);
      setProgress(0);
      setStatusMessage('Analysis failed');
      setAnalyzing(false);
    }
  };

  const generateRecommendations = (scores: any): string[] => {
    const recs: string[] = [];
    if (scores.contentStructure < 20) recs.push('Add schema markup to improve content structure');
    if (scores.contentStructure < 25) recs.push('Improve heading hierarchy (H1, H2, H3)');
    if (scores.brandRanking < 20) recs.push('Optimize Core Web Vitals for better performance');
    if (scores.brandRanking < 25) recs.push('Improve mobile responsiveness');
    if (scores.keywordVisibility < 12) recs.push('Add more targeted keywords in content');
    if (scores.keywordVisibility < 16) recs.push('Create more comprehensive content (1500+ words)');
    if (scores.aiTrust < 12) recs.push('Add author information and credentials (E-E-A-T)');
    if (scores.aiTrust < 16) recs.push('Build quality backlinks from authoritative sources');
    return recs.slice(0, 5);
  };

  const handleExportPDF = () => {
    if (!results) return;

    const reportDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>SAO Auditor Report - ${reportDate}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter'; background: #0f172a; color: #e2e8f0; padding: 40px; }
    .header { text-align: center; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 3px solid #10b981; }
    .header h1 { color: #10b981; font-size: 36px; margin-bottom: 8px; }
    .header p { color: #94a3b8; font-size: 14px; }
    .card { background: #1e293b; border-radius: 16px; padding: 28px; margin-bottom: 28px; border: 1px solid #334155; page-break-inside: avoid; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #334155; }
    .card-title { font-size: 22px; font-weight: bold; color: #f1f5f9; }
    .card-score { font-size: 42px; font-weight: bold; color: #10b981; }
    .pillars { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
    .pillar { background: #0f172a; padding: 14px; border-radius: 12px; }
    .pillar-name { font-size: 11px; color: #94a3b8; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    .pillar-score { font-size: 22px; font-weight: bold; }
    .pillar-bar { height: 6px; background: #334155; border-radius: 3px; margin-top: 6px; overflow: hidden; }
    .pillar-fill { height: 100%; border-radius: 3px; }
    .pillar-insight { font-size: 10px; color: #64748b; margin-top: 6px; }
    .teal { color: #14b8a6; } .lime { color: #84cc16; } .cyan { color: #06b6d4; } .pink { color: #ec4899; } .blue { color: #3b82f6; }
    .recs { background: #0f172a; padding: 20px; border-radius: 12px; margin-top: 20px; }
    .recs h4 { color: #10b981; margin-bottom: 16px; font-size: 16px; }
    .recs li { color: #cbd5e1; margin-bottom: 10px; font-size: 13px; padding-left: 20px; position: relative; }
    .recs li::before { content: "→"; position: absolute; left: 0; color: #10b981; }
    .urls { color: #64748b; font-size: 13px; margin-top: 16px; }
    .comparison { background: #1e293b; border-radius: 16px; padding: 28px; margin-top: 32px; border: 1px solid #334155; }
    .comparison h2 { color: #10b981; margin-bottom: 20px; font-size: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th { color: #94a3b8; font-size: 11px; text-transform: uppercase; text-align: center; padding: 10px 6px; border-bottom: 2px solid #334155; }
    th:first-child { text-align: left; }
    td { padding: 12px 6px; border-bottom: 1px solid #334155; color: #f1f5f9; font-size: 13px; text-align: center; }
    td:first-child { text-align: left; }
    .footer { text-align: center; margin-top: 48px; padding-top: 24px; border-top: 1px solid #334155; color: #64748b; font-size: 12px; }
    .insight-box { background: #0f172a; padding: 16px; border-radius: 10px; margin-top: 16px; border-left: 3px solid #10b981; }
    .insight-box h5 { color: #10b981; font-size: 13px; margin-bottom: 8px; }
    .insight-box p { color: #94a3b8; font-size: 12px; line-height: 1.5; }
    @media print { 
      body { background: white; color: #1e293b; }
      .card, .comparison { background: #f8fafc; border-color: #e2e8f0; }
      .pillar { background: #f1f5f9; }
      .card-title { color: #1e293b; }
      .pillar-name { color: #64748b; }
      th { color: #64748b; }
      td { color: #1e293b; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔍 SAO Auditor Report</h1>
    <p>Search & AI Optimization Analysis</p>
    <p style="margin-top: 8px;">${reportDate}</p>
    <p style="margin-top: 4px; color: #10b981;">Direct 100-Point Scoring System</p>
  </div>

  ${results.map((d, i) => `
  <div class="card">
    <div class="card-header">
      <div class="card-title">${i === 0 ? '🏠' : '🏢'} ${d.name}</div>
      <div class="card-score">${d.averageScore.total}/100</div>
    </div>
    <div class="pillars">
      <div class="pillar">
        <div class="pillar-name">Content Structure</div>
        <div class="pillar-score teal">${d.averageScore.contentStructure}/25</div>
        <div class="pillar-bar"><div class="pillar-fill" style="width:${(d.averageScore.contentStructure / 25) * 100}%;background:#14b8a6"></div></div>
        <div class="pillar-insight">Schema, Headings, ALT, Tables, Direct Answer</div>
      </div>
      <div class="pillar">
        <div class="pillar-name">Brand Ranking</div>
        <div class="pillar-score lime">${d.averageScore.brandRanking}/9</div>
        <div class="pillar-bar"><div class="pillar-fill" style="width:${(d.averageScore.brandRanking / 9) * 100}%;background:#84cc16"></div></div>
        <div class="pillar-insight">Brand Search Rank, Sentiment</div>
      </div>
      <div class="pillar">
        <div class="pillar-name">Website Technical</div>
        <div class="pillar-score cyan">${d.averageScore.websiteTechnical || 0}/17</div>
        <div class="pillar-bar"><div class="pillar-fill" style="width:${((d.averageScore.websiteTechnical || 0) / 17) * 100}%;background:#06b6d4"></div></div>
        <div class="pillar-insight">LCP, INP, CLS, SSL, LLMs.txt, Sitemap</div>
      </div>
      <div class="pillar">
        <div class="pillar-name">Keyword Visibility</div>
        <div class="pillar-score pink">${d.averageScore.keywordVisibility}/23</div>
        <div class="pillar-bar"><div class="pillar-fill" style="width:${(d.averageScore.keywordVisibility / 23) * 100}%;background:#ec4899"></div></div>
        <div class="pillar-insight">Keywords, Avg Position, Intent Match</div>
      </div>
      <div class="pillar">
        <div class="pillar-name">AI Trust</div>
        <div class="pillar-score blue">${d.averageScore.aiTrust}/22</div>
        <div class="pillar-bar"><div class="pillar-fill" style="width:${(d.averageScore.aiTrust / 22) * 100}%;background:#3b82f6"></div></div>
        <div class="pillar-insight">Backlinks, E-E-A-T, Sentiment, Local</div>
      </div>
    </div>
    <div class="urls">📊 ${d.urlResults.length} URLs analyzed</div>
    ${d.recommendations?.length ? `
    <div class="recs">
      <h4>🎯 Optimization Priorities</h4>
      <ul>${d.recommendations.map(r => `<li>${typeof r === 'string' ? r : (r.title || r.message || r.description || '')}</li>`).join('')}</ul>
    </div>` : ''}
    <div class="insight-box">
      <h5>💡 Key Insights for Internal Team</h5>
      <p>
        ${d.averageScore.contentStructure < 20 ? '• Content needs schema markup and proper heading structure. ' : ''}
        ${d.averageScore.brandRanking < 5 ? '• Brand visibility is low - check if ranking #1 for brand keyword. ' : ''}
        ${(d.averageScore.websiteTechnical || 0) < 10 ? '• Technical issues: Check Core Web Vitals, add LLMs.txt and sitemap. ' : ''}
        ${d.averageScore.keywordVisibility < 15 ? '• Keyword strategy needs improvement - focus on intent matching. ' : ''}
        ${d.averageScore.aiTrust < 15 ? '• Trust signals weak - add author info, citations, E-E-A-T elements. ' : ''}
        ${d.averageScore.total >= 70 ? '✅ Good overall performance. Focus on incremental improvements.' : ''}
      </p>
    </div>
  </div>`).join('')}

  <div class="comparison">
    <h2>📊 5-Pillar Comparison</h2>
    <table>
      <tr><th>Domain</th><th>Total</th><th>Content<br/>/25</th><th>Brand<br/>/9</th><th>Technical<br/>/17</th><th>Keywords<br/>/23</th><th>AI Trust<br/>/22</th></tr>
      ${results.map((d, i) => `
      <tr>
        <td>${i === 0 ? '🏠' : '🏢'} ${d.name}</td>
        <td style="color:#10b981;font-weight:bold">${d.averageScore.total}</td>
        <td class="teal">${d.averageScore.contentStructure}</td>
        <td class="lime">${d.averageScore.brandRanking}</td>
        <td class="cyan">${d.averageScore.websiteTechnical || 0}</td>
        <td class="pink">${d.averageScore.keywordVisibility}</td>
        <td class="blue">${d.averageScore.aiTrust}</td>
      </tr>`).join('')}
    </table>
  </div>

  <div class="footer">
    <p>© ${new Date().getFullYear()} SAO Auditor by Conductor</p>
    <p style="margin-top:4px">Search & AI Optimization Analyzer</p>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 300);
    }
  };

  const updateCompetitor = (index: number, field: 'name' | 'urls', value: string) => {
    const updated = [...competitors];
    updated[index] = { ...updated[index], [field]: value };
    setCompetitors(updated);
  };

  const toPercent = (value: number, max: number) => Math.round((value / max) * 100);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#e0f2fe' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#10b981]"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#e0f2fe' }}>
      {/* Loading Popup */}
      {analyzing && <LoadingPopup progress={progress} statusMessage={statusMessage} />}
      
      {/* Decorative curved line like mycommuters */}
      <div className="absolute top-0 right-0 w-1/2 h-80 overflow-hidden pointer-events-none">
        <svg viewBox="0 0 500 300" className="w-full h-full">
          <path d="M0,100 Q150,100 200,50 T400,50 L500,50 L500,0 L0,0 Z" fill="none" stroke="#38bdf8" strokeWidth="4" />
        </svg>
      </div>

      {/* Header */}
      <header className="relative border-b border-slate-300 bg-white/50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-[#38bdf8] to-[#60a5fa] rounded-xl flex items-center justify-center">
              <span className="text-xl text-white font-bold">S</span>
            </div>
            <div>
              <div className="text-xl font-bold text-slate-800">SAO <span className="text-slate-600">Auditor</span></div>
              <div className="text-xs text-slate-600">Search & AI Optimization</div>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-gradient-to-r from-[#38bdf8] to-[#60a5fa] text-white text-xs rounded-full font-bold">PRO</span>
            <span className="text-slate-600 text-sm hidden md:inline">{user.email}</span>
            <Link href="/admin" className="px-4 py-2 bg-gradient-to-r from-[#38bdf8] to-[#60a5fa] hover:from-[#60a5fa] hover:to-[#38bdf8] text-white rounded-full text-sm font-semibold transition shadow-md">
              Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-3">
            Pro <span className="bg-gradient-to-r from-[#38bdf8] to-[#60a5fa] bg-clip-text text-transparent">Multi-URL</span> Analysis
          </h1>
          <p className="text-slate-700 text-lg">
            Analyze up to <span className="text-slate-800 font-semibold">30 URLs</span> and compare with <span className="text-slate-800 font-semibold">4 competitors</span>
          </p>
        </div>

        {/* Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Main Domain */}
          <div className="rounded-2xl p-6 border border-slate-300 shadow-sm" style={{ backgroundColor: '#79B4EE' }}>
            <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-gradient-to-r from-[#38bdf8] to-[#60a5fa] rounded-lg flex items-center justify-center text-white font-bold">🏠</span>
              Your Domain
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-700 mb-2">Domain Name</label>
                <input
                  type="text"
                  value={mainDomainName}
                  onChange={(e) => setMainDomainName(e.target.value)}
                  placeholder="e.g., My Company"
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-[#38bdf8] focus:border-[#38bdf8] focus:outline-none transition shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-2">URLs (one per line, max 30)</label>
                <textarea
                  value={mainUrls}
                  onChange={(e) => setMainUrls(e.target.value)}
                  placeholder="https://example.com/page1&#10;https://example.com/page2&#10;https://example.com/page3"
                  rows={10}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-[#38bdf8] focus:outline-none font-mono text-sm transition shadow-sm"
                />
                <p className="text-sm text-slate-700 mt-2 font-medium">{parseUrls(mainUrls).length} / 30 URLs</p>
              </div>
            </div>
          </div>

          {/* Competitors */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-800 mb-2">🏢 Competitors (up to 4)</h2>
            {competitors.map((comp, index) => (
              <div key={index} className="rounded-xl p-4 border border-slate-300 hover:border-[#38bdf8] transition shadow-sm" style={{ backgroundColor: '#79B4EE' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 bg-gradient-to-r from-[#38bdf8] to-[#60a5fa] rounded flex items-center justify-center text-xs text-white">{index + 1}</span>
                  <span className="text-sm font-medium text-slate-800">Competitor {index + 1}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={comp.name}
                    onChange={(e) => updateCompetitor(index, 'name', e.target.value)}
                    placeholder="Name"
                    className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 text-sm focus:ring-2 focus:ring-[#38bdf8] focus:outline-none shadow-sm"
                  />
                  <textarea
                    value={comp.urls}
                    onChange={(e) => updateCompetitor(index, 'urls', e.target.value)}
                    placeholder="URLs (one per line, max 10)"
                    rows={2}
                    className="md:col-span-2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 text-sm font-mono focus:ring-2 focus:ring-[#38bdf8] focus:outline-none shadow-sm"
                  />
                </div>
                <p className="text-xs text-slate-700 mt-2">{parseUrls(comp.urls).length} / 10 URLs</p>
              </div>
            ))}
          </div>
        </div>

        {/* Analyze Button */}
        <div className="text-center mb-10">
          <button
            onClick={handleAnalyze}
            disabled={analyzing || parseUrls(mainUrls).length === 0}
            className="px-12 py-4 bg-gradient-to-r from-[#38bdf8] to-[#60a5fa] hover:from-[#60a5fa] hover:to-[#38bdf8] disabled:opacity-50 text-white font-bold rounded-full transition text-lg shadow-lg shadow-[#38bdf8]/30 flex items-center gap-3 mx-auto"
          >
            {analyzing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                Analyzing {parseUrls(mainUrls).length} URLs...
              </>
            ) : (
              <>🔍 Analyze All URLs</>
            )}
          </button>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-300 rounded-xl text-red-700 text-center">
            {error}
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-8">
            {/* Actions */}
            <div className="flex flex-wrap justify-between items-center gap-4">
              <h2 className="text-2xl font-bold text-slate-800">📊 Analysis Results</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRecommendations(!showRecommendations)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm border border-slate-300 transition shadow-sm"
                >
                  {showRecommendations ? '📋 Hide Tips' : '📋 Show Tips'}
                </button>
                <button
                  onClick={handleExportPDF}
                  className="px-4 py-2 bg-gradient-to-r from-[#38bdf8] to-[#60a5fa] hover:from-[#60a5fa] hover:to-[#38bdf8] text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition shadow-md"
                >
                  📥 Export PDF
                </button>
              </div>
            </div>

            {/* Domain Score Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
              {results.map((domain, index) => (
                <div
                  key={index}
                  onClick={() => setExpandedDomain(expandedDomain === index ? null : index)}
                  className={`rounded-2xl p-5 cursor-pointer transition-all hover:scale-[1.02] shadow-sm ${expandedDomain === index ? 'ring-2 ring-[#38bdf8]' : ''
                    } ${index === 0 ? 'ring-2 ring-[#38bdf8]' : ''}`}
                  style={{ backgroundColor: '#79B4EE' }}
                >
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold ${index === 0 ? 'bg-gradient-to-r from-[#38bdf8] to-[#60a5fa]' : 'bg-slate-500'
                      }`}>
                      {index === 0 ? '🏠' : '🏢'}
                    </div>
                    <span className="font-semibold text-slate-800 text-sm truncate">{domain.name}</span>
                  </div>

                  {/* Circular Score */}
                  <div className="flex justify-center mb-3">
                    <div className="relative w-28 h-28">
                      <svg className="w-28 h-28 transform -rotate-90">
                        <circle cx="56" cy="56" r="48" stroke="#e5e7eb" strokeWidth="10" fill="none" />
                        <circle
                          cx="56" cy="56" r="48"
                          stroke="#ec4899"
                          strokeWidth="10"
                          fill="none"
                          strokeDasharray={`${(domain.averageScore.total / 100) * 302} 302`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-slate-800">{domain.averageScore.total}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center text-xs font-semibold text-slate-500 mb-4">Overall Performance</div>

                  {/* Pillar Bars - Direct 100-point system */}
                  <div className="space-y-2">
                    <PillarBar label="Content Structure" value={domain.averageScore.contentStructure} max={25} color="#14b8a6" />
                    <PillarBar label="Brand Ranking" value={domain.averageScore.brandRanking} max={9} color="#84cc16" />
                    <PillarBar label="Website Technical" value={domain.averageScore.websiteTechnical || 0} max={17} color="#06b6d4" />
                    <PillarBar label="Keyword Visibility" value={domain.averageScore.keywordVisibility} max={23} color="#ec4899" />
                    <PillarBar label="AI Trust" value={domain.averageScore.aiTrust} max={22} color="#3b82f6" />
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-300 text-center">
                    <span className="text-xs text-slate-700">{domain.urlResults.length} URLs • Click for details</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Expanded Details */}
            {expandedDomain !== null && results[expandedDomain] && (() => {
              const domain = results[expandedDomain];
              const domainScore = domain.averageScore.total;
              const breakdown = domain.averageScore.breakdown || {};
              const recommendations = domain.recommendations || [];
              
              return (
              <div className="space-y-6">
                {/* Header */}
                <div className="rounded-2xl p-6 border border-slate-300 shadow-sm" style={{ backgroundColor: '#79B4EE' }}>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">
                        {expandedDomain === 0 ? '🏠' : '🏢'} {domain.name} — Detailed Analysis
                      </h3>
                      <p className="text-slate-600 text-sm mt-1">
                        {domain.urls.length} URL{domain.urls.length !== 1 ? 's' : ''} analyzed
                      </p>
                    </div>
                    <button onClick={() => setExpandedDomain(null)} className="text-slate-600 hover:text-slate-800 text-xl">✕</button>
                  </div>

                  {/* Site Health and Summary - Side by side on desktop, stacked on mobile */}
                  <div className="mb-6 flex flex-col lg:flex-row gap-6">
                    <SiteHealth
                      score={domainScore}
                      errors={recommendations.filter((r: any) => r.priority === 'HIGH').length}
                      warnings={recommendations.filter((r: any) => r.priority === 'MEDIUM').length}
                      notices={recommendations.filter((r: any) => r.priority === 'LOW').length}
                    />
                    <PillarScores
                      totalScore={domainScore}
                      contentStructure={domain.averageScore.contentStructure}
                      brandRanking={domain.averageScore.brandRanking}
                      websiteTechnical={domain.averageScore.websiteTechnical || 0}
                      keywordVisibility={domain.averageScore.keywordVisibility}
                      aiTrust={domain.averageScore.aiTrust}
                    />
                  </div>

                  {/* Warning card when data sources are missing */}
                  {Array.isArray(domain.warnings) && domain.warnings.length > 0 && (
                    <div className="mb-6 rounded-xl border border-red-400 bg-red-50 px-4 py-3 flex items-start gap-3 text-left">
                      <div className="mt-0.5 text-red-600 text-xl">⚠️</div>
                      <div>
                        <p className="font-semibold text-red-800 mb-1">Pay attention!</p>
                        <ul className="text-sm text-red-700 space-y-1">
                          {domain.warnings.map((msg: string, idx: number) => (
                            <li key={idx}>{msg}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pillar Details with Metric Breakdown */}
                <div className="rounded-2xl p-6 border border-slate-300 shadow-sm" style={{ backgroundColor: '#79B4EE' }}>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">5-Pillar Breakdown</h3>
                  <div className="space-y-6">
                    {Object.entries(PILLAR_INFO).map(([key, info]) => {
                      const score = domain.averageScore[key as keyof typeof domain.averageScore] as number;
                      const pillarBreakdown = breakdown[key] || {};
                      
                      // Metric labels for each pillar
                      const metricLabels: Record<string, Record<string, { label: string; max: number }>> = {
                        contentStructure: {
                          schema: { label: 'Schema Markup', max: 8 },
                          headings: { label: 'Heading Structure', max: 6 },
                          multimodal: { label: 'Multimodal Content', max: 5 },
                          imageAlt: { label: 'Image ALT Tags', max: 3 },
                          tableLists: { label: 'Tables & Lists', max: 2 },
                          directAnswer: { label: 'Direct Answer', max: 5 },
                          contentGap: { label: 'Content Depth', max: 3 },
                        },
                        brandRanking: {
                          brandSearch: { label: 'Branded Search Rank', max: 5 },
                          brandSentiment: { label: 'Brand Sentiment', max: 5 },
                        },
                        websiteTechnical: {
                          lcp: { label: 'LCP (Load Speed)', max: 3 },
                          inp: { label: 'INP (Interactivity)', max: 2 },
                          cls: { label: 'CLS (Visual Stability)', max: 2 },
                          mobile: { label: 'Mobile Performance', max: 3 },
                          ssl: { label: 'SSL/HTTPS Security', max: 3 },
                          brokenLinks: { label: 'Link Health', max: 2 },
                          llmsTxt: { label: 'LLMs.txt', max: 1.5 },
                          sitemap: { label: 'Sitemap.xml', max: 1.5 },
                        },
                        keywordVisibility: {
                          keywords: { label: 'Organic Keywords', max: 10 },
                          positions: { label: 'Average Position', max: 7.5 },
                          intentMatch: { label: 'Search Intent Match', max: 7.5 },
                        },
                        aiTrust: {
                          backlinks: { label: 'Backlink Quality', max: 7.5 },
                          referringDomains: { label: 'Referring Domains', max: 5 },
                          sentiment: { label: 'AI Sentiment Score', max: 5 },
                          eeat: { label: 'E-E-A-T Signals', max: 5 },
                          local: { label: 'Local/GEO Signals', max: 2.5 },
                        },
                      };
                      
                      return (
                        <div key={key} className="bg-white/80 rounded-xl p-4 border border-slate-300">
                          {/* Pillar Header */}
                          <div className="flex justify-between items-center mb-3">
                            <span className="font-semibold text-slate-800" style={{ color: info.color }}>{info.name}</span>
                            <span className="text-lg font-bold" style={{ color: info.color }}>{score.toFixed(1)}/{info.max}</span>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-4">
                            <div className="h-full rounded-full" style={{ width: `${Math.min((score / info.max) * 100, 100)}%`, backgroundColor: info.color }} />
                          </div>
                          
                          {/* Metric Breakdown */}
                          {metricLabels[key] && Object.entries(metricLabels[key]).map(([metricKey, { label, max }]) => {
                            const metric = pillarBreakdown[metricKey];
                            // Always show Brand Ranking metrics even if score is 0
                            if (!metric && key !== 'brandRanking') return null;
                            
                            // For Brand Ranking, show metrics even if they don't exist (they'll be 0)
                            const itemScore = metric ? (typeof metric === 'number' ? metric : (metric.score ?? 0)) : 0;
                            const cappedScore = Math.min(itemScore, max); // Cap score at max
                            const itemPercentage = Math.round((cappedScore / max) * 100);
                            const itemValue = metric && typeof metric === 'object' ? metric.value : undefined;
                            const insight = metric && typeof metric === 'object' ? metric.insight : undefined;
                            const recommendation = metric && typeof metric === 'object' ? metric.recommendation : undefined;
                            const def = METRIC_DEFINITIONS[metricKey];
                            
                            return (
                              <div key={metricKey} className="mb-4 pb-4 border-b border-slate-200 last:border-0 last:pb-0 last:mb-0">
                                {/* Metric Header with Tooltip */}
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex-1 flex items-center gap-2">
                                    <div className="text-sm font-medium text-slate-800">{label}</div>
                                    {def && (
                                      <InfoTooltip
                                        metricKey={metricKey}
                                        definitions={METRIC_DEFINITIONS}
                                        isActive={activeTooltip === `${key}-${metricKey}`}
                                        onToggle={() => setActiveTooltip(activeTooltip === `${key}-${metricKey}` ? null : `${key}-${metricKey}`)}
                                      />
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="text-xs text-slate-500">
                                      {cappedScore.toFixed(1)}/{max} pts ({itemPercentage}%)
                                    </div>
                                    <div className={`px-2 py-1 rounded text-xs font-semibold ${
                                      itemPercentage >= 70 ? 'bg-green-100 text-green-700' :
                                      itemPercentage >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-red-100 text-red-700'
                                    }`}>
                                      {itemPercentage >= 70 ? 'Good' : itemPercentage >= 40 ? 'Fair' : 'Poor'}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Progress Bar */}
                                <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3">
                                  <div
                                    className={`h-1.5 rounded-full transition-all ${
                                      itemPercentage >= 70 ? 'bg-green-500' :
                                      itemPercentage >= 40 ? 'bg-yellow-500' :
                                      'bg-red-500'
                                    }`}
                                    style={{ width: `${Math.min(itemPercentage, 100)}%` }}
                                  ></div>
                                </div>
                                
                                {/* Result Explanation */}
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
                                        {label} scored {cappedScore.toFixed(1)}/{max} points.
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
                      );
                    })}
                  </div>
                </div>

                {/* What This Site Can Improve */}
                {recommendations.length > 0 && (
                  <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: '#79B4EE' }}>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">What This Site Can Improve</h3>
                    <div className="space-y-4">
                      {recommendations.map((rec: any, idx: number) => (
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
                              <div className="text-slate-800 font-semibold mb-1">{rec.title || rec.message || 'Improvement needed'}</div>
                              <div className="text-sm text-slate-700 mb-2">{rec.description || rec.message || ''}</div>
                              {rec.impact && (
                                <div className="text-xs text-slate-600 font-medium">{rec.impact}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* URL Table */}
                <div className="rounded-2xl p-6 border border-slate-300 shadow-sm" style={{ backgroundColor: '#79B4EE' }}>
                  <h4 className="font-semibold text-slate-800 mb-4">Individual URL Scores</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-600 border-b border-slate-300">
                          <th className="pb-3">URL</th>
                          <th className="pb-3 text-right">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {domain.urlResults.map((u, i) => (
                          <tr key={i} className="border-b border-slate-200">
                            <td className="py-2 text-slate-800 truncate max-w-md">{u.url}</td>
                            <td className={`py-2 text-right font-bold ${u.score >= 70 ? 'text-green-600' : u.score >= 50 ? 'text-yellow-600' : 'text-red-600'
                              }`}>{u.score}/100</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              );
            })()}

            {/* Recommendations */}
            {showRecommendations && (
              <div className="rounded-2xl p-6 border border-slate-300 shadow-sm" style={{ backgroundColor: '#79B4EE' }}>
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  🎯 Personalized AIO & GEO Optimization
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.map((domain, index) => (
                    <div key={index} className="bg-white/80 rounded-xl p-4 border border-slate-300">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-slate-800 text-sm">{index === 0 ? '🏠' : '🏢'} {domain.name}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${domain.averageScore.total >= 70 ? 'bg-green-100 text-green-700' :
                          domain.averageScore.total >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                          }`}>{domain.averageScore.total}</span>
                      </div>
                      <ul className="space-y-2">
                        {(domain.recommendations || []).slice(0, 3).map((rec, i) => (
                          <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                            <span className="text-emerald-600 mt-0.5">→</span>{typeof rec === 'string' ? rec : (rec.title || rec.message || rec.description || '')}
                          </li>
                        ))}
                        {(!domain.recommendations || domain.recommendations.length === 0) && (
                          <li className="text-xs text-emerald-700">✅ Great! Site is well optimized.</li>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comparison Table */}
            <div className="rounded-2xl p-6 border border-slate-300 shadow-sm" style={{ backgroundColor: '#79B4EE' }}>
              <h3 className="text-xl font-bold text-slate-800 mb-6">📊 5-Pillar Comparison</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-slate-700 border-b border-slate-300 text-sm">
                      <th className="pb-3 pr-4">Domain</th>
                      <th className="pb-3 text-center">Total</th>
                      <th className="pb-3 text-center">Content<br />/28</th>
                      <th className="pb-3 text-center">Brand<br />/9</th>
                      <th className="pb-3 text-center">Technical<br />/17</th>
                      <th className="pb-3 text-center">Keywords<br />/23</th>
                      <th className="pb-3 text-center">AI Trust<br />/23</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((domain, index) => (
                      <tr key={index} className={`border-b border-slate-200 ${index === 0 ? 'bg-white/40' : ''}`}>
                        <td className="py-4 pr-4 text-slate-800 font-medium">
                          {index === 0 ? '🏠' : '🏢'} {domain.name}
                        </td>
                        <td className="py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${domain.averageScore.total >= 70 ? 'bg-green-100 text-green-700' :
                            domain.averageScore.total >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                            }`}>{domain.averageScore.total}</span>
                        </td>
                        <td className="py-4 text-center text-[#14b8a6] font-medium">{domain.averageScore.contentStructure}/25</td>
                        <td className="py-4 text-center text-[#84cc16] font-medium">{domain.averageScore.brandRanking}/9</td>
                        <td className="py-4 text-center text-[#06b6d4] font-medium">{domain.averageScore.websiteTechnical || 0}/17</td>
                        <td className="py-4 text-center text-[#ec4899] font-medium">{domain.averageScore.keywordVisibility}/23</td>
                        <td className="py-4 text-center text-[#3b82f6] font-medium">{domain.averageScore.aiTrust}/22</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-300 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-600 text-sm">© {new Date().getFullYear()} SAO Auditor by Conductor</p>
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

// Pillar Bar Component
function PillarBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const percent = Math.round((value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-600 flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }}></span>
          {label}
        </span>
        <span className="font-medium text-slate-700">{percent}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${percent}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
