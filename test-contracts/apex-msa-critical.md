<!--
Seed contract for the Playbook-Driven Contract Review agent (Phase 13).

Deliberately drafted as COUNTERPARTY PAPER (Apex's standard terms; we are the
Customer) so it reads as non-standard and triggers a full clause review.
Each clause is crafted to trip a specific playbook rule (docs/legal-playbook.md),
and the clause NUMBERS match docs/sample-risk-report.md so the agent's output
should reproduce that target report. Annual value £180,000, counterparty
Apex Global Holdings Ltd.

Rule map (clause → rule(s) the agent should fire):
  2.2 → TRM-02 (auto-renew, 90-day notice)        2.3 → TRM-01 (no term-for-convenience)
  3.2 → COM-01 (90-day payment)                   3.3 → COM-02 (MFN → §E hard stop, elevated)
  4.1 → LIA-01 (uncapped liability, §E)           5.1 → IND-02 + IND-01 (own-negligence + uncapped, §E)
  6.1 → IP-01 + IP-02 (assigns pre-existing IP, perpetual/irrevocable, §E)
  7.1 → DP-01 (PII, no DPA, §E)                    8.1 → MISC-02 (unrestricted no-notice audit)
  10.1 → GOV-01 (sanctioned/high-risk forum, §E)
Missing-clause gaps the agent should flag: DPA (§D), breach notification,
data return/deletion, AI accuracy disclaimer, acceptable use, uptime/SLA,
sub-processor flow-down.
-->

# MASTER SERVICES AGREEMENT

**This Master Services Agreement** (the "**Agreement**") is entered into between:

**Apex Global Holdings Ltd**, a company registered in the British Virgin Islands (company no. BVI-774103), whose registered office is at Geneva Place, Road Town, Tortola ("**Apex**" or the "**Supplier**"); and

**the Customer** identified in the applicable Order Form (the "**Customer**").

This Agreement is provided on Apex's standard terms of business. By executing an Order Form, the Customer accepts these terms in full. The Supplier's "**Platform**" is an AI-assisted analytics and document-processing service made available to the Customer as more particularly described in the Order Form.

**Annual Charges:** £180,000 per annum (the "**Annual Charges**").

---

## 1. Definitions and Interpretation

1.1 "**Confidential Information**" means any non-public information disclosed by one party to the other that is marked confidential or would reasonably be understood to be confidential.

1.2 "**Customer Data**" means any data, including personal data, submitted by or on behalf of the Customer to the Platform.

1.3 "**Deliverables**" means any reports, configurations, models, or other materials made available to the Customer through the Platform.

---

## 2. Term and Termination

2.1 This Agreement commences on the Effective Date and continues for an initial term of twenty-four (24) months (the "**Initial Term**").

2.2 Following the Initial Term, this Agreement shall **automatically renew** for successive twelve (12) month periods unless the Customer gives written notice of non-renewal **not less than ninety (90) days** before the end of the then-current term.

2.3 The Customer may terminate this Agreement **only** in the event of the Supplier's material breach that remains uncured for sixty (60) days after written notice. **For the avoidance of doubt, the Customer shall have no right to terminate this Agreement for convenience.** The Supplier may terminate at any time on thirty (30) days' notice.

---

## 3. Charges and Payment

3.1 The Customer shall pay the Annual Charges as set out in the Order Form. The Supplier may increase the Annual Charges at any time during the term on notice.

3.2 All invoices are payable within **ninety (90) days** of the invoice date. Overdue amounts accrue interest at 4% per month.

3.3 The Customer warrants that the pricing under this Agreement is, and shall at all times remain, **no less favourable to the Supplier than the pricing or commercial terms the Customer grants to any other supplier of comparable services** ("most-favoured-customer" terms). The Customer shall promptly disclose any more-favourable terms and amend this Agreement to match.

---

## 4. Limitation of Liability

4.1 **The Customer's liability under or in connection with this Agreement shall be unlimited.** The Supplier's aggregate liability under or in connection with this Agreement shall in all circumstances be limited to £100. Nothing in this Agreement excludes the Customer's liability for any indirect, consequential, or loss-of-profit damages, all of which the Customer expressly accepts.

---

## 5. Indemnification

5.1 The Customer shall **indemnify, defend and hold harmless the Supplier** (and its affiliates, officers, and agents) from and against any and all claims, losses, liabilities, damages, costs, and expenses of any kind arising out of or relating to this Agreement, the Platform, or the Customer Data, **including claims arising from the Supplier's own negligence, errors, or wilful misconduct**. This indemnity is **uncapped** and survives termination indefinitely.

---

## 6. Intellectual Property

6.1 The Customer hereby **irrevocably and perpetually assigns to the Supplier all right, title and interest in and to all intellectual property**, including any pre-existing and background intellectual property of the Customer that is used with, submitted to, or processed by the Platform, together with all Deliverables and any derivative works. This assignment is worldwide, royalty-free, perpetual, and irrevocable, and survives termination of this Agreement.

---

## 7. Data

7.1 The Customer acknowledges that the Platform processes **personal data** contained in the Customer Data. The parties agree that **no separate data processing agreement is required** and that the Supplier may process, store, and transfer such personal data to any jurisdiction in which it or its affiliates operate, in its sole discretion, for any purpose connected with the provision or improvement of the Platform.

---

## 8. Audit

8.1 The Supplier (and any third party it nominates) may **audit the Customer's premises, systems, books, and records at any time, without prior notice, and without limitation as to scope or frequency**. The Customer shall provide full access and cooperation at its own cost.

---

## 9. Confidentiality

9.1 Each party shall keep the other party's Confidential Information confidential and use it only for the purposes of this Agreement. This obligation survives for three (3) years following termination.

---

## 10. Governing Law and Jurisdiction

10.1 This Agreement and any dispute or claim arising out of or in connection with it shall be governed by and construed in accordance with the **laws of the Russian Federation**, and the parties submit to the exclusive jurisdiction of the courts of Moscow.

---

## 11. General

11.1 **Entire Agreement.** This Agreement, together with any Order Form, constitutes the entire agreement between the parties and supersedes all prior discussions.

11.2 **Assignment.** The Supplier may assign or novate this Agreement to any third party without the Customer's consent. The Customer may not assign without the Supplier's prior written consent.

11.3 **Variation.** No variation is effective unless agreed in writing and signed by the Supplier.

**IN WITNESS WHEREOF**, the parties have executed this Agreement as of the Effective Date.

For and on behalf of **Apex Global Holdings Ltd**: _______________________

For and on behalf of **the Customer**: _______________________
