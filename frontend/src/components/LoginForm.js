import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import '../styles/forms.css';  // Import CSS
import '../styles/utils.css';  // For alerts
import {
  TextField, Button, Checkbox, FormControlLabel, Alert, Box, Typography, IconButton
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import axios from 'axios';

const LoginForm = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();  // Add errors for validation

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/auth/login', data);
      onLogin(res.data.token, res.data.user, res.data.redirect);
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed');
    }
    setLoading(false);
  };

  const handleForget = async (email) => {
    try {
      await axios.post('/auth/forget-password', { email });
      setError('Reset code sent to email');  // Use success styling
    } catch (err) {
      setError('Email not found');
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.REACT_APP_GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.REACT_APP_API_URL + '/auth/google/callback')}&response_type=code&scope=profile email`;
  };

  return (
    <Box className="form-container">
      <Typography variant="h4" className="form-title">Login</Typography>
      <form onSubmit={handleSubmit(onSubmit)}>
        <TextField
          {...register('email', { required: 'Email is required' })}
          label="Email"
          type="email"
          fullWidth
          margin="normal"
          className="custom-input"
          error={!!errors.email}
          helperText={errors.email?.message}
          required
        />
        <div className="custom-password-input">
          <TextField
            {...register('password', { required: 'Password is required' })}
            label="Password"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            margin="normal"
            className="custom-input"
            error={!!errors.password}
            helperText={errors.password?.message}
            required
            InputProps={{
              endAdornment: (
                <IconButton className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              )
            }}
          />
        </div>
        <FormControlLabel
          className="custom-checkbox"
          control={<Checkbox {...register('remember')} />}
          label="Remember me"
        />
        {error && (
          <Alert severity={error.includes('sent') ? 'success' : 'error'} className="custom-alert">
            {error}
          </Alert>
        )}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading}
          className="custom-button"
        >
          {loading ? <span className="loading-spinner"></span> : 'Login'}
        </Button>
      </form>
      <Button
        fullWidth
        onClick={handleGoogleLogin}
        variant="outlined"
        className="custom-button"
        sx={{ mt: 2 }}
      >
        Login with Google
      </Button>
      <Button
        fullWidth
        onClick={() => navigate('/register')}
        variant="text"
        sx={{ mt: 1 }}
      >
        Register
      </Button>
      <Button
        variant="text"
        onClick={() => {
          const email = prompt('Enter email for reset:');
          if (email) handleForget(email);
        }}
        sx={{ mt: 1, display: 'block', mx: 'auto' }}
      >
        Forgot Password?
      </Button>
    </Box>
  );
};

export default LoginForm;