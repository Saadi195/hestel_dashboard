/**
 * Base repository interface.
 *
 * All repositories in the application should implement this interface
 * or extend it with resource-specific methods.
 *
 * This lives in infrastructure/ because it deals with data access concerns.
 */

export interface BaseRepository<T, TCreate, TUpdate> {
  getById(id: string): Promise<T | null>;
  getAll(): Promise<T[]>;
  create(data: TCreate): Promise<T>;
  update(id: string, data: TUpdate): Promise<T>;
  delete(id: string): Promise<void>;
}

/**
 * Paginated result wrapper.
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
}
