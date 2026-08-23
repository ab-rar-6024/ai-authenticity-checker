import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileSearch, IdCard, ShieldAlert, ShieldCheck, X, Check, AlertTriangle } from 'lucide-react';
import { fadeUp } from '../utils/animations';
import useForensicStore from '../store/useForensicStore';
import PageHeader from '../components/PageHeader';
import ConfirmDialog from '../components/ConfirmDialog';
import ComplaintModal from '../components/ComplaintModal';
import UploadZone from '../components/UploadZone';
import RiskGauge from '../components/RiskGauge';
import VerdictCard from '../components/VerdictCard';
import IndeterminateProgress from '../components/IndeterminateProgress';

const CHECK_LABELS = {
  ai_generation: 'AI Generation',
  tampering: 'Tampering (ELA)',
  copy_move: 'Copy-Move',
  metadata: 'Metadata',
  id_number: 'ID Number',
};

const CHECK_OK_VALUES = new Set(['Not detected', 'Analyzed', 'Valid format']);

const ID_TYPES = [
  { value: '', label: 'None / Other document' },
  { value: 'aadhaar', label: 'Aadhaar' },
  { value: 'pan', label: 'PAN' },
  { value: 'voter_id', label: 'Voter ID (EPIC)' },
];

const ID_PLACEHOLDERS = {
  aadhaar: 'e.g. 234567890124 (12 digits)',
  pan: 'e.g. ABCDE1234F',
  voter_id: 'e.g. ABC1234567',
};

