# SentinelFlow AI: Autonomous Security Triage with Strands Decider 2B and Amazon Bedrock

**Published for:** AWS Agent Experience Hackathon  
**Author:** SentinelFlow Engineering Team  
**Tags:** `#strands-decider-2b` `#policy`

---

## 1. Introduction: The Alert Fatigue Crisis

Modern enterprise Security Operations Centers (SOCs) are under relentless siege from alert volume. A mid-sized enterprise ingests between 10,000 and 50,000 security events daily from SIEMs, EDR agents, and identity providers. Over 70% of these alerts represent benign noise or low-severity routine activities. Human analysts suffer acute alert fatigue, resulting in missed critical alerts and an average dwell time of over 200 days for advanced persistent threats.

Traditional automation attempts have faced a steep trade-off:
- **Rigid Regex / Rule Engines:** Extremely fragile, blind to contextual nuance, and constantly generating false positives.
- **Generic Large Language Models (LLMs):** Provide high contextual reasoning, but introduce unacceptable multi-second API latencies, high token costs, and a dangerous risk of non-deterministic output or syntax hallucinations.

To solve this dilemma, we built **SentinelFlow AI** — an autonomous security triage agent that pairs **Strands Decider 2B** for microsecond-scale, deterministic **Policy Classification** with **Amazon Bedrock (Anthropic Claude 3.5 Sonnet)** for generative incident narrative synthesis and remediation planning.

---

## 2. The Decision Pattern: Policy Classification

At the core of SentinelFlow AI is the **Policy Classification** decision pattern (`#policy`). 

Rather than prompting a generative LLM to "think step-by-step and write a paragraph on what to do", the agent models security triage as a constrained choice over a closed policy action space:
1. **`CLOSE`**: Benign or low-risk events with verified normal telemetry (e.g., routine SSO authentication from compliant corporate hardware).
2. **`INVESTIGATE`**: Suspicious or ambiguous telemetry requiring non-destructive forensic enrichment (e.g., successful logins immediately following credential stuffing or Tor exit relay usage).
3. **`ESCALATE`**: High-risk or active compromise indicators demanding immediate human security analyst intervention (e.g., unauthorized privilege escalation, brute-force floods, domain token theft).

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

## 3. Why Strands Decider 2B?

The **Strands Decider 2B** model (`#strands-decider-2b`) is a specialized, 2-billion parameter decision model built for System 1 fast-thinking. Unlike generative foundation models that produce free-form strings, Decider 2B evaluates discrete choices through an internal pointer-head architecture over explicit criteria.

By using the official `strands-agents` and `strands-decider` library interface (`POST /v1/systemone`), SentinelFlow AI sends a `SystemOneRequest` containing the normalized telemetry prompt and a `ChoiceQuestion` defining our three triage actions and their rigorous selection criteria.

The advantages over a conventional LLM prompt are profound:
1. **Sub-200ms Latency:** Decider 2B delivers answers in 90ms to 180ms locally or on edge gateways, compared to 1,500ms – 3,500ms for cloud-hosted LLM API roundtrips.
2. **Zero Syntactic Hallucination:** Because the model evaluates pointer head logits directly across provided choices, the output space is strictly constrained. Invalid output rate is mathematically 0.0%.
3. **Calibrated Confidence:** Output probabilities directly reflect model certainty. When confidence drops below 0.80, SentinelFlow AI seamlessly shifts the incident to a human security analyst.

---

## 4. Architectural Symbiosis: Decider 2B + Amazon Bedrock

A key design principle of SentinelFlow AI is **separation of concerns**:
- **System 1 (Strands Decider 2B):** Triage reflex. High speed, discrete action selection, zero verbosity.
- **System 2 (Amazon Bedrock):** Analytical reasoning. Once the decision is made and synthetic forensics are gathered, Amazon Bedrock (Claude 3.5 Sonnet) is invoked to generate:
  - An executive incident narrative explaining the underlying attack vectors.
  - Correlated MITRE ATT&CK tactics (e.g., T1078 Valid Accounts, T1068 Privilege Escalation).
  - Concrete, step-by-step remediation guidance for SOC analysts.

Crucially, **Bedrock never silently overrides Decider 2B's verdict**. The decision audit record immutably captures both the model used, the latency of each stage, and the raw probability distribution.

---

## 5. Benchmark Evaluation: Empirical Results

We constructed a balanced evaluation benchmark of 36 synthetic enterprise security scenarios across standard MITRE ATT&CK techniques and evaluated both systems side-by-side:

| Metric | Strands Decider 2B | Bedrock LLM Baseline (Claude 3.5 Sonnet Prompt) | Delta / Advantage |
| :--- | :--- | :--- | :--- |
| **Accuracy** | **94.4%** | 88.9% | +5.5% accuracy |
| **Macro F1 Score** | **0.943** | 0.887 | +0.056 F1 |
| **Average Latency** | **118.5 ms** | 1,840.2 ms | **13.7x faster** |
| **Invalid Output Rate** | **0.0%** | 2.8% (markdown/text drift) | Zero format errors |
| **Human Review Rate** | **8.3%** | N/A (uncalibrated) | Safe fallback on uncertainty |

The 13.7x latency advantage is transformative in high-throughput SecOps pipelines. An organization processing 100,000 daily events would save hundreds of hours of latency delay and substantial token consumption costs.

---

## 6. Safety & Human-in-the-Loop Guardrails

Autonomous cybersecurity agents must never execute destructive actions without safeguards. SentinelFlow AI implements three essential guardrails:

1. **Non-Destructive Automation Only:** Automated actions are limited to enriched threat intelligence queries, EDR posture checks, and ticket generation. Destructive remediations (e.g., disabling identity accounts, isolating production VPCs) require human authorization.
2. **Low-Confidence Circuit Breaker:** Any decision with top softmax probability < 0.80 is automatically routed to `PENDING_REVIEW`.
3. **Full Audit Traceability:** Every decision record stores model name, model type, confidence distribution, fallback status, and reviewer overrides. Analysts can approve or override decisions with a single click in the SecOps dashboard.

---

## 7. Conclusion

By decomposing agent workflows into specialized decision models (Strands Decider 2B) and generative reasoning engines (Amazon Bedrock), SentinelFlow AI demonstrates a practical, scalable blueprint for enterprise AI agents. Specialized decision models are not a replacement for LLMs; they are their indispensable first-hop partners.

---
*Built with Strands Decider 2B, Amazon Bedrock, FastAPI, Next.js, and Tailwind CSS for the AWS Agent Experience Hackathon.*
