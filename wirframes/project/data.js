
const CONTRACTS = [
  {
    id: 1, name: "Acme Vendor Agreement 2024.pdf", type: "vendor",
    riskScore: 8.5, flags: { red: 5, orange: 2, green: 1 },
    parties: ["Acme Corporation", "Our Company Ltd"],
    uploadDate: "2026-04-10", status: "complete",
    effectiveDate: "2024-01-15", terminationDate: "2025-01-14",
    noticePeriod: "60 days", autoRenewal: "Yes, 1-year terms",
    paymentAmount: "£50,000", currency: "GBP", paymentSchedule: "Quarterly",
    priceEscalation: "2% annual", paymentTerms: "Net 30 days",
    riskFlags: [
      { id: 1, severity: "red", title: "Unlimited Liability Exposure", status: "open",
        description: "This contract does not cap the vendor's liability for damages. In case of breach, you could face unlimited financial exposure. Standard practice is to cap liability at 2× annual contract value.",
        recommendation: 'Negotiate to add: "Vendor liability shall not exceed two times the annual contract value."',
        page: 3, section: "7.2" },
      { id: 2, severity: "red", title: "One-Sided Indemnification", status: "open",
        description: "You indemnify the vendor for any IP infringement, but the vendor only indemnifies you for their own negligence. This is asymmetric and unfavourable.",
        recommendation: "Request reciprocal indemnification scope covering both parties equally.",
        page: 5, section: "10.1" },
      { id: 3, severity: "red", title: "Broad IP Assignment", status: "open",
        description: "Section 12 assigns all work product IP to the vendor, including derivative works. You retain no rights to custom-built deliverables.",
        recommendation: "Negotiate to retain ownership of all custom deliverables and work product.",
        page: 6, section: "12" },
      { id: 4, severity: "red", title: "Unilateral Termination Penalty", status: "open",
        description: "Vendor may terminate for convenience with 30-day notice, but you face a 6-month penalty (£25,000) if you terminate early.",
        recommendation: "Equalise termination rights or remove financial penalty clause.",
        page: 7, section: "15.3" },
      { id: 5, severity: "red", title: "Change of Control Not Addressed", status: "open",
        description: "No change of control provision exists. If the vendor is acquired, the contract automatically assigns to the acquirer with no opt-out for you.",
        recommendation: "Add change of control clause giving you right to terminate within 90 days of acquisition.",
        page: 8, section: "N/A" },
      { id: 6, severity: "orange", title: "Automatic Renewal Without Notice", status: "open",
        description: "Contract auto-renews annually unless 60 days' notice given. Current renewal date: 2025-01-14.",
        recommendation: "Set a calendar reminder for 2024-11-15 to serve notice if not renewing.",
        page: 2, section: "3.4" },
      { id: 7, severity: "orange", title: "Dispute Resolution Favours Vendor", status: "accepted",
        description: "All disputes must be resolved by arbitration in New York. This is costly if you are UK-based.",
        recommendation: "Negotiate for disputes to be resolved in English courts under English law.",
        page: 9, section: "18" },
      { id: 8, severity: "green", title: "Confidentiality Terms Standard", status: "open",
        description: "NDA provisions are mutual and standard. 3-year post-termination period is industry norm.",
        recommendation: "No action required.",
        page: 4, section: "8" }
    ]
  },
  {
    id: 2, name: "TechCo Software License 2023.pdf", type: "license",
    riskScore: 7.2, flags: { red: 3, orange: 3, green: 2 },
    parties: ["TechCo Inc", "Our Company Ltd"],
    uploadDate: "2026-04-09", status: "complete",
    effectiveDate: "2023-06-01", terminationDate: "2026-05-31",
    noticePeriod: "90 days", autoRenewal: "No",
    paymentAmount: "$120,000", currency: "USD", paymentSchedule: "Annual",
    priceEscalation: "5% annual (above CPI)", paymentTerms: "Net 45 days",
    riskFlags: [
      { id: 1, severity: "red", title: "Licence Audit Rights Very Broad", status: "open",
        description: "Vendor may audit your systems with 5 days' notice at any time during the licence term.", recommendation: "Negotiate to require 30 days' notice and limit audits to once per year.", page: 4, section: "6.1" },
      { id: 2, severity: "red", title: "Price Escalation Above CPI", status: "open",
        description: "5% annual price increase regardless of CPI. Last 3 years would have cost 15% more than market.", recommendation: "Cap escalation at CPI or 3%, whichever is lower.", page: 3, section: "5.2" },
      { id: 3, severity: "red", title: "Suspension Without Notice", status: "open",
        description: "Vendor may suspend service immediately for any alleged breach.", recommendation: "Require 30-day cure period before suspension.", page: 6, section: "9" },
      { id: 4, severity: "orange", title: "Data Portability Not Guaranteed", status: "open",
        description: "No data export provision upon termination.", recommendation: "Add data portability clause with 90-day post-termination export window.", page: 7, section: "11" },
      { id: 5, severity: "orange", title: "SLA Credits Capped at 5%", status: "open",
        description: "Maximum SLA credit is 5% of monthly fee. Insufficient for business impact.", recommendation: "Negotiate to 15-20% of monthly fee for extended outages.", page: 5, section: "7.3" },
      { id: 6, severity: "orange", title: "Unilateral Terms Update", status: "open",
        description: "Vendor may update licence terms with 30-day notice.", recommendation: "Negotiate right to terminate without penalty if terms change materially.", page: 2, section: "2.4" }
    ]
  },
  {
    id: 3, name: "GlobalPartners JV Agreement.docx", type: "partnership",
    riskScore: 6.8, flags: { red: 2, orange: 4, green: 3 },
    parties: ["Global Partners LLC", "Our Company Ltd"],
    uploadDate: "2026-04-08", status: "complete",
    effectiveDate: "2024-03-01", terminationDate: "2029-02-28",
    noticePeriod: "180 days", autoRenewal: "Mutual agreement only",
    paymentAmount: "Revenue share 30%", currency: "GBP", paymentSchedule: "Monthly",
    priceEscalation: "N/A", paymentTerms: "Accounts settled within 15 days",
    riskFlags: [
      { id: 1, severity: "red", title: "Deadlock Resolution Mechanism Absent", status: "open",
        description: "50/50 JV with no tie-breaking mechanism for governance deadlocks.", recommendation: "Add independent third-party arbitration for deadlocks.", page: 10, section: "14" },
      { id: 2, severity: "red", title: "Non-Compete Scope Too Broad", status: "open",
        description: "3-year global non-compete post-termination would prevent entering adjacent markets.", recommendation: "Limit to specific product categories and 18 months.", page: 12, section: "16.2" }
    ]
  },
  {
    id: 4, name: "Office Lease - 22 Baker St.pdf", type: "lease",
    riskScore: 4.1, flags: { red: 1, orange: 2, green: 5 },
    parties: ["Baker Street Properties Ltd", "Our Company Ltd"],
    uploadDate: "2026-04-07", status: "complete",
    effectiveDate: "2022-07-01", terminationDate: "2027-06-30",
    noticePeriod: "6 months", autoRenewal: "No",
    paymentAmount: "£85,000/yr", currency: "GBP", paymentSchedule: "Monthly",
    priceEscalation: "RPI linked", paymentTerms: "Payable in advance",
    riskFlags: [
      { id: 1, severity: "red", title: "Dilapidations Clause Very Broad", status: "open",
        description: "Tenant liable for all dilapidations including fair wear and tear.", recommendation: "Commission schedule of condition at outset to limit dilapidations.", page: 8, section: "11" },
      { id: 2, severity: "orange", title: "Break Clause Conditions Onerous", status: "open",
        description: "Break clause exercisable only if all rent paid up and no subsisting breach. Minor admin breach could void break right.", recommendation: "Negotiate to 'material breach' standard only.", page: 5, section: "7.2" }
    ]
  },
  {
    id: 5, name: "DataFlow NDA - Series B.pdf", type: "nda",
    riskScore: 2.3, flags: { red: 0, orange: 1, green: 4 },
    parties: ["DataFlow Analytics Ltd", "Our Company Ltd"],
    uploadDate: "2026-04-07", status: "complete",
    effectiveDate: "2026-01-10", terminationDate: "2028-01-09",
    noticePeriod: "N/A", autoRenewal: "No",
    paymentAmount: "N/A", currency: "N/A", paymentSchedule: "N/A",
    priceEscalation: "N/A", paymentTerms: "N/A",
    riskFlags: [
      { id: 1, severity: "orange", title: "Definition of Confidential Information Broad", status: "open",
        description: "Confidential information includes all oral communications. Difficult to track in practice.", recommendation: "Narrow to written/marked confidential or specifically designated oral disclosures.", page: 2, section: "1.1" }
    ]
  },
  {
    id: 6, name: "Sunrise HR Consulting MSA.pdf", type: "vendor",
    riskScore: 5.5, flags: { red: 2, orange: 2, green: 2 },
    parties: ["Sunrise Consulting Group", "Our Company Ltd"],
    uploadDate: "2026-04-06", status: "complete",
    effectiveDate: "2025-02-01", terminationDate: "2026-01-31",
    noticePeriod: "30 days", autoRenewal: "Yes, rolling monthly",
    paymentAmount: "£8,500/month", currency: "GBP", paymentSchedule: "Monthly",
    priceEscalation: "3% annual", paymentTerms: "Net 14 days",
    riskFlags: [
      { id: 1, severity: "red", title: "Personal Liability for Key Personnel", status: "open",
        description: "Named consultants personally liable for deliverables. Creates unenforceable obligations.", recommendation: "Remove personal liability; make corporate entity solely responsible.", page: 4, section: "6" },
      { id: 2, severity: "red", title: "IP in Pre-Existing Materials Unclear", status: "open",
        description: "Pre-existing IP brought to the engagement is not defined or excluded.", recommendation: "Add schedule of pre-existing IP explicitly excluded from assignment.", page: 5, section: "8.1" }
    ]
  },
  {
    id: 7, name: "BlueSky Cloud Infrastructure.pdf", type: "vendor",
    riskScore: 3.2, flags: { red: 0, orange: 3, green: 4 },
    parties: ["BlueSky Cloud Ltd", "Our Company Ltd"],
    uploadDate: "2026-04-05", status: "complete",
    effectiveDate: "2025-09-01", terminationDate: "2027-08-31",
    noticePeriod: "90 days", autoRenewal: "No",
    paymentAmount: "£24,000/yr", currency: "GBP", paymentSchedule: "Annual",
    priceEscalation: "CPI only", paymentTerms: "Net 30 days",
    riskFlags: [
      { id: 1, severity: "orange", title: "Uptime SLA Below Market", status: "open",
        description: "99.5% uptime SLA. Market standard for cloud infra is 99.9%+.", recommendation: "Negotiate SLA to 99.95% with auto-credits for breaches.", page: 3, section: "5" }
    ]
  },
  {
    id: 8, name: "Meridian Distribution Agreement.pdf", type: "customer",
    riskScore: 6.1, flags: { red: 2, orange: 2, green: 3 },
    parties: ["Meridian Distribution PLC", "Our Company Ltd"],
    uploadDate: "2026-04-04", status: "complete",
    effectiveDate: "2024-11-01", terminationDate: "2027-10-31",
    noticePeriod: "120 days", autoRenewal: "Yes, 2-year terms",
    paymentAmount: "Commission 12%", currency: "GBP", paymentSchedule: "Quarterly",
    priceEscalation: "N/A", paymentTerms: "60 days from invoice",
    riskFlags: [
      { id: 1, severity: "red", title: "Exclusivity Clause Overly Broad", status: "open",
        description: "Grants distributor exclusive rights across all of EMEA for all product categories. Severely limits your go-to-market flexibility.", recommendation: "Limit exclusivity to specific product lines or geographies.", page: 3, section: "4.1" },
      { id: 2, severity: "red", title: "Minimum Volume Shortfall Penalties", status: "open",
        description: "Failure to meet minimum volumes triggers £50k annual penalty, regardless of market conditions.", recommendation: "Add force majeure and market downturn carve-outs.", page: 6, section: "9.2" }
    ]
  },
  {
    id: 9, name: "Q1 2026 Outsourcing Review.pdf", type: "vendor",
    riskScore: 0, flags: { red: 0, orange: 0, green: 0 },
    parties: ["TBD", "Our Company Ltd"],
    uploadDate: "2026-04-27", status: "processing",
    effectiveDate: null, terminationDate: null,
    noticePeriod: null, autoRenewal: null,
    paymentAmount: null, currency: null, paymentSchedule: null,
    priceEscalation: null, paymentTerms: null,
    riskFlags: [], progress: 62
  }
];

