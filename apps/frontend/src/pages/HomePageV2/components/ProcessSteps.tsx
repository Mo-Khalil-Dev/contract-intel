import styles from './ProcessSteps.module.css';

interface Step {
  n: string;
  label: string;
  desc: string;
  who: string;
}

const STEPS: Step[] = [
  {
    n: '01',
    label: 'Upload',
    desc: 'Drop in any vendor, licence or partnership contract — PDF or DOCX.',
    who: 'Anyone in Legal Ops',
  },
  {
    n: '02',
    label: 'AI review',
    desc: 'ContractIntel scans every clause against the Northwind playbook.',
    who: 'Automated · ~60 seconds',
  },
  {
    n: '03',
    label: 'Reviewer sign-off',
    desc: 'A reviewer confirms risk flags and adds notes for the business owner.',
    who: 'Reviewer / Senior Counsel',
  },
  {
    n: '04',
    label: 'Approve & file',
    desc: 'Approved contracts are filed to the register; renewals tracked automatically.',
    who: 'Head of Legal',
  },
];

interface ProcessStepsProps {
  onPolicyClick: () => void;
}

/**
 * Four-card horizontal step strip explaining the Legal Ops workflow.
 * The first step number is blue-filled to signal "you are here".
 */
export function ProcessSteps({ onPolicyClick }: ProcessStepsProps) {
  return (
    <div className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.headerRow}>
          <div>
            <div className={styles.eyebrow}>The Northwind process</div>
            <h2 className={styles.h2}>How contracts move through Legal Ops</h2>
            <p className={styles.lede}>
              All third-party contracts above £25k must be run through ContractIntel before
              signature. The platform applies our internal playbook, then routes the review to the
              right reviewer.
            </p>
          </div>
          <a
            href="#"
            className={styles.link}
            onClick={(e) => {
              e.preventDefault();
              onPolicyClick();
            }}
          >
            Read the full Legal Ops policy →
          </a>
        </div>

        <div className={styles.grid}>
          {STEPS.map((s, i) => (
            <div key={s.n} className={styles.step}>
              {i < STEPS.length - 1 && <div className={styles.connector} />}
              <div className={styles.stepHeader}>
                <div
                  className={`${styles.stepNum} ${i === 0 ? styles.stepNumActive : styles.stepNumIdle}`}
                >
                  {s.n}
                </div>
                <div className={styles.stepLabel}>{s.label}</div>
              </div>
              <div className={styles.stepDesc}>{s.desc}</div>
              <div className={styles.stepOwner}>
                <span className={styles.ownerLabel}>Owner:</span>
                {s.who}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
