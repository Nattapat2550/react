import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api';

const initialState = {
  isAuthenticated: false,
  role: null,
  userId: null,
  user: null,
  status: 'idle',
  error: null
};

// ✅ แก้ไข 1: ใช้ endpoint /api/users/me (ไม่ใช่ /api/auth/me)
export const checkAuthStatus = createAsyncThunk(
  'auth/checkStatus',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/api/users/me');
      // ✅ แก้ไข 2: Backend Node.js ส่ง object user มาตรงๆ ไม่ได้ซ้อน data.data
      return res.data; 
    } catch (err) {
      // ถ้า 401/403 แปลว่ายังไม่ login ไม่ต้อง throw error แดง
      return rejectWithValue(null);
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password, remember }, { rejectWithValue }) => {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      
      // ✅ แก้ไข 3: รับ token และ user จาก root object
      const { token, user } = res.data;

      if (remember) {
        localStorage.setItem('token', token);
      } else {
        sessionStorage.setItem('token', token);
      }

      return user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Login failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      // ignore
    } finally {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
    }
    return {};
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Check Status
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const user = action.payload || {};
        if (user && user.id) {
          state.isAuthenticated = true;
          state.role = user.role;
          state.userId = user.id;
          state.user = user;
        } else {
          state.isAuthenticated = false;
          state.user = null;
        }
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.status = 'failed';
        state.isAuthenticated = false;
        state.user = null;
      })
      
      // Login
      .addCase(login.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.isAuthenticated = true;
        state.user = action.payload;
        state.role = action.payload.role;
        state.userId = action.payload.id;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.role = null;
        state.userId = null;
        state.user = null;
        state.status = 'idle';
      });
  }
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;