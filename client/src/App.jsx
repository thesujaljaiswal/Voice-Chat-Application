import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";

const SOCKET_URL = "http://localhost:4000";

const formatTime = (s) => {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
};

export default function App() {
  const [role, setRole] = useState("Customer");
  const [roomId, setRoomId] = useState("demo-room");

  // socket created ONCE
  const socket = useMemo(
    () => io(SOCKET_URL, { transports: ["websocket"], autoConnect: false }),
    [],
  );

  const [isSocketConnected, setIsSocketConnected] = useState(false);

  const [status, setStatus] = useState("disconnected"); // connecting | connected | disconnected
  const [presence, setPresence] = useState({
    customerOnline: false,
    agentOnline: false,
  });
  const [infoMsg, setInfoMsg] = useState("");

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const [muted, setMuted] = useState(false);

  // chat
  const [chatText, setChatText] = useState("");
  const [messages, setMessages] = useState([]);

  // duration
  const [callSeconds, setCallSeconds] = useState(0);
  const timerRef = useRef(null);

  const connectedWith = role === "Customer" ? "Agent" : "Customer";

  const canStartCall =
    presence.customerOnline && presence.agentOnline && status !== "connected";

  const startTimer = () => {
    stopTimer();
    setCallSeconds(0);
    timerRef.current = setInterval(() => setCallSeconds((s) => s + 1), 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const cleanupPeer = () => {
    stopTimer();
    setStatus("disconnected");
    setMuted(false);

    if (pcRef.current) {
      try {
        pcRef.current.ontrack = null;
      } catch {}
      try {
        pcRef.current.onicecandidate = null;
      } catch {}
      try {
        pcRef.current.close();
      } catch {}
      pcRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
  };

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc_ice_candidate", {
          roomId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
      }
    };

    pc.onconnectionstatechange = () => {
      const st = pc.connectionState;

      if (st === "connecting") setStatus("connecting");

      if (st === "connected") {
        setStatus("connected");
        setInfoMsg("Call connected");
        startTimer();
      }

      // disconnected/failed handled by call_ended/endCall
    };

    return pc;
  };

  const startCall = async () => {
    try {
      setInfoMsg("Starting call...");
      setStatus("connecting");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      localStreamRef.current = stream;

      const pc = createPeerConnection();
      pcRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("webrtc_offer", { roomId, offer });
    } catch (e) {
      setStatus("disconnected");
      setInfoMsg("Failed to start call (mic permission or connection issue).");
      console.error(e);
    }
  };

  const endCall = () => {
    socket.emit("end_call", { roomId });
    cleanupPeer();
    setInfoMsg("Call ended");
  };

  const toggleMute = () => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;
    setMuted(!audioTrack.enabled);
  };

  const sendMessage = () => {
    const text = chatText.trim();
    if (!text) return;

    const timestamp = new Date().toISOString();
    socket.emit("chat_message", { roomId, text, timestamp });
    setChatText("");
  };

  // ✅ Connect socket + register ALL listeners once
  useEffect(() => {
    socket.connect();

    const joinNow = () => {
      // join immediately when connected (fixes presence)
      console.log("➡️ join emit:", { roomId, role, socketId: socket.id });
      socket.emit("join", { roomId, role });
    };

    const onConnect = () => {
      console.log("✅ socket connected:", socket.id);
      setIsSocketConnected(true);
      setInfoMsg("Connected to signaling server");
      joinNow();
    };

    const onConnectError = (e) => {
      console.log("❌ socket connect_error:", e.message);
      setInfoMsg(`Connection failed: ${e.message}`);
    };

    const onDisconnect = (reason) => {
      console.log("⚠️ socket disconnected:", reason);
      setIsSocketConnected(false);
      setPresence({ customerOnline: false, agentOnline: false });
      cleanupPeer();
      setInfoMsg("Disconnected from server");
    };

    const onJoinError = ({ message }) => setInfoMsg(message);
    const onPresence = (p) => setPresence(p);
    const onReady = ({ message }) => setInfoMsg(message);

    const onOffer = async ({ offer }) => {
      try {
        setInfoMsg("Incoming call... connecting");
        setStatus("connecting");

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        localStreamRef.current = stream;

        const pc = createPeerConnection();
        pcRef.current = pc;

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        await pc.setRemoteDescription(offer);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("webrtc_answer", { roomId, answer });
      } catch (e) {
        setInfoMsg("Failed to answer call.");
        setStatus("disconnected");
        console.error(e);
      }
    };

    const onAnswer = async ({ answer }) => {
      try {
        if (!pcRef.current) return;
        await pcRef.current.setRemoteDescription(answer);
      } catch (e) {
        setInfoMsg("Failed to set remote answer.");
        console.error(e);
      }
    };

    const onIce = async ({ candidate }) => {
      try {
        if (!pcRef.current) return;
        await pcRef.current.addIceCandidate(candidate);
      } catch (e) {
        console.warn("ICE add failed", e);
      }
    };

    const onChat = (msg) => setMessages((prev) => [...prev, msg]);

    const onCallEnded = ({ reason }) => {
      cleanupPeer();
      setInfoMsg(`Call Ended: ${reason}`);
    };

    socket.on("connect", onConnect);
    socket.on("connect_error", onConnectError);
    socket.on("disconnect", onDisconnect);

    socket.on("join_error", onJoinError);
    socket.on("presence", onPresence);
    socket.on("ready", onReady);

    socket.on("webrtc_offer", onOffer);
    socket.on("webrtc_answer", onAnswer);
    socket.on("webrtc_ice_candidate", onIce);

    socket.on("chat_message", onChat);
    socket.on("call_ended", onCallEnded);

    return () => {
      socket.off("connect", onConnect);
      socket.off("connect_error", onConnectError);
      socket.off("disconnect", onDisconnect);

      socket.off("join_error", onJoinError);
      socket.off("presence", onPresence);
      socket.off("ready", onReady);

      socket.off("webrtc_offer", onOffer);
      socket.off("webrtc_answer", onAnswer);
      socket.off("webrtc_ice_candidate", onIce);

      socket.off("chat_message", onChat);
      socket.off("call_ended", onCallEnded);

      cleanupPeer();
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  // ✅ Re-join whenever role/room changes (only if connected)
  useEffect(() => {
    if (!isSocketConnected) return;

    console.log("➡️ re-join emit:", { roomId, role, socketId: socket.id });
    socket.emit("join", { roomId, role });
  }, [roomId, role, isSocketConnected, socket]);

  return (
    <div className="app-container">
      <div className="title">🎧 Voice Call App (Customer ↔ Agent)</div>

      <div className="status-bar">
        <div>
          Status: <b>{status}</b>
        </div>
        <div>
          Connected with: <b>{connectedWith}</b>
        </div>
        <div>
          Duration: <b>{formatTime(callSeconds)}</b>
        </div>
      </div>

      <div className="controls-row">
        <label>
          Role:&nbsp;
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={status !== "disconnected"}
          >
            <option>Customer</option>
            <option>Agent</option>
          </select>
        </label>

        <label>
          Room:&nbsp;
          <input
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            disabled={status !== "disconnected"}
          />
        </label>

        <div>
          Presence → Customer: {presence.customerOnline ? "✅" : "❌"} | Agent:{" "}
          {presence.agentOnline ? "✅" : "❌"}
        </div>
      </div>

      <div className="info-box">
        {infoMsg ||
          "Open this app in TWO tabs. Set one as Customer and one as Agent."}
      </div>

      <div className="call-buttons">
        <button
          className="btn-start"
          onClick={startCall}
          disabled={!canStartCall}
        >
          Start Call
        </button>

        <button
          className="btn-mute"
          onClick={toggleMute}
          disabled={status !== "connected"}
        >
          {muted ? "Unmute" : "Mute"}
        </button>

        <button
          className="btn-end"
          onClick={endCall}
          disabled={status === "disconnected"}
        >
          End Call
        </button>
      </div>

      <audio ref={remoteAudioRef} autoPlay />

      <div className="chat-section">
        <div className="chat-title">💬 Live Chat / Transcript</div>

        <div className="chat-input-row">
          <input
            value={chatText}
            onChange={(e) => setChatText(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            style={{ flex: 1 }}
          />
          <button onClick={sendMessage}>Send</button>
        </div>

        <div className="chat-box">
          {messages.length === 0 ? (
            <div style={{ color: "#777" }}>No messages yet.</div>
          ) : (
            messages.map((m, idx) => (
              <div className="message" key={idx}>
                <div className="message-header">
                  <b>{m.role}</b> • {new Date(m.timestamp).toLocaleTimeString()}
                </div>
                <div className="message-text">{m.text}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
