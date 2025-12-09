import { useState, useEffect } from 'react';
import './App.css';


function App() {
  const [workouts, setWorkouts] = useState([]);
  const [newType, setNewType] = useState('run');
  const [newDate, setNewDate] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [newIntensity, setNewIntensity] = useState('easy');
  const [newDistanceKm, setNewDistanceKm] = useState('');

  const [newFilterType, setNewFilterType] = useState('all');
  const [filterStartDate, setNewStartDate] = useState('');
  const [filterEndDate, setNewEndDate] = useState('');

  const [dateError, setNewDateError] = useState('');
  const [durationError, setNewDurationError] = useState('');
  const [distanceError, setNewDistanceError] = useState('');
  const [intensityError, setNewIntensityError] = useState('');
  const [generalFormError, setNewGeneralFormError] = useState('');
  const [formStatus, setNewFormStatus] = useState('idle');

  const [coachFeedback, setNewCoachFeedback] = useState('');
  const [coachLoading, setNewCoachLoading] = useState(false);
  const [coachError, setNewCoachError] = useState('');

  async function fetchWorkouts() {
    try {
      const response = await fetch('http://localhost:3000/api/workouts');
      if (!response.ok) {
        console.error('failed to fetch workouts, status:', response.status);
        return;
      }
      const data = await response.json();
      setWorkouts(data);
    } catch (e) {
      console.error('failed', e);
    }
  }

  async function handleDeleteWorkout(id) {
    try {
      const response = await fetch('http://localhost:3000/api/workouts/' + id, {
        method: 'DELETE',
      });

      if (!response.ok) {
        console.log('Failed to delete, Status:' + response.status);
        return;
      }

      setWorkouts((prevWorkouts) => prevWorkouts.filter((w) => w.id !== id));
    } catch (error) {
      console.error('failed to delete', error);
    }
  }

  async function handleEditWorkout(id) {
    let index = workouts.findIndex((w) => w.id === id);
    if (index === -1) {
      console.error('workout not found for id:', id);
      return;
    }

    const newDuration = window.prompt(
      'Enter new duration in minutes',
      workouts[index].durationMinutes
    );

    if (newDuration === null || newDuration.trim() === '') return;

    const newDurationNum = Number(newDuration);

    if (Number.isNaN(newDurationNum) || newDurationNum < 0) {
      alert('please enter a new valid non-negative number');
      return;
    }

    try {
      const response = await fetch(
        'http://localhost:3000/api/workouts/' + id,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ durationMinutes: newDurationNum }),
        }
      );

      if (!response.ok) {
        console.log(`Failed to edit workout, Status:${response.status}`);
        return;
      }

      const res = await response.json();

      setWorkouts((prevWorkouts) =>
        prevWorkouts.map((w) => (w.id === id ? res : w))
      );
    } catch (error) {
      console.error('Failed to edit workout', error);
    }
  }

  useEffect(() => {
    fetchWorkouts();
  }, []);

  async function handleAddWorkout(event) {
    event.preventDefault();

    setNewDateError('');
    setNewDurationError('');
    setNewDistanceError('');
    setNewIntensityError('');
    setNewGeneralFormError('');
    setNewFormStatus('idle');

    let hasError = false;

    if (newDate.trim() === '') {
      setNewDateError('please enter a date');
      hasError = true;
    }

    if (newDuration.trim() === '') {
      setNewDurationError('please enter duration');
      hasError = true;
    } else {
      const durationNum = Number(newDuration);
      if (Number.isNaN(durationNum) || durationNum <= 0) {
        setNewDurationError('Duration must be a positive number of minutes');
        hasError = true;
      }
    }

    if (newType === 'run') {
      if (newDistanceKm.trim() === '') {
        setNewDistanceError('please enter distance');
        hasError = true;
      } else {
        const distanceNum = Number(newDistanceKm);
        if (Number.isNaN(distanceNum) || distanceNum <= 0) {
          setNewDistanceError('distance must a positive number');
          hasError = true;
        }
      }
    } else {
      if (newDistanceKm.trim() !== '') {
        setNewDistanceError(
          'Distance is only for runs.Please clear this field'
        );
        hasError = true;
      }
    }

    if (newIntensity === '') {
      setNewIntensityError('please enter an intensity');
      hasError = true;
    }

    if (hasError === true) {
      return;
    }

    const workoutToCreate = {
      type: newType,
      date: newDate,
      durationMinutes: Number(newDuration),
      distanceKm: newType === 'run' && newDistanceKm !== '' ? Number(newDistanceKm) : null,
      intensity: newIntensity,
    };

    setNewFormStatus('submitting');

    try {
      const response = await fetch('http://localhost:3000/api/workouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workoutToCreate),
      });

      if (!response.ok) {
        setNewFormStatus('error');
        setNewGeneralFormError('failed to save workout. Please try again.');
        console.error('Failed to create workout. Status:', response.status);
        return;
      }

      const createdWorkout = await response.json();

      setWorkouts((prevWorkouts) => [...prevWorkouts, createdWorkout]);

      setNewType('run');
      setNewDate('');
      setNewDuration('');
      setNewDistanceKm('');
      setNewIntensity('easy');
      setNewFormStatus('success');
      setNewGeneralFormError('');
    } catch (error) {
      setNewFormStatus('error');
      setNewGeneralFormError('Network error. Please try again.');
      console.error('Failed to add workout:', error);
    }
  }

  async function handleGenerateCoachFeedback(){
    setNewCoachFeedback('');
    setNewCoachLoading(true);
    setNewCoachError('');

    try{
      const response = await fetch('http://localhost:3000/api/coach/feedback', {
        method: 'GET',
      })

      if (!response.ok){
        setNewCoachLoading(false);
        setNewCoachError('Failed to generate feedback')
        return;
      } 

      const data = await response.json();

      setNewCoachFeedback(data.feedback);
      setNewCoachLoading(false);
    }
    catch(err){
      setNewCoachLoading(false);
      setNewCoachError(err.message || 'Failed to generate feedback');
      setNewCoachFeedback('');
    }
  }

  // === Filtering & stats ===

  let filteredWorkouts = workouts;

  if (newFilterType !== 'all') {
    filteredWorkouts = filteredWorkouts.filter(
      (w) => w.type === newFilterType
    );
  }

  if (filterStartDate !== '') {
    filteredWorkouts = filteredWorkouts.filter(
      (w) => Date.parse(w.date) >= Date.parse(filterStartDate)
    );
  }

  if (filterEndDate !== '') {
    filteredWorkouts = filteredWorkouts.filter(
      (w) => Date.parse(w.date) <= Date.parse(filterEndDate)
    );
  }

  const totalWorkouts = filteredWorkouts.length;
  const totalDurationMinutes = filteredWorkouts.reduce(
    (sum, w) => sum + (w.durationMinutes || 0),
    0
  );
  const totalDistanceKm = filteredWorkouts.reduce(
    (sum, w) => sum + (w.distanceKm || 0),
    0
  );

  let durationStr;
  if (totalDurationMinutes < 60) {
    durationStr = totalDurationMinutes + ' minutes';
  } else {
    if (totalDurationMinutes % 60 === 0) {
      durationStr = Math.floor(totalDurationMinutes / 60) + ':00 hours';
    } else {
      durationStr =
        Math.floor(totalDurationMinutes / 60) +
        ':' +
        (totalDurationMinutes % 60) +
        ' hours';
    }
  }

  return (
    <div className="App">
      {/* Header */}
      <header className="app-header">
        <h1>Workout Tracker</h1>
        <p className="app-subtitle">
          Log your runs, gym sessions, and track your progress over time.
        </p>
      </header>

      {/* Filters bar */}
      <section className="filters-bar">
        <div className="filters-row">
          <select
            value={newFilterType}
            onChange={(e) => setNewFilterType(e.target.value)}
          >
            <option value="all">All</option>
            <option value="run">Run</option>
            <option value="gym">Gym</option>
            <option value="basketball">Basketball</option>
            <option value="surf">Surf</option>
            <option value="other">Other</option>
          </select>

          <div className="date-filters">
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setNewStartDate(e.target.value)}
            />
            <span className="date-range-separator">to</span>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setNewEndDate(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={fetchWorkouts}
          >
            Refresh workouts
          </button>
        </div>
      </section>

      {/* Main two-column layout */}
      <main className="main-layout">
        <div className="left-column">
          <div className="dashboard-summary">
            <h2>Dashboard Summary</h2>
            <p>
              Total workouts:{' '}
              <span className="summary-number">{totalWorkouts}</span>
            </p>
            <p>
              Total duration:{' '}
              <span className="summary-number">{durationStr}</span>
            </p>
            <p>
              Total distance (runs):{' '}
              <span className="summary-number">{totalDistanceKm} km</span>
            </p>
          </div>

          <div className='ai-feedback-card'>
            <div className='ai-feedback-header'>
              <h2 className='ai-feedback-title'>AI Coach Feedback</h2>
              <button 
              onClick={handleGenerateCoachFeedback} 
              disabled={coachLoading} 
              className='btn'>
                {coachLoading ? 'Generating...' : 'Generate feedback'}
              </button>
            </div>

            <div className='ai-feedback-body'>
              {coachLoading && (
                <p>Analyzing your workouts…</p>
              )}

              {!coachLoading && coachError && (
                <p className="field-error">{coachError}</p>
              )}

              {!coachLoading && !coachError && coachFeedback && (
                <pre className="ai-feedback-text">
                  {coachFeedback}
                </pre>
              )}

              {!coachLoading && !coachError && !coachFeedback && (
                <p className="ai-feedback-empty">
                  Click "Generate feedback" to get a short summary of your recent training.
                </p>
              )}
            </div>
          </div>
          
          <div className="section-header">
            <h2 className="section-title">Recent Workouts</h2>
            <span className="section-subtitle">Showing filtered results</span>
          </div>

          <div className="workout-list">
            {filteredWorkouts.length === 0 && <p>No workouts yet.</p>}

            {filteredWorkouts.map((workout) => (
              <div key={workout.id} className={`workout-card workout-card--${workout.type}`}>
                <h2>{workout.type}</h2>
                <p>Date: {workout.date}</p>
                <p>Duration: {workout.durationMinutes} minutes</p>
                {workout.distanceKm !== null && (
                  <p>Distance: {workout.distanceKm} km</p>
                )}
                
                <div className="workout-meta-row">
                  <span>Intensity:</span>
                    <span
                    className={
                    'intensity-badge ' +
                    (workout.intensity ? `intensity-${workout.intensity}` : 'intensity-na')
                    }
                    >
                      {workout.intensity || 'n/a'}
                    </span>
                </div>

                <div className="card-actions">
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDeleteWorkout(workout.id)}
                  >
                    Delete
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => handleEditWorkout(workout.id)}
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="right-column">
          <div className="add-workout">
            <h2>Add New Workout</h2>
            <form onSubmit={handleAddWorkout}>
              {/* general form error */}
              {generalFormError && (
                <p className="form-error">{generalFormError}</p>
              )}

              {/* Type */}
              <div>
                <label>
                  Type:{' '}
                  <select
                    value={newType}
                    onChange={(e) => {
                      const selectedType = e.target.value;
                      if (selectedType !== 'run') {
                        setNewDistanceKm('');
                      }
                      setNewType(selectedType);
                    }}
                  >
                    <option value="run">Run</option>
                    <option value="gym">Gym</option>
                    <option value="basketball">Basketball</option>
                    <option value="surf">Surf</option>
                    <option value="other">Other</option>
                  </select>
                </label>
              </div>

              {/* Date */}
              <div>
                <label>
                  Date:{' '}
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                </label>
                {dateError && (
                  <p className="field-error">{dateError}</p>
                )}
              </div>

              {/* Duration */}
              <div>
                <label>
                  Duration (minutes):{' '}
                  <input
                    type="number"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    min="0"
                  />
                </label>
                {durationError && (
                  <p className="field-error">{durationError}</p>
                )}
              </div>

              {/* Distance (only for run) */}
              <div>
                {newType === 'run' && (
                  <label>
                    Distance in km (number):{' '}
                    <input
                      type="number"
                      value={newDistanceKm}
                      onChange={(e) => setNewDistanceKm(e.target.value)}
                      min="0"
                    />
                  </label>
                )}
                {distanceError && (
                  <p className="field-error">{distanceError}</p>
                )}
              </div>

              {/* Intensity */}
              <div>
                <label>
                  Intensity (easy, moderate, hard):{' '}
                  <select
                    value={newIntensity}
                    onChange={(e) => setNewIntensity(e.target.value)}
                  >
                    <option value="easy">Easy</option>
                    <option value="moderate">Moderate</option>
                    <option value="hard">Hard</option>
                  </select>
                </label>
                {intensityError && (
                  <p className="field-error">{intensityError}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={formStatus === 'submitting'}
              >
                {formStatus === 'submitting' ? 'Saving...' : 'Add workout'}
              </button>
            </form>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
