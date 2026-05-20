import { useEffect, useCallback } from 'react';

interface UseAuditEventDetailProps {
  onClose: () => void;
}

export function useAuditEventDetail({ onClose }: UseAuditEventDetailProps) {
  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  function formatTimestamp(iso: string): string {
    try {
      return new Date(iso).toLocaleString(undefined, {
        dateStyle: 'long',
        timeStyle: 'medium',
      });
    } catch {
      return iso;
    }
  }

  function formatMetadata(metadata: Record<string, unknown> | null | undefined): string {
    if (!metadata) return '—';
    try {
      return JSON.stringify(metadata, null, 2);
    } catch {
      return String(metadata);
    }
  }

  return { handleOverlayClick, formatTimestamp, formatMetadata };
}
