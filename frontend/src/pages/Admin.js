import React, { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import axios from 'axios';
import '../styles/admin.css';  // Import main admin CSS
import '../styles/forms.css';  // For dialogs and inputs
import '../styles/utils.css';  // For buttons and alerts

const Admin = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [content, setContent] = useState({ title: '', content: '' });
  const [editUserId, setEditUserId] = useState(null);
  const [editUserData, setEditUserData] = useState({});
  const [editContentOpen, setEditContentOpen] = useState(false);
  const [openEditUser , setOpenEditUser ] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchContent();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

  const fetchContent = async () => {
    try {
      const res = await axios.get('/api/content');
      setContent(res.data);
      setNewTitle(res.data.title || '');
      setNewContent(res.data.content || '');
    } catch (err) {
      console.error('Failed to fetch content', err);
    }
  };

  const handleEditUser  = (user) => {
    setEditUserData({ ...user });
    setEditUserId(user.id);
    setOpenEditUser (true);
  };

  const handleSaveUser  = async () => {
    try {
      await axios.put(`/api/admin/users/${editUserId}`, editUserData);
      fetchUsers();
      setOpenEditUser (false);
    } catch (err) {
      console.error('Failed to update user', err);
    }
  };

  const handleDeleteUser  = async (id) => {
    if (window.confirm('Delete this user?')) {
      try {
        await axios.delete(`/api/admin/users/${id}`);
        fetchUsers();
      } catch (err) {
        console.error('Failed to delete user', err);
      }
    }
  };

  const handleEditContent = () => {
    setEditContentOpen(true);
  };

  const handleSaveContent = async () => {
    try {
      await axios.put('/api/content', { title: newTitle, content: newContent });
      fetchContent();
      setEditContentOpen(false);
    } catch (err) {
      console.error('Failed to update content', err);
    }
  };

  return (
    <Box className="admin-container page-container">
      <Typography variant="h4" className="admin-title">Admin Panel</Typography>
      <Typography className="welcome-user">Welcome, {user.username}!</Typography>

      {/* Site Content Edit */}
      <Box className="admin-section">
        <Typography variant="h5">Home Page Content</Typography>
        <Typography className="home-body">{content.title}: {content.content}</Typography>
        <Button variant="contained" onClick={handleEditContent} className="admin-button">
          Edit Content
        </Button>
      </Box>

      {/* Users Table */}
      <Box className="admin-section">
        <Typography variant="h5">Users</Typography>
        <Table className="custom-table">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Profile Pic</TableCell>
              <TableCell>Theme</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.id}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.username}</TableCell>
                <TableCell>{u.role}</TableCell>
                <TableCell>
                  <img src={u.profile_pic || '/User .png'} alt="pic" width="50" className="custom-avatar" />
                </TableCell>
                <TableCell>{u.theme}</TableCell>
                <TableCell>
                  <Button onClick={() => handleEditUser (u)} className="admin-button">Edit</Button>
                  <Button onClick={() => handleDeleteUser (u.id)} color="error" className="admin-button">Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      {/* Edit User Dialog */}
      <Dialog open={openEditUser } onClose={() => setOpenEditUser (false)} className="custom-dialog">
        <DialogTitle>Edit User {editUserId}</DialogTitle>
        <DialogContent>
          <TextField
            label="Email"
            value={editUserData.email || ''}
            onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
            fullWidth
            className="custom-input"
            sx={{ mt: 2 }}
          />
          <TextField
            label="Username"
            value={editUserData.username || ''}
            onChange={(e) => setEditUserData({ ...editUserData, username: e.target.value })}
            fullWidth
            className="custom-input"
            sx={{ mt: 2 }}
          />
          <TextField
            label="Role (user/admin)"
            value={editUserData.role || ''}
            onChange={(e) => setEditUserData({ ...editUserData, role: e.target.value })}
            fullWidth
            className="custom-input"
            sx={{ mt: 2 }}
          />
          <TextField
            label="Theme (light/dark)"
            value={editUserData.theme || ''}
            onChange={(e) => setEditUserData({ ...editUserData, theme: e.target.value })}
            fullWidth
            className="custom-input"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditUser (false)}>Cancel</Button>
          <Button onClick={handleSaveUser } variant="contained" className="custom-button">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Content Dialog */}
      <Dialog open={editContentOpen} onClose={() => setEditContentOpen(false)} className="custom-dialog">
        <DialogTitle>Edit Home Page Content</DialogTitle>
        <DialogContent>
          <TextField
            label="Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            fullWidth
            className="custom-input"
            sx={{ mt: 2 }}
            inputProps={{ maxLength: 255 }}
          />
          <TextField
            label="Content"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            fullWidth
            multiline
            rows={4}
            className="custom-input"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditContentOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveContent} variant="contained" className="custom-button">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Admin;