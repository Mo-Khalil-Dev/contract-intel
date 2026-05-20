import {
  DEFAULTS,
  LAYOUT_VALUES,
  RISK_VALUES,
  SORT_VALUES,
  TYPE_VALUES,
  type DocumentListFilters,
  type LayoutVariant,
  type RiskFilter,
  type SortFilter,
  type TypeFilter,
} from './defaults';

export function parse(params: URLSearchParams): DocumentListFilters {
  const rawRisk = params.get('risk') ?? '';
  const rawType = params.get('type') ?? '';
  const rawSort = params.get('sort') ?? '';
  const rawLayout = params.get('layout') ?? '';
  const rawPage = parseInt(params.get('page') ?? '', 10);
  const rawPageSize = parseInt(params.get('pageSize') ?? '', 10);

  return {
    q: params.get('q') ?? DEFAULTS.q,
    risk: (RISK_VALUES as string[]).includes(rawRisk) ? (rawRisk as RiskFilter) : DEFAULTS.risk,
    type: (TYPE_VALUES as string[]).includes(rawType) ? (rawType as TypeFilter) : DEFAULTS.type,
    sort: (SORT_VALUES as string[]).includes(rawSort) ? (rawSort as SortFilter) : DEFAULTS.sort,
    layout: (LAYOUT_VALUES as string[]).includes(rawLayout) ? (rawLayout as LayoutVariant) : DEFAULTS.layout,
    page: Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : DEFAULTS.page,
    pageSize:
      Number.isFinite(rawPageSize) && rawPageSize >= 1 && rawPageSize <= 50
        ? rawPageSize
        : DEFAULTS.pageSize,
  };
}
