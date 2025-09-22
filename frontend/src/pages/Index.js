import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import '../styles/home.css';  // Reuse for general layout
import '../styles/forms.css';  // For buttons

const Index = ({ onRegister, onLogin }) => {  // onLogin passed from App
  const navigate = useNavigate();
  return (
    <Box className="home-content page-container">  {/* Use home styles for index */}
      <Typography variant="h2" className="home-title">General Information</Typography>
      <Typography variant="body1" className="home-body">
        Welcome to our website. This is the index page with general info. Click register or login to get started.
      </Typography>
      <Button variant="contained" onClick={onRegister} className="custom-button" size="large" sx={{ mr: 2 }}>
        Register
      </Button>
      <Button variant="outlined" onClick={onLogin || (() => navigate('/login'))} className="custom-button" size="large">
        Login
      </Button>
    </Box>
  );
};

export default Index;