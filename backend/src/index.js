require('dotenv').config(); // load .env

const openAI = require('openai');
const openai = new openAI({apiKey: process.env.OPENAI_API_KEY});

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- In-memory no longer needed ---
// let workouts = [];
// let nextId = 1;

const ALLOWED_TYPES = ['run', 'gym', 'basketball', 'surf', 'other'];
const ALLOWED_INTENSITY = ['easy', 'moderate', 'hard'];

// --- Mongoose setup & model ---

// Connect to MongoDB Atlas
mongoose
  .connect(process.env.MONGODB_URI, {
    // options mainly for older versions; mongoose 6+ works fine like this
  })
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB', err);
  });

// Define Workout schema
const workoutSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ALLOWED_TYPES,
      required: true,
    },
    date: {
      type: String, // keep as string "YYYY-MM-DD" for now (works with your frontend & filters)
      required: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
    },
    distanceKm: {
      type: Number,
      default: null,
    },
    intensity: {
      type: String,
      enum: ALLOWED_INTENSITY,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true, // adds createdAt, updatedAt
  }
);

// Make JSON output match your current frontend (id instead of _id)
workoutSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Workout = mongoose.model('Workout', workoutSchema);


function buildLocalFallbackFeedback(){
  return (
    'Ai coach is temporarily unavailable. ' + 'For now, aim for 3-4 workouts per week, keep mot sessions easy, and add one harder run or gym session.'
  )
}

// --- Validation helper (same logic you already wrote) ---


function validateWorkout(body) {
  if (!body || typeof body !== 'object') return 'invalid JSON body';

  const { type, date, durationMinutes, distanceKm, intensity, tags } = body;
  const t = String(type).toLowerCase();

  if (!ALLOWED_TYPES.includes(t))
    return 'type must be one of: ' + ALLOWED_TYPES.join(', ');

  if (!date || Number.isNaN(Date.parse(date)))
    return 'date needs to be a valid date(dd-mm-yyyy)';

  if (durationMinutes === null || durationMinutes < 1)
    return 'durationMinutes need to be a positive number';

  if (distanceKm !== undefined && distanceKm !== null && distanceKm !== '') {
    const d = Number(distanceKm);
    if (!Number.isFinite(d) || d < 0)
      return 'distanceKM must be a number >= 0';
  }

  if (intensity !== undefined && intensity !== null && intensity !== '') {
    if (!ALLOWED_INTENSITY.includes(intensity))
      return 'intensity must be easy, moderate, or hard';
  }

  if (tags !== undefined && tags !== null && tags !== '') {
    const ok = Array.isArray(tags) || typeof tags === 'string'; // allow "a,b,c" too
    if (!ok) return 'tags must be an array or a comma-separated string';

    if (Array.isArray(tags) && !tags.every((t) => typeof t === 'string'))
      return 'tags array must contain only strings';
  }

  return null;
}

function buildWorkoutSummary(workouts){
  if (!workouts || workouts.length === 0){
    return "No workouts";
  }

  let copyWorkouts = [...workouts];
  copyWorkouts.sort((a,b) => (Date.parse(b.date) - Date.parse(a.date)));

  let recent = copyWorkouts.slice(0,20);

  let stats = {
    run:0,
    gym:0,
    basketball: 0,
    surf: 0,
    other: 0,
  }

  let  totalDistance = 0;
  let totalMinutes = 0;
  const count = recent.length;

  for (let i =0; i< count ;i++){
    if (recent[i].type === 'run'){
      stats.run++;
      if (recent[i].distanceKm !== null && recent[i].distanceKm !== undefined) 
        totalDistance += recent[i].distanceKm;
    }
    else if (recent[i].type === 'gym'){
      stats.gym++;
    }
    else if (recent[i].type === 'basketball'){
      stats.basketball++;
    }
    else if (recent[i].type === 'surf'){
      stats.surf++;
    }
    else{
      stats.other++;
    }

    totalMinutes += recent[i].durationMinutes;
  }

  let lines = [];

  lines.push("Total workouts: " + count);
  lines.push(`By type: run=${stats.run}, gym=${stats.gym}, basketball=${stats.basketball}, surf=${stats.surf}, other=${stats.other}`);
  lines.push(`Total time: ${totalMinutes} minutes, Total run distance: ${totalDistance} km`);

  for (let j = 0;j< count;j++){
    if (recent[j].type === 'run' && recent[j].distanceKm !== null && recent[j].distanceKm !== undefined){
      lines.push(`${recent[j].date} - ${recent[j].type} - ${recent[j].distanceKm} km - ${recent[j].durationMinutes} minutes - ${recent[j].intensity}`)
    }
    else{
      lines.push(`${recent[j].date} - ${recent[j].type} - no distance - ${recent[j].durationMinutes} minutes - ${recent[j].intensity}`)
    }
  }

  return lines.join('\n');
}

