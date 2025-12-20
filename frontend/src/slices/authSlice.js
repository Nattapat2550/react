// react/frontend/src/slices/authSlice.js
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

// 1. [แก้ไข] เรียกไปที่ /api/users/me
export const checkAuthStatus = createAsyncThunk(
  'auth/checkStatus',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/api/users/me');
      // Backend (users.js) ส่ง JSON user object มาตรงๆ ไม่ได้ห่อ data.data
      // ดังนั้นใช้ res.data ได้เลย
      return res.data; 
    } catch (err) {
      // 401 Unauthorized คือเรื่องปกติของคนยังไม่ล็อกอิน
      return rejectWithValue(null);
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password, remember }, { rejectWithValue }) => {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      
      // ตรวจสอบว่า Backend ส่งอะไรกลับมา (auth.js ในเวอร์ชันล่าสุดน่าจะส่ง plain JSON)
      // ถ้า auth.js ส่ง { token, user, role }
      const data = res.data; 
      
      // กรณีถ้า Backend ห่อด้วย data (เช่น res.json({data: ...})) ให้ใช้ data.data
      const { token, user } = data.data || data; 

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

// ... (Logout ยังคงเดิม)
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/api/auth/logout');
    } catch (err) { } 
    finally {
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
        state.status = 'idle'; // เปลี่ยนเป็น idle เพื่อไม่ให้ loading ค้าง
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