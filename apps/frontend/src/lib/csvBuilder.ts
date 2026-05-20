import type { DocumentListItem } from '@/types/contracts';

const HEADERS = [
  'Name', 'Type', 'Counterparty', 'Risk Score',
  'Red Flags', 'Orange Flags', 'Blue Flags',
  'Expiry', 'Uploaded', 'Status',
];

/** Wraps a value in double-quotes if it contains a comma, quote, or newline; doubles internal quotes. */
export function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Extracts YYYY-MM-DD from an ISO 8601 string, or returns '' for null/invalid. */
export function formatIsoDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.substring(0, 10);
}

/** Builds a RFC 4180 CSV string from an array of DocumentListItems. */
export function buildContractsCsv(items: DocumentListItem[]): string {
  const rows: string[] = [HEADERS.join(',')];

  for (const item of items) {
    const cells = [
      escapeCsvCell(item.name),
      escapeCsvCell(item.type),
      escapeCsvCell(item.counterparty ?? ''),
      item.riskScore !== null ? String(item.riskScore) : '',
      String(item.flagsRed),
      String(item.flagsOrange),
      String(item.flagsBlue),
      formatIsoDate(item.terminationDate),
      formatIsoDate(item.uploadedAt),
      escapeCsvCell(item.status),
    ];
    rows.push(cells.join(','));
  }

  return rows.join('\r\n');
}
