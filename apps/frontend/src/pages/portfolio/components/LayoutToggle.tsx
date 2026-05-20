import type { LayoutVariant } from '@/lib/documentListFilters/defaults';
import styles from './LayoutToggle.module.css';

interface LayoutToggleProps {
  value: LayoutVariant;
  onChange: (v: LayoutVariant) => void;
}

const OPTIONS: { value: LayoutVariant; label: string; icon: string }[] = [
  { value: 'table',   label: 'Table',   icon: '⊞' },
  { value: 'cards',   label: 'Cards',   icon: '⊟' },
  { value: 'minimal', label: 'Minimal', icon: '☰' },
];

export function LayoutToggle({ value, onChange }: LayoutToggleProps) {
  return (
    <div className={styles.wrap} role="group" aria-label="Layout variant">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          className={`${styles.btn} ${value === opt.value ? styles.btnActive : ''}`}
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          aria-label={`${opt.label} layout`}
        >
          <span aria-hidden="true">{opt.icon}</span>
          {opt.label}
        </button>
      ))}
    </div>
  );
}
