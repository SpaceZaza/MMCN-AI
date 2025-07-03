const historyDiv = document.getElementById('mc-chat-history');
const input = document.getElementById('mc-chat-input');
const sendBtn = document.getElementById('mc-chat-send');
const typingDiv = document.getElementById('mc-chat-typing');
const charCount = document.getElementById('mc-chat-charcount');
const MAX_CHARS = 400;

const chatWidget = document.getElementById('mc-chatbot-widget');
const chatMinimized = document.getElementById('mc-chat-minimized');
const chatClose = document.getElementById('mc-chat-close');

const DEFAULT_WIDTH = 350;
const DEFAULT_HEIGHT = 420;

// --- Spam Blocker Variables ---
let lastSendTime = 0;
const SEND_COOLDOWN_MS = 2000; // 2 seconds
let cooldownTimeout;

// --- Chat Minimized/Open/Close Logic ---
chatMinimized.onclick = () => {
  chatWidget.style.display = 'flex';
  chatWidget.style.left = '50vw';
  chatWidget.style.top = '28vh';
  chatWidget.style.width = DEFAULT_WIDTH + 'px';
  chatWidget.style.height = DEFAULT_HEIGHT + 'px';
  chatWidget.classList.add('open');
  chatMinimized.style.display = 'none';
  setTimeout(() => {
    if (!historyDiv.innerHTML.trim()) {
      historyDiv.innerHTML += `<div class="mc-bubble bot"><b>MC Helper:</b> Hi there! Need help with Minecraft Java Edition or modded servers (Forge/Fabric)? Just ask—I’m here for anything Java-related!</div>`;
    }
    updateHistoryHeight();
    input.focus();
  }, 100);
};
chatClose.onclick = () => {
  chatWidget.style.display = 'none';
  chatWidget.classList.remove('open');
  chatMinimized.style.display = 'flex';
};

// --- Send Button, Character Limit, Counter ---
input.addEventListener('input', () => {
  if (input.value.length > MAX_CHARS) {
    input.value = input.value.slice(0, MAX_CHARS);
  }
  charCount.textContent = `${input.value.length} / ${MAX_CHARS}`;
  sendBtn.disabled = input.value.trim().length === 0 || input.value.length > MAX_CHARS;
});
charCount.textContent = `0 / ${MAX_CHARS}`;
sendBtn.disabled = true;

// Block Enter if in cooldown
input.addEventListener('keydown', (e) => { 
  if (e.key === 'Enter' && !sendBtn.disabled) {
    const now = Date.now();
    if (now - lastSendTime < SEND_COOLDOWN_MS) {
      showCooldownWarning();
      e.preventDefault();
      return;
    }
    sendBtn.click();
  }
});

sendBtn.onclick = () => {
  const msg = input.value.trim();
  const now = Date.now();
  if (!msg || msg.length > MAX_CHARS) return;
  if (now - lastSendTime < SEND_COOLDOWN_MS) {
    showCooldownWarning();
    return;
  }
  lastSendTime = now;
  sendMessage(msg);
  input.value = "";
  charCount.textContent = `0 / ${MAX_CHARS}`;
  sendBtn.disabled = true;
};

function showCooldownWarning() {
  clearTimeout(cooldownTimeout);
  typingDiv.textContent = "⏳ Please wait before sending another message.";
  typingDiv.style.color = "#fba617";
  cooldownTimeout = setTimeout(() => {
    typingDiv.textContent = "";
    typingDiv.style.color = "";
  }, 1200);
}

async function sendMessage(msg) {
  // Easter egg: SpaceZaza
  if (/spacezaza/i.test(msg)) {
    historyDiv.innerHTML += `<div class="mc-bubble bot spacezaza-egg">
      <b>MC Helper:</b> <span style="font-size:1.2em;">🌌 Secret unlocked!</span><br>
      <span style="display:inline-block;margin-top:2px;">"SpaceZaza" is the legendary Minecraft traveler!<br>
      <span style="font-size:2em;letter-spacing:-2px;filter:drop-shadow(0 0 4px #71eaff88);">🚀✨🪐</span></span>
    </div>`;
    historyDiv.scrollTop = historyDiv.scrollHeight;
    typingDiv.textContent = "";
    return;
  }

  historyDiv.innerHTML += `<div class="mc-bubble user"><b>You:</b> ${escapeHTML(msg)}</div>`;
  historyDiv.scrollTop = historyDiv.scrollHeight;

  typingDiv.textContent = "MC Helper is typing...";

  try {
    const response = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg })
    });
    const data = await response.json();
    const botMsg = data.reply;
    historyDiv.innerHTML += `<div class="mc-bubble bot"><b>MC Helper:</b> ${botMsg}</div>`;
    historyDiv.scrollTop = historyDiv.scrollHeight;
  } catch (err) {
    historyDiv.innerHTML += `<div class="mc-bubble bot" style="color:#ff5555;"><b>⚠️ Error:</b> ${err.message}</div>`;
    historyDiv.scrollTop = historyDiv.scrollHeight;
  } finally {
    typingDiv.textContent = "";
  }
}

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, function(m) {
    return ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m];
  });
}

// ---- Drag to move ----
const widget = chatWidget;
const header = document.getElementById('mc-chat-header');
let isDragging = false, dragStartX, dragStartY, widgetStartX, widgetStartY;

header.addEventListener('mousedown', function(e) {
  if (e.target.closest('button')) return;
  isDragging = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  const rect = widget.getBoundingClientRect();
  widgetStartX = rect.left;
  widgetStartY = rect.top;
  document.body.style.userSelect = "none";
});
window.addEventListener('mousemove', function(e) {
  if (!isDragging) return;
  let dx = e.clientX - dragStartX;
  let dy = e.clientY - dragStartY;
  let minLeft = 0;
  let minTop = 0;
  let maxLeft = window.innerWidth - widget.offsetWidth;
  let maxTop = window.innerHeight - widget.offsetHeight;
  let newLeft = Math.max(minLeft, Math.min(maxLeft, widgetStartX + dx));
  let newTop = Math.max(minTop, Math.min(maxTop, widgetStartY + dy));
  widget.style.left = newLeft + "px";
  widget.style.top = newTop + "px";
});
window.addEventListener('mouseup', function() {
  if (isDragging) {
    isDragging = false;
    document.body.style.userSelect = "";
  }
});

// ---- Dynamic chat history height ----
function updateHistoryHeight() {
  const widgetRect = widget.getBoundingClientRect();
  const headerRect = header.getBoundingClientRect();
  const inputRect = input.parentNode.getBoundingClientRect();
  let usedHeight = (headerRect.height || 50) + (inputRect.height || 45) + 100;
  let avail = widgetRect.height - usedHeight;
  if (avail < 80) avail = 80;
  historyDiv.style.height = avail + "px";
}
window.addEventListener('resize', updateHistoryHeight);
setTimeout(updateHistoryHeight, 1000);
