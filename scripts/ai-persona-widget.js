// AI Persona Widget for Tax Attorney and Marketer
async function askAIPersona(persona, question) {
  const res = await fetch('/api/ai-persona', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ persona, question })
  });
  return await res.json();
}

window.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('aiPersonaForm');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const persona = form.persona.value;
    const question = form.question.value;
    const result = await askAIPersona(persona, question);
    document.getElementById('aiPersonaResponse').textContent = result.response;
    document.getElementById('aiPersonaDisclaimer').textContent = result.disclaimer;
  });
});
