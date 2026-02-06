/**
 * E-File Provider API Endpoints
 * 
 * Handles e-file submissions to various providers including IRS MEF and TaxSlayer
 */

import { generateId } from '../lib/auth';
import type {
  EFileProvider,
  EFileSubmission,
  SubmitEFileRequest,
} from '../../types';

interface Env {
  DB: D1Database;
  SESSIONS: KVNamespace;
  JWT_SECRET: string;
  IRS_EFIN?: string;
  IRS_ETIN?: string;
  IRS_MEF_ENDPOINT?: string;
  IRS_TEST_MODE?: string;
}

/**
 * GET /api/efile/providers
 * List available e-file providers
 */
export async function listProviders(env: Env): Promise<Response> {
  try {
    const { results } = await env.DB.prepare(
      'SELECT id, name, type, is_active, test_mode FROM efile_providers WHERE is_active = 1'
    ).all();

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error listing providers:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to list providers', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * POST /api/efile/submit
 * Submit a tax return to an e-file provider
 */
export async function submitEFile(
  request: Request,
  env: Env,
  user: any
): Promise<Response> {
  try {
    const body = (await request.json()) as SubmitEFileRequest;
    const { return_id, provider_id, submission_type, workflow_id } = body;

    // Check permissions
    if (user.role !== 'admin' && user.role !== 'ero') {
      return new Response(JSON.stringify({ error: 'Access denied. Only ERO and Admin can submit e-files.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate required fields
    if (!return_id || !provider_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: return_id, provider_id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get return data
    const taxReturn = await env.DB.prepare(
      'SELECT * FROM tax_returns WHERE id = ?'
    )
      .bind(return_id)
      .first();

    if (!taxReturn) {
      return new Response(JSON.stringify({ error: 'Tax return not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check return status
    if (taxReturn.status === 'submitted' || taxReturn.status === 'accepted') {
      return new Response(
        JSON.stringify({ error: 'Return has already been submitted' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get provider details
    const provider = await env.DB.prepare(
      'SELECT * FROM efile_providers WHERE id = ? AND is_active = 1'
    )
      .bind(provider_id)
      .first();

    if (!provider) {
      return new Response(JSON.stringify({ error: 'Provider not found or inactive' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate submission ID
    const submissionId = generateId();
    const transmissionId = `TX${Date.now()}${generateId().substring(0, 8).toUpperCase()}`;

    // Create submission record
    await env.DB.prepare(
      `INSERT INTO efile_submissions 
       (id, workflow_id, return_id, provider_id, submission_type, submission_id, transmission_id, status, submitted_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
    )
      .bind(
        submissionId,
        workflow_id || null,
        return_id,
        provider_id,
        submission_type || 'original',
        submissionId,
        transmissionId,
        user.userId
      )
      .run();

    // Process submission based on provider type
    let submissionResult;
    if (provider.type === 'irs_mef') {
      submissionResult = await submitToIRSMEF(submissionId, taxReturn, provider, env);
    } else if (provider.type === 'taxslayer') {
      submissionResult = await submitToTaxSlayer(submissionId, taxReturn, provider, env);
    } else {
      submissionResult = {
        success: false,
        error: 'Provider type not yet implemented',
      };
    }

    // Update submission with result
    if (submissionResult.success) {
      await env.DB.prepare(
        `UPDATE efile_submissions 
         SET status = 'submitted', submission_response = ?, submitted_at = datetime('now')
         WHERE id = ?`
      )
        .bind(JSON.stringify(submissionResult), submissionId)
        .run();

      // Update return status
      await env.DB.prepare(
        'UPDATE tax_returns SET status = \'submitted\', submitted_at = datetime(\'now\'), irs_submission_id = ? WHERE id = ?'
      )
        .bind(transmissionId, return_id)
        .run();

      // Update workflow if exists
      if (workflow_id) {
        await env.DB.prepare(
          'UPDATE workflow_instances SET current_step = \'acknowledgment\', updated_at = datetime(\'now\') WHERE id = ?'
        )
          .bind(workflow_id)
          .run();
      }
    } else {
      await env.DB.prepare(
        `UPDATE efile_submissions 
         SET status = 'error', validation_errors = ?
         WHERE id = ?`
      )
        .bind(JSON.stringify([submissionResult.error]), submissionId)
        .run();
    }

    // Audit log
    await env.DB.prepare(
      `INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, severity)
       VALUES (?, ?, 'efile_submitted', 'efile_submission', ?, ?)`
    )
      .bind(
        generateId(),
        user.userId,
        submissionId,
        submissionResult.success ? 'info' : 'error'
      )
      .run();

    return new Response(
      JSON.stringify({
        success: submissionResult.success,
        submission_id: submissionId,
        transmission_id: transmissionId,
        message: submissionResult.success
          ? 'E-file submitted successfully'
          : submissionResult.error,
      }),
      {
        status: submissionResult.success ? 200 : 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error submitting e-file:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to submit e-file', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Submit to IRS Modernized e-File (MEF)
 */
async function submitToIRSMEF(
  submissionId: string,
  taxReturn: any,
  provider: any,
  env: Env
): Promise<{ success: boolean; error?: string }> {
  try {
    const mefEndpoint = env.IRS_MEF_ENDPOINT || provider.endpoint_url;
    const testMode = env.IRS_TEST_MODE === 'true' || provider.test_mode === 1;

    // Validate return data
    if (!taxReturn.data_encrypted) {
      return { success: false, error: 'Return data is missing' };
    }

    // In a real implementation, you would:
    // 1. Decrypt the return data
    // 2. Generate MEF XML according to IRS schema (2024v5.0)
    // 3. Sign the XML with IRS certificate
    // 4. Submit to IRS endpoint
    // 5. Process acknowledgment

    // For now, we'll simulate a successful submission in test mode
    if (testMode) {
      console.log('Simulating IRS MEF submission in test mode');
      
      // Update submission record with mock XML data
      await env.DB.prepare(
        'UPDATE efile_submissions SET xml_data = ? WHERE id = ?'
      )
        .bind('<Return xmlns="http://www.irs.gov/efile"><!-- MEF XML --></Return>', submissionId)
        .run();

      return {
        success: true,
      };
    }

    // Production mode would make actual API call
    return {
      success: false,
      error: 'Production IRS MEF submission requires additional configuration',
    };
  } catch (error: any) {
    console.error('Error submitting to IRS MEF:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Submit to TaxSlayer Pro API
 */
async function submitToTaxSlayer(
  submissionId: string,
  taxReturn: any,
  provider: any,
  env: Env
): Promise<{ success: boolean; error?: string }> {
  try {
    const taxslayerEndpoint = provider.endpoint_url || 'https://api.taxslayerpro.com/efile/v1';
    const testMode = provider.test_mode === 1;

    // Validate return data
    if (!taxReturn.data_encrypted) {
      return { success: false, error: 'Return data is missing' };
    }

    // Parse provider configuration
    const config = provider.configuration ? JSON.parse(provider.configuration) : {};

    // In a real implementation, you would:
    // 1. Decrypt the return data
    // 2. Format data according to TaxSlayer API requirements
    // 3. Make authenticated API call to TaxSlayer
    // 4. Process response and acknowledgment

    // For now, we'll simulate a successful submission in test mode
    if (testMode) {
      console.log('Simulating TaxSlayer submission in test mode');

      // Simulate TaxSlayer API response
      const mockResponse = {
        success: true,
        taxslayer_id: `TS${Date.now()}`,
        status: 'submitted',
        message: 'Return successfully submitted to TaxSlayer',
        timestamp: new Date().toISOString(),
      };

      // Update submission record
      await env.DB.prepare(
        'UPDATE efile_submissions SET submission_response = ? WHERE id = ?'
      )
        .bind(JSON.stringify(mockResponse), submissionId)
        .run();

      return {
        success: true,
      };
    }

    // Production mode would make actual API call
    // Example (not functional without real credentials):
    // const response = await fetch(`${taxslayerEndpoint}/submit`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${decryptedApiKey}`,
    //   },
    //   body: JSON.stringify(formattedReturnData),
    // });

    return {
      success: false,
      error: 'Production TaxSlayer submission requires API credentials configuration',
    };
  } catch (error: any) {
    console.error('Error submitting to TaxSlayer:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * GET /api/efile/submissions
 * List e-file submissions
 */
export async function listSubmissions(
  request: Request,
  env: Env,
  user: any
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const return_id = url.searchParams.get('return_id');
    const status = url.searchParams.get('status');

    let query = 'SELECT * FROM efile_submissions WHERE 1=1';
    const bindings: any[] = [];

    if (return_id) {
      query += ' AND return_id = ?';
      bindings.push(return_id);
    }

    if (status) {
      query += ' AND status = ?';
      bindings.push(status);
    }

    // Clients can only see their own submissions
    if (user.role === 'client') {
      query += ' AND return_id IN (SELECT id FROM tax_returns WHERE user_id = ?)';
      bindings.push(user.userId);
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    const { results } = await env.DB.prepare(query).bind(...bindings).all();

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error listing submissions:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to list submissions', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * GET /api/efile/submissions/:id
 * Get submission details
 */
export async function getSubmission(
  submissionId: string,
  env: Env,
  user: any
): Promise<Response> {
  try {
    const submission = await env.DB.prepare(
      'SELECT * FROM efile_submissions WHERE id = ?'
    )
      .bind(submissionId)
      .first();

    if (!submission) {
      return new Response(JSON.stringify({ error: 'Submission not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check permissions
    if (user.role === 'client') {
      const taxReturn = await env.DB.prepare(
        'SELECT user_id FROM tax_returns WHERE id = ?'
      )
        .bind(submission.return_id)
        .first();

      if (!taxReturn || taxReturn.user_id !== user.userId) {
        return new Response(JSON.stringify({ error: 'Access denied' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify(submission), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error fetching submission:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch submission', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
