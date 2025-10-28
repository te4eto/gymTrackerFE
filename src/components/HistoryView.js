// src/components/HistoryView.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button, Table, TableBody, TableCell, TableHead, TableRow, Paper, TableContainer } from '@mui/material';

const HistoryView = () => {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const [exercise, setExercise] = useState(null);
  const [historyData, setHistoryData] = useState([]);

  useEffect(() => {
    if (!exerciseId) return;

    // Get exercise name
    axios.get(`${process.env.REACT_APP_API_URL}/api/exercises/${exerciseId}`)
      .then(res => setExercise(res.data.data))
      .catch(() => {});

    // Get all sessions
    axios.get('${process.env.REACT_APP_API_URL}/api/sessions')
      .then(res => {
        const sessions = res.data.data || [];
        const exerciseHistory = sessions
          .filter(s => s.sets.some(set => set.exerciseId === parseInt(exerciseId)))
          .map(session => ({
            date: session.date,
            sets: session.sets.filter(set => set.exerciseId === parseInt(exerciseId)).map(set => ({ reps: set.reps, weight: set.weight }))
          }));
        setHistoryData(exerciseHistory);
      })
      .catch(err => console.error('Error fetching sessions:', err));
  }, [exerciseId]);

  return (
    <div>
      <Button onClick={() => navigate('/')} sx={{ mb: 2 }}>Back to Calendar</Button>
      <h2>History: {exercise?.name || 'Loading...'}</h2>
      {historyData.length > 0 ? (
        <TableContainer component={Paper} sx={{ boxShadow: 2, borderRadius: 2, mt: 2 }}>
          <Table sx={{ minWidth: 650 }} aria-label="exercise history table">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 'bold', padding: '12px', width: '150px' }}>Date</TableCell>
                {Array.from({ length: 5 }).map((_, index) => (
                  <TableCell
                    key={index}
                    align="center"
                    sx={{ fontWeight: 'bold', padding: '12px', width: '120px' }}
                  >
                    Set {index + 1}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {historyData.map((session, index) => (
                <TableRow
                  key={index}
                  sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' }, '&:hover': { backgroundColor: '#e0e0e0' } }}
                >
                  <TableCell component="th" scope="row" sx={{ padding: '12px', width: '150px' }}>
                    {session.date}
                  </TableCell>
                  {session.sets.map((set, setIndex) => (
                    <TableCell
                      key={setIndex}
                      align="center"
                      sx={{ padding: '8px', borderRight: '1px solid #ddd', width: '120px' }}
                    >
                      {set.reps && set.weight ? `Set ${setIndex + 1}: ${set.reps} reps @ ${set.weight}kg` : ''}
                    </TableCell>
                  ))}
                  {/* Fill remaining cells with empty values up to 5 sets */}
                  {Array.from({ length: 5 - session.sets.length }).map((_, fillIndex) => (
                    <TableCell
                      key={`fill-${fillIndex}`}
                      align="center"
                      sx={{ padding: '8px', borderRight: '1px solid #ddd', width: '120px' }}
                    ></TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <p>No history data yet</p>
      )}
    </div>
  );
};

export default HistoryView;