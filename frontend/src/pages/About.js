import React from 'react';
import { Box, Typography } from '@mui/material';
import './styles/home.css';  // Reuse for body text and container

const About = () => {
  return (
    <Box className="home-content page-container">  {/* Reuse home layout */}
      <Typography variant="h4" className="home-title">About Us</Typography>
      <Typography variant="body1" className="home-body">
        This is the about page. We are a team dedicated to building secure and user-friendly websites. 
        Our platform features advanced authentication, role-based access, and customizable themes.
      </Typography>
    </Box>
  );
};

export default About;