'use client';

import React, { useState } from 'react';
import {
  Play,
  Zap,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Search,
  AlertOctagon,
  Code2,
  Cpu,
  Cloud,
  Layers,
  Database,
  Sparkles,
  Terminal,
  Crosshair,
  Radio,
  FileCode,
} from 'lucide-react';
import { createEvent } from '@/lib/api';
import { SecurityEventDetail } from '@/types';

// Predefined synthetic scenarios with MITRE ATT&CK mapping
const PRESET_EVENTS = [
  {
    code: 'A',
    mitre: 'T1078.004',
    name: 'Tor Exit Proxy Authentication',
    expected: 'INVESTIGATE',
    payload: {
      event_type: 'auth.login.anomalous_sequence',
      severity: 'HIGH',
      username: 'alice.smith',
      source_ip: '185.220.101.5',
      device: 'DESKTOP-WIN-UNKNOWN',
      location: 'St. Petersburg, Russia',
      failed_login_count: 8,
      privilege_level: 'Standard',
      event_description:
        'User account alice.smith experienced 8 consecutive failed password attempts over 3 minutes followed immediately by a successful session authentication from an anomalous Tor exit relay IP address.',
      raw_metadata: {
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TorBrowser/13.0',
        auth_method: 'Password+MFA_Push_Bypassed',
        session_duration_sec: 45,
      },
    },
  },
  {
    code: 'B',
    mitre: 'T1078.002',
    name: 'Routine SSO Corporate Login',
    expected: 'CLOSE',
    payload: {
      event_type: 'auth.login.standard',
      severity: 'LOW',
      username: 'bob.corporate',
      source_ip: '10.0.14.88',
      device: 'CORP-MAC-042',
      location: 'San Francisco, US',
      failed_login_count: 0,
      privilege_level: 'Standard',
      event_description:
        'Routine interactive SSO authentication for user bob.corporate from company-managed compliant MacBook with active FileVault and valid Kerberos ticket during standard business hours.',
      raw_metadata: {
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        auth_method: 'FIDO2_Hardware_Key',
        edr_compliant: true,
      },
    },
  },
  {
    code: 'C',
    mitre: 'T1068',
    name: 'Service Account Privilege Elevation',
    expected: 'ESCALATE',
    payload: {
      event_type: 'system.privilege.elevation',
      severity: 'CRITICAL',
      username: 'svc_readonly_audit',
      source_ip: '10.0.4.15',
      device: 'SERVER-PROD-DB01',
      location: 'Ashburn Datacenter, US',
      failed_login_count: 0,
      privilege_level: 'Administrator',
      event_description:
        'Service account svc_readonly_audit unexpectedly spawned elevated cmd.exe and manipulated Windows security access token SeDebugPrivilege to grant local Administrator privileges on production PostgreSQL cluster.',
      raw_metadata: {
        parent_process: 'powershell.exe -enc SQBFAFgA...',
        target_process: 'cmd.exe',
        integrity_level: 'High',
      },
    },
  },
  {
    code: 'D',
    mitre: 'T1110.001',
    name: 'Distributed SSH Password Spray',
    expected: 'ESCALATE',
    payload: {
      event_type: 'network.auth.brute_force',
      severity: 'HIGH',
      username: 'multiple_targets',
      source_ip: '45.33.32.156',
      device: 'GATEWAY-EXT-01',
      location: 'Bucharest, Romania',
      failed_login_count: 42,
      privilege_level: 'None',
      event_description:
        'External IP 45.33.32.156 initiated 42 failed authentication attempts across 18 administrative accounts (root, admin, deploy, ubuntu) within 60 seconds against external SSH bastion.',
      raw_metadata: {
        protocol: 'SSH-2.0-OpenSSH_8.2p1',
        distinct_usernames_targeted: 18,
        blacklisted_subnet: true,
      },
    },
  },
  {
    code: 'E',
    mitre: 'T1078',
    name: 'Off-Hours Administrative Jump',
    expected: 'INVESTIGATE',
    payload: {
      event_type: 'cloud.iam.anomalous_session',
      severity: 'MEDIUM',
      username: 'david.devops',
      source_ip: '198.51.100.24',
      device: 'UNKNOWN-HOST',
      location: 'Tokyo, Japan',
      failed_login_count: 1,
      privilege_level: 'Administrator',
      event_description:
        'Privileged user david.devops authenticated to AWS Management Console from an unfamiliar IP address in Tokyo at 03:15 AM local time, outside normal working hours and usual geographic baseline.',
      raw_metadata: {
        mfa_verified: true,
        geo_distance_km: 9400,
        unusual_time_deviation_hours: 8,
      },
    },
  },
  {
    code: 'F',
    mitre: 'T1021.002',
    name: 'Scheduled SMB Vulnerability Audit',
    expected: 'CLOSE',
    payload: {
      event_type: 'scanner.vulnerability.authorized',
      severity: 'LOW',
      username: 'scanner_nessus_corp',
      source_ip: '10.0.100.5',
      device: 'INTERNAL-VPC-SCANNER',
      location: 'Internal Network',
      failed_login_count: 0,
      privilege_level: 'Service',
      event_description:
        'Authorized internal Nessus vulnerability scanner executed scheduled credentialed SMB port scanning against staging subnet, with approved change management ticket CHG-2026-8819.',
      raw_metadata: {
        scanner_signature: 'Tenable-Nessus-Engine/10.7',
        change_ticket_id: 'CHG-2026-8819',
        target_subnet: '10.0.2.0/24',
      },
    },
  },
];

