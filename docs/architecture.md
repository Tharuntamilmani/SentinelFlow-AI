# SentinelFlow AI — System Architecture & Design Specification

## 1. Architectural Overview

SentinelFlow AI is an autonomous, policy-driven security triage agent designed for Security Operations Centers (SOC). It replaces conventional, expensive, and non-deterministic LLM loops with **Strands Decider 2B** — a specialized, 2-billion parameter "system one" decision model engineered specifically for low-latency classification, tool selection, and calibrated policy routing without free-form text hallucinations.

```mermaid
graph TD
    classDef client fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
    classDef decider fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#f8fafc;
    classDef enrich fill:#14532d,stroke:#4ade80,stroke-width:2px,color:#f8fafc;
    classDef bedrock fill:#701a75,stroke:#f472b6,stroke-width:2px,color:#f8fafc;
    classDef audit fill:#312e81,stroke:#a5b4fc,stroke-width:2px,color:#f8fafc;

    subgraph Ingestion ["1. Event Ingestion & Normalization"]
        SE[Security Telemetry Events] --> API[FastAPI Ingestion Endpoint]
        API --> NORM[State Normalizer<br/>Observed Facts Extraction]
    end

    subgraph DecisionCore ["2. System One Decision Engine"]
        NORM --> S1REQ[SystemOneRequest<br/>Choice Question: Action Policy]
        S1REQ --> DECIDER[Strands Decider 2B<br/>Pointer Head Inference]
        DECIDER --> CHOICE{Policy Choice}
        CHOICE -->|High Conf >= 0.80| ACTION[CLOSE / INVESTIGATE / ESCALATE]
        CHOICE -->|Low Conf < 0.80 or Incomplete| REVIEW_QUEUE[Human Review Routing]
    end

    subgraph Enrichment ["3. Non-Destructive Investigation"]
        ACTION --> INV[Forensic Tool Suite]
        INV --> TIP[Synthetic Threat Intel IP Lookup]
        INV --> IAM[IAM Directory User Profile]
        INV --> EDR[EDR Device Posture Check]
        INV --> MITRE[MITRE ATT&CK Correlation]
    end

    subgraph GenerativeAnalysis ["4. Amazon Bedrock Generative Explanation"]
        ACTION & INV --> BEDROCK_PROMPT[Grounded Incident Prompt]
        BEDROCK_PROMPT --> BEDROCK[Amazon Bedrock Runtime<br/>Claude 3.5 Sonnet]
        BEDROCK --> EXP[Incident Rationale & Actionable Steps]
    end

    subgraph Persistence ["5. Audit & Operations UI"]
        ACTION & EXP --> DB[(SQLite / SQLAlchemy Async Store)]
        REVIEW_QUEUE --> DB
        DB --> UI[Next.js Cybersecurity Operations Dashboard]
    end

    class API,NORM client;
    class DECIDER,CHOICE,S1REQ decider;
    class INV,TIP,IAM,EDR,MITRE enrich;
    class BEDROCK,BEDROCK_PROMPT,EXP bedrock;
    class DB,UI audit;
```

---

## 2. Sequence Workflow

```mermaid
sequenceDiagram
    autonumber
    actor SecOps as Security Telemetry / SIEM
    participant API as FastAPI Ingestion
    participant Decider as Strands Decider 2B
    participant Forensic as Investigation Service
    participant Bedrock as Amazon Bedrock
    participant DB as SQLite Audit Store
    participant Dashboard as Next.js SOC Dashboard

    SecOps->>API: POST /api/events (Raw JSON Telemetry)
    API->>API: Normalize fields (User, IP, Device, Privilege, Facts)
    API->>Decider: POST /v1/systemone (State + Choice Question)
    Decider-->>API: SystemOneResponse (Choice, Calibrated Confidence, Latency)
    
    alt Confidence < 0.80 or Incomplete Telemetry
        API->>API: Route to Human Review Queue (Flag PENDING_REVIEW)
    end

    API->>Forensic: Run Read-Only Checks (IP Reputation, IAM, Posture, MITRE)
    Forensic-->>API: Gathered Forensic Evidence & MITRE Mapping

    API->>Bedrock: invoke_model (Grounded Prompt: Explain Decider Choice)
    Bedrock-->>API: Structured Explanation & Recommended Next Steps

    API->>DB: Persist SecurityEvent, DecisionAudit, InvestigationRecord
    API-->>SecOps: 201 Created (Full Structured Incident Record)

    Dashboard->>API: GET /api/events & GET /api/stats
    API-->>Dashboard: Live Telemetry, Latency Metrics & Review Queue
```

---

## 3. Core Component Responsibilities

| Component | Responsibility | Technology |
|---|---|---|
| **Ingestion Engine** | Telemetry ingestion, schema validation, distinction between observed facts and inferences. | FastAPI, Pydantic V2 |
| **Decision Module** | Evaluates normalized state against organizational triage policy. Returns strictly constrained choices with calibrated probabilities. | Strands Decider 2B (`strands-decider`) |
| **Forensic Enrichment** | Enriches anomalous events with IP reputation, identity profile, and device posture without destructive side-effects. | Python Read-Only Tool Suite |
| **Generative Analysis** | Generates human-readable incident rationale and actionable containment steps strictly grounded in the Decider verdict. | Amazon Bedrock (`boto3`, `strands-agents`) |
| **Audit Ledger** | Preserves immutable audit trail of every model inference, latency metric, and analyst review action. | SQLite + SQLAlchemy Async |
| **Operations Dashboard** | Real-time SecOps console for monitoring triage streams, reviewing flagged cases, and viewing baseline benchmarks. | Next.js 15, TypeScript, Tailwind CSS, Recharts |