// --- Routes ---

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok' });
});

// Create workout
app.post('/api/workouts', async (req, res) => {
  const err = validateWorkout(req.body);
  if (err) return res.status(400).json({ error: err });

  const {
    type,
    date,
    durationMinutes,
    distanceKm = null,
    intensity = null,
    notes = '',
    tags = [],
  } = req.body;

  const distanceVal =
    distanceKm !== undefined && distanceKm !== null && distanceKm !== ''
      ? Number(distanceKm)
      : null;

  const intensityVal =
    intensity !== undefined && intensity !== null && intensity !== ''
      ? intensity
      : null;

  const tagsVal =
    tags === undefined || tags === null || tags === ''
      ? []
      : Array.isArray(tags)
      ? tags.map((s) => String(s).trim()).filter(Boolean)
      : String(tags)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

  try {
    const workout = new Workout({
      type,
      date,
      durationMinutes: Number(durationMinutes),
      distanceKm: distanceVal,
      intensity: intensityVal,
      notes,
      tags: tagsVal,
    });

    const saved = await workout.save();
    res.status(201).json(saved); // toJSON transform gives you id, createdAt, updatedAt
  } catch (error) {
    console.error('Failed to save workout:', error);
    res.status(500).json({ error: 'internal server error' });
  }
});

// Get workouts (with type/from/to filters)
app.get('/api/workouts', async (req, res) => {
  const { type, from, to } = req.query;

  const t = type ? String(type).toLowerCase() : null;

  const filter = {};

  if (t) {
    filter.type = t;
  }

  // since date is a string "YYYY-MM-DD", string comparison works for ranges
  if (from) {
    filter.date = { ...(filter.date || {}), $gte: from };
  }
  if (to) {
    filter.date = { ...(filter.date || {}), $lte: to };
  }

  try {
    const result = await Workout.find(filter).sort({ date: -1 });
    res.status(200).json(result);
  } catch (error) {
    console.error('Failed to fetch workouts:', error);
    res.status(500).json({ error: 'internal server error' });
  }
});

// Delete workout
app.delete('/api/workouts/:id', async (req, res) => {
  const workoutId = String(req.params.id);

  try {
    const deleted = await Workout.findByIdAndDelete(workoutId);
    if (!deleted) {
      return res.status(404).json({ error: 'workout not found' });
    }
    res.status(200).json(deleted);
  } catch (error) {
    console.error('Failed to delete workout:', error);
    // CastError usually means invalid ObjectId format
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'invalid workout id' });
    }
    res.status(500).json({ error: 'internal server error' });
  }
});

