# SentinelFlow AI — Autonomous Security Decision Agent

[![AWS Agent Experience Hackathon](https://img.shields.io/badge/AWS_Agent_Experience-Hackathon_2026-FF9900?logo=amazon-aws)](https://devpost.com)
[![Strands Decider 2B](https://img.shields.io/badge/%23strands--decider--2b-Official_v0.2.0-blue)](https://github.com/strands-agents)
[![Decision Pattern](https://img.shields.io/badge/%23policy-Classification-10b981)](#decision-pattern-policy-classification)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16_Turbopack-000000?logo=nextdotjs)](https://nextjs.org)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

> **SentinelFlow AI** is an autonomous, policy-driven security triage agent built for the **AWS Agent Experience Hackathon**. It pairs **Strands Decider 2B** — a specialized 2-billion parameter decision model — with **Amazon Bedrock (Claude 3.5 Sonnet)** to triage enterprise security events in under 120 milliseconds with zero hallucinations and full human-in-the-loop auditability.

---

## 📌 Submission Tags
- `#strands-decider-2b`
- `#policy`

---

## 1. The Core Idea: Policy Classification without LLM Latency

Modern Security Operations Centers (SOCs) drown in 10,000+ daily alerts. While traditional LLMs possess strong contextual reasoning, using them for discrete triage introduces critical production bottlenecks:
- **Excessive Latency:** 1,500ms – 3,500ms per alert creates backpressure in real-time SIEM pipelines.
- **Output Drift:** Free-form generation can hallucinate syntax or generate malformed JSON.
- **Uncalibrated Confidence:** Prompted LLMs cannot reliably quantify uncertainty for safe routing.

**SentinelFlow AI** solves this by implementing the **Policy Classification** decision pattern (`#policy`). It utilizes **Strands Decider 2B** as a fast "System 1" reflex that evaluates discrete choice probabilities over structured security telemetry, reserving **Amazon Bedrock** for "System 2" in-depth incident narrative synthesis and remediation playbooks.

```
                      ┌────────────────────────────────────────┐
                      │  Raw Security Event Telemetry Stream   │
                      └───────────────────┬────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │ State Normalizer (Observed Fact Vector)│
                      └───────────────────┬────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │ Strands Decider 2B (System 1 Engine)   │
                      │ 118ms Pointer Head Softmax Logits      │
                      └──────────────┬──────────────────┬──────┘
                                     │                  │
                High Confidence      │                  │ Low Confidence (< 0.80)
                (>= 0.80)            ▼                  ▼ or Missing Facts
                      ┌──────────────────────┐   ┌──────────────────────────┐
                      │ Action Execution     │   │ Human Analyst Review     │
                      │ CLOSE / INVESTIGATE  │   │ Queue (Zero Silent Fails)│
                      │ / ESCALATE           │   └──────────────────────────┘
                      └──────────────┬───────┘
                                     │
                                     ▼
                      ┌────────────────────────────────────────┐
                      │ Non-Destructive Forensic Tool Suite    │
                      │ (IP Intel, IAM Profile, EDR Posture)   │
                      └───────────────────┬────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │ Amazon Bedrock (System 2 Explainer)    │
                      │ Incident Rationale & Remediation Steps │
                      └───────────────────┬────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │ Immutable Audit Ledger & Next.js SecOps│
                      └────────────────────────────────────────┘
```

---

## 2. Key Features

- **Microsecond-Scale Policy Decisions:** Strands Decider 2B evaluates choices in ~118ms (13.7x faster than baseline LLMs).
- **Constrained Output Space:** Uses official `ChoiceQuestion` protocol (`CLOSE`, `INVESTIGATE`, `ESCALATE`) via pointer-head logits with **0.0% formatting hallucinations**.
- **Transparent Dual-Mode Architecture:** Connects to live Strands Decider 2B service (`http://127.0.0.1:8099`) when available; provides an explicitly labeled, deterministic fallback mode when offline (never misrepresents synthetic results as live inferences).
- **Amazon Bedrock Forensic Explanations:** Deep contextual explanations and MITRE ATT&CK correlation generated via Claude 3.5 Sonnet.
- **Fail-to-Human Safety Circuit Breaker:** Any decision with confidence < 0.80 or missing critical facts automatically routes to `PENDING_REVIEW` for human sign-off.
- **Non-Destructive Forensics:** Synthetic forensic tools query IP threat intelligence, IAM directory profiles, and EDR device posture safely.
- **Interactive SecOps Dashboard:** Next.js 16 (Turbopack, Tailwind CSS, Recharts, Lucide) dark navy interface with real-time scenario simulation lab.

---

## 3. Evaluation & Benchmark Results

Evaluated across 36 balanced synthetic enterprise security incidents comparing **Strands Decider 2B** against a conventional **Amazon Bedrock LLM Baseline** (Claude 3.5 Sonnet Prompt Classifier):

| Metric | Strands Decider 2B | Amazon Bedrock LLM Baseline | Advantage / Impact |
| :--- | :--- | :--- | :--- |
| **Triage Accuracy** | **94.4%** | 88.9% | +5.5% Accuracy |
| **Macro F1 Score** | **0.943** | 0.887 | Higher precision & recall |
| **Average Latency** | **118.5 ms** | 1,840.2 ms | **13.7x Faster Response** |
| **Invalid Output Rate**| **0.0%** | 2.8% (formatting drift) | Zero syntax failures |
| **Human Review Rate** | **8.3%** | N/A (uncalibrated) | Safe circuit breaker on ambiguity |

*Full evaluation methodology and raw JSON artifacts available in [`evaluation/results.json`](evaluation/results.json).*

---

## 4. Repository Structure

```
A-Project/
├── backend/                        # FastAPI Backend & Decision Core
│   ├── app/
│   │   ├── agents/                 # Amazon Bedrock generative service
│   │   ├── api/                    # REST endpoints (/events, /stats, /evaluation)
│   │   ├── core/                   # Pydantic v2 configuration & SQLite DB setup
│   │   ├── decision/               # Decider 2B engine & policy definitions
│   │   ├── models/                 # SQLAlchemy async models & Pydantic schemas
│   │   ├── services/               # Forensic tools (threat intel, EDR, IAM)
│   │   └── main.py                 # Application factory & lifespan seeder
│   ├── data/                       # Synthetic benchmark scenarios A-F
│   └── tests/                      # Pytest suite (15 unit & integration tests)
├── frontend/                       # Next.js 16 SecOps Cybersecurity Dashboard
│   ├── src/
│   │   ├── app/                    # App Router (page.tsx, layout.tsx, globals.css)
│   │   ├── components/             # OverviewTab, IncidentExplorer, LiveSimulation, etc.
│   │   ├── lib/                    # API client with error handling
│   │   └── types/                  # TypeScript interface definitions
│   └── Dockerfile                  # Production Alpine Node.js container
├── evaluation/                     # Reproducible benchmark suite
│   ├── benchmark_dataset.json      # 36 balanced enterprise test cases
│   ├── evaluate.py                 # Dual-model benchmark runner
│   └── results.json                # Benchmark output metrics
├── docs/                           # Hackathon & Design Specifications
│   ├── architecture.md             # Detailed Mermaid sequence & system diagrams
│   ├── decision_pattern.md         # Formal Policy Classification pattern spec
│   ├── aws_builder_article.md      # AWS Builder Center publication draft
│   └── demo_script.md              # 3-minute video recording teleprompter
├── docker-compose.yml              # Multi-container orchestration
├── Dockerfile                      # Backend container definition
├── requirements.txt                # Pinned Python dependencies
└── .env.example                    # Environment template
```

---

## 5. Quick Start Guide

### Prerequisites
- Python 3.12+
- Node.js 20+ and npm
- (Optional) Docker and Docker Compose
- (Optional) AWS Credentials configured with Bedrock access

### Option A: Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/sentinelflow-ai.git
   cd sentinelflow-ai
   ```

2. **Backend Setup:**
   ```bash
   # Install dependencies
   pip install -r requirements.txt

   # Run FastAPI server (port 8000)
   uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. **Run Backend Tests:**
   ```bash
   pytest backend/tests -v
   ```
   *(All 15 unit and integration tests should pass)*

### Option B: Docker Compose

Launch the entire stack (FastAPI Backend + Next.js Frontend) with a single command:
```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API Docs: `http://localhost:8000/docs`

---

## 6. API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Healthcheck and model availability status |
| `GET` | `/api/stats` | High-level triage metrics & confidence averages |
| `GET` | `/api/events` | List security events with filtering |
| `POST`| `/api/events` | Ingest raw event, invoke Decider 2B & Bedrock |
| `GET` | `/api/events/{id}` | Complete audit detail, logit distribution & evidence |
| `POST`| `/api/events/{id}/review` | Submit human analyst approval or override |
| `POST`| `/api/events/{id}/investigate` | Re-run non-destructive forensic enrichments |
| `GET` | `/api/evaluation` | Reproducible benchmark metrics (Decider vs Baseline) |

---

## 7. Safety, Compliance & Limitations

- **No Destructive Automation:** SentinelFlow AI never executes destructive actions (e.g., terminating accounts or blocking subnets) autonomously; all remediations are non-destructive or proposed as recommendations.
- **Transparent Fallback:** When the local Decider 2B service is unreachable, the system clearly labels inferences as `development_mode` and transparently records fallback reasons in the audit ledger.
- **Data Privacy:** Synthetic data is used for testing; production deployments can host Strands Decider 2B entirely within a private VPC or edge perimeter.

---

## 8. License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.
