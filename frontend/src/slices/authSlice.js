import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api';

const initialState = {
  isAuthenticated: false,
  role: null,
  userId: null,
  status: 'idle',
  error: null
};

export const checkAuthStatus = createAsyncThunk(
  'auth/checkStatus',
  async (_, { rejectWithValue }) => {
    try {
      // ✅ เรียก /api/auth/me
      const res = await api.get('/api/auth/me');
      // Rust ส่ง { ok: true, data: { ... } }
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Check auth failed');
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password, remember }, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      
      // ✅ Rust ส่ง { ok: true, data: { token, user } }
      const { token, user } = res.data.data;

      if (remember) {
        localStorage.setItem('token', token);
      } else {
        sessionStorage.setItem('token', token);
      }

      return user;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.error || 'Login failed'
      );
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
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const user = action.payload || {};
        state.isAuthenticated = !!user.id;
        state.role = user.id ? user.role : null;
        state.userId = user.id || null;
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.status = 'failed';
        state.isAuthenticated = false;
        state.role = null;
        state.userId = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const user = action.payload || {};
        state.isAuthenticated = !!user.id;
        state.role = user.role || null;
        state.userId = user.id || null;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Login failed';
      })
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.role = null;
        state.userId = null;
        state.status = 'idle';
      });
  }
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;