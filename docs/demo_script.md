# SentinelFlow AI — 3-Minute Video Demo Script

**Project:** SentinelFlow AI — Autonomous Security Decision Agent  
**Hackathon:** AWS Agent Experience Hackathon  
**Tags:** `#strands-decider-2b` `#policy`  
**Target Duration:** 3 minutes (180 seconds)

---

## Video Outline & Timing

| Segment | Timing | Screen / View | Narration & Key Action |
| :--- | :--- | :--- | :--- |
| **1. Hook & Architecture** | 0:00 – 0:35 | Slide / Dashboard Header | Problem: Alert fatigue in SOCs. Solution: Policy Classification with Strands Decider 2B & Amazon Bedrock. |
| **2. Operations Overview** | 0:35 – 1:10 | `Overview` Tab | Live triage stats, action distribution, sub-200ms latency, active incident feed. |
| **3. Live Simulation Engine**| 1:10 – 1:50 | `Live Simulation` Tab | Trigger Scenario A & C; observe 6-stage pipeline animation and sub-second verdict. |
| **4. Deep Inspection & HITL**| 1:50 – 2:25 | `Incident Details Modal` | Inspect Decider 2B softmax logits, Bedrock incident narrative, synthetic forensics, and commit a human review. |
| **5. Benchmark Evaluation** | 2:25 – 3:00 | `Model Evaluation` Tab | Side-by-side benchmark: 13.7x latency speedup, 0.0% formatting errors, closing wrap-up. |

---

## Detailed Script & Teleprompter

### Scene 1: Introduction & Architecture (0:00 – 0:35)
- **Visual:** Browser showing the SentinelFlow AI dark-navy SecOps dashboard at `http://localhost:3000`. Show the header badges: `Strands Decider 2B` and `Amazon Bedrock`.
- **Narration:**
  > "Hello everyone! Welcome to **SentinelFlow AI**, an autonomous security triage agent built for the AWS Agent Experience Hackathon.
  >
  > Today's Security Operations Centers are overwhelmed by tens of thousands of daily alerts. Traditional LLMs are too slow and expensive to evaluate every event in real-time. SentinelFlow solves this by implementing the **Policy Classification** decision pattern.
  >
  > We combine **Strands Decider 2B** — a specialized 2-billion parameter decision model that selects triage actions in under 120 milliseconds with zero hallucinations — with **Amazon Bedrock**, which generates detailed incident explanations and remediation guidance."

---

### Scene 2: Operations Overview Tab (0:35 – 1:10)
- **Visual:** Scroll through the `Overview` tab. Point cursor at the 4 KPI cards (Total Processed, Action Breakdown, Average Latency, and Human Review Queue), then show the Recharts bar and pie charts.
- **Narration:**
  > "Here on the Operations Dashboard, we have real-time visibility into the agent's decisions.
  >
  > Notice the action distribution: the agent classifies events into **CLOSE** for routine benign events, **INVESTIGATE** for anomalous activity requiring forensic enrichment, and **ESCALATE** for critical threats.
  >
  > Look at the average decision latency: **118 milliseconds**. That is fast enough to run directly in high-velocity telemetry pipelines without creating backpressure."

---

### Scene 3: Live Simulation & 6-Stage Pipeline (1:10 – 1:50)
- **Visual:** Click on the `Live Simulation` tab. Select **Scenario A: Failed Logins + Tor IP Success**. Click the blue **Run Agent Decision Pipeline** button.
- **Visual Action:** Watch the 6-stage pipeline animate from Ingestion -> Normalization -> Decider 2B -> Forensics -> Bedrock -> Audit DB.
- **Narration:**
  > "Let's test the live agent with real telemetry. In the Simulation lab, we have standard enterprise scenarios.
  >
  > I'll select **Scenario A**, where an account experiences multiple failed logins followed by a successful authentication from a Tor exit node.
  >
  > I click 'Run Pipeline'. Watch the 6 stages execute: the telemetry is normalized into observed facts, Strands Decider 2B evaluates the policy choice in 114 milliseconds, synthetic forensic tools query threat intel, and Amazon Bedrock synthesizes the forensic narrative.
  >
  > The result? An **INVESTIGATE** decision with 93.4% confidence."

---

### Scene 4: Forensic Inspection & Human Review (1:50 – 2:25)
- **Visual:** Switch to `Incident Explorer` tab. Click on a critical incident (or one marked `PENDING_REVIEW`). The `DecisionDetailsModal` opens.
- **Visual Action:** Show the Decider 2B confidence bar distribution (`CLOSE: 0.02`, `INVESTIGATE: 0.12`, `ESCALATE: 0.86`). Scroll down to show Bedrock's Claude 3.5 Sonnet analysis, the synthetic IP reputation, and the MITRE ATT&CK correlation. In the Human Review action bar, approve the verdict and submit.
- **Narration:**
  > "Opening the Incident Inspector reveals our complete audit trail.
  >
  > Here is the exact pointer-head softmax distribution from Strands Decider 2B. Right below it is the Amazon Bedrock incident report, citing MITRE technique T1068 and actionable remediation steps.
  >
  > Because security requires strict human oversight, when confidence drops below 80% or missing facts are detected, the agent safely flags the record for human review.
  >
  > As a SOC analyst, I can review the findings, add notes, and approve or override the verdict with a single click, immediately updating our immutable audit ledger."

---

### Scene 5: Model Evaluation Benchmark (2:25 – 3:00)
- **Visual:** Click on the `Model Evaluation` tab. Point to the Latency Speedup KPI (13.7x), the response latency horizontal bar chart (118.5ms vs 1,840.2ms), the 3x3 confusion matrix, and the sample case table.
- **Narration:**
  > "Finally, let's look at the empirical benchmark results comparing Strands Decider 2B against an Amazon Bedrock LLM baseline.
  >
  > Across 36 balanced test incidents, Strands Decider 2B achieved **94.4% triage accuracy**, a **13.7x latency speedup**, and a **0.0% invalid output rate**. By constraining inference to a discrete decision head, we eliminated the syntax errors and token delays inherent to general LLMs.
  >
  > SentinelFlow AI proves that specialized decision models like Strands Decider 2B are the missing piece for high-speed, enterprise-grade agentic systems.
  >
  > Thank you!"

---

## Recording Tips for Presenters
- Screen resolution: 1920x1080 (1080p).
- Browser: Fullscreen (F11), dark theme active.
- Ensure backend server is running on `http://localhost:8000` before starting recording.
