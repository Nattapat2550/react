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

// ตรวจสอบสถานะ Login (เรียก /status ตามแบบ Docker)
export const checkAuthStatus = createAsyncThunk(
  'auth/checkStatus',
  async (_, { rejectWithValue }) => {
    try {
      // Backend (auth.js) คืนค่า { authenticated: true, id: ..., role: ... }
      const res = await api.get('/api/auth/status');
      return res.data; 
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
      
      // Backend (auth.js) ที่แก้แล้ว คืนค่า { token, role, user } ตรงๆ ไม่ซ้อน data
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
        const data = action.payload || {};
        
        // Response จาก /status คือ { authenticated, id, role }
        if (data.authenticated) {
            state.isAuthenticated = true;
            state.role = data.role;
            state.userId = data.id;
            // หมายเหตุ: /status ของ docker ไม่คืน user object เต็มๆ 
            // ถ้าต้องการ full user อาจต้อง fetch แยก หรือใช้ค่าเดิมที่มี
            if (!state.user) {
                state.user = { id: data.id, role: data.role }; 
            }
        } else {
            state.isAuthenticated = false;
            state.role = null;
            state.userId = null;
            state.user = null;
        }
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