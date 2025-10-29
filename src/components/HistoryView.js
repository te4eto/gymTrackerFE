// src/components/HistoryView.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Button, Table, TableBody, TableCell, TableHead, TableRow,
  Paper, TableContainer, Typography, Box, CircularProgress, Alert
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
      setError('Invalid exercise.');
      setLoading(false);
      return;
    }

    const fetch = async () => {
      setLoading(true);
      try {
        const [exRes, sessRes] = await Promise.all([
          axios.get(`https://gymprogtrackerappbe.onrender.com/api/exercises/${exerciseId}`),
          axios.get('https://gymprogtrackerappbe.onrender.com/api/sessions'),
        ]);

        setExercise(exRes.data.data);

        const sessions = sessRes.data.data || [];

        const history = sessions
          .filter(s => s.sets?.some(set =>
            (set.exerciseId || set.exercise?.id) == exerciseId && set.reps != null
          ))
          .map(s => ({
            date: s.date,
            sets: s.sets
              .filter(set =>
                (set.exerciseId || set.exercise?.id) == exerciseId && set.reps != null
              )
              .map(set => ({ reps: set.reps, weight: set.weight ?? 0 }))
              // **Preserve exact order from form**
          }))
          // **Newest first**
          .sort((a, b) => b.date.localeCompare(a.date));

        setHistoryData(history);
      } catch (err) {
        setError('Failed to load history.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [exerciseId]);

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', mt: 10 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 700, mx: 'auto', p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={() => navigate('/')} variant="outlined" sx={{ mt: 2 }}>
          Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
      <Button onClick={() => navigate('/')} variant="outlined" sx={{ mb: 3 }}>
        ← Back
      </Button>

      <Typography variant="h4" gutterBottom>
        History: <strong>{exercise?.name || 'Loading...'}</strong>
      </Typography>

      {historyData.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No sets recorded yet.
        </Alert>
      ) : (
        <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#1976d2' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Date</TableCell>
                {[1, 2, 3, 4, 5].map(i => (
                  <TableCell key={i} align="center" sx={{ color: 'white', fontWeight: 'bold' }}>
                    Set {i}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {historyData.map((session, i) => (
                <TableRow
                  key={i}
                  sx={{
                    '&:nth-of-type(odd)': { bgcolor: '#f8f9fa' },
                    '&:hover': { bgcolor: '#e3f2fd' }
                  }}
                >
                  <TableCell sx={{ fontWeight: 'medium' }}>
                    {new Date(session.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </TableCell>

                  {session.sets.map((set, j) => (
                    <TableCell key={j} align="center" sx={{ fontFamily: 'monospace' }}>
                      {set.reps} reps
                      {set.weight > 0 ? ` @ ${set.weight}kg` : set.weight === 0 ? ' @ BW' : ''}
                    </TableCell>
                  ))}

                  {Array.from({ length: 5 - session.sets.length }).map((_, k) => (
                    <TableCell key={`empty-${k}`} align="center" sx={{ color: '#aaa' }}>
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