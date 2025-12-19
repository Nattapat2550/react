import React, { useEffect, useState } from 'react';
import api from '../api';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const AdminPage = () => {
  const { role } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const [tab, setTab] = useState('users'); // 'users' หรือ 'carousel'

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/home');
    }
  }, [role, navigate]);

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem' }}>Admin Dashboard</h2>
      
      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #ddd' }}>
        <button 
          className={`btn ${tab === 'users' ? '' : 'outline'}`} 
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: 'none' }}
          onClick={() => setTab('users')}
        >
          Manage Users
        </button>
        <button 
          className={`btn ${tab === 'carousel' ? '' : 'outline'}`} 
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: 'none' }}
          onClick={() => setTab('carousel')}
        >
          Manage Carousel
        </button>
      </div>

      {/* Render Sub-components */}
      {tab === 'users' ? <UsersManager /> : <CarouselManager />}
    </div>
  );
};

// --- Sub-Component: Manage Users ---
const UsersManager = () => {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await api.get(`/api/admin/users?page=${page}&q=${search}`);
      if (res.data.ok) {
        setUsers(res.data.data.users);
        setTotalPages(res.data.data.total_pages);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchUsers(); }, [page, search]);

  const handleRoleChange = async (id, newRole) => {
    try {
      await api.patch(`/api/admin/users/${id}`, { role: newRole });
      // update local state เพื่อความลื่นไหลไม่ต้อง fetch ใหม่ทันที
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
    } catch (err) {
      alert('Update failed');
    }
  };

  return (
    <div>
      <input 
        type="text" placeholder="Search by email..." 
        value={search} onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: '1rem', padding: '0.6rem', width: '100%', borderRadius: '4px', border: '1px solid #ccc' }}
      />
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <thead>
            <tr style={{ background: '#f8fafc', textAlign: 'left', color: '#64748b' }}>
              <th style={{ padding: '1rem' }}>User</th>
              <th style={{ padding: '1rem' }}>Role</th>
              <th style={{ padding: '1rem' }}>Verified</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <img 
                      src={u.profile_picture_url || '/images/user.png'} 
                      alt="avatar" 
                      style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', background: '#eee' }}
                      onError={(e) => { e.target.src = '/images/user.png'; }} // Fallback
                    />
                    <div>
                      <div style={{ fontWeight: '600' }}>{u.username || 'No Name'}</div>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <select 
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid #ddd' }}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td style={{ padding: '1rem' }}>
                  {u.is_email_verified ? '✅' : '❌'}
                </td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center' }}>No users found</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1rem', alignItems: 'center' }}>
        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn outline small">Prev</button>
        <span>Page {page} of {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn outline small">Next</button>
      </div>
    </div>
  );
};

// --- Sub-Component: Manage Carousel ---
const CarouselManager = () => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [file, setFile] = useState(null);

  const fetchSlides = async () => {
    const res = await api.get('/api/carousel');
    setSlides(res.data.data || []);
  };

  useEffect(() => { fetchSlides(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this slide?')) return;
    try {
      await api.delete(`/api/carousel/${id}`);
      fetchSlides();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert('Please select an image file');
    setLoading(true);

    // Convert File -> Base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result;
      try {
        await api.post('/api/carousel', {
          title,
          description: desc,
          image_dataurl: base64, // ส่งไปให้ backend บันทึก
          item_index: slides.length + 1
        });
        // Reset Form
        setTitle(''); setDesc(''); setFile(null);
        // Reset File Input
        document.getElementById('fileInput').value = "";
        fetchSlides();
      } catch (err) {
        alert('Failed to add slide. File might be too large.');
      } finally {
        setLoading(false);
      }
    };
  };

  return (
    <div>
      {/* Upload Form */}
      <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f1f5f9', borderRadius: '8px' }}>
        <h3 style={{ marginTop: 0 }}>Add New Slide</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxWidth: '500px' }}>
          <input 
            type="text" placeholder="Title" required 
            value={title} onChange={e=>setTitle(e.target.value)}
            style={{ padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <input 
            type="text" placeholder="Description (Optional)" 
            value={desc} onChange={e=>setDesc(e.target.value)}
            style={{ padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <input 
            id="fileInput"
            type="file" accept="image/*" required 
            onChange={e=>setFile(e.target.files[0])}
          />
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Uploading...' : 'Add Slide'}
          </button>
        </form>
      </div>

      {/* Slides Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
        {slides.map(s => (
          <div key={s.id} style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', background: 'white' }}>
            <div style={{ height: '150px', background: '#000' }}>
              <img 
                src={s.image_dataurl} 
                alt="slide" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
              />
            </div>
            <div style={{ padding: '1rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>{s.title}</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>{s.description || '-'}</p>
              <button 
                onClick={() => handleDelete(s.id)}
                style={{ 
                  marginTop: '1rem', width: '100%', padding: '0.5rem', 
                  background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', 
                  borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' 
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPage;