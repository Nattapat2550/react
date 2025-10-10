const msg = document.getElementById('msg');

async function load() {
  try {
    const me = await api('/api/users/me');
    if (me.role !== 'admin') return location.replace('home.html');
    document.getElementById('uname').textContent = me.username || me.email;
    if (me.profile_picture_url) document.getElementById('avatar').src = me.profile_picture_url;

    // Users
    const users = await api('/api/admin/users');
    const tbody = document.querySelector('#usersTable tbody');
    tbody.innerHTML = '';
    users.forEach(u => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${u.id}</td>
        <td><input data-id="${u.id}" data-field="email" value="${u.email || ''}" disabled/></td>
        <td><input data-id="${u.id}" data-field="username" value="${u.username || ''}"/></td>
        <td>
          <select data-id="${u.id}" data-field="role">
            <option value="user" ${u.role==='user'?'selected':''}>user</option>
            <option value="admin" ${u.role==='admin'?'selected':''}>admin</option>
          </select>
        </td>
        <td><button class="btn small" data-save="${u.id}">Save</button></td>
      `;
      tbody.appendChild(tr);
    });

    tbody.addEventListener('click', async (e) => {
      const id = e.target.getAttribute('data-save');
      if (!id) return;
      const row = e.target.closest('tr');
      const inputs = row.querySelectorAll('[data-id]');
      const payload = {};
      inputs.forEach(inp => payload[inp.getAttribute('data-field')] = inp.value);
      try { await api(`/api/admin/users/${id}`, { method:'PUT', body: payload }); msg.textContent = 'Saved'; }
      catch (err) { msg.textContent = err.message; }
    });

    document.getElementById('homeForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const section = document.getElementById('section').value.trim();
      const content = document.getElementById('content').value;
      try { await api('/api/homepage', { method:'PUT', body: { section_name: section, content }}); msg.textContent = 'Homepage content saved.'; }
      catch (err) { msg.textContent = err.message; }
    });
  } catch (err) {
    msg.textContent = err.message;
  }
}
load();
