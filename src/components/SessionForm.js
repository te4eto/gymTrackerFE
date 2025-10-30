// src/components/SessionForm.js
import React, { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import {
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  Box,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import HistoryIcon from '@mui/icons-material/History';

const SessionForm = () => {
  const { date } = useParams();
  const navigate = useNavigate();

  const { register, control, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: { type: "", exerciseGroups: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "exerciseGroups" });

  const [exercises, setExercises] = useState([]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const templates = {
    Push: [
      { exerciseName: "Bench Press", sets: [{ reps: 12, weight: 60 }, { reps: 8, weight: 70 }, { reps: 6, weight: 80 }] },
      { exerciseName: "Dips", sets: [{ reps: 12, weight: 0 }, { reps: 12, weight: 0 }, { reps: 12, weight: 0 }] },
      { exerciseName: "Triceps extensions", sets: [{ reps: 10, weight: 20 }, { reps: 10, weight: 20 }] },
    ],
    Pull: [],
    Legs: [],
  };

  // ──────────────────────────────────────────────────────────────
  // Load data – preserve order
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      api.get("/api/exercises"),
      api.get("/api/sessions"),
    ])
      .then(([exRes, sessRes]) => {
        const exList = exRes.data?.data ?? exRes.data ?? [];
        setExercises(exList);

        const allSessions = sessRes.data?.data ?? sessRes.data ?? [];
        const existing = allSessions.find((s) => s.date === date);

        if (existing) {
          setSession(existing);
          const groupMap = new Map();
          existing.sets.forEach((set) => {
            const exId = set.exerciseId || set.exercise?.id;
            if (!exId) return;
            if (!groupMap.has(exId)) {
              groupMap.set(exId, { exerciseId: exId, sets: [] });
            }
            groupMap.get(exId).sets.push({ reps: set.reps, weight: set.weight });
          });
          const orderedGroups = Array.from(groupMap.values()).map((g) => ({
            exerciseId: g.exerciseId,
            sets: g.sets,
            newExerciseName: "",
          }));
          reset({
            type: existing.type || "",
            exerciseGroups: orderedGroups,
          });
        } else {
          reset({ type: "", exerciseGroups: [] });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [date, reset]);

  // ──────────────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────────────
  const createExercise = async (name) => {
    if (!name?.trim()) return null;
    try {
      const res = await api.post("/api/exercises", {
        name: name.trim(),
        category: "Custom",
      });
      const newEx = res.data?.data ?? res.data;
      setExercises((prev) => [...prev, newEx]);
      return newEx;
    } catch {
      setMessage("Failed to create exercise");
      return null;
    }
  };

  const loadTemplate = async (type) => {
    if (!type) return;
    remove();
    const tmpl = templates[type] || [];
    for (const t of tmpl) {
      let ex = exercises.find((e) => e.name === t.exerciseName);
      if (!ex) ex = await createExercise(t.exerciseName);
      if (ex) {
        append({
          exerciseId: ex.id,
          sets: t.sets,
          newExerciseName: "",
        });
      }
    }
  };

  const onSubmit = async (data) => {
    const payload = { date, type: data.type || "Workout", sets: [] };
    for (const group of data.exerciseGroups) {
      let exId = group.exerciseId;
      if (group.newExerciseName?.trim()) {
        const newEx = await createExercise(group.newExerciseName.trim());
        if (newEx) exId = newEx.id;
      }
      if (!exId) continue;
      group.sets.forEach((s) => {
        payload.sets.push({
          reps: Number(s.reps) || 0,
          weight: Number(s.weight) || 0,
          exercise: { id: Number(exId) },
        });
      });
    }

    const req = session
      ? api.put(`/api/sessions/${session.id}`, payload)
      : api.post("/api/sessions", payload);

    req
      .then(() => {
        setMessage("Saved!");
        setTimeout(() => navigate("/"), 1500);
      })
      .catch((err) =>
        setMessage("Error: " + (err.response?.data?.message || err.message))
      );
  };

  const deleteSession = () => {
    if (!session || !window.confirm("Delete entire workout?")) return;
    api.delete(`/api/sessions/${session.id}`)
      .then(() => {
        setMessage("Deleted");
        setTimeout(() => navigate("/"), 1500);
      })
      .catch(() => setMessage("Delete failed"));
  };

  const deleteExercise = (index) => {
    const exName =
      exercises.find((ex) => ex.id === watch(`exerciseGroups.${index}.exerciseId`))?.name ||
      watch(`exerciseGroups.${index}.newExerciseName`) ||
      "this exercise";
    if (window.confirm(`Delete "${exName}" from this workout?`)) {
      remove(index);
    }
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 700, mx: "auto", p: 2 }}>
      <Typography variant="h5" gutterBottom>
        {session ? "Edit" : "New"} Workout on {date}
      </Typography>

      {message && (
        <Alert severity={message.includes("Error") ? "error" : "success"} sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <InputLabel>Workout Type</InputLabel>
      <Select
        fullWidth
        value={watch("type") || ""}
        onChange={(e) => {
          setValue("type", e.target.value);
          loadTemplate(e.target.value);
        }}
        sx={{ mb: 3 }}
      >
        <MenuItem value=""><em>None</em></MenuItem>
        <MenuItem value="Push">Push</MenuItem>
        <MenuItem value="Pull">Pull</MenuItem>
        <MenuItem value="Legs">Legs</MenuItem>
      </Select>

      {fields.map((field, i) => (
        <Box
          key={field.id}
          sx={{ border: "1px solid #ddd", borderRadius: 2, p: 2, mb: 2, bgcolor: "#fafafa" }}
        >
          <InputLabel>Exercise</InputLabel>

          <Controller
            control={control}
            name={`exerciseGroups.${i}.exerciseId`}
            render={({ field: cf }) => (
              <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                <Select {...cf} fullWidth displayEmpty value={cf.value || ""} sx={{ flexGrow: 1 }}>
                  <MenuItem value="" disabled>
                    <em>Select exercise</em>
                  </MenuItem>
                  {exercises.map((ex) => (
                    <MenuItem key={ex.id} value={ex.id}>
                      {ex.name}
                    </MenuItem>
                  ))}
                </Select>
                {cf.value && (
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/history/${cf.value}`)}
                    title="History"
                  >
                    <HistoryIcon />
                  </IconButton>
                )}
              </Box>
            )}
          />

          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Or type new exercise name..."
              value={watch(`exerciseGroups.${i}.newExerciseName`) || ""}
              onChange={(e) => setValue(`exerciseGroups.${i}.newExerciseName`, e.target.value)}
            />
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={async () => {
                const name = watch(`exerciseGroups.${i}.newExerciseName`)?.trim();
                if (!name) return;
                const newEx = await createExercise(name);
                if (newEx) {
                  setValue(`exerciseGroups.${i}.exerciseId`, newEx.id);
                  setValue(`exerciseGroups.${i}.newExerciseName`, "");
                }
              }}
            >
              Create
            </Button>
          </Box>

          <ExerciseSets nestIndex={i} control={control} register={register} />

          <Button color="error" size="small" onClick={() => deleteExercise(i)} sx={{ mt: 1 }}>
            Remove Exercise
          </Button>
        </Box>
      ))}

      <Button
        variant="outlined"
        onClick={() => append({ exerciseId: "", sets: [{ reps: "", weight: "" }], newExerciseName: "" })}
        sx={{ mb: 2 }}
      >
        + Add Exercise
      </Button>

      <Box sx={{ display: "flex", gap: 2 }}>
        <Button variant="contained" size="large" onClick={handleSubmit(onSubmit)}>
          {session ? "Update" : "Save"} Workout
        </Button>
        {session && (
          <Button variant="outlined" color="error" onClick={deleteSession}>
            Delete Workout
          </Button>
        )}
        <Button variant="text" onClick={() => navigate("/")}>
          Cancel
        </Button>
      </Box>
    </Box>
  );
};

// ──────────────────────────────────────────────────────────────
// Sub-component: Exercise Sets
// ──────────────────────────────────────────────────────────────
const ExerciseSets = ({ nestIndex, control, register }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `exerciseGroups.${nestIndex}.sets`,
  });

  return (
    <>
      {fields.map((set, j) => (
        <Box key={set.id} sx={{ display: "flex", gap: 1, alignItems: "center", mb: 1 }}>
          <TextField
            {...register(`exerciseGroups.${nestIndex}.sets.${j}.reps`)}
            label="Reps"
            type="number"
            size="small"
            sx={{ width: 80 }}
          />
          <TextField
            {...register(`exerciseGroups.${nestIndex}.sets.${j}.weight`)}
            label="Weight"
            type="number"
            size="small"
            step="0.5"
            sx={{ width: 110 }}
          />
          <Button size="small" color="error" onClick={() => remove(j)}>
            x
          </Button>
        </Box>
      ))}
      <Button size="small" onClick={() => append({ reps: "", weight: "" })}>
        + Add Set
      </Button>
    </>
  );
};

export default SessionForm;