import React, { useEffect, useState } from 'react';
import api from '../api';

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const meRes = await api.get('/api/users/me');
        if (meRes.data.role !== 'admin') {
          setMsg('You are not admin.');
          return;
        }
        const usersRes = await api.get('/api/admin/users');
        setUsers(usersRes.data || []);
      } catch (err) {
        setMsg(err.response?.data?.error || 'Failed to load admin data');
      }
    };
    load();
  }, []);

  return (
    <section>
      <h2>Admin</h2>
      {msg && <p style={{ color: 'red' }}>{msg}</p>}
      {users.length > 0 && (
        <table border="1" cellPadding="4">
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Username</th>
              <th>Role</th>
              <th>Verified</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.email}</td>
                <td>{u.username}</td>
                <td>{u.role}</td>
                <td>{u.is_email_verified ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
};

export default AdminPage;
