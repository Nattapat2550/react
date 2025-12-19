import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api';

const initialState = {
  isAuthenticated: false,
  role: null,
  userId: null,
  user: null, // ✅ เพิ่ม field นี้เพื่อเก็บข้อมูล User ทั้งหมดรวมถึงรูปภาพ
  status: 'idle',
  error: null
};

// ตรวจสอบสถานะ Login (เรียก /me)
export const checkAuthStatus = createAsyncThunk(
  'auth/checkStatus',
  async (_, { rejectWithValue }) => {
    try {
      // Browser จะส่ง Cookie ไปเองอัตโนมัติ (สำหรับเคส Google OAuth)
      // หรือส่ง Header Authorization (สำหรับเคส Login ปกติ) ตาม interceptor ใน api.js
      const res = await api.get('/api/auth/me');
      return res.data.data; // Rust ส่งกลับมาใน format { ok: true, data: user }
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Check auth failed');
    }
  }
);

// Login ด้วย Email/Password
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password, remember }, { rejectWithValue }) => {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      
      const { token, user } = res.data.data;

      // เก็บ Token ไว้ใช้กับ api.js interceptor
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
      await api.post('/api/auth/logout'); // สั่งลบ Cookie ฝั่ง Server
    } catch (err) {
      // ignore errors
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
      .addCase(checkAuthStatus.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const user = action.payload || {};
        state.isAuthenticated = !!user.id;
        state.role = user.id ? user.role : null;
        state.userId = user.id || null;
        state.user = user;
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.status = 'failed';
        state.isAuthenticated = false;
        state.role = null;
        state.userId = null;
        state.user = null;
      })
      
      // Login
      .addCase(login.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const user = action.payload || {};
        state.isAuthenticated = !!user.id;
        state.role = user.role || null;
        state.userId = user.id || null;
        state.user = user;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Login failed';
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