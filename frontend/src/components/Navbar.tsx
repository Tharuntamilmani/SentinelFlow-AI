'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Cpu,
  Cloud,
  RefreshCw,
  LayoutDashboard,
  Search,
  PlayCircle,
  BarChart3,
  Radio,
  Terminal,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingReviewsCount: number;
  deciderStatus?: string;
  bedrockStatus?: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  pendingReviewsCount,
  deciderStatus = 'online',
  bedrockStatus = 'online',
  onRefresh,
  isRefreshing,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const isDeciderLive = deciderStatus === 'online';
  const isBedrockLive = bedrockStatus === 'online';

  const navItems = [
    { id: 'overview', label: 'Command HUD', icon: LayoutDashboard },
    {
      id: 'explorer',
      label: 'Incident Stream',
      icon: Search,
      badge: pendingReviewsCount,
    },
    { id: 'simulation', label: 'Attack Simulator', icon: PlayCircle },
    { id: 'evaluation', label: 'Model Benchmark', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-cyan-500/20 bg-[#050811]/90 backdrop-blur-xl">
      {/* Top Threat Posture Ticker */}
      <div className="border-b border-slate-800/80 bg-[#03060c] px-4 py-1 text-[11px] font-mono text-slate-400 flex flex-wrap items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="text-cyan-400 font-semibold tracking-wider uppercase text-[10px]">
              SYSTEM ONE GATEWAY ACTIVE
            </span>
          </div>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="hidden sm:inline text-slate-400">
            DEFCON 3 // AUTOMATED POLICY ENFORCEMENT
          </span>
          <span className="text-slate-600 hidden md:inline">|</span>
          <span className="hidden md:inline text-slate-500">
            FAIL-TO-HUMAN THRESHOLD: 0.80
          </span>
        </div>

        <div className="flex items-center gap-4 font-mono text-[10px]">
          <span className="text-cyan-300/80 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
            {currentTime || '2026-10-22 21:00:00 UTC'}
          </span>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>HEARTBEAT 120ms</span>
          </div>
        </div>
      </div>

      {/* Main Command Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Operational Callout */}
          <div className="flex items-center space-x-3.5">
            <div className="relative group">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-950 via-slate-900 to-blue-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_-3px_rgba(6,182,212,0.4)] group-hover:border-cyan-400 transition-colors">
                <ShieldAlert className="w-5 h-5 transition-transform group-hover:scale-110" />
              </div>
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#050811] animate-pulse" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-100 via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
                  SENTINELFLOW<span className="text-cyan-400 font-mono text-sm ml-1">AI</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 font-bold uppercase tracking-wider">
                  STRANDS DECIDER 2B
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                <Terminal className="w-3 h-3 text-cyan-500 inline" />
                <span>Autonomous Security Triage Engine</span>
              </p>
            </div>
          </div>

          {/* Tactical Nav Tabs */}
          <nav className="hidden lg:flex items-center space-x-1 p-1 bg-slate-950/60 rounded-xl border border-slate-800/80 backdrop-blur-md">
            {navItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-mono font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-950/80 to-blue-950/80 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_-2px_rgba(6,182,212,0.3)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/50 animate-pulse">
                      {tab.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Model Status Telemetry & Refresh */}
          <div className="flex items-center space-x-3">
            {/* Decider 2B Chip */}
            <div
              className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                isDeciderLive
                  ? 'bg-blue-950/40 border-blue-500/30 text-blue-300 shadow-[0_0_10px_-3px_rgba(59,130,246,0.3)]'
                  : 'bg-slate-900/80 border-slate-700/60 text-slate-300'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <div className="flex flex-col text-[10px] leading-tight">
                <span className="font-semibold text-slate-200">Decider 2B</span>
                <span className={isDeciderLive ? 'text-emerald-400' : 'text-cyan-400'}>
                  {isDeciderLive ? 'ONLINE // S1' : 'DEV DUAL-MODE'}
                </span>
              </div>
            </div>

            {/* Amazon Bedrock Chip */}
            <div
              className={`hidden sm:flex items-center space-x-2 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                isBedrockLive
                  ? 'bg-purple-950/40 border-purple-500/30 text-purple-300 shadow-[0_0_10px_-3px_rgba(168,85,247,0.3)]'
                  : 'bg-slate-900/80 border-slate-700/60 text-slate-300'
              }`}
            >
              <Cloud className="w-3.5 h-3.5 text-purple-400" />
              <div className="flex flex-col text-[10px] leading-tight">
                <span className="font-semibold text-slate-200">Bedrock S2</span>
                <span className={isBedrockLive ? 'text-purple-400' : 'text-slate-400'}>
                  {isBedrockLive ? 'ACTIVE' : 'CALIBRATED'}
                </span>
              </div>
            </div>

            {/* Tactical Refresh */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-cyan-300 transition-all shadow-sm active:scale-95 disabled:opacity-50"
              title="Refresh Telemetry Stream"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile Nav Bar */}
        <div className="flex lg:hidden overflow-x-auto py-2 space-x-2 border-t border-slate-800/60">
          {navItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-mono whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-semibold'
                    : 'text-slate-400 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500/30 text-amber-300">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
