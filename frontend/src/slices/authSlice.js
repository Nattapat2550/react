import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api';

const initialState = {
  isAuthenticated: false,
  role: null,
  userId: null,
  user: null,
  status: 'idle', // idle | loading | succeeded | failed
  error: null,
};

// ✅ เช็คสถานะด้วย /api/users/me (เหมือนแนว docker guard)
export const checkAuthStatus = createAsyncThunk(
  'auth/checkStatus',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/api/users/me');
      return res.data; // user object ตรง ๆ
    } catch (_err) {
      return rejectWithValue(null);
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password, remember }, { rejectWithValue }) => {
    try {
      // ✅ ส่ง remember ให้ backend ด้วย (เหมือน docker)
      const res = await api.post('/api/auth/login', { email, password, remember });

      const data = res.data || {};
      const token = data.token;
      const user = data.user;

      if (token) {
        if (remember) localStorage.setItem('token', token);
        else sessionStorage.setItem('token', token);
      }

      return user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Login failed');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await api.post('/api/auth/logout');
  } catch {}
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
  return {};
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // checkAuthStatus
      .addCase(checkAuthStatus.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const user = action.payload || {};
        if (user && user.id) {
          state.isAuthenticated = true;
          state.user = user;
          state.userId = user.id;
          state.role = user.role || 'user';
        } else {
          state.isAuthenticated = false;
          state.user = null;
          state.userId = null;
          state.role = null;
        }
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        // ✅ สำคัญ: ห้ามกลับไป idle ไม่งั้น ProtectedRoute จะ dispatch วนไม่หยุด
        state.status = 'succeeded';
        state.isAuthenticated = false;
        state.user = null;
        state.userId = null;
        state.role = null;
      })

      // login
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.isAuthenticated = true;
        state.user = action.payload || null;
        state.userId = action.payload?.id || null;
        state.role = action.payload?.role || 'user';
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Login failed';
      })

      // logout
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.role = null;
        state.userId = null;
        state.user = null;
        state.status = 'idle';
        state.error = null;
      });
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;