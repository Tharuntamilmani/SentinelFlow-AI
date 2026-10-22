export type ActionType = 'CLOSE' | 'INVESTIGATE' | 'ESCALATE';
export type SeverityType = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
export type StatusType = 'PROCESSED' | 'PENDING_REVIEW' | 'APPROVED' | 'OVERRIDDEN';

export interface DecisionAudit {
  id: string;
  action: ActionType;
  confidence: number | null;
  distribution: Record<string, number> | null;
  latency_ms: number;
  model_name: string;
  model_type: string;
  is_fallback: boolean;
  fallback_reason: string | null;
  routed_to_human_review: boolean;
  review_reason: string | null;
  human_verdict: string | null;
  human_reviewer: string | null;
  human_notes: string | null;
  reviewed_at: string | null;
  explanation: string | null;
  recommended_steps: string[];
  bedrock_model_used: string | null;
  bedrock_latency_ms: number | null;
  created_at: string;
}

export interface InvestigationRecord {
  id: string;
  tools_invoked: string[];
  ip_reputation: Record<string, any> | null;
  user_profile: Record<string, any> | null;
  device_posture: Record<string, any> | null;
  threat_intel_match: Record<string, any> | null;
  forensic_summary: string;
  created_at: string;
}

export interface SecurityEventDetail {
  id: string;
  event_id: string;
  timestamp: string;
  event_type: string;
  severity: SeverityType;
  username: string | null;
  source_ip: string | null;
  device: string | null;
  location: string | null;
  failed_login_count: number;
  privilege_level: string;
  event_description: string;
  raw_payload: Record<string, any>;
  normalized_state: string;
  status: StatusType;
  created_at: string;
  decision?: DecisionAudit | null;
  investigation?: InvestigationRecord | null;
}

export interface SecurityEventSummary {
  id: string;
  event_id: string;
  timestamp: string;
  event_type: string;
  severity: SeverityType;
  username: string | null;
  source_ip: string | null;
  action: ActionType | null;
  confidence: number | null;
  latency_ms: number | null;
  model_type: string | null;
  status: StatusType;
  created_at: string;
}

export interface StatsResponse {
  total_events: number;
  close_count: number;
  investigate_count: number;
  escalate_count: number;
  pending_reviews: number;
  approved_reviews: number;
  overridden_reviews: number;
  avg_decision_latency_ms: number;
  avg_confidence: number | null;
  model_status: string;
  bedrock_status: string;
  severity_breakdown: Record<string, number>;
}

export interface EvaluationMetrics {
  model_name: string;
  baseline_name: string;
  sample_size: number;
  accuracy: number;
  baseline_accuracy: number;
  macro_precision: number;
  macro_recall: number;
  macro_f1: number;
  avg_latency_ms: number;
  baseline_avg_latency_ms: number;
  human_review_rate: number;
  invalid_output_rate: number;
  confusion_matrix: Record<string, Record<string, number>>;
  sample_cases: Array<{
    scenario: string;
    decider_action: string;
    baseline_action: string;
    ground_truth: string;
    decider_latency_ms: number;
    baseline_latency_ms: number;
    agreement: boolean;
  }>;
}
