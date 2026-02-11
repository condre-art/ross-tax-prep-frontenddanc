/**
 * Database Abstraction Layer
 * 
 * Provides a unified interface for both Cloudflare D1 and AWS RDS (via Hyperdrive)
 */

export interface DatabaseAdapter {
  query(sql: string, params?: any[]): Promise<QueryResult>;
  execute(sql: string, params?: any[]): Promise<ExecuteResult>;
  transaction<T>(callback: (adapter: DatabaseAdapter) => Promise<T>): Promise<T>;
}

export interface QueryResult {
  results: any[];
  success: boolean;
  meta?: any;
}

export interface ExecuteResult {
  success: boolean;
  meta?: any;
}

/**
 * D1 Database Adapter (Cloudflare D1)
 */
export class D1Adapter implements DatabaseAdapter {
  constructor(private db: D1Database) {}

  async query(sql: string, params: any[] = []): Promise<QueryResult> {
    try {
      const stmt = this.db.prepare(sql).bind(...params);
      const result = await stmt.all();
      return {
        results: result.results || [],
        success: result.success,
        meta: result.meta
      };
    } catch (error: any) {
      console.error('D1 query error:', error);
      throw new Error(`Database query failed: ${error.message}`);
    }
  }

  async execute(sql: string, params: any[] = []): Promise<ExecuteResult> {
    try {
      const stmt = this.db.prepare(sql).bind(...params);
      const result = await stmt.run();
      return {
        success: result.success,
        meta: result.meta
      };
    } catch (error: any) {
      console.error('D1 execute error:', error);
      throw new Error(`Database execute failed: ${error.message}`);
    }
  }

  async transaction<T>(callback: (adapter: DatabaseAdapter) => Promise<T>): Promise<T> {
    // D1 doesn't support transactions yet, execute directly
    return await callback(this);
  }
}

/**
 * RDS Database Adapter (PostgreSQL/MySQL via Hyperdrive)
 */
export class RDSAdapter implements DatabaseAdapter {
  constructor(private hyperdrive: any) {}

  async query(sql: string, params: any[] = []): Promise<QueryResult> {
    try {
      // Convert ? placeholders to $1, $2, etc. for PostgreSQL
      const pgSql = this.convertPlaceholders(sql);
      
      const conn = await this.hyperdrive.connect();
      try {
        const result = await conn.query(pgSql, params);
        return {
          results: result.rows || [],
          success: true,
          meta: { rowCount: result.rowCount }
        };
      } finally {
        conn.release();
      }
    } catch (error: any) {
      console.error('RDS query error:', error);
      throw new Error(`Database query failed: ${error.message}`);
    }
  }

  async execute(sql: string, params: any[] = []): Promise<ExecuteResult> {
    try {
      const pgSql = this.convertPlaceholders(sql);
      
      const conn = await this.hyperdrive.connect();
      try {
        const result = await conn.query(pgSql, params);
        return {
          success: true,
          meta: { rowCount: result.rowCount }
        };
      } finally {
        conn.release();
      }
    } catch (error: any) {
      console.error('RDS execute error:', error);
      throw new Error(`Database execute failed: ${error.message}`);
    }
  }

  async transaction<T>(callback: (adapter: DatabaseAdapter) => Promise<T>): Promise<T> {
    const conn = await this.hyperdrive.connect();
    try {
      await conn.query('BEGIN');
      const result = await callback(this);
      await conn.query('COMMIT');
      return result;
    } catch (error) {
      await conn.query('ROLLBACK');
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * Convert SQLite-style ? placeholders to PostgreSQL $1, $2, etc.
   */
  private convertPlaceholders(sql: string): string {
    let paramIndex = 1;
    return sql.replace(/\?/g, () => `$${paramIndex++}`);
  }
}

/**
 * Create appropriate database adapter based on environment
 */
export function createDatabaseAdapter(env: any): DatabaseAdapter {
  // Check if Hyperdrive binding is available (AWS RDS)
  if (env.HYPERDRIVE) {
    console.log('Using AWS RDS via Hyperdrive');
    return new RDSAdapter(env.HYPERDRIVE);
  }
  
  // Check if D1 binding is available (Cloudflare D1)
  if (env.DB) {
    console.log('Using Cloudflare D1');
    return new D1Adapter(env.DB);
  }
  
  throw new Error('No database binding found. Configure either D1 or Hyperdrive.');
}

/**
 * Helper function to safely get first result
 */
export async function queryFirst(
  adapter: DatabaseAdapter,
  sql: string,
  params?: any[]
): Promise<any | null> {
  const result = await adapter.query(sql, params);
  return result.results[0] || null;
}

/**
 * Helper function for INSERT and return ID
 */
export async function insert(
  adapter: DatabaseAdapter,
  table: string,
  data: Record<string, any>
): Promise<string> {
  const columns = Object.keys(data);
  const values = Object.values(data);
  const placeholders = columns.map((_, i) => '?').join(', ');
  
  const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING id`;
  const result = await adapter.query(sql, values);
  
  return result.results[0]?.id;
}

/**
 * Helper function for UPDATE
 */
export async function update(
  adapter: DatabaseAdapter,
  table: string,
  id: string,
  data: Record<string, any>
): Promise<void> {
  const columns = Object.keys(data);
  const values = Object.values(data);
  const setClause = columns.map(col => `${col} = ?`).join(', ');
  
  const sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
  await adapter.execute(sql, [...values, id]);
}

/**
 * Migration helper - detect database type
 */
export function getDatabaseType(env: any): 'd1' | 'rds' | 'unknown' {
  if (env.HYPERDRIVE) return 'rds';
  if (env.DB) return 'd1';
  return 'unknown';
}
