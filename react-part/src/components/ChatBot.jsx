// ChatBot.jsx
import React, { useEffect, useRef, useState } from 'react';

export default function ChatBot({ apiBase = '' /* e.g. 'http://localhost:3002' */ }) {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]); // {role, text}
  const [loading, setLoading] = useState(false);
  const sessionIdRef = useRef(null);

  useEffect(() => {
    const p = localStorage.getItem('phone') || '';
    setPhone(p);
    sessionIdRef.current = `session_${p || 'anon'}_${Date.now()}`;
  }, []);

  const send = async () => {
    if (!message.trim()) return;
    const userText = message.trim();
    setChat(c => [...c, { role: 'user', text: userText }]);
    setMessage('');
    setLoading(true);
    try {
      const resp = await fetch(`${apiBase || ''}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message: userText, sessionId: sessionIdRef.current })
      });
      const data = await resp.json();
      if (data.success) {
        setChat(c => [...c, { role: 'assistant', text: data.reply }]);
      } else {
        setChat(c => [...c, { role: 'assistant', text: 'Sorry — could not process your request.' }]);
      }
    } catch (err) {
      setChat(c => [...c, { role: 'assistant', text: 'Network error' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white rounded-xl shadow">
      <div className="mb-3 text-sm text-gray-600">Chat (signed in as: {phone || 'guest'})</div>
      <div className="h-64 overflow-y-auto border rounded p-3 mb-3">
        {chat.map((m, i) => (
          <div key={i} className={`mb-2 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block px-3 py-2 rounded-lg ${m.role === 'user' ? 'bg-green-100' : 'bg-gray-100'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && <div className="text-left text-sm text-gray-500">Thinking...</div>}
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKey}
        rows={2}
        placeholder="Ask me about products, recipes, or recommend items for my preferences..."
        className="w-full p-2 border rounded mb-3"
      />

      <div className="flex gap-2">
        <button onClick={send} disabled={loading || !message.trim()} className="flex-1 bg-blue-600 text-white py-2 rounded">
          Send
        </button>
        <button onClick={() => { setChat([]); sessionIdRef.current = `session_${phone || 'anon'}_${Date.now()}`; }} className="px-3 py-2 border rounded">
          New Chat
        </button>
      </div>
    </div>
  );
}
