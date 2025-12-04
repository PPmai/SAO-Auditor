'use client';

import { useState } from 'react';
import Link from 'next/link';
import ContactSalesModal from '@/app/components/ContactSalesModal';

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const proPrice = isAnnual ? 1200 : 120;
  const proPeriod = isAnnual ? '/year' : '/month';
  const originalYearlyPrice = 120 * 12; // $1,440
  const savings = isAnnual ? `Save $${originalYearlyPrice - 1200}/year (20% off)` : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
              <span className="text-xl">🔍</span>
            </div>
            <div>
              <div className="text-xl font-bold text-white">SAO Auditor</div>
              <div className="text-xs text-emerald-400">Search & AI Optimization</div>
            </div>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-slate-400 hover:text-white transition">
              Home
            </Link>
            <Link href="/admin/login" className="text-slate-400 hover:text-white transition">
              Admin
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">
          Choose the plan that fits your needs. Start free, upgrade when you're ready.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-sm ${!isAnnual ? 'text-white' : 'text-slate-400'}`}>Monthly</span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative w-14 h-7 rounded-full transition ${
              isAnnual ? 'bg-emerald-600' : 'bg-slate-600'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition ${
                isAnnual ? 'translate-x-7' : ''
              }`}
            />
          </button>
          <span className={`text-sm ${isAnnual ? 'text-white' : 'text-slate-400'}`}>
            Annual <span className="text-emerald-400 text-xs">(Save 20%)</span>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="bg-white/5 rounded-2xl p-8 border border-white/10 text-left">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-400 mb-2">Free</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold text-white">$0</span>
                <span className="text-slate-400">/forever</span>
              </div>
            </div>

            <p className="text-slate-400 mb-6">
              Perfect for quick website audits and basic optimization checks.
            </p>

            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3 text-slate-300">
                <span className="text-emerald-400">✓</span>
                1 URL scan at a time
              </li>
              <li className="flex items-center gap-3 text-slate-300">
                <span className="text-emerald-400">✓</span>
                Basic 4-pillar analysis
              </li>
              <li className="flex items-center gap-3 text-slate-300">
                <span className="text-emerald-400">✓</span>
                Content structure scoring
              </li>
              <li className="flex items-center gap-3 text-slate-300">
                <span className="text-emerald-400">✓</span>
                Core Web Vitals check
              </li>
              <li className="flex items-center gap-3 text-slate-300">
                <span className="text-emerald-400">✓</span>
                AI optimization tips
              </li>
              <li className="flex items-center gap-3 text-slate-500">
                <span className="text-slate-600">✗</span>
                Competitor analysis
              </li>
              <li className="flex items-center gap-3 text-slate-500">
                <span className="text-slate-600">✗</span>
                Batch URL scanning
              </li>
            </ul>

            <Link
              href="/"
              className="block w-full py-3 text-center bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition"
            >
              Get Started Free
            </Link>
          </div>

          {/* Pro Tier */}
          <div className="bg-gradient-to-br from-emerald-900/50 to-teal-900/50 rounded-2xl p-8 border border-emerald-500/30 text-left relative overflow-hidden">
            {/* Popular badge */}
            <div className="absolute top-4 right-4 px-3 py-1 bg-emerald-500 text-white text-xs font-semibold rounded-full">
              RECOMMENDED
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-emerald-400 mb-2">Pro</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold text-white">${proPrice}</span>
                <span className="text-slate-400">{proPeriod}</span>
              </div>
              {savings && (
                <p className="text-emerald-400 text-sm mt-1">{savings}</p>
              )}
            </div>

            <p className="text-slate-300 mb-6">
              For teams serious about SEO and AI optimization at scale.
            </p>

            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-white">
                <span className="text-emerald-400">✓</span>
                <strong>30 URLs</strong> per scan
              </li>
              <li className="flex items-center gap-3 text-white">
                <span className="text-emerald-400">✓</span>
                <strong>4 competitor</strong> domains
              </li>
              <li className="flex items-center gap-3 text-white">
                <span className="text-emerald-400">✓</span>
                10 URLs per competitor
              </li>
              <li className="flex items-center gap-3 text-white">
                <span className="text-emerald-400">✓</span>
                Domain average scoring
              </li>
              <li className="flex items-center gap-3 text-white">
                <span className="text-emerald-400">✓</span>
                Competitor comparison charts
              </li>
              <li className="flex items-center gap-3 text-white">
                <span className="text-emerald-400">✓</span>
                Priority support
              </li>
              <li className="flex items-center gap-3 text-white">
                <span className="text-emerald-400">✓</span>
                Custom reporting
              </li>
              <li className="flex items-center gap-3 text-white">
                <span className="text-emerald-400">✓</span>
                Personalized AIO & GEO optimization
              </li>
              <li className="flex items-center gap-3 text-white">
                <span className="text-emerald-400">✓</span>
                PDF Export
              </li>
            </ul>

            <button
              onClick={() => setIsModalOpen(true)}
              className="block w-full py-3 text-center bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition"
            >
              Contact Sales
            </button>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-3xl mx-auto text-left">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-white font-semibold mb-2">What's included in the free tier?</h3>
              <p className="text-slate-400 text-sm">
                The free tier lets you analyze one URL at a time with our complete 4-pillar scoring system. 
                You'll get instant insights on content structure, brand ranking, keyword visibility, and AI trust signals.
              </p>
            </div>
            
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-white font-semibold mb-2">How does batch URL scanning work?</h3>
              <p className="text-slate-400 text-sm">
                Pro users can scan up to 30 URLs from their domain simultaneously. The system calculates 
                average scores across all URLs, giving you a comprehensive view of your entire site's optimization status.
              </p>
            </div>
            
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-white font-semibold mb-2">Can I compare with competitors?</h3>
              <p className="text-slate-400 text-sm">
                Yes! Pro tier includes competitor analysis. Add up to 4 competitor domains with 10 URLs each, 
                and see side-by-side score comparisons to understand your competitive positioning.
              </p>
            </div>
            
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-white font-semibold mb-2">How do I get started with Pro?</h3>
              <p className="text-slate-400 text-sm">
                Click "Contact Sales" to fill out a quick form. Our team will reach out within 24 hours to 
                discuss your needs and set up your Pro account.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 mt-20">
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
        </div>
      </footer>

      {/* Contact Sales Modal */}
      <ContactSalesModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        selectedPlan={isAnnual ? 'Pro Annual' : 'Pro Monthly'}
        price={`$${proPrice}${proPeriod}`}
      />
    </div>
  );
}
