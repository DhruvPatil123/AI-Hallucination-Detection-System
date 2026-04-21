# Product Requirements Document (PRD)

## Project

- Product: Nexa AI AHDS (AI Hallucination Detection System)
- Repository: `AI-helucination-detection-system`
- Prepared for: Ralph Loop
- Date: 2026-04-21
- Product stage: Beta / MVP prototype

## 1. Executive Summary

Nexa AI AHDS is a web product for detecting hallucinations in LLM-generated text before that text reaches end users. The current repository contains a polished landing page, authentication flow, a protected live demo, a monitoring dashboard, static API documentation, a Supabase-backed database, and a Supabase Edge Function that calls Gemini to analyze text and store results.

The product promise is enterprise-grade hallucination detection with span-level evidence, auditability, and a feedback loop. The repo already demonstrates the core user journey end-to-end, but several capabilities shown in the marketing and API docs are still aspirational rather than fully implemented.

This PRD is meant to give Ralph Loop a grounded build brief: preserve the current UX direction, stabilize the working MVP, then phase in the missing platform features.

## 2. Problem Statement

Teams shipping LLM features in healthcare, legal, finance, support, and internal knowledge tools need a way to identify unreliable or fabricated model output quickly and with explainable evidence. Raw LLM answers are often plausible-sounding even when false, which creates trust, compliance, and operational risk.

Users need:

- A fast verification layer for generated text
- Clear span-level highlighting instead of only a single pass/fail score
- Persistent logs for review and compliance
- A human feedback loop to improve detection quality over time
- A simple developer-facing integration path

## 3. Product Vision

Build a hallucination detection platform that sits between an application and its LLM outputs, assigns a risk score, highlights suspicious spans, stores evidence and audit logs, and gives teams a dashboard to monitor quality over time.

## 4. Goals

- Detect hallucinated claims in generated text and classify them by category.
- Return structured results that are useful to both humans and applications.
- Provide a self-serve product experience: landing page, auth, demo, dashboard, docs.
- Persist verification history, flagged spans, and human feedback per user.
- Support high-trust domains such as medical, legal, financial, and general use cases.

## 5. Non-Goals for MVP

- Full billing, subscriptions, and plan enforcement
- True multi-tenant admin tooling
- On-prem deployment
- Formal compliance certifications
- Production-grade API key management portal
- Automated retraining pipeline
- Fully implemented public batch API and logs API

## 6. Target Users

### Primary Users

- AI Product Manager evaluating whether model outputs are safe enough to ship
- ML / Platform Engineer integrating a verification layer into an existing app
- Compliance / Risk Reviewer monitoring flagged outputs and audit history
- Domain Expert validating whether flagged spans are correct or false positives

### Secondary Users

- Developer Advocate or Solutions Engineer using the demo during sales or onboarding
- Founders or internal teams testing hallucination risk across prompts and domains

## 7. Core User Jobs

1. Sign up or sign in to access protected product areas.
2. Paste LLM output into a live demo and run hallucination analysis.
3. Inspect risk score, flagged spans, categories, and evidence.
4. Submit thumbs-up / thumbs-down feedback on flagged spans.
5. Review recent activity, category mix, and risk trends in a dashboard.
6. Read integration docs and understand how the API should work.

## 8. Current Product Scope in This Repo

### Implemented Now

- Marketing landing page for Nexa AI AHDS
- Protected routes for `demo.html` and `dashboard.html`
- Supabase authentication with email/password sign-up, sign-in, password reset, and GitHub OAuth
- Live detection demo with domain selector, confidence threshold slider, example input presets, annotated text highlighting, risk gauge, structured JSON output, and per-span feedback buttons
- Supabase Edge Function `detect-hallucination`
- Gemini-backed text analysis
- Writes to `verifications`, `flagged_spans`, and `audit_logs`
- Dashboard with aggregate stats from Supabase views, risk/category breakdowns, audit log table, and realtime feed via Supabase Realtime
- Static API docs page and pricing page content

### Partially Implemented or Mocked

- Demo fallback uses mock data when live detection fails
- Dashboard trend chart is mock data
- Dashboard integrations widget is mock data
- False positive rate and uptime are hardcoded
- API docs describe endpoints and SDKs that do not exist in this repo yet
- Feedback is stored, but not connected to any retraining workflow