const TEAM_MEMBERS = [
  { id: 1, name: "James Whitfield", email: "j.whitfield@company.com", role: "Admin", lastLogin: "2h ago", status: "active", avatar: "JW" },
  { id: 2, name: "Sarah Chen", email: "s.chen@company.com", role: "Reviewer", lastLogin: "1d ago", status: "active", avatar: "SC" },
  { id: 3, name: "Marcus Rivera", email: "m.rivera@company.com", role: "Reviewer", lastLogin: "3d ago", status: "active", avatar: "MR" },
  { id: 4, name: "Priya Nair", email: "p.nair@company.com", role: "Viewer", lastLogin: "1w ago", status: "active", avatar: "PN" },
  { id: 5, name: "Oliver Thompson", email: "o.thompson@company.com", role: "Reviewer", lastLogin: "—", status: "pending", avatar: "OT" }
];

const RENEWALS = [
  { id: 1, contractId: 1, name: "Acme Vendor Agreement 2024", renewalDate: "2025-01-14", daysRemaining: -103, noticePeriod: "60 days", status: "overdue", riskScore: 8.5 },
  { id: 2, contractId: 2, name: "TechCo Software License", renewalDate: "2026-05-31", daysRemaining: 34, noticePeriod: "90 days", status: "urgent", riskScore: 7.2 },
  { id: 3, contractId: 8, name: "Meridian Distribution Agreement", renewalDate: "2027-10-31", daysRemaining: 552, noticePeriod: "120 days", status: "ontrack", riskScore: 6.1 },
  { id: 4, contractId: 6, name: "Sunrise HR Consulting MSA", renewalDate: "2026-05-15", daysRemaining: 18, noticePeriod: "30 days", status: "urgent", riskScore: 5.5 },
  { id: 5, contractId: 3, name: "GlobalPartners JV Agreement", renewalDate: "2029-02-28", daysRemaining: 1037, noticePeriod: "180 days", status: "ontrack", riskScore: 6.8 },
  { id: 6, contractId: 7, name: "BlueSky Cloud Infrastructure", renewalDate: "2027-08-31", daysRemaining: 491, noticePeriod: "90 days", status: "ontrack", riskScore: 3.2 }
];

window.APP_DATA = { CONTRACTS, TEAM_MEMBERS, RENEWALS };
