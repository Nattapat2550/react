import React from 'react';
import { Box, Typography } from '@mui/material';
import './styles/home.css';  // Reuse for body text and container

const Contact = () => {
  return (
    <Box className="home-content page-container">  {/* Reuse home layout */}
      <Typography variant="h4" className="home-title">Contact Us</Typography>
      <Typography variant="body1" className="home-body">
        This is the contact page. Email us at nyansungvon@gmail.com or call 123-456-7890. 
        We're here to help with any questions about registration, login, or admin features.
      </Typography>
    </Box>
  );
};

export default Contact;