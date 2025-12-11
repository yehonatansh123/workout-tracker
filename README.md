# 🚀 Workout Tracker + AI Coaching
A full-stack fitness tracking app that lets you log workouts, analyze performance, and get AI-powered feedback.  
Built with **React**, **Node.js/Express**, **MongoDB Atlas**, **OpenAI**, and deployed on **Netlify + Render**.

---

## 🌐 Live Demo

### Frontend  
🔗 https://heroic-bonbon-a47e54.netlify.app

### Backend API  
🔗 https://workout-tracker-qyoa.onrender.com

---

## 📸 Screenshots

### Dashboard  
*(Add your own screenshot later if you want)*  
![Dashboard Screenshot](https://via.placeholder.com/900x400?text=Dashboard+Preview)

---

## ✨ Features

### 🏋️ Workout Tracking  
- Add workouts: **Run**, **Gym**, **Basketball**, **Surf**, **Other**  
- Track duration, distance (for runs), intensity, and date  
- View recent workouts  
- Filter by date range & type  
- Dashboard summary totals

### 🤖 AI Coach Feedback  
- Uses OpenAI to generate a personalized summary of your recent training  
- Helps identify:  
  - Overtraining  
  - Workout balance  
  - Suggestions for improvement  
  - Encouraging feedback

### 💾 Persistent Cloud Storage  
- All workouts stored in **MongoDB Atlas**  
- Available from any device  
- No local storage required

### 🚀 Full Deployment Pipeline  
- **Backend** deployed on Render  
- **Frontend** deployed on Netlify  
- Connected via environment variables  
- Fully live & accessible to anyone

---

## 🛠️ Tech Stack

### Frontend
- React  
- Vite  
- Fetch API  
- Custom CSS

### Backend
- Node.js  
- Express  
- Mongoose (MongoDB ORM)  
- OpenAI API

### Database
- MongoDB Atlas (Cloud-hosted NoSQL database)

### Deployment
- Render (Backend)  
- Netlify (Frontend)  

---

## 📁 Project Structure

```text
workout-tracker/
│
├── backend/
│   ├── src/
│   │   ├── index.js        # Express server
│   │   ├── models/
│   │   ├── routes/
│   ├── package.json
│   └── .env  (not committed)
│
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── components/
    ├── package.json
    ├── vite.config.js
    └── .env  (not committed)
```

---

## 🔌 API Endpoints

### GET `/api/workouts`
Returns all workouts (optionally filtered by type/dates).

### POST `/api/workouts`
Adds a new workout.

Request example:

```json
{
  "type": "run",
  "durationMinutes": 42,
  "distanceKm": 10,
  "intensity": "moderate",
  "date": "2025-12-01"
}
```

### GET `/api/coach/feedback`
Sends recent workouts to OpenAI and returns AI-generated feedback.

### GET `/api/health`
Simple uptime check:

```json
{ "status": "ok" }
```

---

## ⚙️ Environment Variables

### Backend `.env`

```env
MONGODB_URI=your_mongodb_uri
OPENAI_API_KEY=your_openai_key
PORT=10000
```

### Frontend `.env`

```env
VITE_API_BASE_URL=https://your-backend-url.onrender.com
```

---

## 📦 Installation (Local Development)

Clone the repo:

```bash
git clone https://github.com/yehonatansh123/workout-tracker.git
cd workout-tracker
```

### Backend:

```bash
cd backend
npm install
npm start   # or npm run dev if you add nodemon
```

### Frontend:

```bash
cd frontend
npm install
npm run dev
```

---

## 🚀 Future Improvements

- 🔐 User login & authentication  
- 👤 Personal accounts tied to user ID  
- 🏆 Weekly training goals  
- 📊 More performance analytics  
- 📱 Mobile app version  
- 🧠 Smarter AI that tracks long-term patterns  

---

## 💡 Why This Project Is Great for Internships / Jobs

This project demonstrates:

- Full-stack development (frontend + backend)
- API design & integration
- Cloud databases (MongoDB Atlas)
- Deployment with Netlify & Render
- Working with external APIs (OpenAI)
- Debugging & troubleshooting real deployment issues

Exactly the kind of real-world project companies like to see from junior developers.

---

## 🙌 Credits

Built by **Yehonatan Shribman** as a personal project to learn full‑stack development, cloud deployment, and AI integration.
