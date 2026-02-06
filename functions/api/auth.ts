/**
 * Authentication API Endpoints
 * 
 * Handles user registration, login, logout, 2FA, and token refresh
 */

import { PasswordService, TOTPService } from '../lib/encryption';
import { JWTService, SessionService, AuditService, getClientIP, getUserAgent, generateId } from '../lib/auth';

interface Env {
  DB: D1Database;
  SESSIONS: KVNamespace;
  JWT_SECRET: string;
  TOTP_SECRET: string;
}

/**
 * POST /api/auth/register
 * Register a new user account
 */
export async function handleRegister(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as any;
    const { email, password, firstName, lastName, phone, role = 'client' } = body;

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters long' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user already exists
    const existingUser = await env.DB.prepare('SELECT id FROM users WHERE email = ?')
      .bind(email)
      .first();

    if (existingUser) {
      return new Response(JSON.stringify({ error: 'User already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Hash password
    const passwordHash = await PasswordService.hash(password);

    // Create user
    const userId = generateId('user');
    const verificationToken = generateId('verify');

    await env.DB.prepare(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, status, email_verification_token)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
    )
      .bind(userId, email, passwordHash, firstName, lastName, phone || null, role, verificationToken)
      .run();

    // Log audit event
    await AuditService.log(
      env.DB,
      userId,
      'user.register',
      'user',
      userId,
      { email, role },
      getClientIP(request),
      getUserAgent(request),
      'info'
    );

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        message: 'User registered successfully. Please verify your email.',
        verificationToken, // In production, send this via email instead
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * POST /api/auth/login
 * User login
 */
export async function handleLogin(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as any;
    const { email, password, mfaCode } = body;

    // Validate input
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Missing email or password' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user (including temp password fields)
    const user = await env.DB.prepare(
      'SELECT id, email, password_hash, role, first_name, last_name, status, mfa_enabled, mfa_secret, temp_password, must_change_password, employee_id FROM users WHERE email = ?'
    )
      .bind(email)
      .first() as any;

    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'Account is not active. Please contact support.' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify password
    const isValidPassword = await PasswordService.verify(password, user.password_hash);

    if (!isValidPassword) {
      // Log failed login attempt
      await AuditService.log(
        env.DB,
        user.id,
        'user.login_failed',
        'user',
        user.id,
        { email, reason: 'invalid_password' },
        getClientIP(request),
        getUserAgent(request),
        'warning'
      );

      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check MFA if enabled
    if (user.mfa_enabled === 1) {
      if (!mfaCode) {
        return new Response(
          JSON.stringify({
            mfa_required: true,
            message: 'MFA code required',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Verify MFA code
      const isValidMFA = await TOTPService.verifyCode(mfaCode, user.mfa_secret);

      if (!isValidMFA) {
        await AuditService.log(
          env.DB,
          user.id,
          'user.login_failed',
          'user',
          user.id,
          { email, reason: 'invalid_mfa' },
          getClientIP(request),
          getUserAgent(request),
          'warning'
        );

        return new Response(JSON.stringify({ error: 'Invalid MFA code' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Create session
    const sessionId = await SessionService.createSession(
      env.DB,
      user.id,
      'temp', // Will be replaced with actual token
      getClientIP(request),
      getUserAgent(request),
      86400 // 24 hours
    );

    // Generate JWT token
    const token = await JWTService.generateToken(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        mfa_enabled: user.mfa_enabled,
      },
      sessionId,
      env.JWT_SECRET
    );

    // Update session with token
    await env.DB.prepare('UPDATE sessions SET token = ? WHERE id = ?')
      .bind(token, sessionId)
      .run();

    // Update last login
    await env.DB.prepare('UPDATE users SET last_login_at = datetime("now") WHERE id = ?')
      .bind(user.id)
      .run();

    // Log successful login
    await AuditService.log(
      env.DB,
      user.id,
      'user.login',
      'user',
      user.id,
      { email },
      getClientIP(request),
      getUserAgent(request),
      'info'
    );

    // Log employee activity if employee
    if (user.employee_id) {
      await env.DB.prepare(`
        INSERT INTO employee_activity_log (id, user_id, employee_id, activity_type, description, ip_address, user_agent)
        VALUES (?, ?, ?, 'login_success', 'Employee logged in successfully', ?, ?)
      `).bind(
        generateId('log'),
        user.id,
        user.employee_id,
        getClientIP(request),
        getUserAgent(request)
      ).run();

      // Update login attempts counter
      await env.DB.prepare('UPDATE employee_credentials SET login_attempts = 0, last_login_attempt = datetime("now") WHERE user_id = ?')
        .bind(user.id)
        .run();
    }

    return new Response(
      JSON.stringify({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          employeeId: user.employee_id,
        },
        tempPassword: user.temp_password === 1,
        mustChangePassword: user.must_change_password === 1,
        requiresPasswordChange: user.temp_password === 1 || user.must_change_password === 1
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * POST /api/auth/logout
 * User logout
 */
export async function handleLogout(request: Request, env: Env): Promise<Response> {
  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.substring(7);
    const payload = await JWTService.verifyToken(token, env.JWT_SECRET);

    if (!payload) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete session
    await SessionService.deleteSession(env.DB, payload.sessionId);

    // Log logout
    await AuditService.log(
      env.DB,
      payload.userId,
      'user.logout',
      'user',
      payload.userId,
      {},
      getClientIP(request),
      getUserAgent(request),
      'info'
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Logged out successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * POST /api/auth/mfa/setup
 * Setup 2FA for user
 */
export async function handleMFASetup(request: Request, env: Env): Promise<Response> {
  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.substring(7);
    const payload = await JWTService.verifyToken(token, env.JWT_SECRET);

    if (!payload) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate TOTP secret
    const secret = TOTPService.generateSecret();

    // Store secret in database
    await env.DB.prepare('UPDATE users SET mfa_secret = ? WHERE id = ?')
      .bind(secret, payload.userId)
      .run();

    // Generate QR code URL for authenticator apps
    const qrUrl = `otpauth://totp/RossTax:${payload.email}?secret=${secret}&issuer=RossTax`;

    // Log MFA setup
    await AuditService.log(
      env.DB,
      payload.userId,
      'user.mfa_setup',
      'user',
      payload.userId,
      {},
      getClientIP(request),
      getUserAgent(request),
      'info'
    );

    return new Response(
      JSON.stringify({
        success: true,
        secret,
        qrUrl,
        message: 'Scan the QR code with your authenticator app',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * POST /api/auth/mfa/verify
 * Verify and enable 2FA
 */
export async function handleMFAVerify(request: Request, env: Env): Promise<Response> {
  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.substring(7);
    const payload = await JWTService.verifyToken(token, env.JWT_SECRET);

    if (!payload) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json() as any;
    const { code } = body;

    if (!code) {
      return new Response(JSON.stringify({ error: 'MFA code required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user's MFA secret
    const user = await env.DB.prepare('SELECT mfa_secret FROM users WHERE id = ?')
      .bind(payload.userId)
      .first() as any;

    if (!user || !user.mfa_secret) {
      return new Response(JSON.stringify({ error: 'MFA not set up' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify code
    const isValid = await TOTPService.verifyCode(code, user.mfa_secret);

    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid MFA code' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Enable MFA
    await env.DB.prepare('UPDATE users SET mfa_enabled = 1 WHERE id = ?')
      .bind(payload.userId)
      .run();

    // Log MFA enabled
    await AuditService.log(
      env.DB,
      payload.userId,
      'user.mfa_enabled',
      'user',
      payload.userId,
      {},
      getClientIP(request),
      getUserAgent(request),
      'info'
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: '2FA enabled successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * POST /api/auth/mfa/disable
 * Disable 2FA
 */
export async function handleMFADisable(request: Request, env: Env): Promise<Response> {
  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.substring(7);
    const payload = await JWTService.verifyToken(token, env.JWT_SECRET);

    if (!payload) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json() as any;
    const { password } = body;

    if (!password) {
      return new Response(JSON.stringify({ error: 'Password required to disable 2FA' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify password
    const user = await env.DB.prepare('SELECT password_hash FROM users WHERE id = ?')
      .bind(payload.userId)
      .first() as any;

    const isValidPassword = await PasswordService.verify(password, user.password_hash);

    if (!isValidPassword) {
      return new Response(JSON.stringify({ error: 'Invalid password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Disable MFA
    await env.DB.prepare('UPDATE users SET mfa_enabled = 0, mfa_secret = NULL WHERE id = ?')
      .bind(payload.userId)
      .run();

    // Log MFA disabled
    await AuditService.log(
      env.DB,
      payload.userId,
      'user.mfa_disabled',
      'user',
      payload.userId,
      {},
      getClientIP(request),
      getUserAgent(request),
      'warning'
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: '2FA disabled successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * POST /api/auth/change-password
 * Change user password (required for temp passwords)
 */
export async function handleChangePassword(request: Request, env: Env): Promise<Response> {
  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.substring(7);
    const payload = await JWTService.verifyToken(token, env.JWT_SECRET);

    if (!payload) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json() as any;
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return new Response(
        JSON.stringify({ error: 'New password must be at least 8 characters long' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get user with current password
    const user = await env.DB.prepare(
      'SELECT id, email, password_hash, employee_id FROM users WHERE id = ?'
    )
      .bind(payload.userId)
      .first() as any;

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify current password
    const isValidPassword = await PasswordService.verify(currentPassword, user.password_hash);

    if (!isValidPassword) {
      return new Response(JSON.stringify({ error: 'Current password is incorrect' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Hash new password
    const newPasswordHash = await PasswordService.hash(newPassword);

    // Update password and clear temp password flags
    await env.DB.prepare(
      `UPDATE users 
       SET password_hash = ?, 
           temp_password = 0, 
           must_change_password = 0,
           password_changed_at = datetime('now'),
           updated_at = datetime('now')
       WHERE id = ?`
    )
      .bind(newPasswordHash, user.id)
      .run();

    // Log password change
    await AuditService.log(
      env.DB,
      user.id,
      'user.password_changed',
      'user',
      user.id,
      { email: user.email },
      getClientIP(request),
      getUserAgent(request),
      'info'
    );

    // Log employee activity if employee
    if (user.employee_id) {
      await env.DB.prepare(`
        INSERT INTO employee_activity_log (id, user_id, employee_id, activity_type, description, ip_address, user_agent)
        VALUES (?, ?, ?, 'password_changed', 'Employee changed password', ?, ?)
      `).bind(
        generateId('log'),
        user.id,
        user.employee_id,
        getClientIP(request),
        getUserAgent(request)
      ).run();
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Password changed successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
