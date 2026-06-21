import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { TopNav } from '@/pages/HomePageV2/components/TopNav';
import { useAskPortfolio } from '@/hooks/useAskPortfolio';
import { AnswerCard } from './components/AnswerCard';
import styles from './AskPage.module.css';

function greeting(now: Date): string {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Ask Your Portfolio page (Phase 12, Task 12.7 / US-AP-1).
 *
 * A hero greeting + single ask box, with answer cards accumulating below
 * (newest on top). The hero collapses once the first answer is asked.
 * `⌘K` focuses the ask box from anywhere on this page — page-scoped, per
 * the design decision (the global ⌘K search overlay is unrelated).
 */
export function AskPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cards, ask, dismiss, isAsking } = useAskPortfolio();
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const hasAsked = cards.length > 0;
  const firstName = useMemo(() => {
    const src = user?.name?.trim() || user?.email || '';
    return src.split(/[\s@]+/)[0] || 'there';
  }, [user]);

  // Page-scoped ⌘K (and Ctrl+K) focuses the ask box.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function submit() {
    const trimmed = value.trim();
    if (trimmed.length === 0) return;
    ask(trimmed);
    setValue('');
  }

  const userInitials = useMemo(() => {
    const src = user?.name?.trim() || user?.email || 'U';
    const parts = src.split(/\s+/).slice(0, 2);
    return (parts.map((p) => p[0] ?? '').join('').toUpperCase() || 'U').slice(0, 2);
  }, [user]);

  function handleNav(id: string) {
    switch (id) {
      case 'home': navigate('/v2'); break;
      case 'portfolio': navigate('/contracts'); break;
      case 'ask': navigate('/ask'); break;
      case 'upload': navigate('/upload'); break;
      default: break;
    }
  }

  return (
    <div className={styles.shell}>
      <TopNav active="ask" userInitials={userInitials} onNav={handleNav} />

      <div className={styles.scroll}>
        <div className={styles.inner}>
          <div className={`${styles.hero} ${hasAsked ? styles.heroShrunk : ''}`}>
            <p className={styles.greet}>
              {greeting(new Date())}, {firstName}
            </p>
            <h1 className={styles.headline}>
              What do you want to know about your portfolio?
            </h1>
          </div>

          <div className={styles.askWrap}>
            <div className={styles.askBox}>
              <span className={styles.spark} aria-hidden>
                ✦
              </span>
              <input
                ref={inputRef}
                className={styles.input}
                placeholder="Which contracts have unlimited liability?"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submit();
                }}
                aria-label="Ask a question about your portfolio"
              />
              <kbd className={styles.kbd}>⌘K</kbd>
              <button
                type="button"
                className={styles.askBtn}
                onClick={submit}
                disabled={value.trim().length === 0 || isAsking}
              >
                Ask
              </button>
            </div>
          </div>

          <div className={styles.stack}>
            {cards.map((card) => (
              <AnswerCard
                key={card.localId}
                card={card}
                onDismiss={dismiss}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
