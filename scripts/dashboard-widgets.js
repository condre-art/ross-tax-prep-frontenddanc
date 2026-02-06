// Dashboard Widgets: Real-Time Updates & API Integration
// This script handles dynamic updates for tasks, workflow progress, and refund status.

// --- Mock API Endpoints ---
const API = {
  getTasks: () => Promise.resolve([
    { id: 'task1', label: 'Collect taxpayer info', completed: false },
    { id: 'task2', label: 'Submit Refund Advantage app', completed: false },
    { id: 'task3', label: 'Transmit efile', completed: false },
    { id: 'task4', label: 'Notify client', completed: false }
  ]),
  updateTask: (id, completed) => Promise.resolve({ id, completed }),
  getWorkflowProgress: () => Promise.resolve({ step: 2, max: 5, label: 'Application Submitted' }),
  getRefundStatus: () => Promise.resolve({ status: 'Pending Bank Approval', expected: '2-5 business days' })
};

// --- Task List ---
async function loadTasks() {
  const tasks = await API.getTasks();
  const list = document.getElementById('task-list');
  if (!list) return;
  list.innerHTML = '';
  tasks.forEach(task => {
    const li = document.createElement('li');
    li.innerHTML = `<input type="checkbox" id="${task.id}" ${task.completed ? 'checked' : ''}> <label for="${task.id}">${task.label}</label>`;
    const checkbox = li.querySelector('input');
    checkbox.addEventListener('change', async (e) => {
      await API.updateTask(task.id, e.target.checked);
      // Optionally reload or update UI
    });
    list.appendChild(li);
  });
    try {
      const tasks = await API.getTasks();
      const list = document.getElementById('task-list');
      if (!list) return;
      list.innerHTML = '';
      tasks.forEach(task => {
        const li = document.createElement('li');
        li.innerHTML = `<input type="checkbox" id="${task.id}" ${task.completed ? 'checked' : ''}> <label for="${task.id}">${task.label}</label>`;
        const checkbox = li.querySelector('input');
        checkbox.addEventListener('change', async (e) => {
          try {
            await API.updateTask(task.id, e.target.checked);
          } catch (err) {
            alert('Error updating task. Please try again.');
          }
        });
        list.appendChild(li);
      });
    } catch (err) {
      alert('Error loading tasks. Please refresh or contact support.');
      // TODO: Log error to backend
    }
}

// --- Workflow Progress ---
async function loadWorkflowProgress() {
  const progress = await API.getWorkflowProgress();
  const bar = document.getElementById('workflow-progress');
  const label = bar?.nextElementSibling;
  if (bar) {
    bar.value = progress.step;
    bar.max = progress.max;
  }
  if (label) {
    label.textContent = `Step ${progress.step} of ${progress.max}: ${progress.label}`;
  }
    try {
      const progress = await API.getWorkflowProgress();
      const bar = document.getElementById('workflow-progress');
      const label = bar?.nextElementSibling;
      if (bar) {
        bar.value = progress.step;
        bar.max = progress.max;
      }
      if (label) {
        label.textContent = `Step ${progress.step} of ${progress.max}: ${progress.label}`;
      }
    } catch (err) {
      alert('Error loading workflow progress.');
      // TODO: Log error to backend
    }
}

// --- Refund Status ---
async function loadRefundStatus() {
  const status = await API.getRefundStatus();
  const statusDiv = document.querySelector('.card h3 + div');
  const expectedDiv = statusDiv?.nextElementSibling;
  if (statusDiv) statusDiv.textContent = status.status;
  if (expectedDiv) expectedDiv.textContent = `Expected: ${status.expected}`;
    try {
      const status = await API.getRefundStatus();
      const statusDiv = document.querySelector('.card h3 + div');
      const expectedDiv = statusDiv?.nextElementSibling;
      if (statusDiv) statusDiv.textContent = status.status;
      if (expectedDiv) expectedDiv.textContent = `Expected: ${status.expected}`;
    } catch (err) {
      alert('Error loading refund status.');
      // TODO: Log error to backend
    }
}

// --- Initialize Widgets ---
window.addEventListener('DOMContentLoaded', () => {
  loadTasks();
  loadWorkflowProgress();
  loadRefundStatus();
    // TODO: Integrate with backend APIs for live data
});
