import { createContext, useContext, useEffect, useState } from "react";
import { request } from "../api.js";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("namma-cart-token");
    if (!saved) { setLoading(false); return; }
    setToken(saved);
    request("/auth/me").then((result) => setUser(result.data.user)).catch(() => {
      localStorage.removeItem("namma-cart-token");
      setToken(null);
    }).finally(() => setLoading(false));
  }, []);

  async function authenticate(path, values) {
    const result = await request(path, { method: "POST", body: JSON.stringify(values) });
    localStorage.setItem("namma-cart-token", result.data.token);
    setToken(result.data.token);
    setUser(result.data.user);
    return result.data.user;
  }

  async function logout() {
    try { await request("/auth/logout", { method: "POST" }); } catch { /* Clear the local token even if the server is unavailable. */ }
    localStorage.removeItem("namma-cart-token");
    setToken(null);
    setUser(null);
  }

  return <AuthContext.Provider value={{ token, user, loading, login: (v) => authenticate("/auth/login", v), signup: (v) => authenticate("/auth/register", v), setUser, logout }}>{children}</AuthContext.Provider>;
}
