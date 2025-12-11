'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Scan {
  id: string;
  url: string;
  totalScore: number;
  contentStructureScore: number;
  brandRankingScore: number;
  keywordVisibilityScore: number;
  aiTrustScore: number;
  createdAt: string;
  status: string;
  competitors: any[];
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState('');
  const [competitors, setCompetitors] = useState<string[]>(['']);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  
  const router = useRouter();

  useEffect(() => {
    checkUser();
    loadScans();
  }, []);

  async function checkUser() {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        router.push('/login?redirect=/dashboard');
        return;
      }
      const data = await res.json();
      setUser(data.user);
      setLoading(false);
    } catch (error) {
      console.error('Error checking user:', error);
      router.push('/login?redirect=/dashboard');
    }
  }

  async function loadScans() {
    try {
      const res = await fetch(`/api/scan?userId=admin`);
      if (res.ok) {
        const data = await res.json();
        // Ensure data is an array
        if (Array.isArray(data)) {
          setScans(data);
        } else {
          // If API returns status object, set empty array
          setScans([]);
        }
      }
    } catch (error) {
      console.error('Error loading scans:', error);
      setScans([]); // Set empty array on error
    }
  }

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    setScanning(true);
    setScanResult(null);

    try {
      const validCompetitors = competitors.filter(c => c.trim());
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          competitors: validCompetitors,
          userId: 'admin'
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setScanResult(data);
      loadScans();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setScanning(false);
    }
  }

  function addCompetitor() {
    if (competitors.length < 4) {
      setCompetitors([...competitors, '']);
    }
  }

  function updateCompetitor(index: number, value: string) {
    const updated = [...competitors];
    updated[index] = value;
    setCompetitors(updated);
  }

  function removeCompetitor(index: number) {
    setCompetitors(competitors.filter((_, i) => i !== index));
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#e0f2fe' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#e0f2fe' }}>
      {/* Header */}
      <header className="border-b border-slate-300 bg-white/80 backdrop-blur-lg shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-slate-800 flex items-center gap-2">
            🛠️ HAS Scorecard
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-slate-700 text-sm">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-slate-700 hover:text-slate-900 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* New Scan Form */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-slate-300 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800 mb-4">New Analysis</h2>
          <form onSubmit={handleScan} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-700 mb-2 font-medium">Website URL</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Competitors */}
            <div>
              <label className="block text-sm text-slate-700 mb-2 font-medium">
                Competitors (Optional, max 4)
              </label>
              {competitors.map((comp, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={comp}
                    onChange={(e) => updateCompetitor(idx, e.target.value)}
                    placeholder={`Competitor ${idx + 1} URL`}
                    className="flex-1 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeCompetitor(idx)}
                    className="px-3 py-2 text-red-600 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
              {competitors.length < 4 && (
                <button
                  type="button"
                  onClick={addCompetitor}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  + Add Competitor
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={scanning}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
            >
              {scanning ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Analyzing...
                </>
              ) : (
                '🚀 Start Analysis'
              )}
            </button>
          </form>
        </div>

        {/* Scan Result */}
        {scanResult && (
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-slate-300 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">Latest Result</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                scanResult.score >= 70 ? 'bg-green-500/20 text-green-400' :
                scanResult.score >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {scanResult.scoreLabel.label}
              </span>
            </div>

            {/* Score Circle */}
            <div className="flex items-center gap-8 mb-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <div className="w-28 h-28 rounded-full bg-slate-900 flex items-center justify-center">
                    <span className="text-4xl font-bold text-white">{scanResult.score}</span>
                  </div>
                </div>
              </div>
              
              {/* Pillar Bars */}
              <div className="flex-1 space-y-3">
                <ScoreBar label="Content Structure" score={scanResult.scores.contentStructure} max={30} color="blue" />
                <ScoreBar label="Brand Ranking" score={scanResult.scores.brandRanking} max={30} color="green" />
                <ScoreBar label="Keyword Visibility" score={scanResult.scores.keywordVisibility} max={20} color="yellow" />
                <ScoreBar label="AI Trust" score={scanResult.scores.aiTrust} max={20} color="purple" />
              </div>
            </div>

            {/* Comparison */}
            {scanResult.comparison && (
              <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Competitor Comparison</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">#{scanResult.comparison.rank}</div>
                    <div className="text-xs text-slate-700">Your Rank</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-800">{scanResult.score}</div>
                    <div className="text-xs text-slate-700">Your Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-700">{scanResult.comparison.avgCompetitorScore}</div>
                    <div className="text-xs text-slate-700">Avg Competitor</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${scanResult.score > scanResult.comparison.avgCompetitorScore ? 'text-green-600' : 'text-red-600'}`}>
                      {scanResult.score - scanResult.comparison.avgCompetitorScore > 0 ? '+' : ''}{scanResult.score - scanResult.comparison.avgCompetitorScore}
                    </div>
                    <div className="text-xs text-slate-700">Difference</div>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Top Recommendations</h3>
              <div className="space-y-2">
                {scanResult.recommendations.slice(0, 5).map((rec: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border-l-4 ${
                      rec.priority === 'HIGH' ? 'bg-red-50 border-red-500' :
                      rec.priority === 'MEDIUM' ? 'bg-yellow-50 border-yellow-500' :
                      'bg-green-50 border-green-500'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span>{rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🟢'}</span>
                      <div>
                        <div className="text-slate-800 font-medium">{rec.title}</div>
                        <div className="text-sm text-slate-700">{rec.description}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Scan History */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-slate-300 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Scan History</h2>
          {scans.length === 0 ? (
            <p className="text-slate-700 text-center py-8">No scans yet. Start your first analysis above!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-slate-700 text-sm border-b border-slate-300 font-medium">
                    <th className="pb-3">URL</th>
                    <th className="pb-3">Score</th>
                    <th className="pb-3">Content</th>
                    <th className="pb-3">Brand</th>
                    <th className="pb-3">Keywords</th>
                    <th className="pb-3">Trust</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {scans.map((scan) => (
                    <tr key={scan.id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="py-3 text-slate-800">
                        <div className="max-w-[200px] truncate">{scan.url}</div>
                        {scan.competitors?.length > 0 && (
                          <span className="text-xs text-slate-600">+{scan.competitors.length} competitors</span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className={`font-bold ${
                          scan.totalScore >= 70 ? 'text-green-600' :
                          scan.totalScore >= 50 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {scan.totalScore}
                        </span>
                      </td>
                      <td className="py-3 text-slate-700">{scan.contentStructureScore}/30</td>
                      <td className="py-3 text-slate-700">{scan.brandRankingScore}/30</td>
                      <td className="py-3 text-slate-700">{scan.keywordVisibilityScore}/20</td>
                      <td className="py-3 text-slate-700">{scan.aiTrustScore}/20</td>
                      <td className="py-3 text-slate-600 text-sm">
                        {new Date(scan.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ScoreBar({ label, score, max, color }: { label: string; score: number; max: number; color: string }) {
  const percentage = (score / max) * 100;
  const colorClass = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
  }[color];

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm text-slate-700 font-medium">{label}</span>
        <span className="text-sm text-slate-800 font-medium">{score}/{max}</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2">
        <div className={`${colorClass} h-2 rounded-full transition-all`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}

