import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/forms.css';  // For dialogs and inputs
import '../styles/navbar.css';  // For dropdown items
import '../styles/utils.css';  // For file upload
import {
  MenuItem, Divider, Dialog, TextField, Button, Box, Typography, Avatar, IconButton
} from '@mui/material';
import { Edit, Delete, Palette, PhotoCamera } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import axios from 'axios';

const ProfileDropdown = ({ user, onClose, onLogout, themeMode, onThemeChange }) => {
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [editFile, setEditFile] = useState(null);  // For preview
  const navigate = useNavigate();
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { username: user.username }
  });

  // ... (existing functions: handleEdit, handleDelete)

  const handlePicUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setEditFile(event.target.result);  // Preview
        axios.put('/api/users/profile', {
          profilePic: event.target.result
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }).then(() => {
          onClose();
          window.location.reload();
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <MenuItem onClick={() => setOpenEdit(true)} className="dropdown-item">
        <Edit fontSize="small" sx={{ mr: 1 }} /> Edit Name
      </MenuItem>
      <label className="file-label">
        <MenuItem component="span" className="dropdown-item">
          <PhotoCamera fontSize="small" sx={{ mr: 1 }} /> Upload Picture
        </MenuItem>
        <input type="file" className="file-input" accept="image/*" onChange={handlePicUpload} />
      </label>
      <MenuItem onClick={() => onThemeChange(themeMode === 'light' ? 'dark' : 'light')} className="dropdown-item">
        <Palette fontSize="small" sx={{ mr: 1 }} /> Toggle Theme ({themeMode})
      </MenuItem>
      <Divider />
      <MenuItem onClick={onLogout} className="dropdown-item">
        <Logout fontSize="small" sx={{ mr: 1 }} /> Logout
      </MenuItem>
      <MenuItem onClick={() => setOpenDelete(true)} className="dropdown-item">
        <Delete fontSize="small" sx={{ mr: 1 }} /> Delete Account
      </MenuItem>

      {/* Edit Dialog */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} className="custom-dialog">
        <Box component="form" onSubmit={handleSubmit(handleEdit)} p={3}>
          <Typography variant="h6">Edit Profile</Typography>
          {editFile && (
            <Avatar src={editFile} sx={{ width: 80, height: 80, mx: 'auto', my: 2 }} />
          )}
          <TextField
            {...register('username')}
            label="Username"
            fullWidth
            margin="normal"
            className="custom-input"
          />
          <Button type="submit" variant="contained" className="custom-button">Save</Button>
          <Button onClick={() => setOpenEdit(false)} sx={{ ml: 2 }}>Cancel</Button>
        </Box>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)} className="custom-dialog">
        <Box p={3}>
          <Typography>Delete account? This is permanent.</Typography>
          <Button onClick={handleDelete} color="error" className="custom-button">Delete</Button>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
        </Box>
      </Dialog>
    </>
  );
};

export default ProfileDropdown;