## 9. Product Gaps Ralph Loop Should Treat as Known Scope Gaps

- Marketing claims a multi-stage verification pipeline, RAG grounding, live web retrieval, and sub-200ms latency. The current backend is a single Gemini prompt call and should be described honestly until the architecture catches up.
- API docs describe `/v1/batch`, `/v1/feedback`, and `/v1/logs`, but the repo only implements a Supabase Edge Function used by the demo.
- API key issuance and plan-based rate limiting are presented in docs/UI but are not actually implemented.
- Pricing tiers are marketing-only today; there is no billing system or usage enforcement.
- Domain support is not fully aligned across code and docs. The code supports `technical`; the docs currently mention `general`, `medical`, `legal`, and `financial`.

## 10. MVP Scope Ralph Loop Should Deliver

### In Scope

- A stable end-to-end user experience for auth, live verification, feedback, and dashboarding
- Reliable persistence of verification results and flagged spans
- Clear explanation of risk level, category, evidence, and timing
- A dashboard that reflects real data wherever possible
- Documentation that matches actual product behavior
- Security cleanup before any public or production use

### Out of Scope for Initial Stabilization

- Enterprise billing
- Public self-serve API key management
- Multi-model orchestration
- Custom knowledge base upload
- True retraining pipeline
- On-prem and dedicated deployment workflows

## 11. Functional Requirements

### FR-1 Authentication

- Users must be able to create an account and sign in with email/password.
- Users should be able to sign in with GitHub OAuth if configured.
- Unauthenticated users trying to open protected pages must be redirected to auth.
- After successful auth, users should return to their intended destination.
- Password reset must be supported.

### FR-2 Verification Flow

- Users must be able to submit text for hallucination analysis from the live demo.
- The system must accept a domain value and confidence threshold.
- The system must return `hallucination_score`, `risk_level`, `flagged_spans`, `processing_time_ms`, and `model_version`.
- Each flagged span must include offsets, text, category, confidence, and evidence.
- Supported categories for MVP are `factual`, `citation`, `logical`, `numerical`, and `temporal`.
- The UI must highlight flagged spans inline and show a structured table of findings.
- If the live backend is unavailable, the product may show a clearly labeled mock fallback in demo environments.

### FR-3 Feedback

- Users must be able to mark a flagged span as `correct` or `incorrect`.
- Feedback must be stored with the user, verification, and span reference.
- The UI should confirm that feedback was recorded.
- Feedback data should be queryable later for model-quality analysis.

### FR-4 Dashboard

- Users must be able to view summary metrics for recent verification activity.
- Dashboard should show detection rate, average latency, p95 or p99 latency, risk distribution, category distribution, and recent audit log entries.
- Realtime updates should appear when new audit log rows are inserted.
- Any chart or KPI shown on the dashboard should be backed by real data or clearly labeled as sample/mock.

### FR-5 Audit Logging

- Every verification should create a durable audit record.
- Audit logs should include at minimum user ID, verification ID, source model ID, risk level, hallucination score, primary category, span count, processing time, domain, and timestamp.

### FR-6 API and Documentation

- Product documentation must accurately reflect what is available.
- The public docs should not advertise endpoints that are not operational unless clearly labeled as planned.
- Verify response schema in docs must match the live implementation.

## 12. Non-Functional Requirements

### Reliability

- Verification requests should fail gracefully and never leave the UI in a broken state.
- Dashboard pages should remain usable even if one data source fails.

### Performance

- MVP target: synchronous verification should feel responsive for normal demo inputs.
- Suggested honest target for current architecture: p95 under 3 seconds for typical requests.
- Do not promise sub-200ms latency until architecture changes support it.

### Security

- Secrets must never be stored in repository text files or exposed client-side.
- Any exposed keys found in the repo should be rotated before deployment.
- Authenticated data access must remain protected by row-level security.

### Explainability

- Every flagged span should include a human-readable evidence string.
- Risk levels should map consistently from the underlying score.

## 13. Data Model Summary

Current schema already supports the MVP:

- `profiles`: user profile and plan metadata
- `verifications`: top-level analysis requests and response metadata
- `flagged_spans`: per-span hallucination findings
- `feedback`: human validation on spans
- `audit_logs`: immutable-style verification event trail
- `dashboard_stats`: aggregate dashboard view
- `category_breakdown`: category distribution view
- `risk_distribution`: risk distribution view

