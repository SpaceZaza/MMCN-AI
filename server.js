const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Allow frontend access (important if running client and server separately)
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(bodyParser.json());

// --- Session setup (per-user unlock/lock) ---
app.use(session({
  secret: 'your_secret_key_goes_here', // CHANGE for production!
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));

// --- Serve static files from /public folder ---
app.use(express.static(path.join(__dirname, 'public')));

const BYPASS_CODE = "unlock-astronaut";
const BYPASS_PASSWORD = "mypassword123"; // CHANGE for production!

function isMinecraftQuestion(msg) {
  // Replace with your own logic for Minecraft filter!
  return /minecraft|java|forge|fabric|server/i.test(msg);
}

// --- Main chat API endpoint ---
app.post('/chat', async (req, res) => {
  const userMessage = (req.body.message || "").trim();

  if (!req.session.bypassActive) req.session.bypassActive = false;

  // --- Unlock bypass ---
  if (!req.session.bypassActive && userMessage.toLowerCase().startsWith(BYPASS_CODE)) {
    const parts = userMessage.trim().split(/\s+/);
    const suppliedPassword = parts.slice(1).join(" ");
    if (suppliedPassword === BYPASS_PASSWORD) {
      req.session.bypassActive = true;
      return res.json({ reply: '🚀 Restrictions bypassed! You can now ask about any topic (just for you).' });
    } else {
      return res.json({ reply: '❌ Incorrect unlock password.' });
    }
  }

  // --- Lock (re-enable restrictions) ---
  if (req.session.bypassActive && userMessage.toLowerCase().startsWith("lock-astronaut")) {
    const parts = userMessage.trim().split(/\s+/);
    const suppliedPassword = parts.slice(1).join(" ");
    if (suppliedPassword === BYPASS_PASSWORD) {
      req.session.bypassActive = false;
      return res.json({ reply: '🔒 Restrictions re-enabled for you.' });
    } else {
      return res.json({ reply: '❌ Incorrect lock password.' });
    }
  }

  // --- Restrict to Minecraft topics unless unlocked ---
  if (!req.session.bypassActive && !isMinecraftQuestion(userMessage)) {
    return res.json({ reply: 'Sorry, I can only help with Minecraft Java Edition questions.' });
  }

  // --- Call your LLM/AI model here (Ollama: phi3:mini) ---
  try {
    const ollamaRes = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "phi3:mini",
        messages: [{ role: "user", content: userMessage }],
        stream: false // IMPORTANT: non-stream response for JSON parsing!
      })
    });
    const data = await ollamaRes.json();

    const aiReply =
      (data.message && data.message.content) ||
      data.response ||
      "Sorry, no response from AI.";

    res.json({ reply: aiReply });
  } catch (err) {
    res.status(500).json({ reply: "AI error: " + err.message });
  }
});

// --- Session destroy endpoint (optional logout) ---
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.json({ success: false, message: 'Error destroying session.' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Session cleared.' });
  });
});

// --- Optional: fallback for unknown routes to index.html for SPA (uncomment if needed) ---
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// Use built-in fetch (Node 18+)
