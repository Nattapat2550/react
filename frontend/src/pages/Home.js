import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import axios from 'axios';
import './styles/home.css';  // Import CSS

const Home = ({ user }) => {
  const [content, setContent] = useState({ title: '', content: '' });

  useEffect(() => {
    axios.get('/api/content').then(res => setContent(res.data || {}));
  }, []);

  return (
    <Box className="home-content page-container">
      <Typography variant="h3" className="home-title">
        {content.title || 'Welcome to Our Site'}
      </Typography>
      <Typography variant="body1" className="home-body">
        {content.content || 'This is general information on the home page.'}
      </Typography>
      <Typography className="welcome-user">
        Welcome, {user.username}!
      </Typography>
    </Box>
  );
};

export default Home;