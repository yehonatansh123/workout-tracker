import { useState, useEffect } from 'react';
import './App.css';
import { apiRequest } from './api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [authError, setAuthError] = useState('');

  const[workoutsLoading, setWorkoutsLoading] = useState(false);
  const [workoutsError, setWorkoutsError] = useState(null);

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('workoutUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  function getAuthHeaders() {
    const headers = { 'Content-type': 'application/json' };
    if (user && user.token) {
      headers['Authorization'] = `Bearer ${user.token}`;
    }
    return headers;
  }

  function handleLogout() {
    setUser(null);
    localStorage.removeItem('workoutUser');
    setWorkouts([]);
  }

  async function handleAuthSubmit(e) {
    e.preventDefault();
    setAuthError(null);
    const path = isLogin ? '/api/users/login' : '/api/users/signup';
    
      const result = await apiRequest(path,'POST', null, {email: authEmail, password: authPassword });
      
      

      if (!result.ok) {
        setAuthError(result.errorMessage);
        return;
      }
      
      localStorage.setItem('workoutUser', JSON.stringify(result.data));
      setUser(result.data);
      fetchWorkouts(result.data);
      setAuthPassword('');
  }

  async function fetchWorkouts(currentUser = user) {
    if (!currentUser || !currentUser.token) {
      setWorkouts([]);
      setWorkoutsLoading(false);
      setWorkoutsError(null);
      return;
    }
    
      setWorkoutsLoading(true);
      setWorkoutsError(null);
      
      let path = `/api/workouts`;

      const response = await apiRequest(path,'GET',currentUser.token, null);
      
      if (response.ok) {
        if (Array.isArray(response.data))
          setWorkouts(response.data);
        else
          setWorkouts([]);

        setWorkoutsError(null);
      } else {
        setWorkoutsError(response.errorMessage);
      }
      setWorkoutsLoading(false);
  }

  async function handleDeleteWorkout(id) {
    if (!user || !user.token){
      alert("Log in to delete workouts.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this workout?")) return;
    
      const result = await apiRequest(`/api/workouts/${id}`,'DELETE',user.token, null);
      
      if (result.ok) {
        setWorkouts((prevWorkouts) => prevWorkouts.filter((w) => (w.id || w._id) !== id));
      }
      else{
        
        alert(`Delete failed: ${result.errorMessage || 'Server error'} `);
      }
  }

  useEffect(() => {
    fetchWorkouts();
  }, [user]);

  async function handleAddWorkout(event) {
    event.preventDefault();
    setNewDateError('');
    setNewDurationError('');
    setNewDistanceError('');
    setNewGeneralFormError('');

    if (!user || !user.token){
      setNewGeneralFormError("Please log in to add a workout.");
      setNewFormStatus('idle');
      return;
    }
    
    let hasError = false;
    if (!newDate) { setNewDateError('Date required'); hasError = true; }
    if (!newDuration || Number(newDuration) <= 0) { setNewDurationError('Invalid duration'); hasError = true; }
    if (newType === 'run' && (!newDistanceKm || Number(newDistanceKm) <= 0)) { setNewDistanceError('Invalid distance'); hasError = true; }

    if (hasError) return;

    const workoutToCreate = {
      type: newType,
      date: newDate,
      durationMinutes: Number(newDuration),
      distanceKm: newType === 'run' ? Number(newDistanceKm) : null,
      intensity: newIntensity,
    };

    setNewFormStatus('submitting');

    const result = await apiRequest('/api/workouts','POST',user.token, workoutToCreate);
      if (result.ok) {
        setWorkouts((prev) => [...prev, result.data]);
        setNewDate(''); setNewDuration(''); setNewDistanceKm('');
        setNewFormStatus('success');
      } else {
        setNewGeneralFormError(result.errorMessage || 'Failed to save');
        setNewFormStatus('error');
      }
  }

  async function handleGenerateCoachFeedback() {
    setNewCoachLoading(true);
    setNewCoachError('');

    if (!user || !user.token){
      setNewCoachError('Please log in to get feedback');
      setNewCoachLoading(false);
      return;
    }


    const result = await apiRequest('/api/coach/feedback','GET',user.token,null);


    try
    {
      if (result.ok) {
      setNewCoachFeedback(result.data.feedback);
      setNewCoachError(null);
      }
      else
      {
        setNewCoachError(result.errorMessage || 'failed to load feedback');
      }
    }
    finally{
      setNewCoachLoading(false);  
    }
  }

  // Filtering
  let filteredWorkouts = workouts.filter(w => {
    const typeMatch = newFilterType === 'all' || w.type === newFilterType;
    const startMatch = !filterStartDate || Date.parse(w.date) >= Date.parse(filterStartDate);
    const endMatch = !filterEndDate || Date.parse(w.date) <= Date.parse(filterEndDate);
    return typeMatch && startMatch && endMatch;
  });

  const totalWorkouts = filteredWorkouts.length;
  const totalDurationMinutes = filteredWorkouts.reduce((sum, w) => sum + (w.durationMinutes || 0), 0);
  const totalDistanceKm = filteredWorkouts.reduce((sum, w) => sum + (w.distanceKm || 0), 0);
  const durationStr = `${Math.floor(totalDurationMinutes / 60)}h ${totalDurationMinutes % 60}m`;

  let workoutsContent;

  if (workoutsLoading === true){
    workoutsContent = "Workout list is loading.";
  }else if (workoutsError !== null){
    workoutsContent = "Error fetching workouts."
  }else if (workouts.length === 0){
    workoutsContent = "You haven't worked out yet. Get out there :)"
  }else if (filteredWorkouts.length === 0){
    workoutsContent = "You haven't worked out in the specified dates."
  }else{
    workoutsContent = filteredWorkouts.map((workout, index) => {
                    
                    // 1. This part 'decides' which icon to use based on the type
                    let iconClass = 'fa-bolt'; // default icon
                    if (workout.type === 'run') iconClass = 'fa-running';
                    if (workout.type === 'gym') iconClass = 'fa-dumbbell';
                    if (workout.type === 'basketball') iconClass = 'fa-basketball-ball';
                    if (workout.type === 'surf') iconClass = 'fa-water';

                    return (
                      <div key={workout.id || workout._id || index} className={`workout-card workout-card--${workout.type}`}>
                        
                        {/* 2. We put the icon inside the H3 title */}
                        <h3>
                          <i className={`fas ${iconClass}`} style={{ marginRight: '10px', color: '#3b82f6' }}></i>
                          {workout.type}
                        </h3>

                        <p>{workout.date} | {workout.durationMinutes} mins</p>
                        
                        <button className="btn btn-danger" onClick={() => handleDeleteWorkout(workout.id || workout._id)}>
                          <i className="fas fa-trash-alt" style={{ marginRight: '5px' }}></i>
                          Delete
                        </button>
                      </div>
                    );
                  })
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>Workout Tracker</h1>
        {!user ? (
          <div className="auth-section">
            <h2>{isLogin ? 'Log In' : 'Sign Up'}</h2>
            <form onSubmit={handleAuthSubmit} className="auth-form">
              <input type="email" placeholder="Email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} />
              <input type="password" placeholder="Password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} />
              <button type='submit' className="btn btn-primary">{isLogin ? 'Log In' : 'Sign Up'}</button>
            </form>
            <button className="btn-link" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? "Need an account? Sign Up" : "Already have an account? Login"}
            </button>
            {authError && <p style={{ color: 'red' }}>{authError}</p>}
          </div>
        ) : (
          <>
            <div className="user-nav">
              <span>Welcome, <strong>{user.email.split('@')[0]}</strong></span>
              <button className="btn btn-secondary" onClick={handleLogout}>Log Out</button>
            </div>
            <p className="app-subtitle">Log your runs and track your progress.</p>

            <section className="filters-bar">
              <div className="filters-row">
                <select value={newFilterType} onChange={(e) => setNewFilterType(e.target.value)}>
                  <option value="all">All</option>
                  <option value="run">Run</option>
                  <option value="gym">Gym</option>
                  <option value="basketball">Basketball</option>
                  <option value="surf">Surf</option>
                </select>
                <div className="date-filters">
                  <input type="date" value={filterStartDate} onChange={(e) => setNewStartDate(e.target.value)} />
                  <span>to</span>
                  <input type="date" value={filterEndDate} onChange={(e) => setNewEndDate(e.target.value)} />
                </div>
              </div>
            </section>

            <main className="main-layout">
              <div className="left-column">
                <div className="dashboard-summary">
                  <h2>Dashboard Summary</h2>
                  <p>Total workouts: {totalWorkouts}</p>
                  <p>Total duration: {durationStr}</p>
                  <p>Total distance: {totalDistanceKm} km</p>
                </div>

                <div className='ai-feedback-card'>
                  <div className='ai-feedback-header'>
                    <h2>AI Coach Feedback</h2>
                    <button onClick={handleGenerateCoachFeedback} disabled={coachLoading} className='btn'>
                      {coachLoading ? 'Generating...' : 'Generate feedback'}
                    </button>
                  </div>
                  <div className='ai-feedback-body'>
                    {coachFeedback && <pre className="ai-feedback-text">{coachFeedback}</pre>}
                    {coachError && <p className="field-error">{coachError}</p>}
                  </div>
                </div>

                <div className="workout-list">
                  {workoutsContent}
                </div>
              </div>

              <aside className="right-column">
                <div className="add-workout">
                  <h2>Add New Workout</h2>
                  <form onSubmit={handleAddWorkout}>
                    {generalFormError && <p className="form-error">{generalFormError}</p>}
                    
                    {/* 1. Workout Type */}
                    <div className="form-group">
                      <label>Type</label>
                      <select value={newType} onChange={(e) => setNewType(e.target.value)}>
                        <option value="run">Run</option>
                        <option value="gym">Gym</option>
                        <option value="basketball">Basketball</option>
                        <option value="surf">Surf</option>
                      </select>
                    </div>
                    
                    {/* 2. Date */}
                    <div className="form-group">
                      <label>Date</label>
                      <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
                      {dateError && <p className="field-error">{dateError}</p>}
                    </div>

                    {/* 3. Duration */}
                    <div className="form-group">
                      <label>Duration (mins)</label>
                      <input type="number" placeholder="45" value={newDuration} onChange={(e) => setNewDuration(e.target.value)} />
                      {durationError && <p className="field-error">{durationError}</p>}
                    </div>

                    {/* 4. Distance (Only for Runs) */}
                    {newType === 'run' && (
                      <div className="form-group">
                        <label>Distance (km)</label>
                        <input 
                          type="number" 
                          placeholder="5.0" 
                          value={newDistanceKm} 
                          onChange={(e) => setNewDistanceKm(e.target.value)} 
                        />
                        {distanceError && <p className="field-error">{distanceError}</p>}
                      </div>
                    )}

                    {/* 5. Intensity */}
                    <div className="form-group">
                      <label>Intensity</label>
                      <select value={newIntensity} onChange={(e) => setNewIntensity(e.target.value)}>
                        <option value="easy">Easy</option>
                        <option value="moderate">Moderate</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={formStatus === 'submitting'}>
                      {formStatus === 'submitting' ? 'Saving...' : 'Add Workout'}
                    </button>
                  </form>
                </div>
              </aside>
            </main>
          </>
        )}
      </header>
    </div>
  );
}

export default App;