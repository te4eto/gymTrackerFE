// src/components/CalendarView.js
import React, { useState, useEffect, useCallback } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import api from "../api/api"; // <-- Central axios instance (uses REACT_APP_API_URL)
import {
  Button,
  ButtonGroup,
  IconButton,
  CircularProgress,
  Alert,
  Box,
} from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

const CalendarView = () => {
  const [events, setEvents] = useState([]);
  const [view, setView] = useState("month");
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch sessions from backend
  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get("/api/sessions");

      // Handle both { data: [...] } and direct array
      const sessions = res.data?.data ?? res.data ?? [];

      const calendarEvents = sessions.map((session) => {
        const start = moment(session.date).startOf("day").toDate();
        const end = moment(session.date).endOf("day").toDate(); // Full day event

        return {
          title: session.type || "Workout",
          start,
          end,
          allDay: true,
        };
      });

      setEvents(calendarEvents);
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setError(
        err.response?.data?.message || "Failed to load workout sessions"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Navigation: prev/next month (or day if in day view)
  const handleNavigate = (action) => {
    const newDate = moment(date);
    const unit = view === "day" ? "day" : "month";
    if (action === "prev") newDate.subtract(1, unit);
    else if (action === "next") newDate.add(1, unit);
    setDate(newDate.toDate());
  };

  // Click on empty slot → go to session form
  const handleSelectSlot = ({ start }) => {
    const formatted = moment(start).format("YYYY-MM-DD");
    window.location.href = `/session/${formatted}`;
  };

  // Click on event → edit that day's session
  const handleSelectEvent = (event) => {
    const formatted = moment(event.start).format("YYYY-MM-DD");
    window.location.href = `/session/${formatted}`;
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Toolbar */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <IconButton onClick={() => handleNavigate("prev")}>
          <ArrowBackIosIcon />
        </IconButton>

        <ButtonGroup variant="outlined">
          {["day", "week", "month"].map((v) => (
            <Button
              key={v}
              onClick={() => setView(v)}
              color={view === v ? "primary" : "inherit"}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Button>
          ))}
        </ButtonGroup>

        <IconButton onClick={() => handleNavigate("next")}>
          <ArrowForwardIosIcon />
        </IconButton>
      </Box>

      {/* Loading */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Calendar */}
      {!loading && !error && (
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          view={view}
          date={date}
          onView={setView}
          onNavigate={setDate}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          selectable
          style={{ height: 560 }}
          components={{
            event: ({ event }) => (
              <div style={{ cursor: "pointer", fontWeight: 500 }}>
                {event.title}
              </div>
            ),
          }}
        />
      )}
    </Box>
  );
};

export default CalendarView;