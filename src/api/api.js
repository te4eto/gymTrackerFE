// src/api/api.js
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL;
console.log("RAW ENV:", process.env);
console.log("API URL:", process.env.REACT_APP_API_URL);

if (!API_BASE_URL) {
  throw new Error("REACT_APP_API_URL is missing! Check your .env file.");
}

const api = axios.create({
  baseURL: API_BASE_URL.replace(/\/$/, ""),
  timeout: 12000,
});

/* -------------------------------------------------
   JWT helpers – add/remove Authorization header
   ------------------------------------------------- */
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

export const login = (username, password) =>
  api.post("/api/auth/login", { username, password });

export const register = (username, password) =>
  api.post("/api/auth/register", { username, password });

export const logout = () => {
  setAuthToken();                     // remove header
  localStorage.removeItem("token");
  localStorage.removeItem("username");
};

/* -------------------------------------------------
   Restore token when the app starts (called from index.js)
   ------------------------------------------------- */
export const initAuth = () => {
  const token = localStorage.getItem("token");
  if (token) setAuthToken(token);
};

/* -------------------------------------------------
   Export the same Axios instance you already use
   ------------------------------------------------- */
export default api;