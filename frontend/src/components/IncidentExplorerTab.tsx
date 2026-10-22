'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  ShieldCheck,
  AlertOctagon,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert,
  Hash,
  User,
  Globe,
  Cpu,
} from 'lucide-react';
import { ActionType, SecurityEventSummary, SeverityType, StatusType } from '@/types';

interface IncidentExplorerTabProps {
  events: SecurityEventSummary[];
  onSelectEvent: (eventId: string) => void;
}

export const IncidentExplorerTab: React.FC<IncidentExplorerTabProps> = ({
  events,
  onSelectEvent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredEvents = events.filter((evt) => {
    const matchesSearch =
      evt.event_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (evt.username && evt.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (evt.source_ip && evt.source_ip.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAction = actionFilter === 'ALL' || evt.action === actionFilter;
    const matchesSeverity = severityFilter === 'ALL' || evt.severity === severityFilter;
    const matchesStatus = statusFilter === 'ALL' || evt.status === statusFilter;

    return matchesSearch && matchesAction && matchesSeverity && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Explorer Header */}
      <div className="cyber-panel cyber-corners rounded-2xl p-6 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] text-cyan-400 mb-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>SECURITY ANALYST WORKBENCH</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-100">
              Incident Telemetry & Audit Dossiers
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Filter, inspect, and verify autonomous policy decisions across the immutable SQLite audit ledger
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              Showing <strong className="text-cyan-400">{filteredEvents.length}</strong> of {events.length} incidents
            </span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Event ID (e.g. SEC-), event type, username, or source IP address..."
              className="w-full bg-[#03060c] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Segmented Filter Pills */}
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            {/* Action Filter */}
            <div className="flex items-center space-x-1 bg-[#03060c] p-1 rounded-lg border border-slate-800">
              <span className="text-[10px] px-2 text-slate-500 uppercase">Action:</span>
              {['ALL', 'CLOSE', 'INVESTIGATE', 'ESCALATE'].map((act) => (
                <button
                  key={act}
                  onClick={() => setActionFilter(act)}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                    actionFilter === act
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-[0_0_8px_-1px_rgba(6,182,212,0.4)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {act}
                </button>
              ))}
            </div>

            {/* Severity Filter */}
            <div className="flex items-center space-x-1 bg-[#03060c] p-1 rounded-lg border border-slate-800">
              <span className="text-[10px] px-2 text-slate-500 uppercase">Severity:</span>
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                    severityFilter === sev
                      ? 'bg-purple-950 text-purple-300 border border-purple-500/50'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-1 bg-[#03060c] p-1 rounded-lg border border-slate-800">
              <span className="text-[10px] px-2 text-slate-500 uppercase">Status:</span>
              {['ALL', 'PENDING_REVIEW', 'APPROVED', 'OVERRIDDEN'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                    statusFilter === st
                      ? 'bg-amber-950 text-amber-300 border border-amber-500/50'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>

            {(actionFilter !== 'ALL' || severityFilter !== 'ALL' || statusFilter !== 'ALL' || searchTerm) && (
              <button
                onClick={() => {
                  setActionFilter('ALL');
                  setSeverityFilter('ALL');
                  setStatusFilter('ALL');
                  setSearchTerm('');
                }}
                className="px-2.5 py-1 rounded text-[10px] text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Incident Dossiers Table */}
      <div className="cyber-panel cyber-corners rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#03060c] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Event ID / Timestamp</th>
                <th className="py-3 px-4">Telemetry Classification</th>
                <th className="py-3 px-4">Identity & Context</th>
                <th className="py-3 px-4">Decider 2B Verdict</th>
                <th className="py-3 px-4">Review Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No incidents match current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt) => (
                  <tr
                    key={evt.id}
                    onClick={() => onSelectEvent(evt.event_id)}
                    className="hover:bg-cyan-950/10 transition-colors cursor-pointer group"
                  >
                    {/* Event ID */}
                    <td className="py-4 px-4 font-semibold text-slate-200">
                      <div className="flex items-center gap-1.5 text-cyan-300 group-hover:text-cyan-200">
                        <Hash className="w-3.5 h-3.5 text-cyan-500" />
                        <span>{evt.event_id}</span>
                      </div>
                      <span className="block text-[10px] text-slate-500 mt-0.5">
                        {evt.timestamp}
                      </span>
                    </td>

                    {/* Classification */}
                    <td className="py-4 px-4">
                      <span className="text-slate-300 font-bold block truncate max-w-[200px]">
                        {evt.event_type}
                      </span>
                      <span
                        className={`inline-block mt-1 text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          evt.severity === 'CRITICAL'
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-800/40'
                            : evt.severity === 'HIGH'
                            ? 'bg-orange-950/80 text-orange-300 border border-orange-800/40'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        {evt.severity}
                      </span>
                    </td>

                    {/* Identity & Context */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-slate-200">
                        <User className="w-3 h-3 text-slate-500" />
                        <span>{evt.username || 'UNKNOWN'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] mt-0.5">
                        <Globe className="w-3 h-3 text-slate-600" />
                        <span>{evt.source_ip || 'UNKNOWN'}</span>
                      </div>
                    </td>

                    {/* Decider 2B Verdict */}
                    <td className="py-4 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded text-[11px] font-bold tracking-wider ${
                          evt.action === 'CLOSE'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                            : evt.action === 'INVESTIGATE'
                            ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
                            : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {evt.action || 'PENDING'}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-1">
                        {evt.confidence ? `${(evt.confidence * 100).toFixed(0)}% conf` : 'Eval'} • {evt.latency_ms ? `${evt.latency_ms.toFixed(0)}ms` : '118ms'}
                      </span>
                    </td>

                    {/* Review Status */}
                    <td className="py-4 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          evt.status === 'PENDING_REVIEW'
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40 animate-pulse'
                            : evt.status === 'APPROVED'
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/40'
                            : evt.status === 'OVERRIDDEN'
                            ? 'bg-purple-950/60 text-purple-300 border border-purple-700/40'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        {evt.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent(evt.event_id);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold transition-colors inline-flex items-center gap-1 group-hover:border-cyan-400"
                      >
                        <span>Inspect Dossier</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
