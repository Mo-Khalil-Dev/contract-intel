import { DEFAULTS, type DocumentListFilters } from './defaults';

/** Serialises filters to URLSearchParams, omitting keys that equal the default so the URL stays clean. */
export function serialize(filters: DocumentListFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.q !== DEFAULTS.q) params.set('q', filters.q);
  if (filters.risk !== DEFAULTS.risk) params.set('risk', filters.risk);
  if (filters.type !== DEFAULTS.type) params.set('type', filters.type);
  if (filters.sort !== DEFAULTS.sort) params.set('sort', filters.sort);
  if (filters.page !== DEFAULTS.page) params.set('page', String(filters.page));
  if (filters.pageSize !== DEFAULTS.pageSize) params.set('pageSize', String(filters.pageSize));

  return params;
}
