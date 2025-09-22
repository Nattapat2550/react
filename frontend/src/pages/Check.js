// This is integrated into RegisterForm above for flow; standalone if needed
import React from 'react';
import { Typography, Button } from '@mui/material';

const Check = () => {
  return (
    <div>
      <Typography>Check your email for the 6-digit code.</Typography>
      <Button onClick={() => window.history.back()}>Back</Button>
    </div>
  );
};

export default Check;