/**
 * Cloudflare Functions Middleware
 * 
 * Routes API requests and handles authentication/authorization
 */

import { JWTService, RBACService, AuditService, getClientIP, getUserAgent } from './lib/auth';
import {
  handleRegister,
  handleLogin,
  handleLogout,
  handleMFASetup,
  handleMFAVerify,
  handleMFADisable,
} from './api/auth';
import {
  createWorkflow,
  getWorkflow,
  listWorkflows,
  transitionWorkflow,
  getWorkflowTasks,
  completeTask,
  createTask,
  listTasks,
} from './api/workflows';
import {
  listProviders,
  submitEFile,
  listSubmissions,
  getSubmission,
} from './api/efile';

interface Env {
  DB: D1Database;
  SESSIONS: KVNamespace;
  CACHE: KVNamespace;
  TAX_DOCUMENTS: R2Bucket;
  CLIENT_UPLOADS: R2Bucket;
  IRS_SUBMISSIONS: R2Bucket;
  JWT_SECRET: string;
  ENCRYPTION_KEY: string;
  TOTP_SECRET: string;
}

/**
 * Main request handler
 */
export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle OPTIONS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Route API requests
    if (url.pathname.startsWith('/api/')) {
      const response = await handleApiRequest(request, env, url);
      
      // Add CORS headers to response
      const headers = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }

    // Pass through to static assets
    return context.next();
  } catch (error: any) {
    console.error('Middleware error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
};

/**
 * Handle API requests
 */
async function handleApiRequest(
  request: Request,
  env: Env,
  url: URL
): Promise<Response> {
  const path = url.pathname;

  // Authentication endpoints (public)
  if (path === '/api/auth/register' && request.method === 'POST') {
    return handleRegister(request, env);
  }

  if (path === '/api/auth/login' && request.method === 'POST') {
    return handleLogin(request, env);
  }

  // Protected authentication endpoints
  if (path === '/api/auth/logout' && request.method === 'POST') {
    return withAuth(request, env, handleLogout);
  }

  if (path === '/api/auth/mfa/setup' && request.method === 'POST') {
    return withAuth(request, env, handleMFASetup);
  }

  if (path === '/api/auth/mfa/verify' && request.method === 'POST') {
    return withAuth(request, env, handleMFAVerify);
  }

  if (path === '/api/auth/mfa/disable' && request.method === 'POST') {
    return withAuth(request, env, handleMFADisable);
  }

  // User management endpoints
  if (path === '/api/users/me' && request.method === 'GET') {
    return withAuth(request, env, handleGetCurrentUser);
  }

  // Document endpoints
  if (path === '/api/documents/upload' && request.method === 'POST') {
    return withAuth(request, env, handleDocumentUpload, ['documents.upload']);
  }

  if (path.startsWith('/api/documents/') && request.method === 'GET') {
    return withAuth(request, env, handleDocumentDownload, ['documents.read']);
  }

  if (path === '/api/documents' && request.method === 'GET') {
    return withAuth(request, env, handleListDocuments, ['documents.read']);
  }

  // IRS MEF endpoints
  if (path === '/api/irs/transmit' && request.method === 'POST') {
    return withAuth(request, env, handleIRSTransmit, ['irs.transmit']);
  }

  if (path === '/api/irs/status' && request.method === 'GET') {
    return withAuth(request, env, handleIRSStatus, ['irs.transmit', 'returns.read']);
  }

  // Admin endpoints
  if (path.startsWith('/api/admin/')) {
    return withAuth(request, env, handleAdminRequest, ['*']);
  }

  // Workflow endpoints
  if (path === '/api/workflows' && request.method === 'POST') {
    return withAuth(request, env, (req, env, user) => createWorkflow(req, env, user), ['workflows.create']);
  }

  if (path === '/api/workflows' && request.method === 'GET') {
    return withAuth(request, env, (req, env, user) => listWorkflows(req, env, user), ['workflows.read']);
  }

  if (path.match(/^\/api\/workflows\/[^/]+$/) && request.method === 'GET') {
    const workflowId = path.split('/').pop()!;
    return withAuth(request, env, (req, env, user) => getWorkflow(workflowId, env, user), ['workflows.read']);
  }

  if (path.match(/^\/api\/workflows\/[^/]+\/transition$/) && request.method === 'POST') {
    const workflowId = path.split('/')[3];
    return withAuth(request, env, (req, env, user) => transitionWorkflow(workflowId, req, env, user), ['workflows.update']);
  }

  if (path.match(/^\/api\/workflows\/[^/]+\/tasks$/) && request.method === 'GET') {
    const workflowId = path.split('/')[3];
    return withAuth(request, env, (req, env, user) => getWorkflowTasks(workflowId, env, user), ['workflows.read', 'tasks.read']);
  }

  // Task endpoints
  if (path === '/api/tasks' && request.method === 'POST') {
    return withAuth(request, env, (req, env, user) => createTask(req, env, user), ['tasks.create']);
  }

  if (path === '/api/tasks' && request.method === 'GET') {
    return withAuth(request, env, (req, env, user) => listTasks(req, env, user), ['tasks.read']);
  }

  if (path.match(/^\/api\/tasks\/[^/]+\/complete$/) && request.method === 'POST') {
    const taskId = path.split('/')[3];
    return withAuth(request, env, (req, env, user) => completeTask(taskId, req, env, user), ['tasks.complete']);
  }

  // E-File endpoints
  if (path === '/api/efile/providers' && request.method === 'GET') {
    return withAuth(request, env, (req, env, user) => listProviders(env), ['returns.read']);
  }

  if (path === '/api/efile/submit' && request.method === 'POST') {
    return withAuth(request, env, (req, env, user) => submitEFile(req, env, user), ['irs.transmit']);
  }

  if (path === '/api/efile/submissions' && request.method === 'GET') {
    return withAuth(request, env, (req, env, user) => listSubmissions(req, env, user), ['returns.read']);
  }

  if (path.match(/^\/api\/efile\/submissions\/[^/]+$/) && request.method === 'GET') {
    const submissionId = path.split('/').pop()!;
    return withAuth(request, env, (req, env, user) => getSubmission(submissionId, env, user), ['returns.read']);
  }

  // Health check
  if (path === '/api/health' && request.method === 'GET') {
    return new Response(
      JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Not found
  return new Response(
    JSON.stringify({
      error: 'Not found',
      path,
    }),
    {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Authentication middleware wrapper
 */
async function withAuth(
  request: Request,
  env: Env,
  handler: (request: Request, env: Env, user?: any) => Promise<Response>,
  requiredPermissions: string[] = []
): Promise<Response> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized - No token provided' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const token = authHeader.substring(7);
  const payload = await JWTService.verifyToken(token, env.JWT_SECRET);

  if (!payload) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized - Invalid token' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Get role permissions
  const rolePermissions = RBACService.getDefaultRolePermissions();

  // Check permissions
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every((perm) =>
      RBACService.hasPermission(payload.role, perm, rolePermissions)
    );

    if (!hasAllPermissions) {
      await AuditService.log(
        env.DB,
        payload.userId,
        'access.denied',
        'api',
        null,
        {
          path: new URL(request.url).pathname,
          requiredPermissions,
          userRole: payload.role,
        },
        getClientIP(request),
        getUserAgent(request),
        'warning'
      );

      return new Response(
        JSON.stringify({
          error: 'Forbidden - Insufficient permissions',
          required: requiredPermissions,
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // Get full user data
  const user = await env.DB.prepare(
    'SELECT id, email, first_name, last_name, role, status FROM users WHERE id = ?'
  )
    .bind(payload.userId)
    .first();

  if (!user) {
    return new Response(
      JSON.stringify({ error: 'User not found' }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return handler(request, env, user);
}

/**
 * Get current user
 */
async function handleGetCurrentUser(
  request: Request,
  env: Env,
  user: any
): Promise<Response> {
  return new Response(
    JSON.stringify({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        status: user.status,
      },
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Handle document upload
 */
async function handleDocumentUpload(
  request: Request,
  env: Env,
  user: any
): Promise<Response> {
  return new Response(
    JSON.stringify({
      error: 'Document upload endpoint - implementation pending',
    }),
    {
      status: 501,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Handle document download
 */
async function handleDocumentDownload(
  request: Request,
  env: Env,
  user: any
): Promise<Response> {
  return new Response(
    JSON.stringify({
      error: 'Document download endpoint - implementation pending',
    }),
    {
      status: 501,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Handle list documents
 */
async function handleListDocuments(
  request: Request,
  env: Env,
  user: any
): Promise<Response> {
  return new Response(
    JSON.stringify({
      error: 'List documents endpoint - implementation pending',
    }),
    {
      status: 501,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Handle IRS transmission
 */
async function handleIRSTransmit(
  request: Request,
  env: Env,
  user: any
): Promise<Response> {
  return new Response(
    JSON.stringify({
      error: 'IRS transmit endpoint - implementation pending',
    }),
    {
      status: 501,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Handle IRS status check
 */
async function handleIRSStatus(
  request: Request,
  env: Env,
  user: any
): Promise<Response> {
  return new Response(
    JSON.stringify({
      error: 'IRS status endpoint - implementation pending',
    }),
    {
      status: 501,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Handle admin requests
 */
async function handleAdminRequest(
  request: Request,
  env: Env,
  user: any
): Promise<Response> {
  return new Response(
    JSON.stringify({
      error: 'Admin endpoint - implementation pending',
    }),
    {
      status: 501,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
