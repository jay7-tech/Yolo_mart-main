// chat-proxy.mjs
/**
 * Chat proxy that:
 *  - reads GEMINI_API_KEY from .env
 *  - exposes POST /api/chat to call Gemini
 *  - fetches user preferences from your existing backend at http://localhost:3001/api/preferences/:phone
 *  - includes robust retry logic for MAX_TOKENS/truncation
 *  - sanitizes JSON-like SDK dumps so clients never see raw debug JSON
 *
 * Usage: node --experimental-specifier-resolution=node chat-proxy.mjs
 * Or set "type":"module" in package.json and run `node chat-proxy.mjs`
 */

import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Gemini client
const GEMINI_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_KEY) {
  console.error('ERROR: GEMINI_API_KEY not set in environment.');
  process.exit(1);
}
const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });

// In-memory session history (demo). For production, use Redis/DB.
const sessionHistory = {}; // sessionId -> [{role:'user'|'assistant', content: '...'}, ...]

/**
 * Helper: fetch preferences from your running backend (port 3001)
 * Expects your backend route to return { success: true, preferences: [...], labels: [...] }
 */
async function getPreferencesForPhone(phone) {
  if (!phone) return null;
  try {
    const resp = await fetch(`http://localhost:3001/api/preferences/${phone}`);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!data) return null;
    if (Array.isArray(data.labels) && data.labels.length) return data.labels;
    if (Array.isArray(data.preferences) && data.preferences.length) return data.preferences;
    // If structure is different, return raw data (proxy will stringify)
    return data;
  } catch (err) {
    console.error('Error fetching preferences:', err?.message ?? err);
    return null;
  }
}

/**
 * Build a clear system instruction string using preferences
 */
function buildSystemInstruction(prefArray) {
  if (!prefArray || (Array.isArray(prefArray) && prefArray.length === 0)) {
    return 'You are a helpful personal shopping assistant. No explicit user preferences were found. Ask clarifying questions if needed.';
  }
  const text = Array.isArray(prefArray) ? prefArray.join(', ') : String(prefArray);
  return `You are a helpful personal shopping assistant. User preferences: ${text}. Always keep these preferences in mind when giving recommendations (e.g., prefer items that match preferences). Ask clarifying questions if required. Be concise and friendly.`;
}

/**
 * Build conversation prompt text from system instruction + recent turns
 */
function buildPrompt(systemInstruction, recentTurns) {
  let prompt = `${systemInstruction}\n\nConversation:\n`;
  for (const t of recentTurns) {
    const who = t.role === 'user' ? 'User' : 'Assistant';
    prompt += `${who}: ${t.content}\n`;
  }
  prompt += 'Assistant:';
  return prompt;
}

/**
 * ----- SANITIZING callGeminiWithRetry -----
 * Robust Gemini call with a single retry for MAX_TOKENS/truncation.
 * - initial maxOutputTokens is 1024 (configurable via env)
 * - on detection of MAX_TOKENS, retry once with 2048 (configurable)
 * - attempts to extract assistant text for a few SDK shapes
 * - if the extracted text looks like JSON/SDK-dump, returns a friendly fallback and logs raw response server-side
 */
