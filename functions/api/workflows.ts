/**
 * Workflow Management API Endpoints
 * 
 * Handles workflow creation, management, task tracking, and state transitions
 */

import { generateId } from '../lib/auth';
import type {
  WorkflowInstance,
  WorkflowTask,
  WorkflowTransition,
  CreateWorkflowRequest,
  CreateWorkflowResponse,
  TransitionWorkflowRequest,
  CompleteTaskRequest,
  CreateTaskRequest,
} from '../../types';

interface Env {
  DB: D1Database;
  SESSIONS: KVNamespace;
  JWT_SECRET: string;
}

/**
 * POST /api/workflows
 * Create a new workflow instance
 */
export async function createWorkflow(
  request: Request,
  env: Env,
  user: any
): Promise<Response> {
  try {
    const body = (await request.json()) as CreateWorkflowRequest;
    const { template_id, return_id, name, assigned_to, due_date, priority = 'normal', metadata } = body;

    // Validate required fields
    if (!template_id || !name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: template_id, name' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if template exists
    const template = await env.DB.prepare(
      'SELECT * FROM workflow_templates WHERE id = ? AND is_active = 1'
    )
      .bind(template_id)
      .first();

    if (!template) {
      return new Response(
        JSON.stringify({ error: 'Workflow template not found or inactive' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create workflow instance
    const workflowId = generateId();
    const steps = JSON.parse(template.steps as string);
    const firstStep = steps[0]?.id || 'start';

    await env.DB.prepare(
      `INSERT INTO workflow_instances 
       (id, template_id, return_id, name, current_step, status, priority, assigned_to, due_date, metadata, started_at)
       VALUES (?, ?, ?, ?, ?, 'in_progress', ?, ?, ?, ?, datetime('now'))`
    )
      .bind(
        workflowId,
        template_id,
        return_id || null,
        name,
        firstStep,
        priority,
        assigned_to || user.userId,
        due_date || null,
        metadata ? JSON.stringify(metadata) : null
      )
      .run();

    // Create initial transition
    await env.DB.prepare(
      `INSERT INTO workflow_transitions 
       (id, workflow_id, from_step, to_step, action, triggered_by)
       VALUES (?, ?, ?, ?, 'created', ?)`
    )
      .bind(generateId(), workflowId, null, firstStep, user.userId)
      .run();

    // Create tasks based on template steps
    for (const step of steps) {
      const taskId = generateId();
      await env.DB.prepare(
        `INSERT INTO workflow_tasks
         (id, workflow_id, title, description, task_type, step_order, status, assigned_to)
         VALUES (?, ?, ?, ?, 'custom', ?, 'pending', ?)`
      )
        .bind(
          taskId,
          workflowId,
          step.name,
          step.description || null,
          step.order,
          assigned_to || user.userId
        )
        .run();
    }

    // Audit log
    await env.DB.prepare(
      `INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, severity)
       VALUES (?, ?, 'workflow_created', 'workflow', ?, 'info')`
    )
      .bind(generateId(), user.userId, workflowId)
      .run();

    const response: CreateWorkflowResponse = {
      success: true,
      workflow_id: workflowId,
      message: 'Workflow created successfully',
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating workflow:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create workflow', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * GET /api/workflows/:id
 * Get workflow details
 */
export async function getWorkflow(
  workflowId: string,
  env: Env,
  user: any
): Promise<Response> {
  try {
    const workflow = await env.DB.prepare(
      'SELECT * FROM workflow_instances WHERE id = ?'
    )
      .bind(workflowId)
      .first();

    if (!workflow) {
      return new Response(JSON.stringify({ error: 'Workflow not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check permissions
    if (
      user.role !== 'admin' &&
      user.role !== 'ero' &&
      workflow.assigned_to !== user.userId
    ) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(workflow), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error fetching workflow:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch workflow', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * GET /api/workflows
 * List workflows (with optional filters)
 */
export async function listWorkflows(
  request: Request,
  env: Env,
  user: any
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const assigned_to = url.searchParams.get('assigned_to');
    const return_id = url.searchParams.get('return_id');

    let query = 'SELECT * FROM workflow_instances WHERE 1=1';
    const bindings: any[] = [];

    if (user.role === 'client') {
      query += ' AND assigned_to = ?';
      bindings.push(user.userId);
    } else if (assigned_to) {
      query += ' AND assigned_to = ?';
      bindings.push(assigned_to);
    }

    if (status) {
      query += ' AND status = ?';
      bindings.push(status);
    }

    if (return_id) {
      query += ' AND return_id = ?';
      bindings.push(return_id);
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    const { results } = await env.DB.prepare(query).bind(...bindings).all();

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error listing workflows:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to list workflows', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * POST /api/workflows/:id/transition
 * Transition workflow to next step
 */
export async function transitionWorkflow(
  workflowId: string,
  request: Request,
  env: Env,
  user: any
): Promise<Response> {
  try {
    const body = (await request.json()) as TransitionWorkflowRequest;
    const { to_step, action, reason, metadata } = body;

    // Get current workflow
    const workflow = await env.DB.prepare(
      'SELECT * FROM workflow_instances WHERE id = ?'
    )
      .bind(workflowId)
      .first();

    if (!workflow) {
      return new Response(JSON.stringify({ error: 'Workflow not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check permissions
    if (user.role !== 'admin' && user.role !== 'ero') {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const fromStep = workflow.current_step;

    // Update workflow
    await env.DB.prepare(
      'UPDATE workflow_instances SET current_step = ?, updated_at = datetime(\'now\') WHERE id = ?'
    )
      .bind(to_step, workflowId)
      .run();

    // Record transition
    await env.DB.prepare(
      `INSERT INTO workflow_transitions 
       (id, workflow_id, from_step, to_step, action, triggered_by, reason, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        generateId(),
        workflowId,
        fromStep,
        to_step,
        action,
        user.userId,
        reason || null,
        metadata ? JSON.stringify(metadata) : null
      )
      .run();

    // Audit log
    await env.DB.prepare(
      `INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, severity)
       VALUES (?, ?, 'workflow_transition', 'workflow', ?, 'info')`
    )
      .bind(generateId(), user.userId, workflowId)
      .run();

    return new Response(
      JSON.stringify({ success: true, message: 'Workflow transitioned successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error transitioning workflow:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to transition workflow', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * GET /api/workflows/:id/tasks
 * Get tasks for a workflow
 */
export async function getWorkflowTasks(
  workflowId: string,
  env: Env,
  user: any
): Promise<Response> {
  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM workflow_tasks WHERE workflow_id = ? ORDER BY step_order ASC'
    )
      .bind(workflowId)
      .all();

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error fetching workflow tasks:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch tasks', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * POST /api/tasks/:id/complete
 * Mark a task as complete
 */
export async function completeTask(
  taskId: string,
  request: Request,
  env: Env,
  user: any
): Promise<Response> {
  try {
    const body = (await request.json()) as CompleteTaskRequest;
    const { result, notes } = body;

    // Get task
    const task = await env.DB.prepare(
      'SELECT * FROM workflow_tasks WHERE id = ?'
    )
      .bind(taskId)
      .first();

    if (!task) {
      return new Response(JSON.stringify({ error: 'Task not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user can complete this task
    if (
      user.role !== 'admin' &&
      user.role !== 'ero' &&
      task.assigned_to !== user.userId
    ) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update task
    const resultData = result ? JSON.stringify({ ...result, notes }) : JSON.stringify({ notes });
    
    await env.DB.prepare(
      `UPDATE workflow_tasks 
       SET status = 'completed', completed_at = datetime('now'), completed_by = ?, result = ?
       WHERE id = ?`
    )
      .bind(user.userId, resultData, taskId)
      .run();

    // Audit log
    await env.DB.prepare(
      `INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, severity)
       VALUES (?, ?, 'task_completed', 'task', ?, 'info')`
    )
      .bind(generateId(), user.userId, taskId)
      .run();

    return new Response(
      JSON.stringify({ success: true, message: 'Task completed successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error completing task:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to complete task', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * POST /api/tasks
 * Create a new task
 */
export async function createTask(
  request: Request,
  env: Env,
  user: any
): Promise<Response> {
  try {
    const body = (await request.json()) as CreateTaskRequest;
    const {
      workflow_id,
      title,
      description,
      task_type,
      step_order = 0,
      assigned_to,
      depends_on,
      required_role,
      due_date,
    } = body;

    // Validate required fields
    if (!workflow_id || !title || !task_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: workflow_id, title, task_type' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check permissions
    if (user.role !== 'admin' && user.role !== 'ero') {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const taskId = generateId();

    await env.DB.prepare(
      `INSERT INTO workflow_tasks
       (id, workflow_id, title, description, task_type, step_order, status, assigned_to, depends_on, required_role, due_date)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`
    )
      .bind(
        taskId,
        workflow_id,
        title,
        description || null,
        task_type,
        step_order,
        assigned_to || null,
        depends_on ? JSON.stringify(depends_on) : null,
        required_role || null,
        due_date || null
      )
      .run();

    // Audit log
    await env.DB.prepare(
      `INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, severity)
       VALUES (?, ?, 'task_created', 'task', ?, 'info')`
    )
      .bind(generateId(), user.userId, taskId)
      .run();

    return new Response(
      JSON.stringify({ success: true, task_id: taskId, message: 'Task created successfully' }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error creating task:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create task', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * GET /api/tasks
 * List tasks (with filters)
 */
export async function listTasks(
  request: Request,
  env: Env,
  user: any
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const assigned_to = url.searchParams.get('assigned_to');
    const workflow_id = url.searchParams.get('workflow_id');

    let query = 'SELECT * FROM workflow_tasks WHERE 1=1';
    const bindings: any[] = [];

    if (user.role === 'client') {
      query += ' AND assigned_to = ?';
      bindings.push(user.userId);
    } else if (assigned_to) {
      query += ' AND assigned_to = ?';
      bindings.push(assigned_to);
    }

    if (status) {
      query += ' AND status = ?';
      bindings.push(status);
    }

    if (workflow_id) {
      query += ' AND workflow_id = ?';
      bindings.push(workflow_id);
    }

    query += ' ORDER BY step_order ASC, created_at DESC LIMIT 100';

    const { results } = await env.DB.prepare(query).bind(...bindings).all();

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error listing tasks:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to list tasks', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
