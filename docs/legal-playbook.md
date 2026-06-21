# Company Contract Playbook

> **Purpose:** This playbook is the governing ruleset used by the contract-analysis agent. When a contract is submitted, the agent evaluates it clause-by-clause against the rules below, flags any matching risks, assigns a severity, and proposes the recommended action. Each rule is self-contained: a trigger, the risk it represents, a severity, and the action to take.

**Organisation:** [Company Name]
**Playbook version:** 1.0
**Jurisdiction baseline:** England & Wales / UK GDPR
**Risk appetite:** Moderate

---

## How the Agent Should Use This Playbook

1. Determine whether the contract uses an **approved template** or counterparty paper (§ B); raise scrutiny for counterparty paper.
2. Parse the contract and identify each relevant clause (liability, indemnity, term, data protection, IP, payment, etc.).
3. For every rule below, evaluate whether the contract's clause **matches the trigger condition**, and grade it against the clause playbook spectrum (§ C: Preferred / Fallback / Escalate).
4. When a trigger is met, record a finding with: rule ID, clause reference, severity, risk description, and recommended action.
5. Where a clause is **missing entirely**, apply the Missing-Clause rules (§ 3) and check against Mandatory Clauses (§ D).
6. Assign an overall **risk tier** using the rubric (§ A), combining contract value and the highest-severity finding; state the required review and approval authority.
7. Aggregate findings into a risk report ordered by severity (Critical → High → Medium → Low).
8. Produce an overall risk rating, the tier with its approval authority, and a prioritised list of negotiation actions.

**Severity scale:**
- **Critical** — do not sign; requires GC/executive escalation.
- **High** — material exposure; must be renegotiated before signing.
- **Medium** — unfavourable; negotiate where leverage allows.
- **Low** — minor / informational; note but acceptable.

---

## A. Risk Tiering & Approval Authority (Rubric)

The agent uses this rubric to assign a **tier** to the contract, in addition to the per-clause severity findings. Tier is the highest band triggered by any single criterion.

| Tier | Criteria (any one) | Review | Approval Authority |
|---|---|---|---|
| **Low** | ≤ £25k value, standard template, no deviations | Self-serve / paralegal | Business Owner |
| **Medium** | £25k–£100k, minor deviations within fallback | Legal counsel | Head of Legal + Department Head |
| **High** | > £100k, custom terms, uncapped/elevated liability, IP assignment, regulated data | Senior counsel / GC | GC + relevant C-suite |
| **Critical** | Strategic, > £500k, novel risk, or sets precedent | GC + external counsel | CEO / Board as required |

**Agent instruction:** map each finding's severity and the contract's value to a tier, take the highest, and state the required review level and approval authority in the report header.

---

## B. Approved Templates

The agent should detect whether the contract is built on an approved template or is counterparty paper. Approved templates (version-locked in the CLM):

- Mutual & one-way NDA
- Master Services Agreement (MSA) + Order Form
- SaaS Subscription Terms
- Data Processing Agreement (DPA) + SCCs
- Reseller / Partner Agreement
- Independent Contractor Agreement
- Statement of Work (SOW) template

**Agent instruction:** if the contract is **counterparty paper** (not one of the above), raise the baseline scrutiny — flag deviations more readily and note in the report that this is non-standard paper requiring full clause review. Templates are owned by Legal; changes go through documented change control.

---

## C. Clause Playbook — Standard Positions & Fallbacks

For each key clause: **preferred position → acceptable fallback → escalate**. The agent uses this to grade where a contract's clause sits on the spectrum. A clause matching "Preferred" or "Acceptable Fallback" is compliant; a clause matching "Escalate" is a finding requiring approval per § A and a recorded rationale.

