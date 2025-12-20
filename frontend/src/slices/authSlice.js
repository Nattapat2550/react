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

// ✅ แก้ไข: เปลี่ยน Endpoint เป็น /api/users/me
export const checkAuthStatus = createAsyncThunk(
  'auth/checkStatus',
  async (_, { rejectWithValue }) => {
    try {
      // เรียกข้อมูล User ปัจจุบัน
      const res = await api.get('/api/users/me');
      return res.data; // { id, username, email, role, ... }
    } catch (err) {
      // ถ้า 401/403 แปลว่ายังไม่ล็อกอิน ให้ return null เงียบๆ ไม่ต้อง throw error แดงเต็มจอ
      return rejectWithValue(null);
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password, remember }, { rejectWithValue }) => {
    try {
      const res = await api.post('/api/auth/login', { email, password });
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
        const user = action.payload;
        if (user && user.id) {
          state.status = 'succeeded';
          state.isAuthenticated = true;
          state.role = user.role;
          state.userId = user.id;
          state.user = user;
        } else {
          // กรณี response แปลกๆ
          state.isAuthenticated = false;
          state.user = null;
        }
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.status = 'idle'; // เปลี่ยนเป็น idle เพื่อไม่ให้ loading ค้าง
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
        state.user = null;
        state.role = null;
        state.userId = null;
      });
  }
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;