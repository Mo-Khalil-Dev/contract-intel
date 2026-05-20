export type RiskFilter = 'all' | 'high' | 'medium' | 'low';
export type TypeFilter =
  | 'all'
  | 'vendor'
  | 'license'
  | 'partnership'
  | 'customer'
  | 'lease'
  | 'nda'
  | 'other';
export type SortFilter = 'risk' | 'date' | 'name';
export type LayoutVariant = 'table' | 'cards' | 'minimal';

export interface DocumentListFilters {
  q: string;
  risk: RiskFilter;
  type: TypeFilter;
  sort: SortFilter;
  page: number;
  pageSize: number;
  layout: LayoutVariant;
}

export const DEFAULTS: DocumentListFilters = {
  q: '',
  risk: 'all',
  type: 'all',
  sort: 'risk',
  page: 1,
  pageSize: 8,
  layout: 'table',
};

export const RISK_VALUES: RiskFilter[] = ['all', 'high', 'medium', 'low'];
export const TYPE_VALUES: TypeFilter[] = [
  'all', 'vendor', 'license', 'partnership', 'customer', 'lease', 'nda', 'other',
];
export const SORT_VALUES: SortFilter[] = ['risk', 'date', 'name'];
export const LAYOUT_VALUES: LayoutVariant[] = ['table', 'cards', 'minimal'];
