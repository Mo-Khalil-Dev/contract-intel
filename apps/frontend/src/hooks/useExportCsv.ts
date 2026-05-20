import { useState, useCallback } from 'react';
import type { DocumentListFilters } from '@/lib/documentListFilters/defaults';
import { documentListService } from '@/services/documentListService';
import { buildContractsCsv } from '@/lib/csvBuilder';

const MAX_EXPORT_ROWS = 5000;

function triggerDownload(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function useExportCsv(filters: DocumentListFilters, total: number) {
  const [isExporting, setIsExporting] = useState(false);

  const exportCsv = useCallback(async () => {
    if (isExporting || total === 0) return;
    setIsExporting(true);
    try {
      const pageSize = Math.min(total, MAX_EXPORT_ROWS);
      const data = await documentListService.getDocumentList({ ...filters, page: 1, pageSize });
      const csv = buildContractsCsv(data.items);
      const date = new Date().toISOString().substring(0, 10);
      triggerDownload(csv, `contracts-${date}.csv`);
    } finally {
      setIsExporting(false);
    }
  }, [filters, total, isExporting]);

  return { exportCsv, isExporting };
}