| Clause | Preferred | Acceptable Fallback | Escalate |
|---|---|---|---|
| **Limitation of liability** | Cap at fees paid (12 months) | Cap at 1.5× annual fees | Uncapped or > 2× |
| **Indemnities** | IP + data breach only, capped | Add third-party claims, capped | Uncapped indemnity |
| **Term & termination** | 12-month, 30-day termination for convenience | Auto-renew with 60-day notice | No exit / multi-year lock-in |
| **Governing law** | England & Wales | Counterparty's EU jurisdiction | Non-EU / unfamiliar forum |
| **Data protection** | Own DPA + SCCs | Counterparty DPA if UK GDPR-compliant | Non-compliant terms |
| **IP ownership** | Each retains pre-existing IP | Licence grant for deliverables | Assignment of company IP |
| **Payment** | 30 days, annual upfront | 45 days | > 60 days / milestone-only |
| **Confidentiality** | Mutual, 3-year survival | 5-year survival | Perpetual / one-way against us |
| **SLAs / warranties** | Standard service warranty | Defined SLA with credits | Penalties / consequential exposure |
| **Assignment** | Consent required, not unreasonably withheld | Permit assignment to affiliates | Free assignment to competitors |

*Anything in the "Escalate" column requires approval per § A and a recorded rationale.*

---

## D. Mandatory Clauses (Legal-Tech Specific)

Every customer-facing agreement **must** address each of the following. The agent flags any that are absent (see also the Missing-Clause rules in § 4):

- **Data protection & security** — UK GDPR/GDPR alignment, sub-processor list, breach-notification timelines, audit rights.
- **AI / automated processing** — disclosure of AI features, model-training restrictions on customer data, accuracy disclaimers.
- **Acceptable use** — prohibited uses, suspension rights.
- **Service availability** — uptime commitment and remedies.
- **Data return & deletion** — on termination, with defined timelines.
- **Subprocessing & flow-down** — obligations passed to vendors handling customer data.

---

## E. Prohibited Terms (Hard Stops — Never Without GC Sign-Off)

If any of these appear, the agent rates the contract **Critical** and recommends GC escalation regardless of other terms:

- Uncapped or unlimited liability
- Perpetual, irrevocable IP assignment of company IP
- Most-favoured-nation pricing clauses
- Unrestricted audit rights with no notice
- Non-compete or exclusivity binding the whole company
- Indemnities for the counterparty's own negligence
- Governing law / jurisdiction in sanctioned or high-risk territories

---

## 1. Clause Rules

Each rule follows this structure:

- **Rule ID** — unique identifier
- **Clause** — the contract area it governs
- **Preferred** — the position we want
- **Trigger** — the condition that constitutes a risk (what the agent looks for)
- **Severity** — how serious the matched risk is
- **Recommended action** — what the agent should advise

---

### LIA — Limitation of Liability

**LIA-01**
- **Clause:** Limitation of liability
- **Preferred:** Liability capped at fees paid in the prior 12 months.
- **Trigger:** Liability is uncapped, or no liability cap clause is present.
- **Severity:** Critical
- **Recommended action:** Reject. Insert a liability cap at 12 months' fees. Escalate to GC before any further negotiation.

**LIA-02**
- **Clause:** Limitation of liability
- **Trigger:** Cap exists but exceeds 2× annual fees.
- **Severity:** High
- **Recommended action:** Negotiate the cap down to ≤ 1.5× annual fees.

**LIA-03**
- **Clause:** Exclusion of indirect/consequential damages
- **Trigger:** No exclusion of indirect, consequential, or loss-of-profit damages.
- **Severity:** High
- **Recommended action:** Add a mutual exclusion of indirect and consequential losses.

---

### IND — Indemnities

**IND-01**
- **Clause:** Indemnification
- **Preferred:** Indemnity limited to IP infringement and data breach, capped.
- **Trigger:** An uncapped indemnity is given by us.
- **Severity:** Critical
- **Recommended action:** Reject uncapped indemnity. Cap at the liability limit. Escalate to GC.

**IND-02**
- **Clause:** Indemnification
- **Trigger:** We indemnify the counterparty for the counterparty's own negligence or wilful misconduct.
- **Severity:** Critical
- **Recommended action:** Remove. We never indemnify a counterparty for their own fault.

**IND-03**
- **Clause:** Indemnification
- **Trigger:** Indemnity scope extends beyond IP and data breach (e.g. general third-party claims) without a cap.
- **Severity:** High
- **Recommended action:** Narrow scope to IP + data breach, or apply a cap.

---

### TRM — Term & Termination

