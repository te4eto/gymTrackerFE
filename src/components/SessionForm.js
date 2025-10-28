// src/components/SessionForm.js
import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button, TextField, Select, MenuItem, InputLabel, Box, Typography, Alert, CircularProgress, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import HistoryIcon from '@mui/icons-material/History';

const SessionForm = () => {
  const { date } = useParams();
  const navigate = useNavigate();
  const { register, control, handleSubmit, reset, setValue, watch, getValues } = useForm({
    defaultValues: { type: '', exerciseGroups: [] }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'exerciseGroups' });
  const [exercises, setExercises] = useState([]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [newExerciseName, setNewExerciseName] = useState('');

  const templates = {
    Push: [
      { exerciseName: "Bench Press", sets: [{ reps: 12, weight: 60 }, { reps: 8, weight: 70 }, { reps: 6, weight: 80 }] },
      { exerciseName: "Dips", sets: [{ reps: 12, weight: 0 }, { reps: 12, weight: 0 }, { reps: 12, weight: 0 }] },
      { exerciseName: "Triceps extensions", sets: [{ reps: 10, weight: 20 }, { reps: 10, weight: 20 }] }
    ],
    Pull: [],
    Legs: []
  };

  useEffect(() => {
    Promise.all([
      axios.get(`${process.env.REACT_APP_API_URL}/api/exercises`),
      axios.get(`https://gymprogtrackerappbe.onrender.com/`)
    ])
      .then(([exRes, sessRes]) => {
        setExercises(exRes.data.data || []);
        const allSessions = sessRes.data.data || [];
        console.log('All Sessions from API:', allSessions); // Debug
        const existing = allSessions.find(s => s.date === date);
        console.log('Found Session for date', date, ':', existing); // Debug
        if (existing) {
          setSession(existing);
          const grouped = {};
          existing.sets.forEach(set => {
            const exId = set.exerciseId || (set.exercise?.id || null); // Handle both DTO and entity formats
            if (exId) {
              if (!grouped[exId]) grouped[exId] = { exerciseId: exId, sets: [] };
              grouped[exId].sets.push({ reps: set.reps, weight: set.weight });
            }
          });
          console.log('Grouped Exercise Groups:', Object.values(grouped)); // Debug
          reset({
            type: existing.type || '',
            exerciseGroups: Object.values(grouped)
          });
        } else {
          reset({ type: '', exerciseGroups: [] }); // Clear form for new session
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching data:', err);
        setLoading(false);
      });
  }, [date, reset]);

  const createExercise = async (name) => {
    if (!name.trim()) return;
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/exercises`, {
        name: name.trim(),
        category: "Custom"
      });
      const newEx = res.data.data;
      setExercises(prev => [...prev, newEx]);
      return newEx;
    } catch (err) {
      setMessage('Failed to create exercise');
      return null;
    }
  };

  const loadTemplate = (type) => {
    if (!type) return;
    remove();
    const tmpl = templates[type] || [];
    tmpl.forEach(async t => {
      let ex = exercises.find(e => e.name === t.exerciseName);
      if (!ex) {
        ex = await createExercise(t.exerciseName);
      }
      if (ex) append({ exerciseId: ex.id, sets: t.sets });
    });
  };

  const onSubmit = async (data) => {
    const payload = {
      date,
      type: data.type || 'Workout',
      sets: []
    };

    for (const group of data.exerciseGroups) {
      let exId = group.exerciseId;
      if (group.newExerciseName) {
        const newEx = await createExercise(group.newExerciseName);
        if (newEx) exId = newEx.id;
      }
      if (exId) {
        group.sets.forEach(s => {
          payload.sets.push({
            reps: Number(s.reps) || 0,
            weight: Number(s.weight) || 0,
            exercise: { id: Number(exId) } // Match backend expectation
          });
        });
      }
    }

    const request = session
      ? axios.put(`https://gymprogtrackerappbe.onrender.com//${session.id}`, payload)
      : axios.post(`https://gymprogtrackerappbe.onrender.com/`, payload);

    request
      .then(() => {
        setMessage('Workout saved!');
        setTimeout(() => navigate('/'), 1500);
      })
      .catch(err => setMessage('Error: ' + (err.response?.data?.message || err.message)));
  };

  const deleteSession = () => {
    if (!session || !window.confirm('Delete this workout?')) return;
    axios.delete(`https://gymprogtrackerappbe.onrender.com//${session.id}`)
      .then(() => {
        setMessage('Deleted');
        setTimeout(() => navigate('/'), 1500);
      })
      .catch(() => setMessage('Delete failed'));
  };

  if (loading) return <Box sx={{ textAlign: 'center', mt: 10 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', p: 2 }}>
      <Typography variant="h5" gutterBottom>
        {session ? 'Edit' : 'New'} Workout on {date}
      </Typography>

      {message && <Alert severity={message.includes('Error') ? 'error' : 'success'} sx={{ mb: 2 }}>{message}</Alert>}

      <InputLabel>Workout Type</InputLabel>
      <Select
        fullWidth
        value={watch('type') || session?.type || ''}
        onChange={(e) => { setValue('type', e.target.value); loadTemplate(e.target.value); }}
        sx={{ mb: 3 }}
      >
        <MenuItem value=""><em>None</em></MenuItem>
        <MenuItem value="Push">Push</MenuItem>
        <MenuItem value="Pull">Pull</MenuItem>
        <MenuItem value="Legs">Legs</MenuItem>
      </Select>

      {fields.map((field, i) => (
        <Box key={field.id} sx={{ border: '1px solid #ddd', borderRadius: 2, p: 2, mb: 2, bgcolor: '#fafafa' }}>
          <InputLabel>Exercise</InputLabel>

          <Controller
            control={control}
            name={`exerciseGroups.${i}.exerciseId`}
            render={({ field: cf }) => (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <Select
                  {...cf}
                  fullWidth
                  displayEmpty
                  value={cf.value || ''}
                  sx={{ flexGrow: 1 }}
                >
                  <MenuItem value="" disabled><em>Select exercise</em></MenuItem>
                  {exercises.map(ex => (
                    <MenuItem key={ex.id} value={ex.id}>{ex.name}</MenuItem>
                  ))}
                </Select>

                {cf.value && (
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/history/${cf.value}`)}
                    title="View history"
                  >
                    <HistoryIcon />
                  </IconButton>
                )}
              </Box>
            )}
          />

          {/* Create New Exercise */}
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Or type new exercise name..."
              value={newExerciseName}
              onChange={(e) => setNewExerciseName(e.target.value)}
            />
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={async () => {
                const name = newExerciseName.trim();
                if (!name) return;
                const newEx = await createExercise(name);
                if (newEx) {
                  setValue(`exerciseGroups.${i}.exerciseId`, newEx.id);
                  setNewExerciseName('');
                }
              }}
            >
              Create
            </Button>
          </Box>

          <ExerciseSets nestIndex={i} control={control} register={register} watch={watch} setValue={setValue} />

          <Button color="error" size="small" onClick={() => remove(i)} sx={{ mt: 1 }}>
            Remove Exercise
          </Button>
        </Box>
      ))}

      <Button
        variant="outlined"
        onClick={() => append({ exerciseId: '', sets: [{ reps: '', weight: '' }] })}
        sx={{ mb: 2 }}
      >
        + Add Exercise
      </Button>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button type="submit" variant="contained" size="large" onClick={handleSubmit(onSubmit)}>
          {session ? 'Update' : 'Save'} Workout
        </Button>
        {session && (
          <Button variant="outlined" color="error" onClick={deleteSession}>
            Delete Workout
          </Button>
        )}
        <Button variant="text" onClick={() => navigate('/')}>Cancel</Button>
      </Box>
    </Box>
  );
};

const ExerciseSets = ({ nestIndex, control, register, watch, setValue }) => {
  const { fields, append, remove } = useFieldArray({ control, name: `exerciseGroups.${nestIndex}.sets` });

  return (
    <>
      {fields.map((set, j) => (
        <Box key={set.id} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
          <TextField
            {...register(`exerciseGroups.${nestIndex}.sets.${j}.reps`)}
            label="Reps"
            type="number"
            size="small"
            sx={{ width: 80 }}
            defaultValue={set.reps || ''} // Pre-fill with existing reps
          />
          <TextField
            {...register(`exerciseGroups.${nestIndex}.sets.${j}.weight`)}
            label="Weight"
            type="number"
            size="small"
            step="0.5"
            sx={{ width: 110 }}
            defaultValue={set.weight || ''} // Pre-fill with existing weight
          />
          <Button size="small" color="error" onClick={() => remove(j)}>×</Button>
        </Box>
      ))}
      <Button size="small" onClick={() => append({ reps: '', weight: '' })}>+ Add Set</Button>
    </>
  );
};

export default SessionForm;