# Outlier Detection — Methodology Note

**Goal:** for any clause in an incoming contract, decide *"is this unusual compared to what we normally sign?"* and produce a **deviation score (0–100)** plus a human-readable reason.

This is the engine that powers the deviation chips and the negotiation card on the Negotiation Review screen.

---

## 1. Two complementary signals

A clause can be an outlier along two independent axes. We compute both and combine.

### A. Semantic outlier (embedding-based)

*"Does this clause read differently from our usual clauses of the same type?"*

1. **Cohort selection** — gather all prior clauses in the portfolio of the same `clause_type` (e.g. all `limitation_of_liability` clauses). Filter to ones marked `accepted` / signed.
2. **Centroid** — compute the mean embedding vector of the cohort. This is "the shape of a typical clause we sign."
3. **Distance** — cosine distance between the new clause's embedding and the centroid. Higher = more semantically unusual.
4. **Normalisation** — convert distance to a 0–100 score using the cohort's own distribution:
   - Compute the distribution of intra-cohort distances (every member's distance from the centroid).
   - The new clause's percentile in that distribution → semantic score.
   - A clause at the 95th percentile means "more unusual than 95% of what we've signed."

**Why centroid + percentile, not raw threshold:** thresholds don't transfer across clause types. A 0.3 cosine distance might be normal for "Governing Law" (short, formulaic) and extreme for "Indemnification" (long, varied). Percentile normalises this away.

**Alternative for small cohorts (< 20):** k-NN distance. Average distance to the 5 nearest neighbours. More robust than centroid when the cohort is multi-modal (e.g. you have two distinct accepted patterns and the centroid sits between them where nothing actually lives).

### B. Structured outlier (parameter-based)

*"Are the numbers in this clause out of band?"*

Embeddings are weak at numerics. A liability cap of $1M vs $100M reads almost identically as text. So we additionally extract structured parameters per clause type and check those against the portfolio distribution.

Examples:
- **Limitation of Liability** → cap amount, cap as multiple of fees, carve-outs count
- **Termination for Convenience** → notice period in days, cure period
- **Payment Terms** → net days, late fee %, currency
- **Indemnification** → mutual vs one-way, cap, carve-outs
- **Auto-renewal** → renewal term, notice-to-terminate window

For each numeric parameter:
- Compute the portfolio distribution (median, p10, p90, IQR).
- Flag the value if outside p10–p90 (mild) or outside p5–p95 (strong).
- Generate a human reason: *"Liability cap is $250K — your portfolio median is $5M (p10 = $1M)."*

Parameter extraction can reuse the same Claude clause-extraction pipeline already in place — just add a structured-fields schema per clause type.

### C. Combining the two

```
deviation_score = max(semantic_score, structured_score_max)
```

Use `max`, not average — a clause is an outlier if it's unusual on **either** axis. A perfectly normal-sounding clause with a wildly off-market cap should still flag.

Surface **both reasons** in the UI when both fire ("Wording differs from your usual + cap is below p10").

---

## 2. Cohort scoping — important

The "portfolio norm" isn't always the whole portfolio. Offer cohort filters:

- **By counterparty type** (enterprise vs SMB vs gov't) — caps differ wildly
- **By deal size band** — a $10K SaaS deal shouldn't be measured against $10M MSAs
- **By contract type** (MSA, NDA, DPA, order form)
- **By recency** — last 24 months vs all time (positions drift)

Default cohort: same `clause_type` + same `contract_type` + last 24 months. Let the user widen it from the negotiation card.

---

## 3. Playbook as a second reference

Once the Playbook exists, we also compare against the **ideal/acceptable language** stored there:

- `playbook_distance` = cosine distance between clause embedding and the playbook's "ideal" embedding
- Map to tier: distance to `ideal` < distance to `acceptable` < distance to `fallback` < distance to `red-line`
- Whichever tier the clause is closest to *and* within a threshold of → that's its playbook verdict.

This gives the user **two complementary verdicts**:
- vs portfolio (descriptive — "how does this compare to what we've signed?")
- vs playbook (prescriptive — "how does this compare to what we *want* to sign?")

These can disagree, and that's interesting: a clause might be normal-for-us (low deviation) but worse-than-ideal (playbook says fallback). The UI should show both.

---

## 4. Cold-start handling

- **Cohort < 5 clauses** → don't compute a semantic outlier score; show "insufficient precedent." Fall back to playbook-only verdict.
- **No playbook standard for this clause type** → show portfolio-only verdict and a CTA: "Add a playbook standard for Limitation of Liability."
- **Neither** → still show the clause, mark `unreviewed`, no score. Don't fabricate confidence.

---

## 5. Explainability (the "why")

A score with no reason is useless to a lawyer. For every flagged clause, generate a short reason string:

- *Semantic:* top 1–2 nearest accepted clauses with similarity %, plus "wording diverges from your usual pattern."
- *Structured:* the specific parameter and its percentile (*"Notice period 7 days — your median is 30 (p10 = 14)."*).
- *Playbook:* which tier it matched and which one it missed (*"Closer to your fallback than your acceptable position."*).

Reasons live on the negotiation card as bullets under the deviation score.

---

## 6. Implementation order (suggested)

1. **Semantic outlier (A)** — quickest win, reuses existing embeddings. Centroid + percentile.
2. **Reason strings + nearest-neighbour precedent list** — same query, just surface the neighbours.
3. **Structured outlier (B)** — add per-clause-type field extraction. Start with 3 high-value clause types (LoL, Termination, Payment Terms).
4. **Playbook comparison (C)** — once the Playbook data model exists.
5. **Cohort scoping controls** — once users start asking "compared to what?"

---

## 7. Evaluation

Before shipping, validate on the existing synthetic portfolio:

- Inject 10 clauses with known anomalies (extreme caps, weird wording, off-market terms).
- Confirm they score in the top decile.
- Inject 10 clauses that are paraphrases of accepted ones — confirm they score low.
- Track false-positive rate on real reviews once internal users start using it.
