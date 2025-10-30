// src/components/HistoryView.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  TableContainer,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";

const HistoryView = () => {
  const { exerciseId } = useParams();
  const navigate = useNavigate();

  const [exercise, setExercise] = useState(null);
  const [historyData, setHistoryData] = useState([]); // [{date, sets:[{reps,weight}]}]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // -----------------------------------------------------------------
  // Fetch data
  // -----------------------------------------------------------------
  useEffect(() => {
    if (!exerciseId) {
      setError("Invalid exercise.");
      setLoading(false);
      return;
    }

    const fetch = async () => {
      setLoading(true);
      try {
        const [exRes, sessRes] = await Promise.all([
          api.get(`/api/exercises/${exerciseId}`),
          api.get("/api/sessions"),
        ]);

        setExercise(exRes.data?.data ?? exRes.data);

        const sessions = sessRes.data?.data ?? sessRes.data ?? [];

        const history = sessions
          .filter((s) =>
            s.sets?.some(
              (set) =>
                (set.exerciseId || set.exercise?.id) == exerciseId && set.reps != null
            )
          )
          .map((s) => ({
            date: s.date,
            sets: s.sets
              .filter(
                (set) =>
                  (set.exerciseId || set.exercise?.id) == exerciseId && set.reps != null
              )
              .map((set) => ({ reps: set.reps, weight: set.weight ?? 0 })),
          }))
          .sort((a, b) => b.date.localeCompare(a.date)); // newest first

        setHistoryData(history);
      } catch (err) {
        console.error(err);
        setError("Failed to load history.");
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [exerciseId]);

  // -----------------------------------------------------------------
  // UI states
  // -----------------------------------------------------------------
  if (loading) {
    return (
      <Box sx={{ textAlign: "center", mt: 10 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading…</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 700, mx: "auto", p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={() => navigate("/")} variant="outlined" sx={{ mt: 2 }}>
          Back
        </Button>
      </Box>
    );
  }

  // -----------------------------------------------------------------
  // No data
  // -----------------------------------------------------------------
  if (historyData.length === 0) {
    return (
      <Box sx={{ maxWidth: 900, mx: "auto", p: 3 }}>
        <Button onClick={() => navigate("/")} variant="outlined" sx={{ mb: 3 }}>
          Back
        </Button>
        <Typography variant="h4" gutterBottom>
          History: <strong>{exercise?.name ?? "…"}</strong>
        </Typography>
        <Alert severity="info" sx={{ mt: 2 }}>
          No sets recorded yet.
        </Alert>
      </Box>
    );
  }

  // -----------------------------------------------------------------
  // Build transposed table data
  // -----------------------------------------------------------------
  const maxSets = Math.max(...historyData.map((s) => s.sets.length));

  const transposedRows = Array.from({ length: maxSets }, (_, setIdx) => {
    const row = [];
    historyData.forEach((session) => {
      row.push(session.sets[setIdx] ?? null);
    });
    return row;
  });

  // -----------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------
  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: 3 }}>
      <Button onClick={() => navigate("/")} variant="outlined" sx={{ mb: 3 }}>
        Back
      </Button>

      <Typography variant="h4" gutterBottom>
        History: <strong>{exercise?.name ?? "…"}</strong>
      </Typography>

      <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2, overflowX: "auto" }}>
        <Table size="small">
          {/* ---------- Header (dates) ---------- */}
          <TableHead>
            <TableRow sx={{ backgroundColor: "#1976d2" }}>
              <TableCell
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  minWidth: 80,
                  position: "sticky",
                  left: 0,
                  zIndex: 2,
                  backgroundColor: "#1976d2",
                }}
              >
                Set
              </TableCell>
              {historyData.map((session) => (
                <TableCell
                  key={session.date}
                  align="center"
                  sx={{
                    color: "white",
                    fontWeight: "bold",
                    minWidth: 120,
                    whiteSpace: "nowrap",
                  }}
                >
                  {new Date(session.date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          {/* ---------- Body (sets) ---------- */}
          <TableBody>
            {transposedRows.map((row, setIdx) => (
              <TableRow
                key={setIdx}
                sx={{
                  "&:nth-of-type(odd)": { bgcolor: "#f8f9fa" },
                  "&:hover": { bgcolor: "#e3f2fd" },
                }}
              >
                {/* Set label (sticky) */}
                <TableCell
                  component="th"
                  scope="row"
                  sx={{
                    fontWeight: "medium",
                    position: "sticky",
                    left: 0,
                    bgcolor: "background.paper",
                    zIndex: 1,
                  }}
                >
                  Set {setIdx + 1}
                </TableCell>

                {/* One cell per date */}
                {row.map((cell, dateIdx) => (
                  <TableCell
                    key={dateIdx}
                    align="center"
                    sx={{ fontFamily: "monospace", minWidth: 120 }}
                  >
                    {cell
                      ? `${cell.reps} reps${
                          cell.weight > 0
                            ? ` @ ${cell.weight}kg`
                            : cell.weight === 0
                            ? " @ BW"
                            : ""
                        }`
                      : "—"}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default HistoryView;