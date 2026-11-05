const listEl = document.getElementById('list');
const emptyEl = document.getElementById('empty');
const summaryEl = document.getElementById('summary');
const feed = document.getElementById('status-message');

const studentId = sessionStorage.getItem('student_id');

let rows = [];

const daysSince = (iso) => {
    const then = new Date(iso).getTime();
    if (!Number.isFinite(then)) return null;
    return Math.max(0, Math.floor((Date.now() - then) / 86400000));
};

const shortDate = (iso) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
        ? ''
        : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

async function setStatus(id, status) {
    try {
        const response = await fetch(`/api/applications/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status ,student_id: Number(studentId)})
        });
        if (!response.ok) throw new Error('Could not update this row.');

        const updated = await response.json();
        rows = rows.map((row) => (row.id === updated.id ? { ...row, ...updated } : row));
        render();
        feed.textContent = `Marked ${updated.company_name || 'this'} as ${status}.`;
    } catch (error) {
        feed.textContent = error.message;
    }
}

function render() {
    listEl.textContent = '';

    emptyEl.hidden = rows.length > 0;

    const counts = rows.reduce((acc, row) => {
        acc[row.status] = (acc[row.status] || 0) + 1;
        return acc;
    }, {});

    summaryEl.textContent = rows.length
        ? `${counts.Drafted || 0} drafted · ${counts.Sent || 0} sent · ${counts.Replied || 0} replied`
        : '';

    rows.forEach((row) => {
        const card = document.createElement('article');
        card.className = 'row';
        card.dataset.state = row.status;

        const main = document.createElement('div');
        main.className = 'row-main';

        const title = document.createElement('h2');
        title.textContent = row.company_name || 'Unknown company';

        const role = document.createElement('span');
        role.className = 'row-role';
        role.textContent = row.job_role;

        const meta = document.createElement('p');
        meta.className = 'row-meta';
        meta.textContent = `${row.recipient_email} · drafted ${shortDate(row.created_at)}`;

        const chip = document.createElement('p');
        chip.className = 'chip';
        chip.textContent = row.status;

        main.append(title, role, meta);

        const waiting = document.createElement('p');
        waiting.className = 'waiting';
        const days = daysSince(row.updated_at || row.created_at);
        waiting.textContent =
            (row.status === 'Sent' || row.status === 'Replied') && days !== null
                ? `waiting ${days} ${days === 1 ? 'day' : 'days'}`
                : '';

        const actions = document.createElement('div');
        actions.className = 'row-actions';

        ['Sent', 'Replied', 'Closed'].forEach((next) => {
            if (next === row.status) return;
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = next;
            button.addEventListener('click', () => setStatus(row.id, next));
            actions.append(button);
        });

        card.append(chip, main, waiting, actions);
        listEl.append(card);
    });
}

async function load() {
    if (!studentId) {
        emptyEl.hidden = false;
        feed.textContent = 'No student selected. Create your profile first.';
        return;
    }

    try {
        const response = await fetch(`/api/students/${studentId}/applications`);
        if (!response.ok) throw new Error('Could not load your applications.');
        rows = await response.json();
        render();
    } catch (error) {
        feed.textContent = error.message;
    }
}

load();