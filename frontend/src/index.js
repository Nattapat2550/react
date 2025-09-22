import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/global.css';  // Add this
import App from './App.js';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ThemeProvider theme={theme}>
    <App />
  </ThemeProvider>
);