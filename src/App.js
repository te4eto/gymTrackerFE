// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // Install react-router-dom if not
import CalendarView from './components/CalendarView';
import SessionForm from './components/SessionForm';
import HistoryView from './components/HistoryView';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CalendarView />} />
        <Route path="/session/:date" element={<SessionForm />} />
        <Route path="/history/:exerciseId" element={<HistoryView />} />
      </Routes>
    </Router>
  );
}

export default App;