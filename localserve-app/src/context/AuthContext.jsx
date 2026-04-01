import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);
const API_URL = "http://localhost:5000/api";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("localserve_token"));

  useEffect(() => {
    if (token) {
      localStorage.setItem("localserve_token", token);
      fetchMe(token);
    } else {
      localStorage.removeItem("localserve_token");
      setUser(null);
    }
  }, [token]);

  const fetchMe = async (currentToken) => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setToken(null);
      }
    } catch (err) {
      console.error(err);
      setToken(null);
    }
  };

  const signup = async (userData) => {
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setUser(data.user);
      setToken(data.token);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const login = async (credentials) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUser(data.user);
      setToken(data.token);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
