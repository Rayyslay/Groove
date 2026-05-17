import './index.css'
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from './context/AuthContext';
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5290";

// Refresh-aware 401 handler. On 401, try to refresh the access token and retry
// the original request. If refresh fails, clear tokens and bounce to /login.
let refreshing = null; // shared promise dedupes concurrent 401s

axios.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    // Never try to refresh in response to a refresh call itself
    if (original?.url?.endsWith("/api/auth/refresh")) {
      return Promise.reject(error);
    }

    if (status === 401 && original && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        refreshing = refreshing || axios.post(`${API}/api/auth/refresh`, { refreshToken });
        const { data } = await refreshing;
        refreshing = null;

        localStorage.setItem("token", data.token);
        localStorage.setItem("refreshToken", data.refreshToken);

        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${data.token}`;
        return axios(original);
      } catch (refreshErr) {
        refreshing = null;
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
