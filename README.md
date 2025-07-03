# MC Helper Chatbot

A modern, draggable/resizable Minecraft Java chat helper with session-based restriction unlock and Ollama (phi3:mini) backend.

---

## Features

- Chat support for Minecraft Java Edition (and modded servers)
- Spam/cooldown and message length limits by default
- “SpaceZaza” easter egg
- Per-user unlock: Ask about anything after you unlock with a code + password
- Password-protected lock to re-enable restrictions
- Uses Ollama (phi3:mini) as the backend AI
- No OpenAI keys or cloud needed
- Frontend served from `/public`

---

## Quick Setup

### 1. **Clone and Install**
```bash
git clone <this clone>
cd mc-helper-chatbot
npm install

2. Get Ollama and Download phi3:mini
Install Ollama

In a terminal, run:

ollama pull phi3:mini

ollama serve

3. Project Structure

project-root/
├── public/
│   ├── index.html
│   ├── mc-chatbot.js
│   ├── logo.png
│   └── ...
├── server.js
├── package.json
├── ...

4. Edit Your Secrets (Optional)
In server.js, set your own:

Session secret

Unlock password

5. Run the Server

node server.js

Visit http://localhost:3000 in your browser.

How To Use
Chat as normal for Minecraft help.

To unlock full AI (ask about anything):
Type in chat:

unlock-astronaut mypassword123
(Change password in server.js if needed)

To lock again and restrict to Minecraft-only:

lock-astronaut mypassword123
You can open multiple browsers or devices; unlock is per user/session.

Troubleshooting
Ollama not running:
Start Ollama and make sure the phi3:mini model is downloaded.

"fetch is not a function":
You need Node.js 18 or newer for built-in fetch support.

"Cannot GET /":
All frontend files must be in the /public folder.

