/**
 * Authentication and Authorization Utilities
 * 
 * JWT token management, session handling, and role-based access control
 */

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
  iat: number;
  exp: number;
}

interface User {
  id: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  mfa_enabled: number;
}

/**
 * JWT Service for token generation and verification
 */
export class JWTService {
  /**
   * Generate a JWT token for a user
   * @param user - User object
   * @param sessionId - Session ID
   * @param jwtSecret - JWT secret key
   * @param expiresIn - Token expiration in seconds (default: 24 hours)
   * @returns JWT token
   */
  static async generateToken(
    user: User,
    sessionId: string,
    jwtSecret: string,
    expiresIn: number = 86400
  ): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId,
      iat: now,
      exp: now + expiresIn,
    };

    return this.createJWT(payload, jwtSecret);
  }

  /**
   * Verify and decode a JWT token
   * @param token - JWT token
   * @param jwtSecret - JWT secret key
   * @returns Decoded payload or null if invalid
   */
  static async verifyToken(token: string, jwtSecret: string): Promise<JWTPayload | null> {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const [headerB64, payloadB64, signatureB64] = parts;

      // Verify signature
      const data = `${headerB64}.${payloadB64}`;
      const expectedSignature = await this.sign(data, jwtSecret);

      if (signatureB64 !== expectedSignature) {
        return null;
      }

      // Decode payload
      const payload = JSON.parse(atob(payloadB64)) as JWTPayload;

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        return null;
      }

      return payload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Create a JWT token
   */
  private static async createJWT(payload: JWTPayload, secret: string): Promise<string> {
    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };

    const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '');
    const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '');

    const data = `${headerB64}.${payloadB64}`;
    const signature = await this.sign(data, secret);

    return `${data}.${signature}`;
  }

  /**
   * Sign data with HMAC-SHA256
   */
  private static async sign(data: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
    return btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '');
  }
}

/**
 * Role-Based Access Control (RBAC) Service
 */
export class RBACService {
  /**
   * Check if a user has permission to perform an action
   * @param userRole - User's role
   * @param requiredPermission - Required permission
   * @param rolePermissions - Role permissions map
   * @returns True if user has permission
   */
  static hasPermission(
    userRole: string,
    requiredPermission: string,
    rolePermissions: Record<string, string[]>
  ): boolean {
    const permissions = rolePermissions[userRole] || [];

    // Admin has all permissions
    if (permissions.includes('*')) {
      return true;
    }

    // Check exact permission match
    if (permissions.includes(requiredPermission)) {
      return true;
    }

    // Check wildcard permissions (e.g., "returns.*" matches "returns.create")
    const parts = requiredPermission.split('.');
    for (let i = parts.length; i > 0; i--) {
      const wildcardPerm = parts.slice(0, i).join('.') + '.*';
      if (permissions.includes(wildcardPerm)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get default role permissions
   */
  static getDefaultRolePermissions(): Record<string, string[]> {
    return {
      admin: ['*'],
      ero: [
        'returns.create',
        'returns.read',
        'returns.update',
        'returns.submit',
        'clients.read',
        'clients.create',
        'documents.read',
        'documents.upload',
        'irs.transmit',
      ],
      client: ['returns.read', 'documents.upload', 'documents.read', 'notifications.read'],
      demo: ['returns.read', 'documents.read'],
    };
  }
}

/**
 * Session Management Service
 */
export class SessionService {
  /**
   * Create a new session
   * @param db - D1 Database
   * @param userId - User ID
   * @param token - JWT token
   * @param ipAddress - Client IP address
   * @param userAgent - Client user agent
   * @param expiresIn - Session expiration in seconds
   * @returns Session ID
   */
  static async createSession(
    db: D1Database,
    userId: string,
    token: string,
    ipAddress: string,
    userAgent: string,
    expiresIn: number = 86400
  ): Promise<string> {
    const sessionId = this.generateId('session');
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    await db
      .prepare(
        `INSERT INTO sessions (id, user_id, token, ip_address, user_agent, expires_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(sessionId, userId, token, ipAddress, userAgent, expiresAt)
      .run();

    return sessionId;
  }

  /**
   * Validate a session
   * @param db - D1 Database
   * @param sessionId - Session ID
   * @returns True if session is valid
   */
  static async validateSession(db: D1Database, sessionId: string): Promise<boolean> {
    const result = await db
      .prepare(
        `SELECT id FROM sessions 
         WHERE id = ? AND expires_at > datetime('now')`
      )
      .bind(sessionId)
      .first();

    return result !== null;
  }

  /**
   * Delete a session (logout)
   * @param db - D1 Database
   * @param sessionId - Session ID
   */
  static async deleteSession(db: D1Database, sessionId: string): Promise<void> {
    await db.prepare(`DELETE FROM sessions WHERE id = ?`).bind(sessionId).run();
  }

  /**
   * Clean up expired sessions
   * @param db - D1 Database
   */
  static async cleanupExpiredSessions(db: D1Database): Promise<void> {
    await db.prepare(`DELETE FROM sessions WHERE expires_at < datetime('now')`).run();
  }

  /**
   * Generate a unique ID
   */
  private static generateId(prefix: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `${prefix}_${timestamp}${random}`;
  }
}

/**
 * Audit Logging Service
 */
export class AuditService {
  /**
   * Log an audit event
   * @param db - D1 Database
   * @param userId - User ID (can be null)
   * @param action - Action performed
   * @param resourceType - Type of resource
   * @param resourceId - Resource ID (can be null)
   * @param details - Additional details
   * @param ipAddress - Client IP address
   * @param userAgent - Client user agent
   * @param severity - Log severity
   */
  static async log(
    db: D1Database,
    userId: string | null,
    action: string,
    resourceType: string,
    resourceId: string | null,
    details: Record<string, any>,
    ipAddress: string,
    userAgent: string,
    severity: 'info' | 'warning' | 'error' | 'critical' = 'info'
  ): Promise<void> {
    const id = this.generateId('audit');
    const detailsJson = JSON.stringify(details);

    await db
      .prepare(
        `INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, ip_address, user_agent, details, severity)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(id, userId, action, resourceType, resourceId, ipAddress, userAgent, detailsJson, severity)
      .run();
  }

  private static generateId(prefix: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `${prefix}_${timestamp}${random}`;
  }
}

/**
 * Helper function to generate unique IDs
 */
export function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `${prefix}_${timestamp}${random}`;
}

/**
 * Helper function to extract IP address from request
 */
export function getClientIP(request: Request): string {
  return request.headers.get('CF-Connecting-IP') || 
         request.headers.get('X-Forwarded-For')?.split(',')[0] || 
         'unknown';
}

/**
 * Helper function to get user agent
 */
export function getUserAgent(request: Request): string {
  return request.headers.get('User-Agent') || 'unknown';
}