async function callGeminiWithRetry(promptText) {
  // base config
  let config = {
    temperature: 0.6,
    maxOutputTokens: Number(process.env.GEMINI_MAX_OUTPUT_TOKENS) || 1024,
  };

  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: promptText,
        config,
      });

      // Extract assistant text across SDK shapes
      let assistantText = '';
      if (response?.text && typeof response.text === 'string') {
        assistantText = response.text;
      } else if (response?.outputs && Array.isArray(response.outputs) && response.outputs[0]?.content) {
        const out = response.outputs[0].content;
        if (typeof out === 'string') assistantText = out;
        else if (Array.isArray(out) && out[0]?.text) assistantText = out[0].text;
        else if (out?.text) assistantText = out.text;
        else assistantText = JSON.stringify(out);
      } else if (response?.candidates && Array.isArray(response.candidates) && response.candidates[0]?.content) {
        const c = response.candidates[0].content;
        if (typeof c === 'string') assistantText = c;
        else assistantText = JSON.stringify(c);
      } else {
        assistantText = JSON.stringify(response).slice(0, 2000);
      }

      // Defensive sanitization: if extracted text looks like an SDK JSON dump, hide it
      const looksLikeJson =
        typeof assistantText === 'string' &&
        (assistantText.trim().startsWith('{') ||
         assistantText.trim().startsWith('[') ||
         assistantText.includes('"candidates"') ||
         assistantText.includes('"finishReason"') ||
         assistantText.length > 16000); // absurdly long fallback

      if (looksLikeJson) {
        // Log full raw response server-side for debugging (DO NOT send raw data to clients)
        console.warn('Gemini returned a JSON-like payload; hiding raw output. Raw response logged below:');
        console.dir(response, { depth: 3, maxArrayLength: 50 });

        // Try to find a safer textual fallback inside the response (outputs[].content, etc.)
        let fallback = '';
        try {
          if (response?.outputs && Array.isArray(response.outputs)) {
            for (const o of response.outputs) {
              if (typeof o?.content === 'string' && o.content.trim()) { fallback = o.content; break; }
              if (Array.isArray(o?.content) && o.content[0]?.text) { fallback = o.content[0].text; break; }
            }
          }
        } catch (e) {
          /* ignore */
        }

        assistantText = (fallback && !fallback.trim().startsWith('{'))
          ? fallback
          : '[Sorry — assistant returned an internal message. Please try again or ask to continue.]';
      }

      // Detect finishReason for retry
      const finishReason =
        response?.candidates?.[0]?.finishReason ||
        response?.outputs?.[0]?.finishReason ||
        null;

      if ((finishReason === 'MAX_TOKENS' || finishReason === 'max_tokens') && attempt === 0) {
        console.warn('Gemini: finishReason indicates MAX_TOKENS. Retrying with larger maxOutputTokens...');
        config.maxOutputTokens = Number(process.env.GEMINI_RETRY_MAX_OUTPUT_TOKENS) || 2048;
        continue; // retry once
      }

      return { assistantText, finishReason, raw: response };
    } catch (err) {
      const msg = String(err?.message || err).toLowerCase();
      if (attempt === 0 && (msg.includes('max_tokens') || msg.includes('max tokens') || msg.includes('max_tokens_exceeded'))) {
        console.warn('Gemini SDK error mentions max_tokens; retrying with larger maxOutputTokens...');
        config.maxOutputTokens = Number(process.env.GEMINI_RETRY_MAX_OUTPUT_TOKENS) || 2048;
        continue;
      }
      throw err;
    }
  }

  throw new Error('Gemini: failed after retry (MAX_TOKENS or SDK error).');
}

/**
 * Chat endpoint
 * body: { phone, message, sessionId (optional) }
 */
app.post('/api/chat', async (req, res) => {
  const { phone, message, sessionId = 'anon' } = req.body ?? {};
  if (!message || typeof message !== 'string') return res.status(400).json({ success: false, message: 'message required' });

  // Fetch preferences from the main backend
  const prefs = await getPreferencesForPhone(phone);
  const systemInstruction = buildSystemInstruction(prefs);

  // Manage in-memory conversation
  sessionHistory[sessionId] = sessionHistory[sessionId] || [];
  sessionHistory[sessionId].push({ role: 'user', content: message });

  // Limit history length to keep prompt tokens reasonable
  const maxTurns = Number(process.env.MAX_HISTORY_TURNS) || 8;
  const recentTurns = sessionHistory[sessionId].slice(-maxTurns);

  // Build prompt text
  const promptText = buildPrompt(systemInstruction, recentTurns);

  try {
    const { assistantText, finishReason } = await callGeminiWithRetry(promptText);

    // Save assistant reply into session history (trim if needed)
    sessionHistory[sessionId].push({ role: 'assistant', content: assistantText });

    // If finishReason signals that output was truncated, optionally indicate this to the client
    if (finishReason === 'MAX_TOKENS' || finishReason === 'max_tokens') {
      const truncatedNote = '\n\n[Note: response may have been truncated. You can ask the assistant to continue.]';
      return res.json({ success: true, reply: assistantText + truncatedNote, truncated: true });
    }

    res.json({ success: true, reply: assistantText });
  } catch (err) {
    console.error('Gemini call failed after retry:', err?.message ?? err);
    return res.status(500).json({ success: false, message: 'AI error', error: err?.message ?? String(err) });
  }
});

/**
 * Clear session history (demo)
 */
app.post('/api/clear-session', (req, res) => {
  const { sessionId = 'anon' } = req.body ?? {};
  delete sessionHistory[sessionId];
  res.json({ success: true });
});

