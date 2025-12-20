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

// ตรวจสอบสถานะ Login (ใช้ /api/users/me เพื่อดึงข้อมูล User)
export const checkAuthStatus = createAsyncThunk(
  'auth/checkStatus',
  async (_, { rejectWithValue }) => {
    try {
      // เปลี่ยนจาก /api/auth/me (ซึ่งไม่มีอยู่จริง) เป็น /api/users/me
      const res = await api.get('/api/users/me');
      
      // Node Backend ส่ง object user มาตรงๆ ไม่ได้ห่อใน data.data
      return res.data; 
    } catch (err) {
      // 401/403 ถือว่าปกติสำหรับคนยังไม่ Login
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
      
      // Backend ส่ง { token, user, role } มาตรงๆ ใน res.data
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
        const user = action.payload || {};
        state.isAuthenticated = !!user.id;
        state.role = user.role || null;
        state.userId = user.id || null;
        state.user = user;
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.status = 'failed'; // หรือ 'idle' ก็ได้ ถ้ามองว่า guest คือสถานะปกติ
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