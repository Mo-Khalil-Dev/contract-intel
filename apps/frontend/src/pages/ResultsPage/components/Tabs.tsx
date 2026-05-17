import styles from './Tabs.module.css';

export interface TabDef<T extends string> {
  id: T;
  label: string;
  /** Optional count badge, e.g. "Risk Flags (8)" — we render the parentheses. */
  count?: number;
}

interface TabsProps<T extends string> {
  tabs: TabDef<T>[];
  active: T;
  onChange: (id: T) => void;
}

/**
 * Underlined-tab strip matching the v2 wireframe. Active tab gets a
 * blue underline + bold. Optional count badge surfaces a number next
 * to the label (Risk Flags (N)).
 */
export function Tabs<T extends string>({ tabs, active, onChange }: TabsProps<T>) {
  return (
    <div className={styles.bar} role="tablist" aria-label="Results sections">
      {tabs.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
            onClick={() => onChange(t.id)}
          >
            {t.label}
            {typeof t.count === 'number' && (
              <span className={styles.tabBadge}>({t.count})</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
