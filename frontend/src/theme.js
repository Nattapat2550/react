import { createTheme } from '@mui/material/styles';

const getTheme = (mode) => createTheme({
  palette: {
    mode,
    ...(mode === 'dark' ? { background: { default: '#121212' } } : {}),
  },
});

export default getTheme;