'use client';

import { useState } from 'react';

interface ContactSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan?: string;
  price?: string;
}

export default function ContactSalesModal({ isOpen, onClose, selectedPlan, price }: ContactSalesModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    telephone: '',
    remark: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          plan: selectedPlan || 'Pro',
          price: price || '$399/month',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit');
      }

      setSuccess(true);
      setFormData({ name: '', email: '', company: '', telephone: '', remark: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 rounded-2xl border border-emerald-500/30 w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white">Contact Sales</h2>
              <p className="text-emerald-100 text-sm">Get started with SAO Auditor Pro</p>
            </div>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white p-1"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-bold text-white mb-2">Thank you!</h3>
              <p className="text-slate-400 mb-6">
                We've received your inquiry. Our team will contact you within 24 hours.
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Selected Plan */}
              {selectedPlan && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-sm">
                  <span className="text-slate-400">Selected Plan: </span>
                  <span className="text-emerald-400 font-semibold">{selectedPlan}</span>
                  {price && <span className="text-slate-400"> - {price}</span>}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="John Doe"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="john@company.com"
                />
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Company Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Acme Inc."
                />
              </div>

              {/* Telephone */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Telephone <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              {/* Remark */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Remarks (Optional)
                </label>
                <textarea
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                  placeholder="Tell us about your needs..."
                />
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Inquiry'
                )}
              </button>

              <p className="text-xs text-slate-500 text-center">
                By submitting, you agree to be contacted by our sales team.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

