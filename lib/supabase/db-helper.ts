export interface DynamicQueryResult<T = Record<string, unknown>> {
  data: T | null;
  error: unknown;
}

export interface DynamicQueryListResult<T = Record<string, unknown>> {
  data: T[] | null;
  error: unknown;
}

export interface DynamicTableClient {
  select(columns?: string): DynamicTableClient;
  insert(data: unknown): DynamicTableClient;
  update(data: unknown): DynamicTableClient;
  delete(): DynamicTableClient;
  eq(column: string, value: unknown): DynamicTableClient;
  order(column: string, options?: { ascending?: boolean }): DynamicTableClient;
  range(from: number, to: number): DynamicTableClient;
  maybeSingle(): Promise<DynamicQueryResult>;
  single(): Promise<DynamicQueryResult>;
  then<TResult = DynamicQueryListResult>(
    onfulfilled?: ((value: DynamicQueryListResult) => TResult | PromiseLike<TResult>) | null,
  ): Promise<TResult>;
}

/**
 * Returns a typed dynamic table client for Supabase tables
 * to prevent TypeScript 'never' parameter type inference on un-typed tables.
 */
export function getTable(supabase: unknown, tableName: string): DynamicTableClient {
  const client = supabase as { from: (table: string) => DynamicTableClient };
  return client.from(tableName);
}
