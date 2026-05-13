export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta: PaginationMeta | null;
}

export interface PaginatedPayload<T> {
  data: T[];
  meta: PaginationMeta;
}

export function isPaginatedPayload<T>(value: unknown): value is PaginatedPayload<T> {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<PaginatedPayload<T>>;
  return (
    Array.isArray(candidate.data) &&
    typeof candidate.meta === 'object' &&
    candidate.meta !== null &&
    typeof candidate.meta.total === 'number' &&
    typeof candidate.meta.page === 'number' &&
    typeof candidate.meta.pageSize === 'number' &&
    typeof candidate.meta.totalPages === 'number'
  );
}

export function buildPaginationMeta(total: number, page: number, pageSize: number): PaginationMeta {
  if (pageSize <= 0) {
    throw new Error('pageSize must be greater than 0');
  }
  if (page < 1) {
    throw new Error('page must be 1 or greater');
  }
  if (total < 0) {
    throw new Error('total cannot be negative');
  }

  return {
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
