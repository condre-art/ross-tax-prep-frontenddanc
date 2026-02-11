// Dashboard Widgets: Real-Time Updates & API Integration
// This script handles dynamic updates for tasks, workflow progress, and refund status.

import { logTaskError, logWorkflowError, logAPIError } from '../lib/client-logger.js';

// --- API Endpoints ---
const API = {
  getTasks: async () => {
    const response = await fetch('/api/tasks?status=pending', {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  updateTask: async (id, completed) => {
    const response = await fetch(`/api/tasks/${id}/complete`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({ result: { completed } })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  getWorkflowProgress: async () => {
    const response = await fetch('/api/workflows?status=in_progress', {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const workflows = await response.json();
    // Return first workflow or mock data
    if (workflows.length > 0) {
      const wf = workflows[0];
      return { step: 2, max: 5, label: wf.current_step || 'In Progress' };
    }
    return { step: 2, max: 5, label: 'Application Submitted' };
  },
  getRefundStatus: async () => {
    // Mock implementation - integrate with actual refund tracking API
    return { status: 'Pending Bank Approval', expected: '2-5 business days' };
  }
};

function getAuthToken() {
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
}

// --- Task List ---
async function loadTasks() {
  const list = document.getElementById('task-list');
  if (!list) return;

  try {
    const tasks = await API.getTasks();
    list.innerHTML = '';
    tasks.forEach(task => {
      const li = document.createElement('li');
      // Use 'title' property from backend API (standardized in workflows.ts)
      const taskTitle = task.title || task.label || 'Untitled Task';
      li.innerHTML = `<input type="checkbox" id="${task.id}" ${task.completed || task.status === 'completed' ? 'checked' : ''}> <label for="${task.id}">${taskTitle}</label>`;
      const checkbox = li.querySelector('input');
      checkbox.addEventListener('change', async (e) => {
        try {
          await API.updateTask(task.id, e.target.checked);
        } catch (err) {
          alert('Error updating task. Please try again.');
          await logTaskError('update', err, { taskId: task.id });
          e.target.checked = !e.target.checked; // Revert checkbox
        }
      });
      list.appendChild(li);
    });
  } catch (err) {
    alert('Error loading tasks. Please refresh or contact support.');
    await logTaskError('load', err);
  }
}


// --- Workflow Progress ---
async function loadWorkflowProgress() {
  const bar = document.getElementById('workflow-progress');
  const label = bar?.nextElementSibling;

  try {
    const progress = await API.getWorkflowProgress();
    if (bar) {
      bar.value = progress.step;
      bar.max = progress.max;
    }
    if (label) {
      label.textContent = `Step ${progress.step} of ${progress.max}: ${progress.label}`;
    }
  } catch (err) {
    alert('Error loading workflow progress.');
    await logWorkflowError('load_progress', err);
  }
}


// --- Refund Status ---
async function loadRefundStatus() {
  const statusDiv = document.querySelector('.card h3 + div');
  const expectedDiv = statusDiv?.nextElementSibling;

  try {
    const status = await API.getRefundStatus();
    if (statusDiv) statusDiv.textContent = status.status;
    if (expectedDiv) expectedDiv.textContent = `Expected: ${status.expected}`;
  } catch (err) {
    alert('Error loading refund status.');
    await logAPIError('/api/refund-status', 'GET', err);
  }
}

// --- Initialize Widgets ---
window.addEventListener('DOMContentLoaded', () => {
  loadTasks();
  loadWorkflowProgress();
  loadRefundStatus();
});
