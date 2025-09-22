import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';  // Add if not present
import '../styles/navbar.css';  // Import CSS
import '../styles/utils.css';   // For shared utilities
import {
  AppBar, Toolbar, Typography, Button, IconButton, Menu, MenuItem, Avatar, Switch
} from '@mui/material';
import { AccountCircle, Settings, Logout } from '@mui/icons-material';
import ProfileDropdown from '../ProfileDropdown';

const Navbar = ({ user, onLogout, themeMode, onThemeChange }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();  // For navigation

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const profilePic = user.profilePic || '/User .png';  // Note: Fixed filename to User.png (no space)

  return (
    <AppBar position="static" className="navbar">
      <Toolbar>
        <Typography variant="h6" className="site-name">
          Website Name
        </Typography>
        <Button className="nav-button" onClick={() => navigate('/about')}>
          About
        </Button>
        <Button className="nav-button" onClick={() => navigate('/contact')}>
          Contact
        </Button>
        {user && (
          <>
            <div className="avatar-container">
              <IconButton onClick={handleMenu}>
                <Avatar className="custom-avatar" alt={user.username} src={profilePic} />
              </IconButton>
            </div>
            <Menu
              id="menu"
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              className="dropdown-menu"
              classes={{ paper: 'dropdown-menu' }}  // Apply CSS to paper
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <ProfileDropdown
                user={user}
                onClose={handleClose}
                onLogout={onLogout}
                themeMode={themeMode}
                onThemeChange={onThemeChange}
              />
            </Menu>
            <Switch
              className="custom-switch"
              checked={themeMode === 'dark'}
              onChange={(e) => onThemeChange(e.target.checked ? 'dark' : 'light')}
            />
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;