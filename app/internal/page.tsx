'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface DomainResult {
  name: string;
  urls: string[];
  averageScore: {
    total: number;
    contentStructure: number;
    brandRanking: number;
    keywordVisibility: number;
    aiTrust: number;
  };
  urlResults: {
    url: string;
    score: number;
  }[];
  recommendations?: string[];
}

// Pillar definitions
const PILLAR_INFO = {
  keywordVisibility: {
    name: 'Keyword Visibility',
    color: '#ec4899',
    max: 20,
    tips: ['Add targeted keywords', 'Optimize meta descriptions', 'Create topic clusters']
  },
  aiTrust: {
    name: 'AI Trust & Sentiment',
    color: '#3b82f6',
    max: 20,
    tips: ['Add author bios (E-E-A-T)', 'Include citations', 'Build quality backlinks']
  },
  contentStructure: {
    name: 'Content Structure',
    color: '#14b8a6',
    max: 30,
    tips: ['Add schema markup', 'Improve heading hierarchy', 'Add structured data']
  },
  brandRanking: {
    name: 'Official Brand Ranking',
    color: '#84cc16',
    max: 30,
    tips: ['Optimize Core Web Vitals', 'Improve page speed', 'Build domain authority']
  }
};

export default function InternalDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [expandedDomain, setExpandedDomain] = useState<number | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(true);
  
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

  useEffect(() => { checkAuth(); }, []);

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

      const formattedResults: DomainResult[] = [
        {
          name: mainDomainName || 'Your Domain',
          urls: mainUrlList,
          averageScore: data.scores,
          urlResults: data.urlResults || [{ url: data.url, score: data.score }],
          recommendations: data.recommendations?.map((r: any) => r.message) || generateRecommendations(data.scores)
        },
        ...(data.competitors || []).map((comp: any) => ({
          name: comp.name,
          urls: comp.urls,
          averageScore: comp.averageScore,
          urlResults: comp.urlResults,
          recommendations: generateRecommendations(comp.averageScore)
        }))
      ];

      setResults(formattedResults.slice(0, 5));
      setExpandedDomain(0);
    } catch (err: any) {
      setError(err.message);
    } finally {
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
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; color: #e2e8f0; padding: 40px; }
    .header { text-align: center; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 3px solid #10b981; }
    .header h1 { color: #10b981; font-size: 36px; margin-bottom: 8px; }
    .header p { color: #94a3b8; font-size: 14px; }
    .card { background: #1e293b; border-radius: 16px; padding: 28px; margin-bottom: 28px; border: 1px solid #334155; page-break-inside: avoid; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #334155; }
    .card-title { font-size: 22px; font-weight: bold; color: #f1f5f9; }
    .card-score { font-size: 42px; font-weight: bold; color: #10b981; }
    .pillars { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
    .pillar { background: #0f172a; padding: 16px; border-radius: 12px; }
    .pillar-name { font-size: 13px; color: #94a3b8; margin-bottom: 6px; }
    .pillar-score { font-size: 26px; font-weight: bold; }
    .pillar-bar { height: 8px; background: #334155; border-radius: 4px; margin-top: 8px; overflow: hidden; }
    .pillar-fill { height: 100%; border-radius: 4px; }
    .pink { color: #ec4899; }
    .blue { color: #3b82f6; }
    .teal { color: #14b8a6; }
    .lime { color: #84cc16; }
    .recs { background: #0f172a; padding: 20px; border-radius: 12px; margin-top: 20px; }
    .recs h4 { color: #10b981; margin-bottom: 16px; font-size: 16px; }
    .recs li { color: #cbd5e1; margin-bottom: 10px; font-size: 14px; padding-left: 20px; position: relative; }
    .recs li::before { content: "→"; position: absolute; left: 0; color: #10b981; }
    .urls { color: #64748b; font-size: 13px; margin-top: 16px; }
    .comparison { background: #1e293b; border-radius: 16px; padding: 28px; margin-top: 32px; border: 1px solid #334155; }
    .comparison h2 { color: #10b981; margin-bottom: 20px; font-size: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th { color: #94a3b8; font-size: 12px; text-transform: uppercase; text-align: left; padding: 12px 8px; border-bottom: 2px solid #334155; }
    td { padding: 14px 8px; border-bottom: 1px solid #334155; color: #f1f5f9; font-size: 14px; }
    .footer { text-align: center; margin-top: 48px; padding-top: 24px; border-top: 1px solid #334155; color: #64748b; font-size: 12px; }
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
  </div>

  ${results.map((d, i) => `
  <div class="card">
    <div class="card-header">
      <div class="card-title">${i === 0 ? '🏠' : '🏢'} ${d.name}</div>
      <div class="card-score">${d.averageScore.total}/100</div>
    </div>
    <div class="pillars">
      <div class="pillar">
        <div class="pillar-name">Keyword Visibility</div>
        <div class="pillar-score pink">${d.averageScore.keywordVisibility}/20</div>
        <div class="pillar-bar"><div class="pillar-fill" style="width:${(d.averageScore.keywordVisibility/20)*100}%;background:#ec4899"></div></div>
      </div>
      <div class="pillar">
        <div class="pillar-name">AI Trust & Sentiment</div>
        <div class="pillar-score blue">${d.averageScore.aiTrust}/20</div>
        <div class="pillar-bar"><div class="pillar-fill" style="width:${(d.averageScore.aiTrust/20)*100}%;background:#3b82f6"></div></div>
      </div>
      <div class="pillar">
        <div class="pillar-name">Content Structure</div>
        <div class="pillar-score teal">${d.averageScore.contentStructure}/30</div>
        <div class="pillar-bar"><div class="pillar-fill" style="width:${(d.averageScore.contentStructure/30)*100}%;background:#14b8a6"></div></div>
      </div>
      <div class="pillar">
        <div class="pillar-name">Official Brand Ranking</div>
        <div class="pillar-score lime">${d.averageScore.brandRanking}/30</div>
        <div class="pillar-bar"><div class="pillar-fill" style="width:${(d.averageScore.brandRanking/30)*100}%;background:#84cc16"></div></div>
      </div>
    </div>
    <div class="urls">📊 ${d.urlResults.length} URLs analyzed</div>
    ${d.recommendations?.length ? `
    <div class="recs">
      <h4>🎯 Recommendations</h4>
      <ul>${d.recommendations.map(r => `<li>${r}</li>`).join('')}</ul>
    </div>` : ''}
  </div>`).join('')}

  <div class="comparison">
    <h2>📊 Competitor Comparison</h2>
    <table>
      <tr><th>Domain</th><th>Overall</th><th>Keywords</th><th>AI Trust</th><th>Content</th><th>Brand</th></tr>
      ${results.map((d, i) => `
      <tr>
        <td>${i === 0 ? '🏠' : '🏢'} ${d.name}</td>
        <td style="color:#10b981;font-weight:bold">${d.averageScore.total}</td>
        <td class="pink">${d.averageScore.keywordVisibility}</td>
        <td class="blue">${d.averageScore.aiTrust}</td>
        <td class="teal">${d.averageScore.contentStructure}</td>
        <td class="lime">${d.averageScore.brandRanking}</td>
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
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#10b981]"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Decorative curved line like mycommuters */}
      <div className="absolute top-0 right-0 w-1/2 h-80 overflow-hidden pointer-events-none">
        <svg viewBox="0 0 500 300" className="w-full h-full">
          <path d="M0,100 Q150,100 200,50 T400,50 L500,50 L500,0 L0,0 Z" fill="none" stroke="#10b981" strokeWidth="4"/>
        </svg>
      </div>

      {/* Header */}
      <header className="relative border-b border-[#1e293b]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#10b981] rounded-xl flex items-center justify-center">
              <span className="text-xl text-[#0f172a] font-bold">S</span>
            </div>
            <div>
              <div className="text-xl font-bold text-white">SAO <span className="text-[#10b981]">Auditor</span></div>
              <div className="text-xs text-slate-400">Search & AI Optimization</div>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-[#10b981] text-[#0f172a] text-xs rounded-full font-bold">PRO</span>
            <span className="text-slate-400 text-sm hidden md:inline">{user.email}</span>
            <Link href="/admin" className="px-4 py-2 bg-[#10b981] hover:bg-[#059669] text-[#0f172a] rounded-full text-sm font-semibold transition">
              Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Pro <span className="text-[#10b981]">Multi-URL</span> Analysis
          </h1>
          <p className="text-slate-400 text-lg">
            Analyze up to <span className="text-[#10b981] font-semibold">30 URLs</span> and compare with <span className="text-[#10b981] font-semibold">4 competitors</span>
          </p>
        </div>

        {/* Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Main Domain */}
          <div className="bg-[#1e293b] rounded-2xl p-6 border border-[#10b981]/30">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-[#10b981] rounded-lg flex items-center justify-center text-[#0f172a] font-bold">🏠</span>
              Your Domain
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Domain Name</label>
                <input
                  type="text"
                  value={mainDomainName}
                  onChange={(e) => setMainDomainName(e.target.value)}
                  placeholder="e.g., My Company"
                  className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">URLs (one per line, max 30)</label>
                <textarea
                  value={mainUrls}
                  onChange={(e) => setMainUrls(e.target.value)}
                  placeholder="https://example.com/page1&#10;https://example.com/page2&#10;https://example.com/page3"
                  rows={10}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-[#10b981] focus:outline-none font-mono text-sm transition"
                />
                <p className="text-sm text-[#10b981] mt-2 font-medium">{parseUrls(mainUrls).length} / 30 URLs</p>
              </div>
            </div>
          </div>

          {/* Competitors */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-2">🏢 Competitors (up to 4)</h2>
            {competitors.map((comp, index) => (
              <div key={index} className="bg-[#1e293b] rounded-xl p-4 border border-[#334155] hover:border-[#10b981]/30 transition">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 bg-slate-700 rounded flex items-center justify-center text-xs text-slate-300">{index + 1}</span>
                  <span className="text-sm font-medium text-slate-300">Competitor {index + 1}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={comp.name}
                    onChange={(e) => updateCompetitor(index, 'name', e.target.value)}
                    placeholder="Name"
                    className="px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-[#10b981] focus:outline-none"
                  />
                  <textarea
                    value={comp.urls}
                    onChange={(e) => updateCompetitor(index, 'urls', e.target.value)}
                    placeholder="URLs (one per line, max 10)"
                    rows={2}
                    className="md:col-span-2 px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-white placeholder-slate-500 text-sm font-mono focus:ring-2 focus:ring-[#10b981] focus:outline-none"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">{parseUrls(comp.urls).length} / 10 URLs</p>
              </div>
            ))}
          </div>
        </div>

        {/* Analyze Button */}
        <div className="text-center mb-10">
          <button
            onClick={handleAnalyze}
            disabled={analyzing || parseUrls(mainUrls).length === 0}
            className="px-12 py-4 bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 text-[#0f172a] font-bold rounded-full transition text-lg shadow-lg shadow-[#10b981]/20 flex items-center gap-3 mx-auto"
          >
            {analyzing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#0f172a]"></div>
                Analyzing {parseUrls(mainUrls).length} URLs...
              </>
            ) : (
              <>🔍 Analyze All URLs</>
            )}
          </button>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-300 text-center">
            {error}
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-8">
            {/* Actions */}
            <div className="flex flex-wrap justify-between items-center gap-4">
              <h2 className="text-2xl font-bold text-white">📊 Analysis Results</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRecommendations(!showRecommendations)}
                  className="px-4 py-2 bg-[#1e293b] hover:bg-[#334155] text-white rounded-lg text-sm border border-[#334155] transition"
                >
                  {showRecommendations ? '📋 Hide Tips' : '📋 Show Tips'}
                </button>
                <button
                  onClick={handleExportPDF}
                  className="px-4 py-2 bg-[#10b981] hover:bg-[#059669] text-[#0f172a] rounded-lg text-sm font-semibold flex items-center gap-2 transition"
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
                  className={`bg-white rounded-2xl p-5 cursor-pointer transition-all hover:scale-[1.02] ${
                    expandedDomain === index ? 'ring-2 ring-[#ec4899]' : ''
                  } ${index === 0 ? 'ring-2 ring-[#10b981]' : ''}`}
                >
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold ${
                      index === 0 ? 'bg-[#10b981]' : 'bg-slate-500'
                    }`}>
                      {index === 0 ? '🏠' : '🏢'}
                    </div>
                    <span className="font-semibold text-slate-700 text-sm truncate">{domain.name}</span>
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

                  {/* Pillar Bars */}
                  <div className="space-y-2">
                    <PillarBar label="Keyword Visibility" value={domain.averageScore.keywordVisibility} max={20} color="#ec4899" />
                    <PillarBar label="AI Trust & Sentiment" value={domain.averageScore.aiTrust} max={20} color="#3b82f6" />
                    <PillarBar label="Content Structure" value={domain.averageScore.contentStructure} max={30} color="#14b8a6" />
                    <PillarBar label="Brand Ranking" value={domain.averageScore.brandRanking} max={30} color="#84cc16" />
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 text-center">
                    <span className="text-xs text-slate-400">{domain.urlResults.length} URLs • Click for details</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Expanded Details */}
            {expandedDomain !== null && results[expandedDomain] && (
              <div className="bg-[#1e293b] rounded-2xl p-6 border border-[#334155]">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">
                    {expandedDomain === 0 ? '🏠' : '🏢'} {results[expandedDomain].name} — Detailed Analysis
                  </h3>
                  <button onClick={() => setExpandedDomain(null)} className="text-slate-400 hover:text-white text-xl">✕</button>
                </div>

                {/* Pillar Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {Object.entries(PILLAR_INFO).map(([key, info]) => {
                    const score = results[expandedDomain].averageScore[key as keyof typeof results[0]['averageScore']] as number;
                    return (
                      <div key={key} className="bg-[#0f172a] rounded-xl p-4 border border-[#334155]">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-white" style={{ color: info.color }}>{info.name}</span>
                          <span className="text-lg font-bold" style={{ color: info.color }}>{score}/{info.max}</span>
                        </div>
                        <div className="h-2 bg-[#334155] rounded-full overflow-hidden mb-3">
                          <div className="h-full rounded-full" style={{ width: `${(score/info.max)*100}%`, backgroundColor: info.color }} />
                        </div>
                        <div className="space-y-1">
                          {info.tips.map((tip, i) => (
                            <p key={i} className="text-xs text-slate-400 flex items-center gap-1">
                              <span className="text-[#10b981]">💡</span> {tip}
                            </p>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* URL Table */}
                <div className="bg-[#0f172a] rounded-xl p-4">
                  <h4 className="font-semibold text-white mb-4">Individual URL Scores</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-400 border-b border-[#334155]">
                          <th className="pb-3">URL</th>
                          <th className="pb-3 text-right">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results[expandedDomain].urlResults.map((u, i) => (
                          <tr key={i} className="border-b border-[#1e293b]">
                            <td className="py-2 text-white truncate max-w-md">{u.url}</td>
                            <td className={`py-2 text-right font-bold ${
                              u.score >= 70 ? 'text-[#10b981]' : u.score >= 50 ? 'text-yellow-400' : 'text-red-400'
                            }`}>{u.score}/100</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {showRecommendations && (
              <div className="bg-gradient-to-r from-[#1e293b] to-[#0f172a] rounded-2xl p-6 border border-[#10b981]/30">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  🎯 Personalized AIO & GEO Optimization
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.map((domain, index) => (
                    <div key={index} className="bg-[#0f172a] rounded-xl p-4 border border-[#334155]">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-white text-sm">{index === 0 ? '🏠' : '🏢'} {domain.name}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          domain.averageScore.total >= 70 ? 'bg-[#10b981]/20 text-[#10b981]' :
                          domain.averageScore.total >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                        }`}>{domain.averageScore.total}</span>
                      </div>
                      <ul className="space-y-2">
                        {(domain.recommendations || []).slice(0, 3).map((rec, i) => (
                          <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                            <span className="text-[#10b981] mt-0.5">→</span>{rec}
                          </li>
                        ))}
                        {(!domain.recommendations || domain.recommendations.length === 0) && (
                          <li className="text-xs text-[#10b981]">✅ Great! Site is well optimized.</li>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comparison Table */}
            <div className="bg-[#1e293b] rounded-2xl p-6 border border-[#334155]">
              <h3 className="text-xl font-bold text-white mb-6">📊 Competitor Comparison Chart</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-[#334155] text-sm">
                      <th className="pb-3 pr-4">Domain</th>
                      <th className="pb-3 text-center">Overall</th>
                      <th className="pb-3 text-center">Keywords</th>
                      <th className="pb-3 text-center">AI Trust</th>
                      <th className="pb-3 text-center">Content</th>
                      <th className="pb-3 text-center">Brand</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((domain, index) => (
                      <tr key={index} className={`border-b border-[#0f172a] ${index === 0 ? 'bg-[#10b981]/10' : ''}`}>
                        <td className="py-4 pr-4 text-white font-medium">
                          {index === 0 ? '🏠' : '🏢'} {domain.name}
                        </td>
                        <td className="py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                            domain.averageScore.total >= 70 ? 'bg-[#10b981]/20 text-[#10b981]' :
                            domain.averageScore.total >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                          }`}>{domain.averageScore.total}</span>
                        </td>
                        <td className="py-4 text-center text-[#ec4899] font-medium">{domain.averageScore.keywordVisibility}/20</td>
                        <td className="py-4 text-center text-[#3b82f6] font-medium">{domain.averageScore.aiTrust}/20</td>
                        <td className="py-4 text-center text-[#14b8a6] font-medium">{domain.averageScore.contentStructure}/30</td>
                        <td className="py-4 text-center text-[#84cc16] font-medium">{domain.averageScore.brandRanking}/30</td>
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
      <footer className="border-t border-[#1e293b] mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">© {new Date().getFullYear()} SAO Auditor by Conductor</p>
        </div>
      </footer>
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