## 14. Success Metrics

### Product Metrics

- Percentage of signed-in users who complete at least one verification
- Number of verifications per active user
- Percentage of flagged spans receiving feedback
- Dashboard return usage after first verification

### Quality Metrics

- Detection precision and recall once labeled data exists
- False positive rate by domain
- Average feedback agreement rate
- Median and p95 processing latency

### Business / Adoption Metrics

- Demo-to-signup conversion
- Signup-to-first-verification conversion
- Number of organizations requesting API access or enterprise trial

## 15. Risks and Constraints

- Current detection depends on a third-party model call and may have variable latency.
- The app currently mixes real behavior and marketing/demo claims, which can confuse users.
- Static docs can drift from the actual backend if not maintained together.
- Dashboard credibility is reduced if mocked metrics are shown without labeling.
- Security risk is high if repository credentials are not removed and rotated.

## 16. Recommended Delivery Phases

### Phase 1: MVP Stabilization

- Align UI copy and docs with actual implemented behavior
- Remove or label all mocked dashboard metrics
- Ensure demo, auth, dashboard, and feedback work end-to-end on live Supabase
- Clean up exposed secrets and environment handling

### Phase 2: Productization

- Build real public `/verify` API surface
- Implement logs retrieval endpoint
- Implement consistent feedback API contract
- Add API key issuance, usage tracking, and plan enforcement

### Phase 3: Enterprise Expansion

- Add batch processing
- Add custom knowledge bases / grounding sources
- Add team workspaces and admin controls
- Add retraining workflow based on validated feedback
- Add deployment/compliance features for enterprise customers

## 17. Open Questions

- Is the immediate goal a polished demo product, a real SaaS MVP, or both?
- Should the first public release focus on one domain instead of many?
- Which claims on the landing page are intended as roadmap versus shipping functionality?
- Should feedback stay binary only, or should users also submit corrected text and notes?
- Is the near-term API intended to be Supabase-backed only, or should it become a standalone public service?

## 18. Recommendation to Ralph Loop

Treat this repo as a strong product prototype with a real end-to-end skeleton already in place. The best next move is not a redesign; it is to harden the core loop:

1. Auth -> verify -> review spans -> submit feedback -> inspect dashboard.
2. Remove mismatches between promise and implementation.
3. Turn the documented API and platform claims into real shipped features in phases.

If Ralph Loop executes against that sequence, this project can move from impressive demo to credible MVP without throwing away the current frontend or Supabase foundation.

## 19. Ralph Loop Task Breakdown

### Task 1: Security Cleanup

Remove exposed secrets and unsafe credential artifacts from the repo and move all sensitive values to proper environment or secret storage. Rotate any previously exposed credentials before public use.

### Task 2: Align Product Copy With Reality

Update landing page copy, API docs, and dashboard language so the shipped product accurately reflects the current implementation. Clearly label roadmap features versus working features.

### Task 3: Stabilize Live Verification

Make the auth -> demo -> detection -> persistence flow reliable end to end. Ensure Supabase auth, Gemini-backed verification, span storage, audit logging, and feedback recording all work without breaking the UI.

### Task 4: Remove or Replace Mocked Dashboard Data

Replace mocked charts, KPIs, and integration widgets with real Supabase-backed queries where feasible. If any mock data remains, label it clearly in the interface.

### Task 5: Normalize Product and Domain Contracts

Make supported domains, response schema, category names, and thresholds consistent across frontend, backend, schema, and documentation. Resolve mismatches such as `technical` support existing in code but not in docs.

### Task 6: Build the Real Public API Surface

Implement a production-facing `/verify` API contract first, then add feedback and logs endpoints. Ensure the docs only describe endpoints that actually exist and can be exercised.

### Task 7: Add Usage, Limits, and Product Guardrails

Implement plan-aware usage tracking, rate limits, and honest product gating for Starter, Enterprise, and Dedicated tiers. Do not expose pricing or API-key claims as fully available until enforcement exists.

### Task 8: Prepare the Product for MVP Release

Polish onboarding, error handling, empty states, and operator visibility so the product can be used as a credible MVP rather than only a demo. Prioritize trust, correctness, and operational clarity over cosmetic expansion.
