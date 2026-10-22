'use client';

import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Search,
  AlertOctagon,
  Clock,
  Cpu,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  FileText,
  Activity,
  Layers,
  ChevronRight,
  Crosshair,
  User,
  Globe,
  Terminal,
  Lock,
} from 'lucide-react';
import { ActionType, SecurityEventDetail } from '@/types';

interface DecisionDetailsModalProps {
  event: SecurityEventDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitReview: (
    eventId: string,
    review: { verdict: string; new_action?: string; reviewer: string; notes: string }
  ) => Promise<void>;
  onTriggerReinvestigate: (eventId: string) => Promise<void>;
}

export const DecisionDetailsModal: React.FC<DecisionDetailsModalProps> = ({
  event,
  isOpen,
  onClose,
  onSubmitReview,
  onTriggerReinvestigate,
}) => {
  const [reviewVerdict, setReviewVerdict] = useState<'APPROVED' | 'OVERRIDDEN'>('APPROVED');
  const [overrideAction, setOverrideAction] = useState<ActionType>('INVESTIGATE');
  const [reviewerName, setReviewerName] = useState('Senior SecOps Analyst');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReinvestigating, setIsReinvestigating] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isOpen || !event) return null;

  const decision = event.decision;
  const investigation = event.investigation;

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewVerdict === 'OVERRIDDEN' && !reviewNotes.trim()) {
      alert('Please provide justification notes when overriding a decision.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmitReview(event.event_id, {
        verdict: reviewVerdict,
        new_action: reviewVerdict === 'OVERRIDDEN' ? overrideAction : undefined,
        reviewer: reviewerName,
        notes: reviewNotes || (reviewVerdict === 'APPROVED' ? 'Approved automated policy verdict without modification.' : ''),
      });
      setFeedbackMsg('Human review submitted and audit record sealed.');
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      alert(err?.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReinvestigate = async () => {
    try {
      setIsReinvestigating(true);
      await onTriggerReinvestigate(event.event_id);
      setFeedbackMsg('Synthetic forensic tools re-executed successfully.');
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      alert(err?.message || 'Failed to re-run investigation');
    } finally {
      setIsReinvestigating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-mono">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#070c18] border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_-10px_rgba(6,182,212,0.3)] flex flex-col overflow-hidden cyber-corners">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-[#04070f] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
              <Crosshair className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-slate-100 text-sm">
                  INCIDENT DOSSIER: {event.event_id}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-700">
                  {event.event_type}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Logged: {event.timestamp} • Ingested into SQLite Ledger
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Top Decision Banner */}
          <div className="cyber-panel p-5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-slate-500 text-[10px] uppercase tracking-wider block">
                DECIDER 2B POLICY VERDICT
              </span>
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1.5 rounded-lg text-sm font-extrabold tracking-wider ${
                    decision?.action === 'CLOSE'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : decision?.action === 'INVESTIGATE'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                      : 'bg-rose-950 text-rose-300 border border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                  }`}
                >
                  {decision?.action || 'PENDING'}
                </span>

                <div className="text-[11px] text-slate-400 space-y-0.5">
                  <div>Model: <strong className="text-slate-200">{decision?.model_name || 'Strands Decider 2B'}</strong></div>
                  <div>Inference Latency: <strong className="text-cyan-400">{decision?.latency_ms ? `${decision.latency_ms.toFixed(1)} ms` : '118 ms'}</strong></div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start sm:items-end">
              <span className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">
                HUMAN REVIEW GATEWAY
              </span>
              <span
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                  event.status === 'PENDING_REVIEW'
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50 animate-pulse'
                    : event.status === 'APPROVED'
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/40'
                    : event.status === 'OVERRIDDEN'
                    ? 'bg-purple-950/60 text-purple-300 border border-purple-700/40'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                STATUS: {event.status.replace('_', ' ')}
              </span>
              {decision?.routed_to_human_review && (
                <span className="text-[10px] text-amber-400 mt-1">
                  Reason: {decision.review_reason || 'Confidence < 0.80 Circuit'}
                </span>
              )}
            </div>
          </div>

          {/* Decider 2B Pointer Head Softmax Spectrum */}
          {decision?.distribution && (
            <div className="cyber-panel p-5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-bold flex items-center gap-1.5 text-slate-200">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  Pointer-Head Logit Distribution (Calibrated Softmax)
                </span>
                <span className="text-slate-500 text-[10px]">Threshold: 0.80</span>
              </div>

              <div className="space-y-2">
                {Object.entries(decision.distribution).map(([act, prob]) => {
                  const pct = Math.round((prob as number) * 100);
                  const isSelected = act === decision.action;
                  return (
                    <div key={act} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className={isSelected ? 'text-cyan-300 font-bold' : 'text-slate-400'}>
                          {act} {isSelected && '(SELECTED)'}
                        </span>
                        <span className="text-slate-300">{pct}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full transition-all duration-500 ${
                            act === 'CLOSE'
                              ? 'bg-emerald-500'
                              : act === 'INVESTIGATE'
                              ? 'bg-cyan-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.max(pct, 2)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Telemetry Facts & Synthetic Forensics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Observed Telemetry */}
            <div className="cyber-panel p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-slate-400 font-bold flex items-center gap-1.5 uppercase text-[10px] text-cyan-400">
                <Terminal className="w-3.5 h-3.5" />
                Normalized Telemetry Facts
              </span>
              <div className="space-y-1 text-slate-300 text-[11px] leading-relaxed">
                <div>Identity: <strong className="text-slate-100">{event.username || 'UNKNOWN'}</strong></div>
                <div>Source IP: <strong className="text-slate-100">{event.source_ip || 'UNKNOWN'}</strong></div>
                <div>Device: <strong className="text-slate-100">{event.device || 'UNKNOWN'}</strong></div>
                <div>Location: <strong className="text-slate-100">{event.location || 'UNKNOWN'}</strong></div>
                <div>Failed Logins: <strong className="text-amber-400">{event.failed_login_count}</strong></div>
                <div>Privilege Level: <strong className="text-slate-100">{event.privilege_level}</strong></div>
              </div>
            </div>

            {/* Synthetic Forensics */}
            <div className="cyber-panel p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold flex items-center gap-1.5 uppercase text-[10px] text-cyan-400">
                  <Activity className="w-3.5 h-3.5" />
                  Forensic Intelligence
                </span>
                <button
                  onClick={handleReinvestigate}
                  disabled={isReinvestigating}
                  className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 text-[10px] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className={`w-3 h-3 ${isReinvestigating ? 'animate-spin' : ''}`} />
                  Re-Query
                </button>
              </div>

              {investigation ? (
                <div className="space-y-1 text-slate-300 text-[11px]">
                  <div>IP Reputation: <strong className="text-slate-100">{investigation.ip_reputation?.threat_score || 0}/100 ({investigation.ip_reputation?.tor_exit_node ? 'TOR EXIT DETECTED' : 'Clean'})</strong></div>
                  <div>User Blast Radius: <strong className="text-slate-100">{investigation.user_profile?.blast_radius || 'Normal'}</strong></div>
                  <div>EDR Posture: <strong className="text-slate-100">{investigation.device_posture?.compliant ? 'Compliant' : 'Non-Compliant'}</strong></div>
                  <div>MITRE Technique: <strong className="text-purple-300">{investigation.threat_intel_match?.mitre_technique || 'N/A'}</strong></div>
                </div>
              ) : (
                <p className="text-slate-500 text-[11px]">No forensic record attached.</p>
              )}
            </div>
          </div>

          {/* Amazon Bedrock Generative Incident Report */}
          <div className="cyber-panel p-5 rounded-xl border border-purple-500/20 space-y-3 bg-purple-950/10">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-2 text-purple-300">
                <Cloud className="w-4 h-4 text-purple-400" />
                Amazon Bedrock Incident Rationale & Remediation (Claude 3.5 Sonnet)
              </span>
              <span className="text-[10px] text-purple-400/80">
                System 2 Explainer • {decision?.bedrock_latency_ms ? `${decision.bedrock_latency_ms.toFixed(0)}ms` : 'Synthetic'}
              </span>
            </div>

            <p className="text-slate-300 leading-relaxed text-[11px] font-sans">
              {decision?.explanation || 'No generative explanation available for this event.'}
            </p>

            {decision?.recommended_steps && decision.recommended_steps.length > 0 && (
              <div className="pt-2 border-t border-purple-900/40">
                <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                  Recommended SecOps Containment Steps:
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] font-sans">
                  {decision.recommended_steps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Human Review Form */}
          <div className="cyber-panel p-5 rounded-xl border border-slate-800 space-y-4">
            <span className="font-bold flex items-center gap-2 text-slate-200">
              <Lock className="w-4 h-4 text-cyan-400" />
              SecOps Analyst Sign-off Console
            </span>

            {feedbackMsg && (
              <div className="p-3 bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs">
                {feedbackMsg}
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="space-y-4 font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase block mb-1.5">
                    Review Decision:
                  </label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setReviewVerdict('APPROVED')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                        reviewVerdict === 'APPROVED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}
                    >
                      APPROVE VERDICT
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewVerdict('OVERRIDDEN')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                        reviewVerdict === 'OVERRIDDEN'
                          ? 'bg-purple-950 text-purple-300 border border-purple-500/50 shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}
                    >
                      OVERRIDE ACTION
                    </button>
                  </div>
                </div>

                {reviewVerdict === 'OVERRIDDEN' && (
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase block mb-1.5">
                      New Policy Action:
                    </label>
                    <select
                      value={overrideAction}
                      onChange={(e) => setOverrideAction(e.target.value as ActionType)}
                      className="w-full bg-[#03060c] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="CLOSE">CLOSE</option>
                      <option value="INVESTIGATE">INVESTIGATE</option>
                      <option value="ESCALATE">ESCALATE</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase block mb-1.5">
                  Analyst Identity & Justification Notes:
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="Analyst Name / Callout"
                    className="w-full bg-[#03060c] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                  <textarea
                    rows={2}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Enter analytical justification (required if overriding verdict)..."
                    className="w-full bg-[#03060c] border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  DISMISS
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'COMMITTING TO LEDGER...' : 'COMMIT HUMAN AUDIT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
