import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import './styles/forms.css';  // Import CSS
import './styles/utils.css';  // For alerts
import {
  TextField, Button, Alert, Box, Typography
} from '@mui/material';
import axios from 'axios';

const RegisterForm = ({ onLogin }) => {
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('email');  // 'email' -> 'verify' -> 'code' -> 'form'
  const navigate = useNavigate();
  const { register, handleSubmit, reset } = useForm();  // reset for steps

  // ... (existing functions: checkEmail, sendVerification, verifyCode, completeRegister)

  const renderStep = () => {
    if (step === 'email') {
      return (
        <form onSubmit={handleSubmit(checkEmail)}>
          <TextField
            {...register('email', { required: 'Email is required' })}
            label="Email"
            type="email"
            fullWidth
            className="custom-input"
            error={!!error}
            helperText={error}
            required
          />
          <Button type="submit" fullWidth variant="contained" className="custom-button" sx={{ mt: 2 }}>
            Check & Send Code
          </Button>
        </form>
      );
    }

    if (step === 'verify') {
      return (
        <>
          <Typography>Verification code sent to {email}</Typography>
          <Button onClick={sendVerification} variant="contained" className="custom-button" sx={{ mt: 2 }}>
            Resend Code
          </Button>
          <Button onClick={() => setStep('email')} sx={{ ml: 2 }}>
            Back
          </Button>
        </>
      );
    }

    if (step === 'code') {
      return (
        <form onSubmit={handleSubmit(verifyCode)}>
          <TextField
            {...register('code', { required: 'Code is required', minLength: 6 })}
            label="6-Digit Code"
            fullWidth
            className="custom-input"
            error={!!error}
            helperText={error}
            required
          />
          <Button type="submit" fullWidth variant="contained" className="custom-button" sx={{ mt: 2 }}>
            Verify
          </Button>
          <Button onClick={sendVerification} sx={{ mt: 1 }}>
            Resend
          </Button>
        </form>
      );
    }

    // Step 'form'
    return (
      <form onSubmit={handleSubmit(completeRegister)}>
        <TextField
          {...register('username', { required: 'Username is required' })}
          label="Username"
          fullWidth
          margin="normal"
          className="custom-input"
          required
        />
        <TextField
          {...register('password', { required: 'Password is required', minLength: 6 })}
          label="Password"
          type="password"
          fullWidth
          margin="normal"
          className="custom-input"
          required
        />
        {error && <Alert severity="error" className="custom-alert">{error}</Alert>}
        <Button type="submit" fullWidth variant="contained" className="custom-button" sx={{ mt: 2 }}>
          Register
        </Button>
        <Button onClick={() => setStep('code')} sx={{ mt: 1 }}>
          Back
        </Button>
      </form>
    );
  };

  return (
    <Box className="form-container">
      <Typography variant="h4" className="form-title">
        {step === 'email' ? 'Register' : step === 'code' ? 'Enter Code' : 'Complete Registration'}
      </Typography>
      {renderStep()}
    </Box>
  );
};

export default RegisterForm;