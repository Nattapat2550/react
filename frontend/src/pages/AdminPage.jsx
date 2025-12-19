import React, { useEffect, useState } from 'react';
import api from '../api';

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [carousel, setCarousel] = useState([]);
  const [sectionName, setSectionName] = useState('welcome_header');
  const [sectionContent, setSectionContent] = useState('');
  
  // Carousel Form
  const [newIndex, setNewIndex] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newImage, setNewImage] = useState(null);
  const [fileMap, setFileMap] = useState({});
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        // ✅ Path ของ Rust
        const usersRes = await api.get('/api/users');
        setUsers(usersRes.data.data || []);

        const carouselRes = await api.get('/api/carousel');
        setCarousel(carouselRes.data.data || []);
      } catch (err) {
        setMsg(err.response?.data?.error || 'Failed to load admin data');
      }
    };
    load();
  }, []);

  const handleHomeSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      await api.put('/api/homepage', {
        section_name: sectionName.trim(),
        content: sectionContent
      });
      setMsg(`Section saved.`);
    } catch (err) {
      setMsg('Failed to save homepage section');
    }
  };

  const handleUserFieldChange = (id, field, value) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, [field]: value } : u));
  };

  const handleUserSave = async (id) => {
    setMsg(null);
    const u = users.find((x) => x.id === id);
    if (!u) return;
    try {
      // ✅ ใช้ PATCH /api/users/:id/role
      await api.patch(`/api/users/${id}/role`, { role: u.role });
      setMsg('User role saved.');
    } catch (err) {
      setMsg('Failed to save user role');
    }
  };

  // ---- Carousel Logic ----
  const reloadCarousel = async () => {
    const res = await api.get('/api/carousel');
    setCarousel(res.data.data || []);
    setFileMap({});
  };

  const handleNewCarouselSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (!newImage) { setMsg('Image required'); return; }

    // ✅ แปลงรูปเป็น Base64 ส่งไป Backend
    const reader = new FileReader();
    reader.readAsDataURL(newImage);
    reader.onload = async () => {
      try {
        await api.post('/api/carousel', {
          item_index: parseInt(newIndex || '0'),
          title: newTitle,
          subtitle: newSubtitle,
          description: newDescription,
          image_dataurl: reader.result // ส่ง Base64 String
        });
        setNewIndex(''); setNewTitle(''); setNewSubtitle(''); setNewDescription(''); setNewImage(null);
        await reloadCarousel();
        setMsg('Item created.');
      } catch (err) {
        setMsg('Failed to create item');
      }
    };
  };

  const handleCarouselFieldChange = (id, field, value) => {
    setCarousel(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };
  
  const handleCarouselFileChange = (id, file) => {
    setFileMap(prev => ({ ...prev, [id]: file }));
  };

  const handleCarouselSave = async (id) => {
    const item = carousel.find(x => x.id === id);
    if (!item) return;

    const payload = {
      item_index: item.item_index,
      title: item.title,
      subtitle: item.subtitle,
      description: item.description
    };

    const doUpdate = async (p) => {
      try {
         await api.patch(`/api/carousel/${id}`, p);
         setMsg('Item saved.');
         reloadCarousel();
      } catch(err) { setMsg('Failed to save'); }
    };

    if (fileMap[id]) {
      const reader = new FileReader();
      reader.readAsDataURL(fileMap[id]);
      reader.onload = () => {
        payload.image_dataurl = reader.result;
        doUpdate(payload);
      };
    } else {
      doUpdate(payload);
    }
  };

  const handleCarouselDelete = async (id) => {
    if (!window.confirm('Delete?')) return;
    try {
      await api.delete(`/api/carousel/${id}`);
      setCarousel(prev => prev.filter(x => x.id !== id));
    } catch(err) { setMsg('Failed to delete'); }
  };

  return (
    <>
      <h2>Admin Dashboard</h2>
      
      <section>
        <h3>Homepage Content</h3>
        <form onSubmit={handleHomeSubmit}>
           <label>Section</label><input value={sectionName} onChange={e=>setSectionName(e.target.value)} required/>
           <label>Content</label><textarea value={sectionContent} onChange={e=>setSectionContent(e.target.value)} />
           <button className="btn">Save</button>
        </form>
      </section>

      <section>
        <h3>Users (Role Only)</h3>
        <table>
          <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Action</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>
                  <select value={u.role} onChange={e => handleUserFieldChange(u.id, 'role', e.target.value)}>
                    <option value="user">user</option><option value="admin">admin</option>
                  </select>
                </td>
                <td><button className="btn small" onClick={()=>handleUserSave(u.id)}>Save</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h3>Carousel</h3>
        <form onSubmit={handleNewCarouselSubmit}>
           <input type="number" placeholder="Index" value={newIndex} onChange={e=>setNewIndex(e.target.value)} />
           <input placeholder="Title" value={newTitle} onChange={e=>setNewTitle(e.target.value)} />
           <input placeholder="Subtitle" value={newSubtitle} onChange={e=>setNewSubtitle(e.target.value)} />
           <input placeholder="Desc" value={newDescription} onChange={e=>setNewDescription(e.target.value)} />
           <input type="file" onChange={e=>setNewImage(e.target.files[0])} />
           <button className="btn">Add</button>
        </form>
        <div style={{marginTop: '10px'}}>
        {carousel.map(c => (
           <div key={c.id} style={{borderBottom:'1px solid #ccc', padding:'5px', display:'flex', gap:'10px', alignItems:'center'}}>
              {c.image_dataurl && <img src={c.image_dataurl} width="50" />}
              <span>{c.title}</span>
              <button className="btn small danger" onClick={()=>handleCarouselDelete(c.id)}>Delete</button>
              {/* ปุ่ม Save/Edit ย่อไว้ในตัวอย่างนี้เพื่อความกระชับ แต่ฟังก์ชันมีให้แล้วข้างบน */}
           </div>
        ))}
        </div>
      </section>
      
      {msg && <p style={{color:'red'}}>{msg}</p>}
    </>
  );
};

export default AdminPage;