// Patch workout
app.patch('/api/workouts/:id', async (req, res) => {
  const { type, date, durationMinutes, distanceKm, intensity, notes, tags } =
    req.body;

  // Validate only provided fields (same logic you had)
  const t = type !== undefined ? String(type).toLowerCase() : null;
  if (type !== undefined && !ALLOWED_TYPES.includes(t)) {
    return res
      .status(400)
      .json({ error: 'type must be one of: ' + ALLOWED_TYPES.join(', ') });
  }
  if (date !== undefined && Number.isNaN(Date.parse(date))) {
    return res
      .status(400)
      .json({ error: 'date needs to be a valid date(yyyy-mm-dd)' });
  }
  if (durationMinutes !== undefined && Number(durationMinutes) < 1) {
    return res
      .status(400)
      .json({ error: 'durationMinutes need to be a positive number' });
  }
  if (distanceKm !== undefined && distanceKm !== null && distanceKm !== '') {
    const d = Number(distanceKm);
    if (!Number.isFinite(d) || d < 0) {
      return res
        .status(400)
        .json({ error: 'distanceKm must be a number >= 0' });
    }
  }
  if (intensity !== undefined && intensity !== null && intensity !== '') {
    if (!ALLOWED_INTENSITY.includes(intensity)) {
      return res
        .status(400)
        .json({ error: 'intensity must be easy, moderate, or hard' });
    }
  }
  if (notes !== undefined && typeof notes !== 'string') {
    return res.status(400).json({ error: 'notes must be a string' });
  }
  if (tags !== undefined && tags !== null && tags !== '') {
    const ok = Array.isArray(tags) || typeof tags === 'string';
    if (!ok)
      return res.status(400).json({
        error: 'tags must be an array or a comma-separated string',
      });
    if (Array.isArray(tags) && !tags.every((t) => typeof t === 'string')) {
      return res
        .status(400)
        .json({ error: 'tags array must contain only strings' });
    }
  }

  const workoutId = String(req.params.id);

  // Build an update object
  const update = {};

  if (type !== undefined) update.type = type;
  if (date !== undefined) update.date = date;
  if (durationMinutes !== undefined)
    update.durationMinutes = Number(durationMinutes);
  if (distanceKm !== undefined) {
    update.distanceKm =
      distanceKm === null || distanceKm === '' ? null : Number(distanceKm);
  }
  if (intensity !== undefined) {
    update.intensity =
      intensity === null || intensity === '' ? null : intensity;
  }
  if (notes !== undefined) update.notes = notes;
  if (tags !== undefined) {
    update.tags =
      tags === null || tags === ''
        ? []
        : Array.isArray(tags)
        ? tags.map((s) => String(s).trim()).filter(Boolean)
        : String(tags)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
  }

  try {
    const updated = await Workout.findByIdAndUpdate(workoutId, update, {
      new: true,
    });
    if (!updated) {
      return res.status(404).json({ error: 'workout not found' });
    }
    res.status(200).json(updated);
  } catch (error) {
    console.error('Failed to update workout:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'invalid workout id' });
    }
    res.status(500).json({ error: 'internal server error' });
  }
});

app.get('/api/coach/feedback', async (req,res) =>{
  try{
    const workouts = await Workout.find({})
    .sort({ date:-1 })
    .limit(20);

    if (workouts.length === 0){
      return res.status(200).json({
        feedback:'You have not logged workouts yet. Log a few sessions and try again for feedback'
      });
    }

    const summary = buildWorkoutSummary(workouts);

    const messages = [
      {
        role:'system',
        content:
        'You are a friendly but honest running and fitness coach. You look at a user`s recent workout log and give concise, practical feedback.',
      }, 
      {
        role: 'user',
        content: `here is the user's recent workout log:\n\n${summary}\n\n` + 
        'Please give 3-5 short bullet points of feedback:\n' + 
        '- 1-2 positives\n' + 
        '- 1-2 comments about trends (consistency, volume, intensity)\n' + 
        '- 1-2 concrete suggestions for the next week.\n' + 
        'Keep it under 120 words. Write in a friendly, encouraging tone.',
      },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages,
    })

    const feedbackText =
    completion.choices?.[0]?.message?.content?.trim() ||
    'Sorry, I could not generate feedback right now.';

    return res.json({feedback:feedbackText});
  }
  catch(error){
    console.log("Sorry, Error generating feedback right now", error);
    
    const message = String(error?.message || '');
    const type = error?.error?.type || error?.type
    const status = error?.status;

    const isQuotaError =
    status === 429 ||
    type === 'insufficient_quota' ||
    message.toLowerCase().includes('insufficient_quota');

    if (isQuotaError){
      const fallback = buildLocalFallbackFeedback();
      return res.status(200).json({feedback: fallback})
    }

    return res.status(500).json({error: 'failed to generate feedback'});
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
