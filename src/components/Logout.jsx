import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../api/api";

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    logout();
    navigate("/login");
  }, [navigate]);

  return <div>Logging out...</div>;
}