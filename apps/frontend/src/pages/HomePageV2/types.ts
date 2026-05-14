/**
 * HomePageV2 re-exports the project's shared dashboard types so the
 * page is decoupled from the import path of the real types.
 *
 * If the central DashboardViewModel moves, only this file changes.
 */

export type {
  DashboardViewModel,
  DashboardKpis,
  RecentContractItem,
  UrgentRenewalItem,
} from '@/types/referenceData';
