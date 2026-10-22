'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { OverviewTab } from '@/components/OverviewTab';
import { IncidentExplorerTab } from '@/components/IncidentExplorerTab';
import { LiveSimulationTab } from '@/components/LiveSimulationTab';
import { ModelEvaluationTab } from '@/components/ModelEvaluationTab';
import { DecisionDetailsModal } from '@/components/DecisionDetailsModal';
import {
  getStats,
  getEvents,
  getEventDetail,
  submitHumanReview,
  reinvestigateEvent,
} from '@/lib/api';
import { SecurityEventDetail, SecurityEventSummary, StatsResponse } from '@/types';
import {
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Cloud,
  ExternalLink,
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [events, setEvents] = useState<SecurityEventSummary[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEventDetail, setSelectedEventDetail] = useState<SecurityEventDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load stats and recent events
  const loadDashboardData = useCallback(async (showRefreshingSpinner = false) => {
    try {
      if (showRefreshingSpinner) setIsRefreshing(true);
      setError(null);

      const [statsData, eventsData] = await Promise.all([
        getStats().catch(() => null),
        getEvents({ limit: 100 }).catch(() => []),
      ]);

      if (statsData) setStats(statsData);
      if (eventsData) setEvents(eventsData);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(err?.message || 'Could not communicate with SentinelFlow backend');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Polling every 15 seconds
  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(() => {
      loadDashboardData();
    }, 15000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  // Open detail modal
  const handleSelectEvent = async (eventId: string) => {
    setSelectedEventId(eventId);
    setIsModalOpen(true);
    try {
      const detail = await getEventDetail(eventId);
      setSelectedEventDetail(detail);
    } catch (err) {
      console.error('Failed to load event details:', err);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEventId(null);
    setSelectedEventDetail(null);
  };

  // Submit human review
  const handleSubmitReview = async (
    eventId: string,
    review: { verdict: string; new_action?: string; reviewer: string; notes: string }
  ) => {
    await submitHumanReview(eventId, review);
    // Reload updated details and dashboard
    const updated = await getEventDetail(eventId);
    setSelectedEventDetail(updated);
    await loadDashboardData();
  };

  // Trigger non-destructive re-investigation
  const handleTriggerReinvestigate = async (eventId: string) => {
    await reinvestigateEvent(eventId);
    const updated = await getEventDetail(eventId);
    setSelectedEventDetail(updated);
    await loadDashboardData();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070b12] text-slate-100 font-sans">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingReviewsCount={stats?.pending_reviews || 0}
        deciderStatus={stats?.model_status || 'online'}
        bedrockStatus={stats?.bedrock_status || 'online'}
        onRefresh={() => loadDashboardData(true)}
        isRefreshing={isRefreshing}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-200 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="text-xs">
                <span className="font-semibold block text-sm text-amber-300">
                  Backend Service Alert
                </span>
                {error}. Ensure the SentinelFlow FastAPI backend is running on port 8000.
              </div>
            </div>
            <button
              onClick={() => loadDashboardData(true)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Tab Switcher Body */}
        {activeTab === 'overview' && (
          <OverviewTab
            stats={stats}
            events={events}
            onSelectEvent={handleSelectEvent}
            onNavigateToExplorer={() => setActiveTab('explorer')}
          />
        )}

        {activeTab === 'explorer' && (
          <IncidentExplorerTab
            events={events}
            onSelectEvent={handleSelectEvent}
          />
        )}

        {activeTab === 'simulation' && (
          <LiveSimulationTab
            onEventCreated={() => {
              loadDashboardData();
              setActiveTab('explorer');
            }}
          />
        )}

        {activeTab === 'evaluation' && <ModelEvaluationTab />}
      </main>

      {/* Inspection & Human Review Modal */}
      <DecisionDetailsModal
        event={selectedEventDetail}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmitReview={handleSubmitReview}
        onTriggerReinvestigate={handleTriggerReinvestigate}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#05080e] py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
            <span>
              <strong className="text-slate-300">SentinelFlow AI</strong> — Autonomous Security Decision Agent
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono">
            <span className="px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/40">
              #strands-decider-2b
            </span>
            <span className="px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40">
              #policy
            </span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <Cpu className="w-3.5 h-3.5 text-blue-400" /> Decider 2B
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <Cloud className="w-3.5 h-3.5 text-purple-400" /> Amazon Bedrock
            </span>
          </div>

          <div className="text-slate-600 text-center md:text-right">
            AWS Agent Experience Hackathon Submission
          </div>
        </div>
      </footer>
    </div>
  );
}
