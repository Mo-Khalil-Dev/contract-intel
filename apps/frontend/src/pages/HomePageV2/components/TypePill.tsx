import type { RecentContractItem } from '../types';
import styles from './TypePill.module.css';

type ContractType = RecentContractItem['type'];

const TYPE_STYLES: Record<ContractType, { color: string; bg: string }> = {
  vendor: { color: '#475569', bg: '#F1F5F9' },
  license: { color: '#0369A1', bg: '#F0F9FF' },
  partnership: { color: '#0F766E', bg: '#F0FDFA' },
  customer: { color: '#B45309', bg: '#FFFBEB' },
  lease: { color: '#9F1239', bg: '#FFF1F2' },
  nda: { color: '#374151', bg: '#F9FAFB' },
};

/** Coloured contract-type chip — exactly matches the wireframe's <TypePill>. */
export function TypePill({ type }: { type: ContractType }) {
  const palette = TYPE_STYLES[type] ?? TYPE_STYLES.nda;
  return (
    <span className={styles.pill} style={{ color: palette.color, background: palette.bg }}>
      {type}
    </span>
  );
}
