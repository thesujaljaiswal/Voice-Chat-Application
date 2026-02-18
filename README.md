# 📞 Real-Time Voice Chat Application (Customer ↔ Agent)

This project is a real-time browser-based voice communication system that allows two users (Customer and Agent) to connect, talk via voice, and exchange text messages instantly.

The application is built using **React, Node.js, Socket.io, and WebRTC**.

---

# 🚀 Features Implemented

## ✅ Real-Time Voice Calling

- Peer-to-peer voice communication using WebRTC
- Two users can connect in the same room
- Connection status indicators:
  - Connecting
  - Connected
  - Disconnected
- Call duration timer
- Mute / Unmute functionality
- End call option

---

## ✅ Real-Time Chat / Transcript

- Live text messaging during calls
- Shows sender role (Customer / Agent)
- Displays timestamps
- Updates instantly for both users

---

## ✅ Presence & Connection Handling

- Shows whether Customer and Agent are online
- Automatically ends call if one user disconnects
- Handles page refresh gracefully
- Displays connection status messages

---

## ✅ User Interface

- Clean and responsive UI
- Role selection (Customer / Agent)
- Room-based pairing system
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

---

# 📡 Where WebRTC Is Used in This Project

WebRTC is responsible for handling the **actual voice communication** between the two users.

It is used in the following parts of the application:

### 1️⃣ Creating Peer-to-Peer Connection

We use:

```js
new RTCPeerConnection();
```

This establishes a direct connection between Customer and Agent for real-time audio streaming.

---

### 2️⃣ Capturing Microphone Audio

We use:

```js
navigator.mediaDevices.getUserMedia();
```

This accesses the user's microphone and captures audio streams.

---

### 3️⃣ Sending Audio to the Peer

Audio tracks are added to the connection:

```js
pc.addTrack(track, stream);
```

This sends the captured microphone audio to the other user.

---

### 4️⃣ Offer / Answer Exchange

WebRTC uses SDP signaling:

```js
pc.createOffer();
pc.createAnswer();
```

Socket.io is used to exchange these offers and answers between peers.

---

### 5️⃣ ICE Candidate Exchange

WebRTC discovers the best network route using:

```js
pc.onicecandidate;
pc.addIceCandidate();
```

This enables communication across NAT/firewalls.

---

### 6️⃣ Receiving Remote Audio Stream

Remote audio is received via:

```js
pc.ontrack;
```

And played using an HTML audio element.

---

# 📡 Role of Socket.io in the Project

Socket.io is **NOT used for voice transmission**.

It is used only for:

- Room creation and presence tracking
- Signaling exchange (offer, answer, ICE candidates)
- Real-time chat messages
- Call lifecycle events

---

# 📦 Installation & Setup

## 1️⃣ Clone Repository

```bash
git clone <your-repo-url>
cd voice-chat-app
```

---

## 2️⃣ Setup Backend

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

Open a new terminal:

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
2. Window 1:
   - Select Role = Customer
   - Enter Room ID (example: demo-room)
3. Window 2:
   - Select Role = Agent
   - Enter the SAME Room ID
4. Click **Start Call**
5. Allow microphone access.

Both users can now communicate via voice and chat in real time.

---

# ⚠️ Problems Faced & Solutions

## Problem 1: Presence not updating

Cause:
Socket connection and room joining were not synchronized.

Solution:
Joined the room only after successful socket connection and managed socket lifecycle correctly.

---

## Problem 2: Multiple socket IDs appearing

Cause:
React StrictMode caused components to mount twice.

Solution:
Removed StrictMode and initialized socket only once using `useMemo()`.

---

## Problem 3: WebRTC call not connecting

Cause:
Improper signaling flow.

Solution:
Implemented correct offer → answer → ICE candidate exchange using Socket.io.

---

## Problem 4: CORS connection errors

Cause:
Frontend and backend running on different ports.

Solution:
Configured Socket.io CORS settings properly.

---

# 📸 Screenshots

(Add screenshots here)

## Presence Screen

![Presence](screenshots/presence.png)

---

## Active Call Screen

![Call](screenshots/call.png)

---

## Chat Screen

![Chat](screenshots/chat.png)

---

# 📈 Future Improvements

- Video calling support
- Call recording feature
- Speech-to-text transcription
- TURN server integration for production networks
- Multiple agents queue system
- User authentication

---

# 👨‍💻 Author

**Sujal Jaiswal**  
Full Stack Developer (MERN Stack)

---

# ⭐ Conclusion

This project demonstrates practical understanding of:

- Real-time communication architecture
- WebRTC media streaming
- Socket.io signaling mechanisms
- Client-server synchronization
- Handling real-world connection scenarios
