import React, { useEffect, useState } from 'react';
import api from '../api';

function authHeader() {
  const t = localStorage.getItem('token') || sessionStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}` } : undefined;
}

const AdminPage = () => {
  const [msg, setMsg] = useState('');
  const [users, setUsers] = useState([]);
  const [section, setSection] = useState('welcome_title');
  const [content, setContent] = useState('');

  const [carousel, setCarousel] = useState([]);

  // create carousel form
  const [cIndex, setCIndex] = useState('0');
  const [cTitle, setCTitle] = useState('');
  const [cSubtitle, setCSubtitle] = useState('');
  const [cDesc, setCDesc] = useState('');
  const [cImage, setCImage] = useState(null);

  const loadUsers = async () => {
    const res = await api.get('/api/admin/users');
    setUsers(Array.isArray(res.data) ? res.data : []);
  };

  const loadCarousel = async () => {
    const res = await api.get('/api/admin/carousel');
    setCarousel(Array.isArray(res.data) ? res.data : []);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await Promise.all([loadUsers(), loadCarousel()]);
        if (cancelled) return;
      } catch (e) {
        setMsg(e.response?.data?.error || 'Admin load failed');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const saveUser = async (id, patch) => {
    setMsg('');
    try {
      await api.put(`/api/admin/users/${id}`, patch);
      setMsg('Saved');
      await loadUsers();
    } catch (e) {
      setMsg(e.response?.data?.error || 'Save failed');
    }
  };

  const saveHomepage = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await api.put('/api/homepage', { section_name: section.trim(), content });
      setMsg(`Section "${section}" saved.`);
    } catch (e) {
      setMsg(e.response?.data?.error || 'Homepage save failed');
    }
  };

  const createCarousel = async (e) => {
    e.preventDefault();
    setMsg('');

    if (!cImage) {
      setMsg('Please choose an image.');
      return;
    }

    try {
      const fd = new FormData();
      fd.append('image', cImage);
      fd.append('itemIndex', cIndex);
      fd.append('title', cTitle);
      fd.append('subtitle', cSubtitle);
      fd.append('description', cDesc);

      const res = await fetch(`${api.defaults.baseURL}/api/admin/carousel`, {
        method: 'POST',
        credentials: 'include',
        headers: authHeader(),
        body: fd,
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: 'Create failed' }));
        throw new Error(j.error || 'Create failed');
      }

      setMsg('Slide added.');
      setCIndex('0');
      setCTitle('');
      setCSubtitle('');
      setCDesc('');
      setCImage(null);
      await loadCarousel();
    } catch (err) {
      setMsg(err.message || 'Create failed');
    }
  };

  const updateCarousel = async (id, row) => {
    setMsg('');
    try {
      const fd = new FormData();
      fd.append('itemIndex', row.item_index);
      fd.append('title', row.title || '');
      fd.append('subtitle', row.subtitle || '');
      fd.append('description', row.description || '');
      if (row._newImage) fd.append('image', row._newImage);

      const res = await fetch(`${api.defaults.baseURL}/api/admin/carousel/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: authHeader(),
        body: fd,
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: 'Update failed' }));
        throw new Error(j.error || 'Update failed');
      }

      setMsg('Saved.');
      await loadCarousel();
    } catch (err) {
      setMsg(err.message || 'Update failed');
    }
  };

  const deleteCarousel = async (id) => {
    if (!confirm('Delete this slide?')) return;
    setMsg('');
    try {
      const res = await fetch(`${api.defaults.baseURL}/api/admin/carousel/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: authHeader(),
      });
      if (!res.ok && res.status !== 204) {
        const j = await res.json().catch(() => ({ error: 'Delete failed' }));
        throw new Error(j.error || 'Delete failed');
      }
      setMsg('Deleted.');
      await loadCarousel();
    } catch (err) {
      setMsg(err.message || 'Delete failed');
    }
  };

  return (
    <>
      <h1>Admin Panel</h1>

      <p className="muted" id="msg">{msg}</p>

      <section className="card">
        <h2>Homepage Content</h2>
        <form id="homeForm" onSubmit={saveHomepage}>
          <label>Section name</label>
          <input
            id="section"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            placeholder="welcome_title / main_paragraph"
            required
          />
          <label>Content</label>
          <textarea
            id="content"
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <button className="btn" type="submit">Save</button>
        </form>
      </section>

      <section className="card">
        <h2>Users</h2>
        <div style={{ overflowX: 'auto' }}>
          <table id="usersTable">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <UserRow key={u.id} u={u} onSave={saveUser} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>Carousel</h2>

        <form id="carouselForm" onSubmit={createCarousel}>
          <div className="card-grid">
            <div>
              <label>Index</label>
              <input type="number" id="cIndex" value={cIndex} onChange={(e) => setCIndex(e.target.value)} />
            </div>
            <div>
              <label>Title</label>
              <input type="text" id="cTitle" value={cTitle} onChange={(e) => setCTitle(e.target.value)} />
            </div>
            <div>
              <label>Subtitle</label>
              <input type="text" id="cSubtitle" value={cSubtitle} onChange={(e) => setCSubtitle(e.target.value)} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label>Description</label>
              <textarea id="cDesc" rows={2} value={cDesc} onChange={(e) => setCDesc(e.target.value)} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label>Image</label>
              <input
                id="cImage"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                onChange={(e) => setCImage(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <button className="btn" type="submit">Add Slide</button>
        </form>

        <hr />

        <div style={{ overflowX: 'auto' }}>
          <table id="carouselTable">
            <thead>
              <tr>
                <th>ID</th>
                <th>Index</th>
                <th>Preview</th>
                <th>Title</th>
                <th>Subtitle</th>
                <th>Description</th>
                <th>New Image</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {carousel.map((it) => (
                <CarouselRow
                  key={it.id}
                  it={it}
                  onSave={updateCarousel}
                  onDelete={deleteCarousel}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

function UserRow({ u, onSave }) {
  const [username, setUsername] = useState(u.username || '');
  const [email, setEmail] = useState(u.email || '');
  const [role, setRole] = useState(u.role || 'user');

  return (
    <tr>
      <td>{u.id}</td>
      <td><input value={username} onChange={(e) => setUsername(e.target.value)} /></td>
      <td><input value={email} onChange={(e) => setEmail(e.target.value)} /></td>
      <td>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
      </td>
      <td>
        <button className="btn small" type="button" onClick={() => onSave(u.id, { username, email, role })}>
          Save
        </button>
      </td>
    </tr>
  );
}

function CarouselRow({ it, onSave, onDelete }) {
  const [row, setRow] = useState({
    id: it.id,
    item_index: it.item_index,
    image_dataurl: it.image_dataurl,
    title: it.title || '',
    subtitle: it.subtitle || '',
    description: it.description || '',
    _newImage: null,
  });

  return (
    <tr>
      <td>{row.id}</td>
      <td>
        <input
          type="number"
          style={{ width: 80 }}
          value={row.item_index}
          onChange={(e) => setRow((r) => ({ ...r, item_index: e.target.value }))}
        />
      </td>
      <td>
        <img
          src={row.image_dataurl}
          alt="preview"
          style={{ width: 120, height: 60, objectFit: 'cover', borderRadius: '.25rem' }}
        />
      </td>
      <td><input value={row.title} onChange={(e) => setRow((r) => ({ ...r, title: e.target.value }))} /></td>
      <td><input value={row.subtitle} onChange={(e) => setRow((r) => ({ ...r, subtitle: e.target.value }))} /></td>
      <td>
        <textarea
          rows={2}
          value={row.description}
          onChange={(e) => setRow((r) => ({ ...r, description: e.target.value }))}
        />
      </td>
      <td>
        <input
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
          onChange={(e) => setRow((r) => ({ ...r, _newImage: e.target.files?.[0] || null }))}
        />
      </td>
      <td>
        <button className="btn" type="button" onClick={() => onSave(row.id, row)}>Save</button>{' '}
        <button className="btn danger" type="button" onClick={() => onDelete(row.id)}>Delete</button>
      </td>
    </tr>
  );
}

export default AdminPage;
