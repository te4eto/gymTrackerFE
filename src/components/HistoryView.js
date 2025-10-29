// src/components/HistoryView.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
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
} from '@mui/material';

const HistoryView = () => {
  const { exerciseId } = useParams();
  const navigate = useNavigate();

  const [exercise, setExercise] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!exerciseId) {
      setError('No exercise selected.');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        // Fetch exercise name
        const exerciseRes = await axios.get(
          `https://gymprogtrackerappbe.onrender.com/api/exercises/${exerciseId}`
        );
        setExercise(exerciseRes.data.data);

        // Fetch all sessions
        const sessionsRes = await axios.get(
          'https://gymprogtrackerappbe.onrender.com/api/sessions'
        );
        const sessions = sessionsRes.data.data || [];

        // Filter sessions that include this exercise with valid reps
        const exerciseHistory = sessions
          .filter((session) =>
            session.sets?.some(
              (set) =>
                (set.exerciseId || set.exercise?.id) == exerciseId && set.reps != null
            )
          )
          .map((session) => ({
            date: session.date,
            sets: session.sets
              .filter(
                (set) =>
                  (set.exerciseId || set.exercise?.id) == exerciseId && set.reps != null
              )
              .map((set) => ({
                reps: set.reps,
                weight: set.weight ?? 0, // Treat null/undefined as 0
              }))
              .sort((a, b) => a.reps - b.reps), // Optional: sort by reps
          }))
          .sort((a, b) => b.date.localeCompare(a.date)); // Newest first

        setHistoryData(exerciseHistory);
      } catch (err) {
        console.error('Error fetching history:', err);
        setError('Failed to load history. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [exerciseId]);

  // Loading state
  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', mt: 10 }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading history...
        </Typography>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ maxWidth: 700, mx: 'auto', p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={() => navigate('/')} variant="outlined">
          Back to Calendar
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
      {/* Back Button */}
      <Button onClick={() => navigate('/')} variant="outlined" sx={{ mb: 3 }}>
        ← Back to Calendar
      </Button>

      {/* Title */}
      <Typography variant="h4" gutterBottom>
        History: <strong>{exercise?.name || 'Unknown Exercise'}</strong>
      </Typography>

      {/* No Data */}
      {historyData.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No recorded sets for this exercise yet.
        </Alert>
      ) : (
        /* Table */
        <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Table sx={{ minWidth: 650 }} aria-label="exercise history table">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#1976d2' }}>
                <TableCell sx={{ fontWeight: 'bold', color: 'white', width: '150px' }}>
                  Date
                </TableCell>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableCell
                    key={i}
                    align="center"
                    sx={{
                      fontWeight: 'bold',
                      color: 'white',
                      width: '130px',
                      borderRight: '1px solid rgba(255,255,255,0.2)',
                    }}
                  >
                    Set {i + 1}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {historyData.map((session, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  sx={{
                    '&:nth-of-type(odd)': { backgroundColor: '#f8f9fa' },
                    '&:hover': { backgroundColor: '#e3f2fd' },
                    transition: 'background-color 0.2s',
                  }}
                >
                  <TableCell
                    component="th"
                    scope="row"
                    sx={{
                      fontWeight: 'medium',
                      color: '#333',
                      width: '150px',
                    }}
                  >
                    {new Date(session.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </TableCell>

                  {/* Render actual sets */}
                  {session.sets.map((set, setIndex) => (
                    <TableCell
                      key={setIndex}
                      align="center"
                      sx={{
                        borderRight: '1px solid #e0e0e0',
                        width: '130px',
                        fontFamily: 'monospace',
                        fontSize: '0.95rem',
                      }}
                    >
                      {set.reps} reps
                      {set.weight > 0 ? ` @ ${set.weight}kg` : set.weight === 0 ? ' @ BW' : ''}
                    </TableCell>
                  ))}

                  {/* Fill empty cells */}
                  {Array.from({ length: 5 - session.sets.length }).map((_, fillIndex) => (
                    <TableCell
                      key={`empty-${fillIndex}`}
                      align="center"
                      sx={{
                        borderRight: '1px solid #e0e0e0',
                        width: '130px',
                        color: '#aaa',
                      }}
                    >
                      —
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default HistoryView;