function getUserId() {
  let id = localStorage.getItem('user_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('user_id', id);
  }
  return id;
}
async function track(phase) {
  try {
    await fetch('/api/tracker', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: getUserId(), phase: phase }),
    });
  } catch (e) {

  }
}
