import { sevColor, type Severity } from '../tokens';
import styles from './PlaybookAndContacts.module.css';

interface Rule {
  label: string;
  sev: Severity;
}

const RULES: Rule[] = [
  { label: 'Liability capped at 2× annual contract value', sev: 'red' },
  { label: 'Mutual, reciprocal indemnification', sev: 'red' },
  { label: 'Change-of-control termination right', sev: 'red' },
  { label: 'Price escalation capped at CPI + 1%', sev: 'orange' },
  { label: 'Data portability on termination (90 days)', sev: 'orange' },
  { label: 'Auto-renewal flagged 90 days before notice', sev: 'orange' },
  { label: 'English law and English courts', sev: 'green' },
];

interface Contact {
  name: string;
  role: string;
  avatar: string;
  topic: string;
}

const CONTACTS: Contact[] = [
  {
    name: 'Sarah Chen',
    role: 'Head of Legal',
    avatar: 'SC',
    topic: 'Exceptions, sign-off, escalations',
  },
  {
    name: 'Priya Anand',
    role: 'Senior Counsel',
    avatar: 'PA',
    topic: 'Vendor contracts, IP, indemnities',
  },
  {
    name: 'Marcus Webb',
    role: 'Commercial Counsel',
    avatar: 'MW',
    topic: 'Pricing, SLAs, renewals',
  },
  {
    name: 'Legal Ops inbox',
    role: 'legal-ops@northwind.co.uk',
    avatar: '✉',
    topic: 'Anything else — first response in 4h',
  },
];

/**
 * Two-column section: the Northwind playbook on the left (severity-
 * coloured rules) and the contacts list on the right with a reminder
 * callout below it.
 */
export function PlaybookAndContacts() {
  return (
    <div className={styles.section}>
      <div className={styles.grid}>
        <div>
          <div className={styles.eyebrow}>The Northwind playbook</div>
          <h2 className={styles.h2}>What every contract is checked against</h2>
          <p className={styles.lede}>
            Our playbook codifies the positions agreed with the Board and Finance. Anything outside
            these lines is flagged for review — no exceptions without sign-off from Head of Legal.
          </p>
          <div className={styles.rules}>
            {RULES.map((r) => (
              <div
                key={r.label}
                className={styles.rule}
                style={{ borderLeftColor: sevColor(r.sev) }}
              >
                <span className={styles.ruleLabel}>{r.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className={styles.eyebrow}>Need a hand?</div>
          <h2 className={styles.h2}>Who to ask</h2>
          <p className={styles.lede}>
            Reviews are handled by the Legal Ops team. If you&apos;re stuck on a clause or need an
            exception, reach out directly.
          </p>
          <div className={styles.contactCard}>
            {CONTACTS.map((c) => (
              <div key={c.name} className={styles.contact}>
                <div className={styles.avatar}>{c.avatar}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className={styles.contactName}>{c.name}</div>
                  <div className={styles.contactRole}>
                    {c.role} · {c.topic}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.reminder}>
            <strong className={styles.reminderHead}>Reminder</strong>
            ContractIntel suggests language but doesn&apos;t replace sign-off. Every contract above
            £25k still needs a reviewer&apos;s approval before signature.
          </div>
        </div>
      </div>
    </div>
  );
}
