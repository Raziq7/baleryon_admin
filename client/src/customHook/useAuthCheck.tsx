import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function useAuthCheck() {
  const { token, setAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    if (storedToken) {
      setAuth(storedToken);
    }
  }, [setAuth]); // Set auth on mount only

  useEffect(() => {
    if (!token) {
      navigate("/signin");
    }
  }, [token, navigate]); // ✅ Redirect whenever token becomes null

  return token;
}