function CheckBadge({ name, value }) {
  const ok = CHECK_OK_VALUES.has(value);
  return (
    <div
      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm ${
        ok
          ? 'bg-risk-clearDim border-[rgba(34,197,94,0.15)] text-risk-clear'
          : 'bg-risk-cautionDim border-[rgba(250,204,21,0.15)] text-risk-caution'
      }`}
    >
      <span className="flex items-center gap-2 text-text-1">
        {ok ? <Check size={13} className="text-risk-clear" /> : <AlertTriangle size={13} className="text-risk-caution" />}
        {CHECK_LABELS[name] || name}
      </span>
      <span className="text-xs font-medium">{value}</span>
    </div>
  );
}

export default function DocumentAnalysis() {
  const [file, setFile] = useState(null);
  const [idType, setIdType] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [complaintOpen, setComplaintOpen] = useState(false);

  const { documentAnalysis, runDocumentAnalysis, clearAnalysis } = useForensicStore();
  const { isAnalyzing, results, error } = documentAnalysis;

  const handleAnalyze = () => {
    if (file) runDocumentAnalysis(file, idType, idNumber);
  };

  const handleCancelRequest = useCallback(() => setConfirmCancel(true), []);
  const handleCancelConfirm = useCallback(() => {
    const { cancelAnalysis } = useForensicStore.getState();
    cancelAnalysis('document');
    clearAnalysis('document');
    setConfirmCancel(false);
  }, [clearAnalysis]);

  const checkEntries = results?.checks ? Object.entries(results.checks) : [];

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeUp} className="space-y-6">
      <PageHeader
        icon={FileSearch}
        title="Document Analysis"
        subtitle="Screen IDs, receipts, certificates, and scanned documents for AI generation or tampering."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column: Upload + Analyze */}
        <div className="lg:col-span-1 space-y-4">
          <UploadZone
            onFileSelect={setFile}
            accept="image/*"
            label="Drop document/ID or click to browse"
          />

          <div className="p-3 rounded-lg bg-bg-inset border border-border-dim text-xs text-text-2 leading-relaxed">
            Heuristic forensic checks (error-level analysis, noise
            consistency, copy-move detection, metadata) plus a generic
            AI-image detector applied to the whole document. Not a
            trained document classifier yet — treat results as a first
            pass, same as a &quot;Beta&quot; feature.
          </div>

          {/* Government ID proof-of-concept */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <IdCard size={13} className="text-text-3" />
              <span className="label-tag">ID Number Check (Optional)</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs mb-1 block text-text-2">ID Type</label>
                <select
                  value={idType}
                  onChange={(e) => { setIdType(e.target.value); setIdNumber(''); }}
                  className="field-input text-sm"
                >
                  {ID_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {idType && (
                <div>
                  <label className="text-xs mb-1 block text-text-2">
                    {ID_TYPES.find((t) => t.value === idType)?.label} Number
                  </label>
                  <input
                    type="text"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder={ID_PLACEHOLDERS[idType]}
                    className="field-input text-sm font-mono"
                  />
                  <p className="text-xs mt-1.5 text-text-3">
                    {idType === 'aadhaar'
                      ? 'Checked against the real Verhoeff checksum UIDAI uses — not a guess.'
                      : 'Checked against the standard format only — no public checksum exists for this ID type.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {isAnalyzing ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <button disabled className="btn-primary flex-1 py-3 text-sm">
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </button>
                <button onClick={handleCancelRequest} className="btn-danger py-3 px-4 text-sm">
                  <X size={15} />
                  Cancel
                </button>
              </div>
              <IndeterminateProgress label="Running forensic checks…" />
            </div>
          ) : (
            <button
              onClick={handleAnalyze}
              disabled={!file}
              className="btn-primary w-full py-3 text-sm"
            >
              <ShieldCheck size={15} />
              Run Document Analysis
            </button>
          )}

          {results?.processing_time_ms != null && (
            <p className="text-xs text-center text-text-3">
              Completed in {(results.processing_time_ms / 1000).toFixed(1)}s
            </p>
          )}
        </div>

        {/* Right column: Results panel */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={13} className="text-text-3" />
              <span className="label-tag">Document Review</span>
            </div>

            {error ? (
              <div
                role="alert"
                className="p-3 rounded-lg text-sm bg-risk-criticalDim text-risk-critical border border-[rgba(251,113,133,0.20)]"
              >
                {error}
              </div>
            ) : !results ? (
              <div className="flex items-center justify-center gap-2 py-8 text-text-3">
                <ShieldCheck size={16} className="opacity-30" />
                <p className="text-sm">Upload a document or ID image and run analysis to see results.</p>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex flex-col items-center">
                  <RiskGauge percentage={results.risk_percent} />

                  <div className="flex flex-wrap justify-center gap-4 mt-2">
                    {results.confidence && (
                      <span className="text-xs text-text-2">
                        Confidence: <strong className="text-text-1">{results.confidence}</strong>
                      </span>
                    )}
                    {results.primary_finding && (
                      <span className="text-xs text-text-2">
                        Finding: <strong className="text-text-1">{results.primary_finding}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {checkEntries.length > 0 && (
                  <div className="space-y-2">
                    <span className="label-tag mb-1 block">Visual Analysis</span>
                    {checkEntries.map(([name, value]) => (
                      <CheckBadge key={name} name={name} value={value} />
                    ))}
                  </div>
                )}

                {results.id_validation && (
                  <div
                    className={`p-3 rounded-lg border text-sm ${
                      results.id_validation.valid
                        ? 'bg-risk-clearDim border-[rgba(34,197,94,0.15)]'
                        : 'bg-risk-cautionDim border-[rgba(250,204,21,0.15)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {results.id_validation.valid
                        ? <Check size={13} className="text-risk-clear" />
                        : <AlertTriangle size={13} className="text-risk-caution" />}
                      <span className="font-semibold text-text-1">
                        {results.id_validation.id_label} Number: {results.id_validation.valid ? 'Valid' : 'Invalid'}
                      </span>
                    </div>
                    <p className="text-xs text-text-2 leading-relaxed">
                      {results.id_validation.reason}
                    </p>
                  </div>
                )}

                <VerdictCard verdict={results.verdict} riskScore={results.risk_percent} />

                {results.verdict === 'AI-GENERATED' && (
                  <button
                    onClick={() => setComplaintOpen(true)}
                    className="btn-danger w-full py-2.5 text-sm"
                  >
                    <ShieldAlert size={15} />
                    Raise Cyber Crime Complaint
                  </button>
                )}

                {results.evidence?.ela_map && (
                  <div>
                    <span className="label-tag mb-2 block">Error Level Analysis (Evidence)</span>
                    <img
                      src={results.evidence.ela_map}
                      alt="Error level analysis heatmap"
                      className="w-full rounded-lg border border-border-dim"
                    />
                  </div>
                )}

                {results.exif?.findings?.length > 0 && (
                  <div className="p-3 rounded-lg bg-bg-inset border border-border-dim">
                    <span className="label-tag mb-1.5 block">Metadata Findings</span>
                    <ul className="text-sm text-text-2 space-y-1 list-disc list-inside">
                      {results.exif.findings.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        title="Cancel Analysis"
        message="The current analysis is still running. Are you sure you want to cancel?"
        confirmLabel="Cancel Analysis"
        onConfirm={handleCancelConfirm}
        onCancel={() => setConfirmCancel(false)}
      />

      <ComplaintModal
        open={complaintOpen}
        onClose={() => setComplaintOpen(false)}
        analysis={results}
        fileName={file?.name}
      />
    </motion.div>
  );
}
