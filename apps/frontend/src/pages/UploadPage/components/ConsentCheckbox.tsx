import { useId } from 'react';
import styles from './ConsentCheckbox.module.css';

interface ConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function ConsentCheckbox({ checked, onChange, disabled = false }: ConsentCheckboxProps) {
  const id = useId();
  return (
    <label className={styles.label} htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className={styles.checkbox}
      />
      <span className={styles.text}>
        I understand that ContractIntel uses Claude AI to analyse these documents. Files are
        encrypted in transit and stored securely.{' '}
        <a
          href="/privacy"
          className={styles.link}
          onClick={(e) => e.stopPropagation()}
          target="_blank"
          rel="noopener noreferrer"
        >
          Privacy policy →
        </a>
      </span>
    </label>
  );
}
