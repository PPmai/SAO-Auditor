'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AdminUser {
  email: string;
  role: string;
  name: string;
}

export default function AdminDashboardPage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalScans: 0,
    todayScans: 0,
    avgScore: 0,
  });
  
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const response = await fetch('/api/admin/me');
      
      if (!response.ok) {
        router.push('/admin/login');
        return;
      }
      
      const data = await response.json();
      setUser(data.user);
      
      // Mock stats for testing
      setStats({
        totalScans: Math.floor(Math.random() * 1000) + 100,
        todayScans: Math.floor(Math.random() * 50) + 5,
        avgScore: Math.floor(Math.random() * 30) + 50,
      });
    } catch (error) {
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold text-white flex items-center gap-2">
              🔍 SAO Auditor
            </Link>
            <span className="px-2 py-1 bg-indigo-600 text-white text-xs font-semibold rounded">
              ADMIN
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-white font-medium">{user.name}</div>
              <div className="text-slate-400 text-xs">{user.role.replace('_', ' ').toUpperCase()}</div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user.name}!</h1>
          <p className="text-slate-400">Here's what's happening with SAO Auditor today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Scans"
            value={stats.totalScans.toLocaleString()}
            icon="📊"
            color="blue"
          />
          <StatCard
            title="Scans Today"
            value={stats.todayScans.toLocaleString()}
            icon="📈"
            color="green"
          />
          <StatCard
            title="Average Score"
            value={`${stats.avgScore}/100`}
            icon="⭐"
            color="yellow"
          />
        </div>

        {/* Pro Feature - Multi-URL Scan */}
        <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 backdrop-blur-lg rounded-2xl p-6 border border-emerald-500/30 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                🚀 Pro Multi-URL Scan
                <span className="px-2 py-0.5 bg-emerald-600 text-white text-xs rounded">PRO</span>
              </h2>
              <p className="text-slate-400 text-sm mt-1">Analyze 30 URLs + compare with 4 competitors</p>
            </div>
            <Link
              href="/internal"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition flex items-center gap-2"
            >
              🔍 Run Pro Scan
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-emerald-400">30</div>
              <div className="text-slate-400">URLs per scan</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-emerald-400">4</div>
              <div className="text-slate-400">Competitors</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-emerald-400">10</div>
              <div className="text-slate-400">URLs/competitor</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-emerald-400">5</div>
              <div className="text-slate-400">Score cards</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <ActionButton icon="🚀" label="Pro Scan (Multi-URL)" href="/internal" highlight />
            <ActionButton icon="🔍" label="Free Scan (Single URL)" href="/" />
            <ActionButton icon="💰" label="Pricing Page" href="/pricing" />
            <ActionButton icon="⚙️" label="Settings" href="/admin/settings" />
          </div>
        </div>

        {/* Admin Tools */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* System Status */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4">System Status</h2>
            <div className="space-y-3">
              <StatusItem label="API Status" status="operational" />
              <StatusItem label="Database" status="testing" />
              <StatusItem label="Moz API" status="not_configured" />
              <StatusItem label="DataForSEO API" status="not_configured" />
              <StatusItem label="Google Search Console" status="not_configured" />
              <StatusItem label="PageSpeed API" status="operational" />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
            <div className="space-y-3">
              <ActivityItem
                action="Admin login"
                user={user.email}
                time="Just now"
              />
              <ActivityItem
                action="System started"
                user="System"
                time="5 minutes ago"
              />
              <ActivityItem
                action="Test scan completed"
                user="Anonymous"
                time="10 minutes ago"
              />
            </div>
          </div>
        </div>

        {/* Environment Info */}
        <div className="mt-8 bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-4">Environment Configuration</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-slate-400">Mode</span>
              <span className="text-yellow-400 font-medium">Testing (No Database)</span>
            </div>
            <div className="flex justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-slate-400">PageSpeed API</span>
              <span className="text-green-400 font-medium">✓ Configured</span>
            </div>
            <div className="flex justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-slate-400">Moz API</span>
              <span className="text-red-400 font-medium">Not Configured</span>
            </div>
            <div className="flex justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-slate-400">DataForSEO API</span>
              <span className="text-red-400 font-medium">Not Configured</span>
            </div>
          </div>
          <p className="text-slate-500 text-xs mt-4">
            💡 Configure Moz and DataForSEO APIs in .env file to get real backlink and keyword data.
          </p>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string; icon: string; color: string }) {
  const colorClasses = {
    blue: 'from-blue-600/20 to-blue-600/5 border-blue-500/20',
    green: 'from-green-600/20 to-green-600/5 border-green-500/20',
    yellow: 'from-yellow-600/20 to-yellow-600/5 border-yellow-500/20',
  }[color] || 'from-blue-600/20 to-blue-600/5 border-blue-500/20';

  return (
    <div className={`bg-gradient-to-br ${colorClasses} backdrop-blur-lg rounded-2xl p-6 border`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-3xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-slate-400 text-sm">{title}</div>
    </div>
  );
}

function ActionButton({ icon, label, href, highlight }: { icon: string; label: string; href: string; highlight?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 p-4 rounded-xl transition border ${
        highlight 
          ? 'bg-emerald-600/20 hover:bg-emerald-600/30 border-emerald-500/30' 
          : 'bg-white/5 hover:bg-white/10 border-white/10'
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-white font-medium">{label}</span>
    </Link>
  );
}

function StatusItem({ label, status }: { label: string; status: string }) {
  const statusConfig = {
    operational: { color: 'bg-green-500', text: 'Operational' },
    testing: { color: 'bg-yellow-500', text: 'Testing Mode' },
    not_configured: { color: 'bg-red-500', text: 'Not Configured' },
    error: { color: 'bg-red-500', text: 'Error' },
  }[status] || { color: 'bg-slate-500', text: status };

  return (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
      <span className="text-slate-300">{label}</span>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${statusConfig.color}`}></div>
        <span className="text-sm text-slate-400">{statusConfig.text}</span>
      </div>
    </div>
  );
}

function ActivityItem({ action, user, time }: { action: string; user: string; time: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
      <div>
        <div className="text-white text-sm">{action}</div>
        <div className="text-slate-500 text-xs">{user}</div>
      </div>
      <div className="text-slate-500 text-xs">{time}</div>
    </div>
  );
}




