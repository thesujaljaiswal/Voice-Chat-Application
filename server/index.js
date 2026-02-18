const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  }),
);

app.get("/", (req, res) => res.send("OK"));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// rooms[roomId] = { customer: socketId|null, agent: socketId|null }
const rooms = {};

function emitPresence(roomId) {
  const room = rooms[roomId];
  const presence = {
    customerOnline: !!room?.customer,
    agentOnline: !!room?.agent,
  };
  io.to(roomId).emit("presence", presence);
  return presence;
}

io.on("connection", (socket) => {
  console.log("✅ connected:", socket.id);

  socket.on("join", ({ roomId, role }) => {
    try {
      if (!roomId || !role) {
        socket.emit("join_error", { message: "roomId and role are required" });
        return;
      }

      if (!rooms[roomId]) rooms[roomId] = { customer: null, agent: null };
      const room = rooms[roomId];

      // ✅ If this socket was previously in this room under another role, clear it
      if (room.customer === socket.id) room.customer = null;
      if (room.agent === socket.id) room.agent = null;

      // ✅ Enforce 1 customer and 1 agent
      if (role === "Customer") {
        if (room.customer && room.customer !== socket.id) {
          socket.emit("join_error", { message: "Customer already in room" });
          return;
        }
        room.customer = socket.id;
      } else if (role === "Agent") {
        if (room.agent && room.agent !== socket.id) {
          socket.emit("join_error", { message: "Agent already in room" });
          return;
        }
        room.agent = socket.id;
      } else {
        socket.emit("join_error", {
          message: "Role must be Customer or Agent",
        });
        return;
      }

      socket.data.roomId = roomId;
      socket.data.role = role;

      socket.join(roomId);

      console.log("📥 join:", { roomId, role, socketId: socket.id, room });

      // ✅ Emit presence to room AND directly to this socket (so UI updates even if room emit fails)
      const presence = emitPresence(roomId);
      socket.emit("presence", presence);

      if (room.customer && room.agent) {
        io.to(roomId).emit("ready", {
          message: "Both users connected. You can start the call.",
        });
      }
    } catch (e) {
      console.error("join error:", e);
      socket.emit("join_error", { message: "Join failed" });
    }
  });

  // WebRTC signaling
  socket.on("webrtc_offer", ({ roomId, offer }) => {
    socket.to(roomId).emit("webrtc_offer", { offer });
  });

  socket.on("webrtc_answer", ({ roomId, answer }) => {
    socket.to(roomId).emit("webrtc_answer", { answer });
  });

  socket.on("webrtc_ice_candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("webrtc_ice_candidate", { candidate });
  });

  // chat
  socket.on("chat_message", ({ roomId, text, timestamp }) => {
    const role = socket.data.role || "Unknown";
    io.to(roomId).emit("chat_message", { role, text, timestamp });
  });

  socket.on("end_call", ({ roomId }) => {
    io.to(roomId).emit("call_ended", { reason: "Ended by user" });
  });

  socket.on("disconnect", () => {
    const roomId = socket.data.roomId;
    const role = socket.data.role;

    console.log("❌ disconnected:", socket.id, { roomId, role });

    if (!roomId || !rooms[roomId]) return;

    const room = rooms[roomId];

    if (role === "Customer" && room.customer === socket.id)
      room.customer = null;
    if (role === "Agent" && room.agent === socket.id) room.agent = null;

    io.to(roomId).emit("call_ended", {
      reason: `${role || "User"} disconnected`,
    });

    emitPresence(roomId);

    if (!room.customer && !room.agent) delete rooms[roomId];
  });
});

server.listen(4000, () =>
  console.log("Server running on http://localhost:4000"),
);