const PIPELINE_STAGES = [
  { id: 1, name: 'INGEST', desc: 'Schema validation' },
  { id: 2, name: 'NORMALIZE', desc: 'Facts extraction' },
  { id: 3, name: 'DECIDER 2B', desc: 'Pointer head logits' },
  { id: 4, name: 'FORENSICS', desc: 'Synthetic Intel' },
  { id: 5, name: 'BEDROCK S2', desc: 'Claude 3.5 synthesis' },
  { id: 6, name: 'AUDIT LEDGER', desc: 'Immutable DB log' },
];

export const LiveSimulationTab: React.FC<{ onEventCreated: () => void }> = ({
  onEventCreated,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<number>(0);
  const [jsonText, setJsonText] = useState<string>(
    JSON.stringify(PRESET_EVENTS[0].payload, null, 2)
  );
  const [activeStage, setActiveStage] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [result, setResult] = useState<SecurityEventDetail | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'SYSTEM READY. Select an enterprise attack scenario and click EXECUTE PIPELINE.',
  ]);

  const handleSelectPreset = (index: number) => {
    setSelectedPreset(index);
    setJsonText(JSON.stringify(PRESET_EVENTS[index].payload, null, 2));
    setResult(null);
    setActiveStage(0);
  };

  const handleRunPipeline = async () => {
    setIsRunning(true);
    setErrorMsg(null);
    setResult(null);
    setActiveStage(1);

    const logs: string[] = [];
    const addLog = (msg: string) => {
      const time = new Date().toISOString().substring(11, 19);
      logs.push(`[${time}] ${msg}`);
      setTerminalLogs([...logs]);
    };

    try {
      addLog('Ingesting raw telemetry vector into FastAPI endpoint...');
      let parsedPayload: any;
      try {
        parsedPayload = JSON.parse(jsonText);
      } catch {
        throw new Error('Invalid JSON format in telemetry payload editor');
      }

      await new Promise((r) => setTimeout(r, 200));
      setActiveStage(2);
      addLog(`Normalizing facts for identity: ${parsedPayload.username || 'UNKNOWN'}...`);

      await new Promise((r) => setTimeout(r, 250));
      setActiveStage(3);
      addLog('Dispatching SystemOneRequest to Strands Decider 2B pointer head (/v1/systemone)...');

      // Actual API call
      const createdEvent = await createEvent(parsedPayload);

      await new Promise((r) => setTimeout(r, 250));
      setActiveStage(4);
      addLog(`Verdict selected: ${createdEvent.decision?.action} (Confidence: ${createdEvent.decision?.confidence ? (createdEvent.decision.confidence * 100).toFixed(1) + '%' : 'N/A'})`);
      addLog('Executing 4 non-destructive synthetic forensic tools (IP intel, IAM, EDR, MITRE)...');

      await new Promise((r) => setTimeout(r, 250));
      setActiveStage(5);
      addLog('Invoking Amazon Bedrock Claude 3.5 Sonnet for incident rationale & remediation...');

      await new Promise((r) => setTimeout(r, 250));
      setActiveStage(6);
      addLog(`Committed to SQLite ledger with Event ID: ${createdEvent.event_id}`);
      addLog('Autonomous triage pipeline finished with zero errors.');

      setResult(createdEvent);
      onEventCreated();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Pipeline execution failed');
      addLog(`ERROR: ${err?.message || 'Pipeline execution failed'}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Simulation Lab Header */}
      <div className="cyber-panel cyber-corners rounded-2xl p-6 relative overflow-hidden border border-cyan-500/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-mono text-[10px]">
              <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                TACTICAL SIMULATION MATRIX
              </span>
              <span className="text-slate-500 font-mono">MITRE ATT&CK MAPPED</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
              <Crosshair className="w-6 h-6 text-cyan-400" />
              Live Security Decision Pipeline
            </h2>
            <p className="text-xs text-slate-300/80 leading-relaxed max-w-2xl">
              Inject real-world attack telemetry and observe the end-to-end 6-stage triage conduit. Strands Decider 2B selects policy actions in real-time, followed by Amazon Bedrock generative analysis.
            </p>
          </div>

          <button
            onClick={handleRunPipeline}
            disabled={isRunning}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_-3px_rgba(6,182,212,0.5)] active:scale-95 disabled:opacity-50 self-start lg:self-auto cursor-pointer"
          >
            {isRunning ? (
              <>
                <Zap className="w-4 h-4 animate-spin text-slate-950" />
                <span>TRIAGING TELEMETRY...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                <span>EXECUTE PIPELINE</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Scenario Matrix Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {PRESET_EVENTS.map((preset, idx) => {
          const isSelected = selectedPreset === idx;
          return (
            <div
              key={preset.code}
              onClick={() => handleSelectPreset(idx)}
              className={`p-4 rounded-xl border transition-all cursor-pointer font-mono ${
                isSelected
                  ? 'bg-cyan-950/40 border-cyan-500/60 shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-800 font-bold">
                  SCENARIO {preset.code}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40 font-mono">
                  {preset.mitre}
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-200 mb-2 truncate">
                {preset.name}
              </h4>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Expected Policy:</span>
                <span
                  className={`px-1.5 py-0.2 rounded font-bold ${
                    preset.expected === 'CLOSE'
                      ? 'text-emerald-400 bg-emerald-950/40'
                      : preset.expected === 'INVESTIGATE'
                      ? 'text-cyan-400 bg-cyan-950/40'
                      : 'text-rose-400 bg-rose-950/40'
                  }`}
                >
                  {preset.expected}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Animated 6-Stage Conduit */}
      <div className="cyber-panel cyber-corners rounded-2xl p-6 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            Active Execution Conduit
          </h3>
          <span className="text-[10px] font-mono text-slate-500">
            {isRunning ? 'PIPELINE ACTIVE' : activeStage === 6 ? 'EXECUTION COMPLETE' : 'IDLE'}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {PIPELINE_STAGES.map((stg) => {
            const isCompleted = activeStage > stg.id || activeStage === 6;
            const isCurrent = activeStage === stg.id && isRunning;
            return (
              <div
                key={stg.id}
                className={`p-3 rounded-xl border font-mono transition-all relative overflow-hidden ${
                  isCurrent
                    ? 'bg-cyan-950/80 border-cyan-400 shadow-[0_0_15px_-2px_rgba(6,182,212,0.5)] animate-pulse'
                    : isCompleted
                    ? 'bg-slate-900/90 border-emerald-500/40 text-slate-200'
                    : 'bg-slate-950/40 border-slate-800/80 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] mb-1 font-bold">
                  <span className={isCurrent ? 'text-cyan-300' : isCompleted ? 'text-emerald-400' : 'text-slate-600'}>
                    0{stg.id}
                  </span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : isCurrent ? (
                    <Zap className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-slate-600" />
                  )}
                </div>
                <div className="text-[11px] font-bold text-slate-200 truncate">
                  {stg.name}
                </div>
                <div className="text-[9px] text-slate-400 truncate mt-0.5">
                  {stg.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-Column Editor & Live Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Telemetry JSON Editor */}
        <div className="lg:col-span-6 cyber-panel cyber-corners rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5 uppercase">
                <FileCode className="w-4 h-4 text-cyan-400" />
                Raw Telemetry Payload (JSON)
              </span>
              <span className="text-[10px] font-mono text-slate-500">FastAPI Ingest Schema</span>
            </div>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={14}
              className="w-full bg-[#03060c] border border-slate-800/90 rounded-xl p-3 font-mono text-xs text-cyan-200/90 focus:outline-none focus:border-cyan-500/50 resize-none"
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Payload Size: {jsonText.length} bytes</span>
            <span>UTF-8 JSON Encoded</span>
          </div>
        </div>

        {/* Right Column: Live Cyber Terminal Log Feed */}
        <div className="lg:col-span-6 cyber-panel cyber-corners rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5 uppercase">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Pipeline Execution Telemetry
              </span>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                REAL-TIME STREAM
              </span>
            </div>

            <div className="w-full bg-[#03060c] border border-slate-800/90 rounded-xl p-3 font-mono text-xs text-emerald-400/90 h-[280px] overflow-y-auto scanlines space-y-1.5">
              {terminalLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed">
                  <span className="text-slate-500">$ </span>
                  {log}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Result Preview */}
          {result && (
            <div className="mt-4 p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-xl font-mono text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[10px]">LATEST VERDICT:</span>
                <span className="text-cyan-300 font-bold text-sm">{result.decision?.action}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px]">EVENT ID:</span>
                <span className="text-slate-200 font-bold">{result.event_id}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
