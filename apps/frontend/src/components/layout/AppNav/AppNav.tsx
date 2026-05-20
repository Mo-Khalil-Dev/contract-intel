import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import styles from './AppNav.module.css';

const LINKS = [
  { id: 'home',      label: 'Home',      href: '/' },
  { id: 'portfolio', label: 'Contracts', href: '/contracts' },
  { id: 'playbook',  label: 'Playbook',  href: null },
  { id: 'compare',   label: 'Compare',   href: null },
  { id: 'renewals',  label: 'Renewals',  href: null },
  { id: 'settings',  label: 'Settings',  href: null },
];

function activeId(pathname: string): string {
  if (pathname.startsWith('/contracts')) return 'portfolio';
  if (pathname === '/' || pathname === '/v2') return 'home';
  if (pathname.startsWith('/upload') || pathname.startsWith('/processing') || pathname.startsWith('/results')) return 'portfolio';
  return '';
}

export function AppNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const current = activeId(location.pathname);

  const initials = useMemo(() => {
    const src = user?.name?.trim() || user?.email || 'U';
    return src
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0] ?? '')
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  }, [user]);

  function handleNav(href: string | null) {
    setDrawerOpen(false);
    if (href) navigate(href);
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        {/* Logo */}
        <button className={styles.logo} onClick={() => handleNav('/')}>
          <div className={styles.logoBox}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 2h7l3 3v9H3V2z" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M10 2v3h3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 8h6M5 11h4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className={styles.brand}>ContractIntel</span>
        </button>

        {/* Nav links */}
        <div className={styles.links}>
          {LINKS.map((l) => (
            <button
              key={l.id}
              className={`${styles.link} ${current === l.id ? styles.linkActive : ''}`}
              onClick={() => handleNav(l.href)}
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className={styles.spacer} />

        {/* Right: Upload CTA + avatar */}
        <div className={styles.right}>
          <button className={styles.uploadBtn} onClick={() => handleNav('/upload')}>
            + Upload
          </button>
          <div
            className={styles.avatar}
            title={user?.name || user?.email}
            onClick={logout}
            role="button"
            aria-label="User menu"
          >
            {initials}
          </div>
          {/* Hamburger */}
          <button
            className={styles.hamburger}
            onClick={() => setDrawerOpen((o) => !o)}
            aria-label="Open menu"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              {drawerOpen
                ? <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                : <path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div className={`${styles.drawer} ${drawerOpen ? styles.drawerOpen : ''}`}>
        {LINKS.map((l) => (
          <button
            key={l.id}
            className={`${styles.drawerLink} ${current === l.id ? styles.drawerLinkActive : ''}`}
            onClick={() => handleNav(l.href)}
          >
            {l.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
