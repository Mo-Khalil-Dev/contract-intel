import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import styles from './HowItWorksSection.module.css';

const steps = [
  {
    number: '01',
    title: 'Upload',
    description: 'Drag and drop your contract or select from your computer.',
    who: 'Anyone on your team',
  },
  {
    number: '02',
    title: 'Review',
    description: 'Our AI extracts key terms, risks, and obligations.',
    who: 'Lawyers & ops teams',
  },
  {
    number: '03',
    title: 'Flag',
    description: 'Critical issues are highlighted with context.',
    who: 'Legal reviewers',
  },
  {
    number: '04',
    title: 'Decide',
    description: 'Make informed decisions backed by clear intelligence.',
    who: 'Negotiators & executives',
  },
];

export function HowItWorksSection() {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>How it works</h2>
      <div className={styles.grid}>
        {steps.map((step) => (
          <Card key={step.number}>
            <CardHeader>
              <div className={styles.stepNumber}>{step.number}</div>
              <CardTitle className={styles.stepTitle}>{step.title}</CardTitle>
            </CardHeader>
            <CardContent className={styles.stepContent}>
              <p className={styles.description}>{step.description}</p>
              <p className={styles.who}>{step.who}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