**TRM-01**
- **Clause:** Termination for convenience
- **Preferred:** Either party may terminate on 30 days' notice.
- **Trigger:** No termination-for-convenience right for us, or notice period exceeds 90 days.
- **Severity:** High
- **Recommended action:** Add a termination-for-convenience right with ≤ 60 days' notice.

**TRM-02**
- **Clause:** Auto-renewal
- **Trigger:** Contract auto-renews with a notice window longer than 60 days, or with no defined notice window.
- **Severity:** Medium
- **Recommended action:** Reduce renewal-notice window to ≤ 60 days and flag the renewal date for tracking.

**TRM-03**
- **Clause:** Term length
- **Trigger:** Initial term exceeds 24 months with no exit right.
- **Severity:** Medium
- **Recommended action:** Negotiate a shorter term or add interim exit rights.

---

### DP — Data Protection & Security

**DP-01**
- **Clause:** Data Processing Agreement
- **Preferred:** A UK GDPR-compliant DPA with SCCs is in place.
- **Trigger:** Personal data is processed but no DPA is present.
- **Severity:** Critical
- **Recommended action:** Do not sign. Require execution of a compliant DPA with SCCs.

**DP-02**
- **Clause:** Breach notification
- **Trigger:** No breach-notification obligation, or notification period exceeds 72 hours.
- **Severity:** High
- **Recommended action:** Require breach notification without undue delay and within 72 hours.

**DP-03**
- **Clause:** Sub-processors
- **Trigger:** Sub-processors permitted with no notice, consent, or flow-down obligations.
- **Severity:** High
- **Recommended action:** Require prior notice of sub-processors and flow-down of data obligations.

**DP-04**
- **Clause:** International transfers
- **Trigger:** Data transferred outside the UK/EEA without SCCs or an adequacy basis.
- **Severity:** High
- **Recommended action:** Require SCCs or confirm an adequacy decision before transfer.

**DP-05**
- **Clause:** Data return / deletion
- **Trigger:** No obligation to return or delete data on termination.
- **Severity:** Medium
- **Recommended action:** Add a data return-and-deletion obligation with a defined timeline.

---

### AI — AI / Automated Processing (Legal-Tech Specific)

**AI-01**
- **Clause:** Model training on customer data
- **Trigger:** Counterparty (as customer) data may be used to train models without restriction, OR our data may be used by a vendor to train their models.
- **Severity:** High
- **Recommended action:** Prohibit training on customer/our data without explicit opt-in.

**AI-02**
- **Clause:** AI accuracy / output disclaimer
- **Trigger:** No disclaimer that AI-generated output is not legal advice and may contain errors.
- **Severity:** Medium
- **Recommended action:** Add an AI accuracy disclaimer and human-review recommendation.

---

### IP — Intellectual Property

**IP-01**
- **Clause:** IP ownership
- **Preferred:** Each party retains pre-existing IP; deliverables licensed, not assigned.
- **Trigger:** Assignment of our pre-existing IP or background IP to the counterparty.
- **Severity:** Critical
- **Recommended action:** Reject assignment. Convert to a licence grant. Escalate to GC.

**IP-02**
- **Clause:** Licence grant
- **Trigger:** Licence granted to counterparty is perpetual and irrevocable.
- **Severity:** High
- **Recommended action:** Make the licence co-terminous with the agreement and revocable on termination.

---

### COM — Commercial Terms

**COM-01**
- **Clause:** Payment terms
- **Preferred:** 30 days from invoice.
- **Trigger:** Payment terms exceed 60 days, or payment is milestone-only with no schedule.
- **Severity:** Medium
- **Recommended action:** Negotiate to ≤ 45 days with a defined payment schedule.

**COM-02**
- **Clause:** Most-favoured-nation pricing
- **Trigger:** Any MFN / most-favoured-customer pricing clause is present.
- **Severity:** High
- **Recommended action:** Remove. MFN clauses require GC approval.

**COM-03**
- **Clause:** Price increase
- **Trigger:** Counterparty may increase prices mid-term with no cap or notice.
- **Severity:** Medium
- **Recommended action:** Cap annual increases (e.g. CPI or 5%) and require advance notice.

---

### GOV — Governing Law & Jurisdiction

