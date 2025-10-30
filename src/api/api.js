// src/api/api.js
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL;

console.log("RAW ENV:", process.env);
console.log("API URL:", process.env.REACT_APP_API_URL);

if (!API_BASE_URL) {
  throw new Error("REACT_APP_API_URL is missing! Check your .env file.");
}

const api = axios.create({
  baseURL: API_BASE_URL.replace(/\/$/, ""), // remove trailing slash
  timeout: 12000,
});

export default api;