/**
 * Minimal test HTML UI (standalone) — useful if you don't want to change your React app.
 */
app.get('/chat', (req, res) => {
  res.type('html').send(`
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Local Chat (Gemini) - Demo</title>
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <style>
      body{font-family:Inter,Arial,sans-serif;background:#f3f4f6;margin:0;padding:20px}
      .wrap{max-width:760px;margin:0 auto;background:#fff;padding:18px;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,0.08)}
      .chat{height:360px;overflow:auto;border:1px solid #e5e7eb;padding:10px;border-radius:8px;background:#fafafa}
      .row{display:flex;gap:8px;margin-top:8px}
      .user{text-align:right}
      .bubb{display:inline-block;padding:8px 12px;border-radius:12px;background:#e6ffed}
      .bubb.assistant{background:#eef2ff;text-align:left}
      input,textarea{width:100%;padding:8px;border-radius:6px;border:1px solid #d1d5db}
      button{padding:8px 12px;border-radius:6px;border:0;background:#2563eb;color:#fff}
    </style>
  </head>
  <body>
    <div class="wrap">
      <h2>Personal Chat (uses your saved preferences)</h2>
      <p style="color:#6b7280">Enter phone to load preferences from your running backend (http://localhost:3001/api/preferences/:phone)</p>
      <div style="display:flex;gap:8px">
        <input id="phone" placeholder="Phone (10 digits)" />
        <button id="setPhone">Set</button>
      </div>

      <div style="margin-top:12px">
        <div id="prefs" style="color:#374151;font-size:14px;margin-bottom:8px">Preferences: <em>not loaded</em></div>
        <div id="chat" class="chat"></div>
      </div>

      <div style="margin-top:12px" class="row">
        <textarea id="message" rows="2" placeholder="Ask about products, recipes, or request recommendations..."></textarea>
        <div style="width:140px">
          <button id="send">Send</button>
          <button id="new" style="background:#10b981;margin-left:6px">New Chat</button>
        </div>
      </div>
    </div>

    <script>
      let sessionId = 'session_' + Math.random().toString(36).slice(2,9);
      let currentPhone = '';
      async function append(role, text) {
        const el = document.createElement('div');
        el.className = 'row ' + (role === 'user' ? 'user' : 'assistant');
        el.innerHTML = '<div class="bubb ' + (role==='assistant' ? 'assistant' : '') + '">' + (text || '') + '</div>';
        document.getElementById('chat').appendChild(el);
        document.getElementById('chat').scrollTop = document.getElementById('chat').scrollHeight;
      }
      document.getElementById('setPhone').onclick = async () => {
        const p = document.getElementById('phone').value.trim();
        if (!p) return alert('Enter phone');
        currentPhone = p;
        // try to load preferences from your local backend
        try {
          const r = await fetch('http://localhost:3001/api/preferences/' + p);
          const data = await r.json();
          let text = 'No preferences found';
          if (data && data.labels && data.labels.length) text = data.labels.join(', ');
          else if (data && data.preferences && data.preferences.length) text = data.preferences.join(', ');
          document.getElementById('prefs').innerText = 'Preferences: ' + text;
        } catch (err) {
          document.getElementById('prefs').innerText = 'Preferences: (failed to load)';
        }
      };
      document.getElementById('send').onclick = async () => {
        const msg = document.getElementById('message').value.trim();
        if (!msg) return;
        append('user', msg);
        document.getElementById('message').value = '';
        append('assistant','Thinking...');
        try {
          const r = await fetch('/api/chat', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ phone: currentPhone, message: msg, sessionId })
          });
          const data = await r.json();
          const chatEl = document.getElementById('chat');
          chatEl.removeChild(chatEl.lastChild); // remove "Thinking..."
          if (data.success) append('assistant', data.reply);
          else append('assistant', 'Error: ' + (data.message || 'unknown'));
        } catch (err) {
          append('assistant', 'Network or server error');
        }
      };
      document.getElementById('new').onclick = () => {
        sessionId = 'session_' + Math.random().toString(36).slice(2,9);
        document.getElementById('chat').innerHTML = '';
      };
    </script>
  </body>
</html>
  `);
});

/**
 * Start server
 */
const PORT = process.env.CHAT_PORT || 3002;
app.listen(PORT, () => {
  console.log(`Chat proxy running on http://localhost:${PORT}`);
  console.log('Open http://localhost:' + PORT + '/chat to try the standalone chat UI.');
});
