import { sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export interface RLSContext {
  userId?: string;
  tenantId?: string;
  role?: string;
}

/**
 * Injects RLS context variables into the current transaction.
 * Ensures subsequent queries in this session are scoped to the tenant.
 */
export const setRLSContext = (context: RLSContext): SQL => {
  const settings: SQL[] = [];

  if (context.userId) {
    settings.push(sql`SET LOCAL app.current_user = ${context.userId}`);
  }

  if (context.tenantId) {
    settings.push(sql`SET LOCAL app.current_tenant = ${context.tenantId}`);
  }

  if (context.role) {
    settings.push(sql`SET LOCAL app.user_role = ${context.role}`);
  }

  return settings.length > 0 ? sql.join(settings, sql`; `) : sql`SELECT 1`;
};

/**
 * Generates a Row Level Security policy for tenant isolation.
 */
export const createTenantPolicy = (
  tableName: string,
  policyName: string,
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' = 'SELECT',
  tenantColumn = 'tenant_id'
): SQL => {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) throw new Error(`Invalid table: ${tableName}`);
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(policyName)) throw new Error(`Invalid policy: ${policyName}`);

  return sql.raw(`
    CREATE POLICY ${policyName} ON ${tableName}
      FOR ${operation}
      TO authenticated_user
      USING (${tenantColumn} = current_setting('app.current_tenant', true)::uuid);
  `);
};

/**
 * database-level role enforcement.
 */
export const roleFilter = (allowedRoles: string[]): SQL => {
  const validRoles = ['owner', 'admin', 'member', 'viewer'];
  if (allowedRoles.some(r => !validRoles.includes(r))) {
    throw new Error(`Invalid roles provided`);
  }

  return sql`current_setting('app.user_role', true) = ANY(${allowedRoles})`;
};