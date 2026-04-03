# 🎓 StudySync — Smart Student Collaboration Platform

A full-stack web application that helps students find ideal study partners based on skills, learning level, goals, and availability, and collaborate in real-time.

![Tech Stack](https://img.shields.io/badge/React-18-blue) ![Node.js](https://img.shields.io/badge/Node.js-20-green) ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen) ![Socket.io](https://img.shields.io/badge/Socket.io-4.7-black)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **Auth** | JWT-based signup/login with bcrypt password hashing |
| 👤 **Profile** | Skills, level, goals, availability with multi-select UI |
| 🤝 **Smart Matching** | Weighted algorithm (skills 40%, level 20%, goals 20%, availability 20%) |
| 💬 **Real-time Chat** | Socket.io one-to-one messaging with typing indicators |
| 🟢 **Online Status** | Live online/offline indicators per user |
| 🍅 **Pomodoro Timer** | 25/5/15 min modes with animated progress ring |
| 📝 **Notes** | Study notes saved to localStorage |
| 🏆 **Leaderboard** | Top students ranked by daily study streak |
| 🌙 **Dark Mode** | Full dark/light mode toggle, persisted |
| 📱 **Responsive** | Fully mobile + desktop responsive |

---

## 🗂️ Project Structure

```
STUDENT/
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── middleware/
│   │   └── auth.js            # JWT verification middleware
│   ├── models/
│   │   ├── User.js            # User schema
│   │   └── Message.js         # Message schema
│   ├── routes/
│   │   ├── auth.js            # POST /api/auth/register|login
│   │   ├── users.js           # GET|PUT /api/users/profile, leaderboard
│   │   ├── match.js           # GET /api/match
│   │   └── chat.js            # GET /api/chat/:userId
│   ├── .env                   # Environment variables
│   ├── package.json
│   └── server.js              # Express + Socket.io entry point
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── axios.js       # Axios instance with JWT interceptor
    │   ├── components/
    │   │   ├── Navbar.jsx     # Navigation with dark mode toggle
    │   │   └── MatchCard.jsx  # Partner card with match score ring
    │   ├── context/
    │   │   └── AuthContext.jsx # Auth state + dark mode provider
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Profile.jsx
    │   │   ├── FindPartner.jsx
    │   │   ├── Chat.jsx       # Real-time chat with Socket.io
    │   │   ├── StudyTools.jsx # Pomodoro timer + notes
    │   │   └── Leaderboard.jsx
    │   ├── App.jsx            # Router + protected routes
    │   ├── socket.js          # Socket.io singleton
    │   └── main.jsx
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── postcss.config.js
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ — [Download](https://nodejs.org)
- **MongoDB** — Either:
  - **Local**: [Install MongoDB Community](https://www.mongodb.com/try/download/community) — runs on `mongodb://localhost:27017`
  - **Cloud**: [MongoDB Atlas](https://cloud.mongodb.com/) (free tier)

---

### 1️⃣ Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Configure environment (edit .env)
# Default .env already points to local MongoDB:
# MONGO_URI=mongodb://127.0.0.1:27017/student_platform
# JWT_SECRET=super_secret_jwt_key_change_in_production
# PORT=5000
# CLIENT_URL=http://localhost:5173

# Start backend in development mode
npm run dev
```

Expected output:
```
🚀 Server running on port 5000
MongoDB connected: 127.0.0.1
```

---

### 2️⃣ Frontend Setup

Open a **new terminal**:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Expected output:
```
  VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

---

### 3️⃣ Open the App

Navigate to **[http://localhost:5173](http://localhost:5173)**

---

## 🔑 Environment Variables (Backend `.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Express server port |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/student_platform` | MongoDB connection string |
| `JWT_SECRET` | `super_secret_jwt_key_change_in_production` | **Change this in production!** |
| `CLIENT_URL` | `http://localhost:5173` | Frontend origin for CORS |

---

## 🧠 Matching Algorithm

The match score (0–100%) is computed using:

```
Score = Skills similarity  × 40   (Jaccard index)
      + Level proximity    × 20   (Same=20, Adjacent=10, Far=0)
      + Goals similarity   × 20   (Jaccard index)
      + Availability slots × 20   (Jaccard index)
```

**Jaccard similarity**: `|A ∩ B| / |A ∪ B|`

---

## 🔌 API Routes

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login, returns JWT |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users/profile` | Get current user profile |
| `PUT` | `/api/users/profile` | Update current user profile |
| `GET` | `/api/users/leaderboard` | Top 20 users by streak |
| `GET` | `/api/users/:id` | Get user by ID |

### Match
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/match` | Get ranked match suggestions |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/chat` | List chat partners |
| `GET` | `/api/chat/:userId` | Message history with user |

### Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join` | Client → Server | Register user as online |
| `sendMessage` | Client → Server | Send a message |
| `receiveMessage` | Server → Client | Incoming message |
| `messageSent` | Server → Client | Message delivery confirmation |
| `onlineUsers` | Server → Client | Updated online users list |
| `typing` / `stopTyping` | Client → Server | Typing indicators |
| `userTyping` / `userStoppedTyping` | Server → Client | Typing indicators |

---

## 🎨 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Real-time | Socket.io |
| Auth | JWT, bcryptjs |
| Icons | react-icons |
| Notifications | react-hot-toast |

---

## 🌟 Bonus Features

- **Study Streak**: Auto-increments on daily login, resets if you miss a day
- **Leaderboard**: Top students ranked by streak with medal podium
- **Typing Indicators**: Live "..." dots when partner is typing
- **Dark Mode**: Full dark theme persisted across sessions
- **Skeleton Loading**: Smooth skeleton screens before data loads