**GOV-01**
- **Clause:** Governing law
- **Preferred:** England & Wales.
- **Trigger:** Governing law is in a sanctioned, high-risk, or unfamiliar non-EU jurisdiction.
- **Severity:** High
- **Recommended action:** Negotiate to England & Wales or a familiar EU jurisdiction. Escalate if counterparty insists.

**GOV-02**
- **Clause:** Dispute resolution
- **Trigger:** Mandatory arbitration in a foreign seat with no carve-out for injunctive relief.
- **Severity:** Medium
- **Recommended action:** Add a carve-out for injunctive relief; prefer a neutral or local seat.

---

### CON — Confidentiality

**CON-01**
- **Clause:** Confidentiality
- **Preferred:** Mutual obligations, 3-year survival.
- **Trigger:** Confidentiality is one-way against us, or survival is perpetual.
- **Severity:** Medium
- **Recommended action:** Make obligations mutual; cap survival at 3–5 years.

---

### MISC — Other High-Risk Terms

**MISC-01**
- **Clause:** Exclusivity / non-compete
- **Trigger:** Any clause binding the whole company to exclusivity or non-compete.
- **Severity:** Critical
- **Recommended action:** Reject. Company-wide exclusivity requires GC and executive approval.

**MISC-02**
- **Clause:** Audit rights
- **Trigger:** Counterparty granted unrestricted audit rights with no notice or scope limits.
- **Severity:** High
- **Recommended action:** Limit audits to once per year, on reasonable notice, scoped to compliance.

**MISC-03**
- **Clause:** Assignment
- **Trigger:** Counterparty may freely assign the contract, including to a competitor.
- **Severity:** Medium
- **Recommended action:** Require our consent (not unreasonably withheld); permit assignment to affiliates only.

---

## 2. Hard Stops (Always Critical)

These mirror the Prohibited Terms in § E, mapped to specific rule IDs. If any appear, the agent must rate the contract **Critical** and recommend escalation to the General Counsel regardless of other terms:

- Uncapped or unlimited liability (LIA-01)
- Uncapped indemnity given by us (IND-01)
- Indemnifying the counterparty for their own negligence (IND-02)
- Assignment of our pre-existing IP (IP-01)
- Processing personal data with no DPA (DP-01)
- Company-wide exclusivity or non-compete (MISC-01)
- Governing law in a sanctioned territory (GOV-01)

---

## 3. Missing-Clause Rules

When an expected clause is **absent**, the agent flags it as a gap:

| Expected clause | If missing | Severity | Action |
|---|---|---|---|
| Limitation of liability | No cap on exposure | Critical | Insert liability cap |
| Data Processing Agreement (if PII processed) | No GDPR coverage | Critical | Require DPA + SCCs |
| Termination rights | No exit mechanism | High | Add termination provisions |
| Confidentiality | No protection of our information | High | Add mutual confidentiality |
| IP ownership | Ambiguous ownership | High | Add clear IP ownership terms |
| Breach notification | No incident obligations | High | Add 72-hour breach notice |
| Data return / deletion | Data retained indefinitely | Medium | Add return/deletion clause |
| Governing law | Forum uncertainty | Medium | Specify England & Wales |

---

## 4. Output Format (Agent Report Schema)

The agent should produce a report containing:

**Summary**
- Contract name / counterparty
- Template basis (approved template / counterparty paper)
- Overall risk rating (Critical / High / Medium / Low)
- **Risk tier (§ A)** with required review level and approval authority
- Number of findings by severity
- Recommendation (Sign / Sign with changes / Do not sign — escalate)

**Findings** (one row per matched rule)

| Rule ID | Clause | Severity | Risk identified | Clause reference | Recommended action |
|---|---|---|---|---|---|
| e.g. LIA-01 | Limitation of liability | Critical | Liability is uncapped | §11.2 | Insert 12-month fees cap; escalate to GC |

**Recommended actions** — a prioritised, deduplicated action list drawn from the findings, ordered by severity.

---

*This playbook encodes the organisation's contract risk policy. It is configuration for an automated analysis tool and does not itself constitute legal advice. Thresholds and positions should be reviewed by Legal and tuned to the organisation's risk appetite.*
