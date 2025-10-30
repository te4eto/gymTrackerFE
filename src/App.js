// src/App.js
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import CalendarView from "./components/CalendarView";
import SessionForm from "./components/SessionForm";
import HistoryView from "./components/HistoryView";
import Logout from "./components/Logout";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Register from "./components/Register";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/logout" element={<Logout />} />

        {/* PROTECTED ROUTES */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <CalendarView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/session/:date"
          element={
            <ProtectedRoute>
              <SessionForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history/:exerciseId"
          element={
            <ProtectedRoute>
              <HistoryView />
            </ProtectedRoute>
          }
        />

        {/* FALLBACK – redirect unknown paths */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;