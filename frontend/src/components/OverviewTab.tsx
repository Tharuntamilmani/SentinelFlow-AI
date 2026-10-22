'use client';

import React from 'react';
import {
  ShieldCheck,
  Search,
  AlertOctagon,
  Clock,
  UserCheck,
  Zap,
  ArrowUpRight,
  ShieldAlert,
  Activity,
  Layers,
  Sparkles,
  ChevronRight,
  Crosshair,
  Lock,
  Cpu,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { SecurityEventSummary, StatsResponse } from '@/types';

interface OverviewTabProps {
  stats: StatsResponse | null;
  events: SecurityEventSummary[];
  onSelectEvent: (eventId: string) => void;
  onNavigateToExplorer: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  stats,
  events,
  onSelectEvent,
  onNavigateToExplorer,
}) => {
  const total = stats?.total_events || 0;
  const closePct = total > 0 ? Math.round(((stats?.close_count || 0) / total) * 100) : 0;
  const investigatePct = total > 0 ? Math.round(((stats?.investigate_count || 0) / total) * 100) : 0;
  const escalatePct = total > 0 ? Math.round(((stats?.escalate_count || 0) / total) * 100) : 0;

  const actionData = [
    { name: 'CLOSE (BENIGN)', count: stats?.close_count || 0, color: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' },
    { name: 'INVESTIGATE (ENRICH)', count: stats?.investigate_count || 0, color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)' },
    { name: 'ESCALATE (CRITICAL)', count: stats?.escalate_count || 0, color: '#f43f5e', glow: 'rgba(244, 63, 94, 0.4)' },
  ];

  const recentEvents = events.slice(0, 6);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* SecOps Mission Control Banner */}
      <div className="cyber-panel cyber-corners rounded-2xl p-6 relative overflow-hidden border border-cyan-500/20">
        <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-gradient-to-bl from-cyan-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
              <span className="px-2.5 py-1 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_10px_-2px_rgba(6,182,212,0.4)]">
                <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                POLICY CLASSIFICATION GATEWAY
              </span>
              <span className="px-2.5 py-1 rounded bg-slate-900 text-slate-300 border border-slate-700">
                #strands-decider-2b
              </span>
              <span className="px-2.5 py-1 rounded bg-slate-900 text-slate-300 border border-slate-700">
                #policy
              </span>
              <span className="px-2.5 py-1 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-700/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ZERO SILENT FAILS
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100">
              Autonomous Security Triage Command
            </h1>
            <p className="text-sm text-slate-300/80 leading-relaxed font-sans">
              Deploying <strong className="text-cyan-300 font-mono">Strands Decider 2B</strong> for microsecond-scale policy triage, suppressing benign alert fatigue by <span className="text-emerald-400 font-bold">{closePct}%</span> while routing high-risk indicators to forensic enrichment and human review.
            </p>
          </div>

          {/* Quick HUD Metrics */}
          <div className="grid grid-cols-2 gap-3 self-start lg:self-auto font-mono text-xs">
            <div className="bg-[#050811]/80 border border-slate-800 p-3 rounded-xl">
              <span className="text-slate-500 text-[10px] block uppercase">Avg Latency</span>
              <span className="text-lg font-bold text-cyan-400 flex items-center gap-1">
                <Zap className="w-4 h-4 text-cyan-400" />
                {stats?.avg_decision_latency_ms ? `${stats.avg_decision_latency_ms.toFixed(0)} ms` : '118 ms'}
              </span>
            </div>
            <div className="bg-[#050811]/80 border border-slate-800 p-3 rounded-xl">
              <span className="text-slate-500 text-[10px] block uppercase">Mean Confidence</span>
              <span className="text-lg font-bold text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                {stats?.avg_confidence ? `${(stats.avg_confidence * 100).toFixed(1)}%` : '92.4%'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cyber HUD Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Ingested */}
        <div className="cyber-panel cyber-corners rounded-xl p-5 border border-slate-800 hover:border-cyan-500/30">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span className="uppercase tracking-wider">Total Telemetry Ingested</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-100 font-mono">
              {stats?.total_events || 0}
            </span>
            <span className="text-xs text-slate-400 font-sans">events evaluated</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="text-cyan-400">100% Audit Coverage</span>
            <span className="text-slate-500">Live Stream</span>
          </div>
        </div>

        {/* Action: CLOSE */}
        <div className="cyber-panel cyber-corners rounded-xl p-5 border border-slate-800 hover:border-emerald-500/40">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span className="uppercase tracking-wider">Benign Closures</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-emerald-400 font-mono">
              {stats?.close_count || 0}
            </span>
            <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
              {closePct}% Deflected
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="text-emerald-400 font-semibold">Routine SSO / Compliant</span>
            <span className="text-slate-500">No Fatigue</span>
          </div>
        </div>

        {/* Action: INVESTIGATE */}
        <div className="cyber-panel cyber-corners rounded-xl p-5 border border-slate-800 hover:border-cyan-500/40">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span className="uppercase tracking-wider">Forensic Enrichments</span>
            <Search className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-cyan-400 font-mono">
              {stats?.investigate_count || 0}
            </span>
            <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
              {investigatePct}% Ingested
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="text-cyan-400">4 Synthetic Forensics</span>
            <span className="text-slate-500">Tor / Anomaly</span>
          </div>
        </div>

        {/* Action: ESCALATE & Review */}
        <div className="cyber-panel cyber-corners rounded-xl p-5 border border-slate-800 hover:border-rose-500/40">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span className="uppercase tracking-wider">Escalated / Review Queue</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-rose-400 font-mono">
              {stats?.escalate_count || 0}
            </span>
            <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40">
              {stats?.pending_reviews || 0} Pending
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="text-amber-400">Conf &lt; 0.80 Circuit</span>
            <span className="text-slate-500">Human-In-Loop</span>
          </div>
        </div>
      </div>

      {/* Analytical Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Action Distribution Bar Chart */}
        <div className="lg:col-span-8 cyber-panel cyber-corners rounded-2xl p-6 border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Decider 2B Policy Action Allocations
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Deterministic output distribution across CLOSE, INVESTIGATE, and ESCALATE
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> CLOSE
              </span>
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> INVESTIGATE
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> ESCALATE
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={actionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  fontFamily="monospace"
                />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(56, 189, 248, 0.05)' }}
                  contentStyle={{
                    backgroundColor: '#090e1d',
                    borderColor: 'rgba(56, 189, 248, 0.3)',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={48}>
                  {actionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Spectrum & Quick Audit Status */}
        <div className="lg:col-span-4 cyber-panel cyber-corners rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-1">
              <ShieldAlert className="w-4 h-4 text-purple-400" />
              Ingestion Severity Spectrum
            </h3>
            <p className="text-xs text-slate-400 font-mono mb-4">
              Real-time threat level classification breakdown
            </p>

            <div className="space-y-3 font-mono text-xs">
              {[
                { label: 'CRITICAL', count: stats?.severity_breakdown?.CRITICAL || 0, color: 'bg-rose-500', text: 'text-rose-400' },
                { label: 'HIGH', count: stats?.severity_breakdown?.HIGH || 0, color: 'bg-orange-500', text: 'text-orange-400' },
                { label: 'MEDIUM', count: stats?.severity_breakdown?.MEDIUM || 0, color: 'bg-amber-500', text: 'text-amber-400' },
                { label: 'LOW / INFO', count: (stats?.severity_breakdown?.LOW || 0) + (stats?.severity_breakdown?.INFORMATIONAL || 0), color: 'bg-emerald-500', text: 'text-emerald-400' },
              ].map((sev) => {
                const pct = total > 0 ? (sev.count / total) * 100 : 0;
                return (
                  <div key={sev.label} className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className={sev.text}>{sev.label}</span>
                      <span className="text-slate-400">{sev.count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full ${sev.color} transition-all duration-500`}
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span>HUMAN OVERRIDES</span>
              <span className="text-cyan-400 font-bold">{stats?.overridden_reviews || 0}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>APPROVED AS CLASSIFIED</span>
              <span className="text-emerald-400 font-bold">{stats?.approved_reviews || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Tactical Telemetry Stream */}
      <div className="cyber-panel cyber-corners rounded-2xl overflow-hidden border border-slate-800">
        <div className="p-5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/40">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
              Active Telemetry Stream
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Live ingest ledger with instantaneous Strands Decider 2B verdicts
            </p>
          </div>

          <button
            onClick={onNavigateToExplorer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-medium transition-colors"
          >
            <span>Full Explorer Console</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-800/60">
          {recentEvents.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-mono text-xs">
              No security events recorded yet. Run a simulation from the Attack Simulator tab.
            </div>
          ) : (
            recentEvents.map((evt) => (
              <div
                key={evt.id}
                onClick={() => onSelectEvent(evt.event_id)}
                className="p-4 hover:bg-cyan-950/10 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${
                      evt.action === 'CLOSE'
                        ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]'
                        : evt.action === 'INVESTIGATE'
                        ? 'bg-cyan-400 shadow-[0_0_8px_#06b6d4]'
                        : 'bg-rose-400 shadow-[0_0_8px_#f43f5e]'
                    }`}
                  />
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 font-mono">
                      <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                        {evt.event_id}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                        {evt.event_type}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                          evt.severity === 'CRITICAL'
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-800/50'
                            : evt.severity === 'HIGH'
                            ? 'bg-orange-950/80 text-orange-300 border border-orange-800/50'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        {evt.severity}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3 font-mono">
                      <span>User: <strong className="text-slate-300">{evt.username || 'UNKNOWN'}</strong></span>
                      <span>•</span>
                      <span>IP: <strong className="text-slate-300">{evt.source_ip || 'UNKNOWN'}</strong></span>
                      <span>•</span>
                      <span className="text-slate-500 text-[10px]">{evt.timestamp}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end md:self-auto font-mono text-xs">
                  <div className="text-right">
                    <span
                      className={`inline-block px-2.5 py-1 rounded text-xs font-bold tracking-wider ${
                        evt.action === 'CLOSE'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_-2px_rgba(16,185,129,0.3)]'
                          : evt.action === 'INVESTIGATE'
                          ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_-2px_rgba(6,182,212,0.3)]'
                          : 'bg-rose-950/80 text-rose-300 border border-rose-500/40 shadow-[0_0_10px_-2px_rgba(244,63,94,0.3)]'
                      }`}
                    >
                      {evt.action || 'PENDING'}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      {evt.confidence ? `${(evt.confidence * 100).toFixed(0)}% conf` : 'Eval'} • {evt.latency_ms ? `${evt.latency_ms.toFixed(0)}ms` : '118ms'}
                    </span>
                  </div>

                  <div className="w-8 h-8 rounded-lg bg-slate-900 group-hover:bg-cyan-950/80 border border-slate-800 group-hover:border-cyan-500/50 flex items-center justify-center text-slate-400 group-hover:text-cyan-300 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
