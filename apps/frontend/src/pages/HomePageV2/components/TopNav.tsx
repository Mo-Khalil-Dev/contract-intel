import { Button } from './Button';
import styles from './TopNav.module.css';

interface NavLink {
  id: string;
  label: string;
}

const LINKS: NavLink[] = [
  { id: 'home', label: 'Home' },
  { id: 'portfolio', label: 'Contracts' },
  { id: 'playbook', label: 'Playbook' },
  { id: 'compare', label: 'Compare' },
  { id: 'renewals', label: 'Renewals' },
  { id: 'settings', label: 'Settings' },
];

interface TopNavProps {
  active: string;
  userInitials: string;
  onNav: (id: string) => void;
}

/**
 * Top navigation bar — dark slate background, white logo + brand,
 * pill-style active nav link, "+ Upload" CTA, circular avatar.
 *
 * Pixel values copied from wirframes/project/ci-redesign/components.jsx
 * (the TopNav component).
 */
export function TopNav({ active, userInitials, onNav }: TopNavProps) {
  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <div className={styles.logoWrap} onClick={() => onNav('home')}>
          <div className={styles.logoBox}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 2h7l3 3v9H3V2z"
                stroke="#fff"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M10 2v3h3"
                stroke="#fff"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M5 8h6M5 11h4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className={styles.brand}>ContractIntel</span>
        </div>

        <div className={styles.links}>
          {LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => onNav(link.id)}
              className={`${styles.link} ${active === link.id ? styles.linkActive : ''}`}
            >
              {link.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        <div className={styles.right}>
          <Button size="sm" onClick={() => onNav('upload')}>
            + Upload
          </Button>
          <div className={styles.avatar}>{userInitials}</div>
        </div>
      </div>
    </nav>
  );
}
