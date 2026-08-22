import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, X } from 'lucide-react';
import { forensicApi } from '../services/api';
import useToastStore from '../store/useToastStore';

/**
 * Collects complainant details and generates a downloadable cyber crime
 * complaint document from an analysis result already held in memory.
 * Never submits anything anywhere — only produces a file for the user
 * to review and file themselves.
 */
export default function ComplaintModal({ open, onClose, analysis, fileName }) {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', address: '', incidentDescription: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleChange = useCallback((field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setIsGenerating(true);
    try {
      const { blob, filename } = await forensicApi.generateComplaint(analysis, fileName, form);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      useToastStore.getState().addToast('Complaint document generated', 'success');
      onClose();
    } catch (err) {
      useToastStore.getState().addToast(
        err.response?.data?.detail || 'Could not generate complaint document', 'error',
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="complaint-title"
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          <motion.div
            ref={dialogRef}
            className="relative z-10 w-full max-w-md rounded-xl p-6 bg-bg-card border border-border-mid shadow-modal max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border bg-risk-criticalDim border-[rgba(251,113,133,0.20)]">
                  <ShieldAlert size={16} className="text-risk-critical" />
                </div>
                <div>
                  <h2 id="complaint-title" className="text-sm font-semibold text-text-1">
                    Raise Cyber Crime Complaint
                  </h2>
                  <p className="text-xs mt-1 text-text-2 leading-relaxed">
                    Generates a complaint document for you to review and file yourself —
                    ProofyX does not submit anything on your behalf.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded text-text-3 hover:text-text-1 hover:bg-white/5 flex-shrink-0"
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-3">
              <div>
                <label className="text-xs mb-1 block text-text-2">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange('name')}
                  className="field-input text-sm"
                  placeholder="Your full name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs mb-1 block text-text-2">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={handleChange('phone')}
                    className="field-input text-sm"
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <label className="text-xs mb-1 block text-text-2">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={handleChange('email')}
                    className="field-input text-sm"
                    placeholder="Email address"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs mb-1 block text-text-2">Address</label>
                <textarea
                  value={form.address}
                  onChange={handleChange('address')}
                  rows={2}
                  className="field-input text-sm resize-none"
                  placeholder="Your address"
                />
              </div>

              <div>
                <label className="text-xs mb-1 block text-text-2">Incident Description (optional)</label>
                <textarea
                  value={form.incidentDescription}
                  onChange={handleChange('incidentDescription')}
                  rows={3}
                  className="field-input text-sm resize-none"
                  placeholder="Where/how did you encounter this content, and what harm or risk does it pose?"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={onClose} className="btn-ghost text-xs">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!form.name.trim() || isGenerating}
                  className="btn-danger text-xs"
                >
                  {isGenerating ? 'Generating…' : 'Generate & Download'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
