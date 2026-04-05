import { createContext, useState, useEffect } from "react";
import api from "../utils/axios"; // Ensure this path is correct
import AppLoader from "../components/AppLoader";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // ✅ 1. Add loading state

  useEffect(() => {
    const checkUserLoggedIn = async () => {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");

      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          // ✅ 2. Call the backend to verify token and get user data
          const { data } = await api.get("/auth/me");
          setUser(data);
        } catch (error) {
          // If token is invalid (expired, etc.), clear it
          console.error("Session expired or invalid:", error);
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");
          delete api.defaults.headers.common['Authorization'];
          setUser(null);
        }
      }
      
      // ✅ 3. Finished checking, turn off loading
      setLoading(false);
    };

    checkUserLoggedIn();
  }, []);

  const login = async (userData) => {
    // Adjust based on your actual login API response structure
    const { data } = await api.post("/auth/login", userData);
    
    if (data.requireOtp) {
      return data;
    }

    if (data.token) {
        if (userData.rememberMe) {
            localStorage.setItem("token", data.token);
        } else {
            sessionStorage.setItem("token", data.token);
        }
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        setUser(data.user);
        return data;
    }
    // If no token, throw error to trigger catch block in Login.jsx
    throw new Error("Login failed: No token received");
  };

  const verifyOtp = async (otpData) => {
    const { data } = await api.post("/auth/verify-otp", otpData);
    if (data.token) {
        if (otpData.rememberMe) {
            localStorage.setItem("token", data.token);
        } else {
            sessionStorage.setItem("token", data.token);
        }
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        setUser(data.user);
        return data;
    }
    throw new Error("Verification failed");
  };

  const logout = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    audio.play().catch(() => {});
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setTimeout(() => {
      window.location.href = "/login"; // Optional: Force redirect
    }, 800);
  };

  // ✅ 4. Prevent rendering children until we know if the user is logged in
  if (loading) {
    return (
      <AppLoader
        message="Preparing your dashboard..."
        className="min-h-screen flex items-center justify-center px-4 bg-slate-50"
      />
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, verifyOtp, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
