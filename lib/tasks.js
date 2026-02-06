export async function fetchTasks() {
  const res = await fetch("/api/tasks");
  return res.json();
}

export async function fetchTask(id) {
  const res = await fetch(`/api/tasks/${id}`);
  return res.json();
}
