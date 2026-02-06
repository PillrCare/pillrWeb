import { createAdminClient } from './supabase/admin';

export type AuditAction = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';

export interface AuditLogParams {
  user_id: string | null;
  action: AuditAction;
  table_name: string;
  record_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  request_path?: string | null;
  request_method?: string | null;
  error_message?: string | null;
}

/**
 * Log an audit event for HIPAA compliance.
 * Uses admin client to bypass RLS and ensure audit logs cannot be tampered with.
 * 
 * This function never throws - audit logging failures should not break the application.
 * If the service role key is missing, logging is silently skipped.
 */
export async function logAuditEvent(params: AuditLogParams): Promise<void> {
  try {
    const adminClient = createAdminClient();
    
    // Silently skip logging if admin client cannot be created (missing secret key)
    if (!adminClient) {
      return;
    }
    
    const { error } = await adminClient
      .from('audit_log')
      .insert({
        user_id: params.user_id,
        action: params.action,
        table_name: params.table_name,
        record_id: params.record_id || null,
        ip_address: params.ip_address || null,
        user_agent: params.user_agent || null,
        request_path: params.request_path || null,
        request_method: params.request_method || null,
        error_message: params.error_message || null,
      });

    if (error) {
      console.error('[Audit Log] Failed to write audit log:', error);
    }
  } catch (error) {
    console.error('[Audit Log] Error in audit logging:', error);
  }
}

/**
 * Extract IP address from Next.js request headers
 */
export function getIpAddress(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  return null;
}

/**
 * Extract user agent from request headers
 */
export function getUserAgent(request: Request): string | null {
  return request.headers.get('user-agent');
}

/**
 * Log audit event for server components (no Request object available).
 * Use this in Server Components where you don't have access to Request headers.
 * 
 * @param user_id - The user ID accessing the data
 * @param action - The database action (SELECT, INSERT, UPDATE, DELETE)
 * @param table_name - The table being accessed
 * @param record_id - Optional record ID
 * @param error_message - Optional error message if the operation failed
 */
export async function logServerComponentAccess(
  user_id: string | null,
  action: AuditAction,
  table_name: string,
  record_id?: string | null,
  error_message?: string | null
): Promise<void> {
  await logAuditEvent({
    user_id,
    action,
    table_name,
    record_id: record_id || null,
    ip_address: null, // Not available in server components
    user_agent: null, // Not available in server components
    request_path: null, // Not available in server components
    request_method: null, // Not available in server components
    error_message: error_message || null,
  });
}

/**
 * Extract record ID(s) from query result.
 * Handles arrays, single objects, and nested data structures.
 */
function extractRecordIds(data: any): string | null {
  if (!data) return null;
  
  // Handle arrays
  if (Array.isArray(data)) {
    if (data.length === 0) return null;
    // For arrays, return comma-separated IDs (limit to first 10 to avoid huge strings)
    const ids = data
      .slice(0, 10)
      .map((item) => item?.id || item?.patient_id || item?.user_id || null)
      .filter((id): id is string => id !== null);
    return ids.length > 0 ? ids.join(',') : null;
  }
  
  // Handle single object
  if (typeof data === 'object') {
    return data.id || data.patient_id || data.user_id || null;
  }
  
  return null;
}

/**
 * Log a database query result for HIPAA compliance.
 * Use this after executing Supabase queries in server components.
 * 
 * @param user_id - The user ID making the query
 * @param action - The database action (SELECT, INSERT, UPDATE, DELETE)
 * @param table_name - The table being accessed
 * @param result - The query result object from Supabase (with data and error properties)
 * @param options - Optional configuration
 */
export async function logQueryResult<T>(
  user_id: string | null,
  action: AuditAction,
  table_name: string,
  result: { data: T | null; error: any } | null,
  options?: {
    record_id?: string | null;
    skip_logging?: boolean;
  }
): Promise<void> {
  // Skip logging if explicitly disabled
  if (options?.skip_logging) return;
  
  // Extract error message
  const error_message = result?.error?.message || null;
  
  // Extract record ID(s) from result data, or use provided record_id
  const record_id = options?.record_id || (result?.data ? extractRecordIds(result.data) : null);
  
  await logServerComponentAccess(
    user_id,
    action,
    table_name,
    record_id,
    error_message
  );
}

/**
 * Convenience function to log SELECT queries.
 * Use this after SELECT queries in server components.
 * 
 * @example
 * const { data, error } = await supabase.from('profiles').select('*');
 * await logSelectQuery(userId, 'profiles', { data, error });
 */
export async function logSelectQuery<T>(
  user_id: string | null,
  table_name: string,
  result: { data: T | null; error: any } | null,
  options?: { record_id?: string | null; skip_logging?: boolean }
): Promise<void> {
  await logQueryResult(user_id, 'SELECT', table_name, result, options);
}
