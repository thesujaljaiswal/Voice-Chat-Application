# 📞 Real-Time Voice Chat Application (Customer ↔ Agent)

A simple real-time voice calling web application built using **React, Node.js, Socket.io, and WebRTC**.  
The system allows two users (Customer and Agent) to connect, talk via voice, and exchange text messages in real time through their browser.

---

# 🚀 Features Implemented

## ✅ Voice Calling

- Real-time voice communication using WebRTC
- Two users (Customer and Agent) can connect
- Call connection status indicators:
  - Connecting
  - Connected
  - Disconnected
- Call duration timer
- Mute / Unmute functionality
- End call option

---

## ✅ Real-Time Chat / Transcript

- Live text chat during the call
- Displays sender role (Customer / Agent)
- Shows timestamps for messages
- Updates instantly for both users

---

## ✅ Presence & Connection Handling

- Displays whether Customer and Agent are online
- Automatically ends call if one user disconnects
- Handles page refresh gracefully
- Clear status messages for connection states

---

## ✅ User Interface

- Clean and responsive UI
- Role selection system
- Room-based connection logic
- Visual presence indicators
- Call control buttons

---

# 🛠️ Tech Stack

## Frontend

- React (Vite)
- Socket.io Client
- WebRTC API

## Backend

- Node.js
- Express.js
- Socket.io

## Real-Time Communication

- WebRTC → Voice streaming
- Socket.io → Signaling & messaging

---

# 📦 Installation & Setup

## 1️⃣ Clone the repository

```bash
git clone <your-repo-url>
cd voice-chat-app
```

---

## 2️⃣ Setup Backend

Navigate to server folder:

```bash
cd server
npm install
npm run dev
```

Backend runs at:

```
http://localhost:4000
```

---

## 3️⃣ Setup Frontend

Open a new terminal and run:

```bash
cd client
npm install
npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

---

# ▶️ How to Use the Application

1. Open the app in **two browser windows**.
2. In Window 1:
   - Select Role = **Customer**
   - Enter Room ID (example: demo-room)
3. In Window 2:
   - Select Role = **Agent**
   - Enter the SAME Room ID
4. Click **Start Call**
5. Allow microphone access when prompted.

Both users can now talk and chat in real time.

---

# ⚠️ Problems Faced & Solutions

## Problem 1: Presence not updating

Cause:
Socket connection and room joining were not synchronized.

Solution:
Joined the room only after successful socket connection and managed socket lifecycle properly in React.

---

## Problem 2: Multiple socket IDs appearing

Cause:
React StrictMode caused components to mount twice.

Solution:
Removed StrictMode and ensured socket initializes only once using `useMemo`.

---

## Problem 3: WebRTC call not connecting

Cause:
Signaling messages were not exchanged correctly.

Solution:
Implemented proper offer → answer → ICE candidate exchange using Socket.io.

---

## Problem 4: CORS connection errors

Cause:
Frontend and backend running on different ports.

Solution:
Configured CORS correctly in Socket.io server settings.

---

# 📸 Screenshots

(Add screenshots here before submission)

## Presence Screen

Shows online status of Customer and Agent.

[Insert Screenshot]

---

## Active Call Screen

Displays call duration and control buttons.

[Insert Screenshot]

---

## Real-Time Chat Screen

Shows messages exchanged during call.

[Insert Screenshot]

---

# 📈 Future Improvements

- Video calling support
- Call recording feature
- Speech-to-text transcription
- TURN server integration for production use
- Multiple agents support
- User authentication system

---

# 👨‍💻 Author

**Sujal Jaiswal**  
Full Stack Developer (MERN Stack)

---

# ⭐ Conclusion

This project demonstrates practical understanding of:

- Real-time communication systems
- WebRTC media streaming
- Socket.io signaling
- Client-server synchronization
- Handling real-world connection scenarios
